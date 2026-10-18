"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, generateOrderNumber } from "@/lib/utils";
import { PaymentMethod, CustomerCheckoutDetails, OrderSummary } from "@/types";

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
  const { items, itemCount, subtotal, discount, appliedCoupon, shipping, total, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill with demo details matching Stitch UI design
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "Priya Sundaram",
      email: "priya@example.com",
      phone: "9820144521",
      addressLine1: "14B Seagull Apt, Carter Road",
      addressLine2: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      paymentMethod: "upi",
      deliveryNotes: "Please deliver between 2 PM and 6 PM.",
    },
  });

  const selectedPaymentMethod = watch("paymentMethod");

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    // Simulate authentic demo order processing
    await new Promise((resolve) => setTimeout(resolve, 800));

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

    const orderNumber = generateOrderNumber();
    const orderSummary: OrderSummary = {
      orderId: `ord_${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      customer: customerDetails,
      items: [...items],
      subtotal,
      shipping,
      discount,
      couponCode: appliedCoupon || undefined,
      tax: Math.round(subtotal * 0.12),
      total,
      paymentMethod: data.paymentMethod,
      status: "confirmed",
      trackingNumber: `BD-AIR-${Math.floor(100000 + Math.random() * 900000)}`,
      estimatedDelivery: "2–3 business days via BlueDart Express Air",
    };

    // Save order in session storage for the confirmation page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("velure_latest_order", JSON.stringify(orderSummary));
    }

    clearCart();
    router.push(`/order-confirmation?order=${orderNumber}`);
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
      <div className="mb-8 p-4 rounded-xl bg-secondary-container/20 border border-secondary-container text-on-surface font-body-sm text-body-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-secondary shrink-0" />
          <span>
            <strong>Demo Storefront Simulation:</strong> This checkout flow simulates a real order without processing real credit cards or financial transactions.
          </span>
        </div>
        <span className="font-label-sm uppercase tracking-wider text-secondary font-bold shrink-0">
          Sandboxed Mode
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Contact & Delivery */}
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
                      placeholder="priya@example.com"
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

            {/* Step 2: Payment Method Selection */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                    2
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
                {/* Razorpay UPI */}
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
                          Razorpay UPI &amp; Instant Pay
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
                  <span>Securing Your Atelier Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <span className="font-tabular-num">• {formatPrice(total)}</span>
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
                <span>Express Air Shipping</span>
                <span className="font-label-md text-label-md font-semibold text-[#386641] uppercase">
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
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
                  {formatPrice(total)}
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
