"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Truck, MessageCircle, ArrowRight, ShieldCheck, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { OrderRecord } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("order");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    if (!orderNumberParam) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumberParam)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      }
    } catch {}
    setIsRefreshing(false);
  };

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      // 1. Try fetching from server API using the order number
      if (orderNumberParam) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderNumberParam)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setOrder(data.order);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Fall back to session storage
        }
      }

      // 2. Fall back to session storage
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("velure_latest_order");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setOrder(parsed);
          } catch {}
        }
      }
      setIsLoading(false);
    }

    loadOrder();
  }, [orderNumberParam]);

  if (isLoading) {
    return (
      <main className="w-full max-w-[1000px] mx-auto px-6 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <h2 className="font-title-md text-title-md text-primary font-semibold">
          Retrieving Atelier Order Details...
        </h2>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="w-full max-w-[600px] mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary font-semibold mb-2">
          Order Not Found
        </h1>
        <p className="font-body-md text-on-surface-variant mb-6">
          We couldn&apos;t locate an order record for #{orderNumberParam || "unknown"}. If you just placed an order, please check your confirmation email or order history in your account.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
        >
          <span>Return to Storefront</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    );
  }

  const orderNum = order.orderNumber;
  const isCod = order.paymentMethod === "cod";

  return (
    <main className="w-full max-w-[1000px] mx-auto px-6 py-12">
      {/* Success Banner */}
      <div className="text-center pb-12 border-b border-surface-container-high">
        <div className="w-16 h-16 rounded-full bg-in-stock-bg text-in-stock flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-bold block mb-1">
          Atelier Order Received
        </span>
        <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-primary font-bold tracking-tight mb-3">
          Thank You For Choosing Vélure
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
          Your order <strong className="text-primary font-semibold">#{orderNum}</strong> has been secured in our atelier system.
        </p>

        {/* Payment & Fulfillment Status Badges */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold uppercase tracking-wider">
            Payment Status:{" "}
            <span
              className={
                order.paymentStatus === "paid"
                  ? "text-in-stock font-bold"
                  : order.paymentStatus === "failed"
                  ? "text-error font-bold"
                  : "text-[#BC6C25]"
              }
            >
              {order.paymentStatus === "paid"
                ? "Paid & Settled"
                : order.paymentStatus === "pending"
                ? isCod
                  ? "Pay on Delivery (Pending)"
                  : "Pending Gateway Settlement"
                : order.paymentStatus}
            </span>
          </span>

          {order.paymentStatus === "pending" && !isCod && (
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Refresh Settlement"}</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold uppercase tracking-wider">
            Fulfillment: <span className="text-secondary">{order.fulfillmentStatus}</span>
          </span>
        </div>

        {order.paymentStatus === "failed" && (
          <div className="mt-6 max-w-lg mx-auto p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <strong className="block text-sm">Payment Unsuccessful or Expired</strong>
                Your order batch reservation is temporarily held. Retry to complete your garment order.
              </div>
            </div>
            <Link
              href={`/checkout/mock-gateway?order=${encodeURIComponent(order.orderNumber)}`}
              className="px-4 py-2 rounded bg-error text-white text-xs font-semibold hover:opacity-90 shrink-0 shadow-sm"
            >
              Retry Payment
            </Link>
          </div>
        )}
      </div>

      {/* Order Progress Tracker */}
      <div className="my-12 p-6 sm:p-8 bg-surface-container-low rounded-2xl border border-outline-variant/30">
        <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-8 text-center">
          Atelier Fulfillment Journey
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-in-stock text-on-primary flex items-center justify-center font-bold mb-2 shadow-sm">
              ✓
            </div>
            <h3 className="font-title-md text-title-md text-primary font-semibold">Order Initiated</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Batch reserved</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-2 shadow-sm animate-pulse">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-primary font-semibold">Hand-Finishing</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">French seams &amp; hemming</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-on-surface-variant font-medium">Quality Inspection</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Master tailor check</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-title-md text-title-md text-on-surface-variant font-medium">Dispatched via Air</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{order.carrier || "BlueDart Express"}</p>
          </div>
        </div>
      </div>

      {/* Purchased Line Items Snapshot */}
      <div className="p-6 sm:p-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 mb-8 shadow-sm">
        <h3 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-6 pb-3 border-b border-surface-container-high">
          Garments in this Edition ({order.items?.length || 0})
        </h3>
        <div className="divide-y divide-surface-container-high">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {item.imageUrl && (
                  <div className="w-16 h-20 rounded-lg overflow-hidden relative bg-surface-container shrink-0">
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-semibold">
                    {item.productName}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {item.variantDescription || `SKU: ${item.sku}`}
                  </p>
                  <p className="font-tabular-num text-sm text-primary/80 mt-1">
                    Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
              </div>
              <span className="font-title-md text-title-md font-bold text-primary font-tabular-num">
                {formatPrice(item.lineTotal || item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Summary Grid */}
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
              {order.shippingAddress?.fullName}
            </p>
            <p className="text-on-surface-variant">
              {order.shippingAddress?.addressLine1}
              {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
            </p>
            <p className="text-on-surface-variant">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
            </p>
            <p className="text-on-surface-variant pt-2">
              <strong>Phone:</strong> {order.shippingAddress?.phone}
            </p>
            {order.trackingNumber && (
              <p className="text-on-surface-variant">
                <strong>Waybill Tracking:</strong> {order.trackingNumber}
              </p>
            )}
            {order.deliveryNotes && (
              <p className="text-xs text-on-surface-variant italic pt-2">
                &ldquo;{order.deliveryNotes}&rdquo;
              </p>
            )}
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
                {order.paymentMethod}
              </span>
            </div>
            {order.bankReferenceNumber && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Bank Reference (UTR):</span>
                <span className="font-mono text-xs font-semibold text-primary">
                  {order.bankReferenceNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span className="font-tabular-num">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Shipping ({order.carrier || "Priority Air"}):</span>
              <span className={order.shippingFee === 0 ? "text-[#386641] font-semibold" : "font-tabular-num"}>
                {order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Discount ({order.couponCode || "PROMO"}):</span>
                <span className="font-tabular-num font-semibold">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-surface-container-high flex justify-between items-baseline font-bold text-primary">
              <span className="font-title-md">Total Amount:</span>
              <span className="font-headline-md font-tabular-num">
                {formatPrice(order.totalAmount)}
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
          href={`https://wa.me/919820144521?text=Hello%20V%C3%A9lure%2C%20inquiry%20regarding%20order%20${encodeURIComponent(orderNum)}`}
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
