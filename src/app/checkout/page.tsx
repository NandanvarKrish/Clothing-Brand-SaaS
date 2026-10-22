"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Building2,
  Banknote,
  Sparkles,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User,
  Truck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { formatPrice, calculateShippingFee, ShippingMethodId } from "@/lib/utils";
import { CustomerCheckoutDetails, CustomerAddress } from "@/types";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Please enter street address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Please enter city"),
  state: z.string().min(2, "Please enter state"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit PIN code"),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"] as const),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotal, discount, appliedCoupon, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved address management
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");

  // Shipping method selection
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>("standard_air");

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      paymentMethod: "upi",
      deliveryNotes: "",
    },
  });

  const applyAddressToForm = useCallback(
    (addr: CustomerAddress) => {
      setValue("fullName", addr.fullName || profile?.fullName || "");
      setValue("phone", addr.phone || profile?.phone || "");
      setValue("addressLine1", addr.addressLine1);
      setValue("addressLine2", addr.addressLine2 || "");
      setValue("city", addr.city);
      setValue("state", addr.state);
      setValue("pincode", addr.pincode);
    },
    [setValue, profile]
  );

  useEffect(() => {
    async function loadAddresses() {
      if (!user) return;

      if (profile?.fullName) setValue("fullName", profile.fullName);
      if (user.email) setValue("email", user.email);
      if (profile?.phone) setValue("phone", profile.phone);

      try {
        const { data, error } = await supabase
          .from("customer_addresses")
          .select("*")
          .order("is_default", { ascending: false });

        let list: CustomerAddress[] = [];
        if (!error && data && data.length > 0) {
          list = data.map((a: any) => ({
            id: a.id,
            customerId: a.customer_id,
            fullName: a.full_name,
            phone: a.phone,
            addressLine1: a.address_line1,
            addressLine2: a.address_line2,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            isDefault: a.is_default,
          }));
        } else if (typeof window !== "undefined") {
          const local = localStorage.getItem(`velure_addresses_${user.id}`);
          if (local) {
            try {
              list = JSON.parse(local);
            } catch (e) {}
          }
        }

        if (list.length > 0) {
          setSavedAddresses(list);
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
          applyAddressToForm(def);
        }
      } catch (err) {
        console.warn("Could not load addresses:", err);
      }
    }

    loadAddresses();
  }, [user, profile, setValue, supabase, applyAddressToForm]);

  const selectedPaymentMethod = watch("paymentMethod");

  // Dynamic authoritative shipping & order totals calculation
  const calculatedShipping = calculateShippingFee(subtotal, shippingMethod);
  const calculatedTotal = Math.max(0, subtotal - discount + calculatedShipping);

  const handleAutoFillDemo = () => {
    setValue("fullName", "Priya Sundaram");
    setValue("email", user?.email || "priya.sundaram@atelier-velure.com");
    setValue("phone", "9820144521");
    setValue("addressLine1", "14B Seagull Apt, Carter Road");
    setValue("addressLine2", "Bandra West");
    setValue("city", "Mumbai");
    setValue("state", "Maharashtra");
    setValue("pincode", "400050");
    setValue("deliveryNotes", "Please deliver between 2 PM and 6 PM. Fragile silk packaging.");
    setSelectedAddressId("new");
    setErrorMessage(null);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Client-side generated idempotency key to prevent double charging/ordering
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const customerDetails: CustomerCheckoutDetails = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      deliveryNotes: data.deliveryNotes,
      paymentMethod: data.paymentMethod,
    };

    try {
      // Authoritative server-side checkout creation & validation
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          customerId: user?.id || null,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          couponCode: appliedCoupon,
          shippingMethodId: shippingMethod,
          shippingAddress: customerDetails,
          customer: customerDetails,
          deliveryNotes: data.deliveryNotes,
          paymentMethod: data.paymentMethod,
        }),
      });

      const check = await res.json();

      if (!res.ok || !check.success) {
        setErrorMessage(
          check.error || "Some items in your cart are no longer available or out of stock."
        );
        setIsSubmitting(false);
        return;
      }

      // Persist authoritative order snapshot in session storage for confirmation page
      const authoritativeOrder = check.order;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("velure_latest_order", JSON.stringify(authoritativeOrder));
      }

      clearCart();

      // For digital payment methods (UPI, Card, Netbanking), initiate gateway session
      if (data.paymentMethod !== "cod") {
        try {
          const payRes = await fetch("/api/payments/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber: authoritativeOrder.orderNumber,
              returnUrl: `${window.location.origin}/order-confirmation?order=${encodeURIComponent(authoritativeOrder.orderNumber)}`,
            }),
          });
          const payData = await payRes.json();
          if (payData.success && payData.checkoutUrl) {
            router.push(payData.checkoutUrl);
            return;
          }
        } catch (payErr) {
          console.warn("Payment initiation fallback:", payErr);
        }
      }

      router.push(`/order-confirmation?order=${encodeURIComponent(authoritativeOrder.orderNumber)}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16 text-center">
        <div className="max-w-md mx-auto py-12 bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30">
          <h1 className="font-headline-lg text-headline-lg text-primary font-semibold mb-2">
            Your Bag is Empty
          </h1>
          <p className="font-body-md text-on-surface-variant mb-6">
            Please add silhouettes to your shopping bag before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex px-6 py-3 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            Explore Silhouettes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
      {/* Demo Notice Banner */}
      <div className="mb-8 p-4 rounded-xl bg-secondary-container/20 border border-secondary-container text-on-surface font-body-sm text-body-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-secondary shrink-0" />
          <span>
            <strong>Atelier Checkout Foundation:</strong> Prices, inventory reservations, coupons, and shipping fees are calculated authoritatively on the backend.
          </span>
        </div>
        <button
          type="button"
          onClick={handleAutoFillDemo}
          className="font-label-sm uppercase tracking-wider text-secondary font-bold hover:underline shrink-0"
        >
          Auto-fill Demo Details
        </button>
      </div>

      {errorMessage && (
        <div className="mb-8 p-4 rounded-xl bg-error/10 border border-error/30 text-error font-body-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to complete checkout</p>
            <p>{errorMessage}</p>
            {(errorMessage.includes("stock") || errorMessage.includes("available")) && (
              <Link href="/cart" className="inline-block mt-2 font-semibold underline hover:opacity-80">
                Return to shopping bag to adjust pieces →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {user ? (
              <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-between text-xs text-secondary mb-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Checking out as patron: <strong>{profile?.fullName || user.email}</strong>
                  </span>
                </span>
                <Link href="/account/addresses" className="underline font-semibold hover:text-primary">
                  Manage addresses
                </Link>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant mb-2">
                <span>Already an atelier patron?</span>
                <Link
                  href="/login?redirectTo=/checkout"
                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Sign in for saved addresses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Step 1: Delivery Address Selection */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                    1
                  </span>
                  <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
                    Contact &amp; Delivery Address
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-secondary" /> Pan-India Express
                </span>
              </div>

              {/* Saved Addresses Selector (for authenticated users) */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 pb-4 border-b border-surface-container-high">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold block">
                    Choose Saved Atelier Address
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          applyAddressToForm(addr);
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "bg-surface-container-lowest border-primary ring-1 ring-primary shadow-sm"
                            : "bg-surface-container border-outline-variant/30 hover:border-outline-variant"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-primary text-sm truncate">
                            {addr.fullName}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary/15 text-secondary">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">
                          {addr.addressLine1}, {addr.city}, {addr.pincode}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Phone: {addr.phone}
                        </p>
                      </div>
                    ))}

                    <div
                      onClick={() => {
                        setSelectedAddressId("new");
                        setValue("addressLine1", "");
                        setValue("addressLine2", "");
                        setValue("city", "");
                        setValue("state", "");
                        setValue("pincode", "");
                      }}
                      className={`p-3.5 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-semibold ${
                        selectedAddressId === "new"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-outline-variant/60 text-on-surface-variant hover:border-outline-variant"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Enter a New Address</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      {...register("fullName")}
                      type="text"
                      placeholder="e.g. Priya Sundaram"
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-body-sm text-error mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="patron@example.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-body-sm text-error mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="9820144521"
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-body-sm text-error mt-1">{errors.phone.message}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Street Address &amp; Apartment
                  </label>
                  <input
                    {...register("addressLine1")}
                    type="text"
                    placeholder="14B Seagull Apt, Carter Road"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  {errors.addressLine1 && (
                    <p className="text-body-sm text-error mt-1">{errors.addressLine1.message}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="sm:col-span-2">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Landmark / Locality (Optional)
                  </label>
                  <input
                    {...register("addressLine2")}
                    type="text"
                    placeholder="Near Joggers Park, Bandra West"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    City
                  </label>
                  <input
                    {...register("city")}
                    type="text"
                    placeholder="Mumbai"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  {errors.city && (
                    <p className="text-body-sm text-error mt-1">{errors.city.message}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    State
                  </label>
                  <input
                    {...register("state")}
                    type="text"
                    placeholder="Maharashtra"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  {errors.state && (
                    <p className="text-body-sm text-error mt-1">{errors.state.message}</p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    PIN Code
                  </label>
                  <input
                    {...register("pincode")}
                    type="text"
                    maxLength={6}
                    placeholder="400050"
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  {errors.pincode && (
                    <p className="text-body-sm text-error mt-1">{errors.pincode.message}</p>
                  )}
                </div>

                {/* Delivery Notes */}
                <div className="sm:col-span-2">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-medium block mb-1">
                    Special Atelier Delivery &amp; Hemming Instructions
                  </label>
                  <textarea
                    {...register("deliveryNotes")}
                    rows={2}
                    placeholder="Specify custom trouser inseam, sleeve adjustment, or doorbell notes..."
                    className="w-full p-3 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Method Selection */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                    2
                  </span>
                  <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
                    Select Shipping Method
                  </h2>
                </div>
                <Truck className="w-5 h-5 text-secondary" />
              </div>

              <div className="space-y-3">
                {/* Standard Express Air */}
                <label
                  onClick={() => setShippingMethod("standard_air")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer shadow-sm transition-all border ${
                    shippingMethod === "standard_air"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      {shippingMethod === "standard_air" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-surface" />
                      )}
                    </div>
                    <div>
                      <span className="font-title-md text-title-md text-primary font-semibold block">
                        Standard Priority Air (BlueDart)
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Estimated 2–3 business days • Complimentary on orders ₹1,999+
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-primary font-tabular-num">
                    {subtotal >= 1999 ? (
                      <span className="text-[#386641] uppercase tracking-wider text-xs font-bold">
                        Free
                      </span>
                    ) : (
                      formatPrice(250)
                    )}
                  </span>
                </label>

                {/* Atelier White-Glove Courier */}
                <label
                  onClick={() => setShippingMethod("express_courier")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer shadow-sm transition-all border ${
                    shippingMethod === "express_courier"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center">
                      {shippingMethod === "express_courier" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-title-md text-primary font-semibold block">
                          Atelier White-Glove Courier
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/15 text-secondary uppercase tracking-wider">
                          Expedited
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Guaranteed 24–48h delivery • Bespoke garment-bag packaging
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-primary font-tabular-num">
                    {formatPrice(450)}
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                    3
                  </span>
                  <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
                    Select Payment Method
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <Lock className="w-4 h-4 text-[#386641]" /> 256-Bit SSL Secured
                </span>
              </div>

              <div className="space-y-3">
                {/* UPI */}
                <label
                  onClick={() => setValue("paymentMethod", "upi")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex flex-col gap-2.5 cursor-pointer shadow-sm transition-all border ${
                    selectedPaymentMethod === "upi"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        {selectedPaymentMethod === "upi" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-surface" />
                        )}
                      </div>
                      <div>
                        <span className="font-title-md text-title-md text-primary font-semibold block">
                          Instant UPI Pay
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Google Pay, PhonePe, Paytm, CRED &amp; Any UPI App
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ebf2ec] text-[#386641] uppercase tracking-wider">
                      Instant
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high">
                    <span className="px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm font-semibold text-primary">
                      GPay
                    </span>
                    <span className="px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm font-semibold text-primary">
                      PhonePe
                    </span>
                    <span className="px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm font-semibold text-primary">
                      Paytm UPI
                    </span>
                    <span className="px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm font-semibold text-primary">
                      BHIM
                    </span>
                  </div>
                </label>

                {/* Credit / Debit Card */}
                <label
                  onClick={() => setValue("paymentMethod", "card")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer shadow-sm transition-all border ${
                    selectedPaymentMethod === "card"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center">
                      {selectedPaymentMethod === "card" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <span className="font-title-md text-title-md text-primary font-medium block">
                        Credit or Debit Card
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Visa, Mastercard, RuPay &amp; American Express
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-on-surface-variant" />
                </label>

                {/* NetBanking */}
                <label
                  onClick={() => setValue("paymentMethod", "netbanking")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer shadow-sm transition-all border ${
                    selectedPaymentMethod === "netbanking"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center">
                      {selectedPaymentMethod === "netbanking" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <span className="font-title-md text-title-md text-primary font-medium block">
                        NetBanking
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        All major Indian banks (HDFC, ICICI, SBI, Axis)
                      </span>
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-on-surface-variant" />
                </label>

                {/* Cash On Delivery */}
                <label
                  onClick={() => setValue("paymentMethod", "cod")}
                  className={`p-4 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer shadow-sm transition-all border ${
                    selectedPaymentMethod === "cod"
                      ? "ring-2 ring-primary border-transparent"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center">
                      {selectedPaymentMethod === "cod" && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <span className="font-title-md text-title-md text-primary font-medium block">
                        Cash On Delivery (COD)
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Pay upon doorstep receipt via Cash or QR
                      </span>
                    </div>
                  </div>
                  <Banknote className="w-5 h-5 text-on-surface-variant" />
                </label>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-lg bg-[#582F0E] text-[#FAF7F2] hover:bg-[#7F4F24] font-title-md text-title-md font-semibold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Authorizing Atelier Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <span className="font-tabular-num">• {formatPrice(calculatedTotal)}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Bag
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary & Trust Badges */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          {/* Order Summary Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
              <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
                Bag Summary
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {itemCount} {itemCount === 1 ? "Piece" : "Pieces"}
              </span>
            </div>

            {/* Line Items List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded-md overflow-hidden relative flex-shrink-0 bg-surface-container">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-title-md text-title-md text-primary font-medium truncate">
                      {item.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Size: {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-tabular-num text-tabular-num text-primary font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-surface-container-high font-body-md text-body-md">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-tabular-num text-on-surface">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>
                  {shippingMethod === "express_courier"
                    ? "White-Glove Courier"
                    : "Priority Express Air"}
                </span>
                <span
                  className={
                    calculatedShipping === 0
                      ? "font-label-md text-label-md font-semibold text-[#386641] uppercase"
                      : "font-tabular-num text-on-surface"
                  }
                >
                  {calculatedShipping === 0 ? "FREE" : formatPrice(calculatedShipping)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Promotional Discount ({appliedCoupon})</span>
                  <span className="font-tabular-num font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-surface-container-high flex justify-between items-baseline">
                <div>
                  <span className="font-title-md text-title-md text-primary font-bold">Total Due</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    All GST &amp; custom duties included
                  </p>
                </div>
                <span className="font-headline-md text-headline-md text-primary font-bold font-tabular-num">
                  {formatPrice(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badges & Guarantee Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-1 border border-outline-variant/20">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                100% Secure
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-1 border border-outline-variant/20">
              <Lock className="w-5 h-5 text-secondary" />
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                256-bit SSL
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-1 border border-outline-variant/20">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                Authentic Atelier
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
