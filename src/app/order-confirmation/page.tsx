"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Truck, MessageCircle, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { OrderSummary } from "@/types";
import { formatPrice } from "@/lib/utils";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("order");
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("velure_latest_order");
      if (stored) {
        try {
          setOrder(JSON.parse(stored));
        } catch {
          // ignore error
        }
      }
    }
  }, []);

  const orderNum = order?.orderNumber || orderNumberParam || "VEL-2024-8921";

  return (
    <main className="w-full max-w-[1000px] mx-auto px-6 py-12">
      {/* Success Banner */}
      <div className="text-center pb-12 border-b border-surface-container-high">
        <div className="w-16 h-16 rounded-full bg-in-stock-bg text-in-stock flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-bold block mb-1">
          Atelier Order Confirmed
        </span>
        <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-primary font-bold tracking-tight mb-3">
          Thank You For Choosing Vélure
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
          Your order <strong className="text-primary font-semibold">#{orderNum}</strong> has been secured in our tailoring queue. A confirmation has been sent to your email.
        </p>

        {/* Demo Disclaimer */}
        <div className="mt-4 inline-block px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-body-sm">
          Simulated Demonstration Order • No real charges occurred
        </div>
      </div>

      {/* Order Progress Tracker */}
      <div className="my-12 p-6 sm:p-8 bg-surface-container-low rounded-2xl border border-outline-variant/30">
        <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-8 text-center">
          Atelier Fulfillment Journey
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-in-stock text-on-primary flex items-center justify-center font-bold mb-2 shadow-sm">
              ✓
            </div>
            <h3 className="font-title-md text-title-md text-primary font-semibold">Order Confirmed</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Batch reserved</p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-2 shadow-sm animate-pulse">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-primary font-semibold">Hand-Finishing</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">French seams &amp; hemming</p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-on-surface-variant font-medium">Quality Inspection</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Master tailor check</p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-on-surface-variant font-medium">Dispatched via Air</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">BlueDart Express</p>
          </div>
        </div>
      </div>

      {/* Order Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
        {/* Customer & Delivery */}
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high">
            <MapPin className="w-5 h-5 text-secondary" />
            <h3 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
              Delivery Details
            </h3>
          </div>
          <div className="space-y-1 font-body-md text-body-md text-on-surface">
            <p className="font-semibold text-primary">
              {order?.customer.fullName || "Priya Sundaram"}
            </p>
            <p className="text-on-surface-variant">
              {order?.customer.addressLine1 || "14B Seagull Apt, Carter Road"}
              {order?.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ", Bandra West"}
            </p>
            <p className="text-on-surface-variant">
              {order?.customer.city || "Mumbai"}, {order?.customer.state || "Maharashtra"} — {order?.customer.pincode || "400050"}
            </p>
            <p className="text-on-surface-variant pt-2">
              <strong>Phone:</strong> +91 {order?.customer.phone || "98201 44521"}
            </p>
            <p className="text-on-surface-variant">
              <strong>Email:</strong> {order?.customer.email || "priya@example.com"}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high">
            <Package className="w-5 h-5 text-secondary" />
            <h3 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
              Payment &amp; Totals
            </h3>
          </div>

          <div className="space-y-2 font-body-md text-body-md">
            <div className="flex justify-between text-on-surface-variant">
              <span>Payment Mode:</span>
              <span className="font-semibold text-primary uppercase">
                {order?.paymentMethod || "Razorpay UPI"}
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-tabular-num">{formatPrice(order?.subtotal || 4850)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Air Shipping:</span>
              <span className="text-[#386641] font-semibold">FREE</span>
            </div>
            {order?.discount ? (
              <div className="flex justify-between text-secondary">
                <span>Discount ({order.couponCode || "FESTIVE10"}):</span>
                <span className="font-tabular-num font-semibold">-{formatPrice(order.discount)}</span>
              </div>
            ) : null}
            <div className="pt-3 border-t border-surface-container-high flex justify-between items-baseline font-bold text-primary">
              <span className="font-title-md">Total Paid:</span>
              <span className="font-headline-md font-tabular-num">
                {formatPrice(order?.total || 4365)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md font-semibold uppercase tracking-wider shadow-md transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <a
          href="https://wa.me/919820144521?text=Hello%20V%C3%A9lure%2C%20I%20have%20an%20inquiry%20regarding%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-title-md text-title-md font-semibold transition-all inline-flex items-center justify-center gap-2 border border-outline-variant/30"
        >
          <MessageCircle className="w-4 h-4 text-secondary" />
          <span>WhatsApp Concierge</span>
        </a>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1000px] mx-auto px-6 py-16 text-center text-on-surface-variant">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-body-md">Loading confirmation details...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
