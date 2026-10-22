"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingBag,
  AlertCircle,
  RotateCcw,
  XCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrderSummary, FulfillmentStatus, PaymentStatus } from "@/types";
import { formatPrice } from "@/lib/utils";
import { isOrderEligibleForCancellation, isOrderEligibleForReturn } from "@/lib/orderPolicyConfig";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setLoading(true);

      const combinedOrders: OrderSummary[] = [];

      try {
        // 1. Fetch authenticated orders via authoritative server endpoint
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            data.orders.forEach((o: any) => {
              combinedOrders.push({
                orderId: o.id,
                orderNumber: o.orderNumber,
                createdAt: o.createdAt,
                customer: o.shippingAddress || {},
                items: (o.items || []).map((it: any) => ({
                  id: it.id,
                  productId: it.productId || "",
                  productSlug: "",
                  name: it.productName,
                  price: Number(it.unitPrice),
                  image: it.imageUrl || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600",
                  size: it.size || (it.variantDescription?.split("•")[0]?.trim() || "M"),
                  color: it.color || (it.variantDescription?.split("•")[1]?.trim() || "Espresso"),
                  quantity: it.quantity,
                  maxStock: 10,
                })),
                subtotal: Number(o.subtotal),
                shipping: Number(o.shippingFee),
                discount: Number(o.discountAmount),
                tax: Number(o.taxAmount),
                total: Number(o.totalAmount),
                paymentMethod: o.paymentMethod || "upi",
                status: o.fulfillmentStatus || "confirmed",
                fulfillmentStatus: o.fulfillmentStatus,
                paymentStatus: o.paymentStatus,
                trackingNumber: o.trackingNumber,
                carrier: o.carrier || "BlueDart Express Air",
                trackingUrl: o.trackingUrl,
                estimatedDelivery: o.estimatedDelivery || "2–3 business days via BlueDart Air",
                cancellationReason: o.cancellationReason,
                cancellationRequestedAt: o.cancellationRequestedAt,
                cancelledAt: o.cancelledAt,
                deliveredAt: o.deliveredAt,
              });
            });
          }
        }
      } catch (err) {
        console.warn("Could not query orders API:", err);
      }

      // 2. Also check sessionStorage for order placed in this active browser session
      if (typeof window !== "undefined") {
        const sessionOrder = sessionStorage.getItem("velure_latest_order");
        if (sessionOrder) {
          try {
            const parsed = JSON.parse(sessionOrder);
            if (!combinedOrders.some((o) => o.orderNumber === parsed.orderNumber)) {
              combinedOrders.unshift({
                orderId: parsed.id || parsed.orderId,
                orderNumber: parsed.orderNumber,
                createdAt: parsed.createdAt,
                customer: parsed.shippingAddress || parsed.customer || {},
                items: (parsed.items || []).map((it: any) => ({
                  id: it.id,
                  productId: it.productId || "",
                  productSlug: "",
                  name: it.productName || it.name,
                  price: Number(it.unitPrice || it.price),
                  image: it.imageUrl || it.image || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600",
                  size: it.size || "M",
                  color: it.color || "Espresso",
                  quantity: it.quantity,
                  maxStock: 10,
                })),
                subtotal: Number(parsed.subtotal),
                shipping: Number(parsed.shippingFee || parsed.shipping || 0),
                discount: Number(parsed.discountAmount || parsed.discount || 0),
                tax: Number(parsed.taxAmount || parsed.tax || 0),
                total: Number(parsed.totalAmount || parsed.total || 0),
                paymentMethod: parsed.paymentMethod || "upi",
                status: parsed.fulfillmentStatus || "confirmed",
                fulfillmentStatus: parsed.fulfillmentStatus || "confirmed",
                paymentStatus: parsed.paymentStatus || "pending",
                trackingNumber: parsed.trackingNumber,
                carrier: parsed.carrier || "BlueDart Express Air",
                estimatedDelivery: parsed.estimatedDelivery || "2–3 business days via BlueDart Air",
              });
            }
          } catch (e) {}
        }
      }

      setOrders(combinedOrders);
      if (combinedOrders.length > 0) {
        setExpandedOrders({ [combinedOrders[0].orderNumber]: true });
      }
      setLoading(false);
    }

    fetchOrders();
  }, [user]);

  const toggleExpand = (orderNumber: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderNumber]: !prev[orderNumber],
    }));
  };

  const getFulfillmentBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return { label: "Delivered", color: "bg-emerald-500/10 text-emerald-800 border-emerald-500/30" };
      case "dispatched":
      case "shipped":
        return { label: "Dispatched • In Transit", color: "bg-sky-500/10 text-sky-800 border-sky-500/30" };
      case "inspection":
        return { label: "Quality Inspection", color: "bg-indigo-500/10 text-indigo-800 border-indigo-500/30" };
      case "tailoring":
      case "processing":
        return { label: "In Atelier Tailoring", color: "bg-purple-500/10 text-purple-800 border-purple-500/30" };
      case "cancellation_requested":
        return { label: "Cancellation Requested", color: "bg-amber-500/10 text-amber-800 border-amber-500/30" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30 line-through" };
      case "return_requested":
        return { label: "Return Under Review", color: "bg-amber-500/10 text-amber-800 border-amber-500/30" };
      case "returned":
        return { label: "Returned & Resolved", color: "bg-rose-500/10 text-rose-800 border-rose-500/30" };
      case "confirmed":
      default:
        return { label: "Commission Confirmed", color: "bg-secondary/15 text-secondary border-secondary/30" };
    }
  };

  const getPaymentBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "captured":
        return { label: "Paid", color: "text-emerald-700 bg-emerald-50" };
      case "failed":
        return { label: "Payment Failed", color: "text-rose-700 bg-rose-50" };
      case "refunded":
        return { label: "Refunded", color: "text-purple-700 bg-purple-50" };
      case "partially_refunded":
        return { label: "Partial Refund", color: "text-purple-700 bg-purple-50" };
      default:
        return { label: "Payment Pending", color: "text-amber-700 bg-amber-50" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-sm text-headline-sm font-serif text-primary">
          Commission History
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Review your current and historical garment orders, tailoring milestones, air shipments, and return requests.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-on-surface-variant">Retrieving your atelier records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-12 text-center text-on-surface-variant">
          <Package className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-title-md text-title-md font-semibold text-primary">
            No Orders on Record
          </h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            You have not commissioned any atelier garments yet. Explore our latest seasonal capsules.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Silhouettes</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders[order.orderNumber];
            const fBadge = getFulfillmentBadge(order.fulfillmentStatus);
            const pBadge = getPaymentBadge(order.paymentStatus);
            const canCancel = isOrderEligibleForCancellation(order).eligible;
            const canReturn = isOrderEligibleForReturn(order).eligible;

            return (
              <div
                key={order.orderNumber}
                className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(order.orderNumber)}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-xs text-on-surface-variant block">Commission No.</span>
                      <strong className="font-mono text-primary font-semibold">
                        {order.orderNumber}
                      </strong>
                    </div>

                    <div>
                      <span className="text-xs text-on-surface-variant block">Placed On</span>
                      <span className="text-on-surface font-medium">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-on-surface-variant block">Total</span>
                      <strong className="text-primary font-semibold">
                        {formatPrice(order.total)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pBadge.color}`}>
                        {pBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${fBadge.color}`}>
                      {fBadge.label}
                    </span>
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 border-t border-outline-variant/30 pt-5 space-y-6 animate-in fade-in duration-150">
                    {/* Air Delivery Tracking Card */}
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-secondary flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">
                            Priority Air Delivery • {order.estimatedDelivery}
                          </p>
                          <p className="text-on-surface-variant mt-0.5">
                            Carrier: <strong className="text-primary">{order.carrier}</strong> • AWB:{" "}
                            <span className="font-mono font-medium text-primary">
                              {order.trackingNumber || "Assigning in atelier"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>Live Courier Tracking</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null}

                        <Link
                          href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-secondary font-semibold transition-colors"
                        >
                          <span>Full Commission Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Garments List */}
                    <div className="divide-y divide-outline-variant/30">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                          <div className="w-16 h-20 rounded-lg overflow-hidden bg-surface-container border border-outline-variant/40 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-title-sm text-sm font-semibold text-primary truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Size: <strong className="font-medium text-primary">{item.size}</strong> • Color:{" "}
                              <strong className="font-medium text-primary">{item.color}</strong> • Qty:{" "}
                              <strong className="font-medium text-primary">{item.quantity}</strong>
                            </p>
                            <p className="text-xs font-semibold text-primary mt-1">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial & Delivery Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30 text-xs">
                      <div>
                        <span className="font-semibold text-primary uppercase tracking-wider block mb-1">
                          Delivery Coordinates
                        </span>
                        <p className="text-on-surface-variant leading-relaxed">
                          {order.customer.fullName}
                          <br />
                          {order.customer.addressLine1}
                          {order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ""}
                          <br />
                          {order.customer.city}, {order.customer.state} — {order.customer.pincode}
                        </p>
                        <p className="text-on-surface-variant font-mono mt-1">
                          📞 +91 {order.customer.phone}
                        </p>
                      </div>

                      <div className="space-y-1.5 md:text-right">
                        <div className="flex justify-between md:justify-end gap-6 text-on-surface-variant">
                          <span>Subtotal:</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between md:justify-end gap-6 text-secondary">
                            <span>Promotional Courtesy:</span>
                            <span>-{formatPrice(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between md:justify-end gap-6 text-on-surface-variant">
                          <span>Priority Air Shipping:</span>
                          <span>{order.shipping === 0 ? "Complimentary" : formatPrice(order.shipping)}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-6 text-on-surface-variant">
                          <span>GST (12% Included):</span>
                          <span>{formatPrice(order.tax)}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-6 font-semibold text-sm text-primary pt-1 border-t border-outline-variant/30">
                          <span>Total ({order.paymentMethod.toUpperCase()}):</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Link to Detail Page */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        {canCancel && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Eligible for cancellation
                          </span>
                        )}
                        {canReturn && (
                          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Eligible for complimentary return
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Timeline &amp; Requests</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
