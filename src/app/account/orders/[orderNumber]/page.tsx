"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  XCircle,
  Loader2,
  Scissors,
  Check,
  MapPin,
  CreditCard,
  Building2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrderRecord } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_POLICY,
  isOrderEligibleForCancellation,
  isOrderEligibleForReturn,
} from "@/lib/orderPolicyConfig";
import { sanitizeTrackingUrl } from "@/services/shipping/trackingUrlHelper";
import {
  requestOrderCancellationAction,
  createReturnRequestAction,
} from "@/actions/orderActions";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = (params?.orderNumber as string) || "";
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(ORDER_POLICY.CANCELLATION_REASONS[0]);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<string>(ORDER_POLICY.RETURN_REASONS[0]);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Order not found or unauthorized access.");
        setLoading(false);
        return;
      }

      setOrder(data.order);
      // Initialize return quantities to 1 for all items
      const initialQtys: Record<string, number> = {};
      (data.order.items || []).forEach((item: any) => {
        initialQtys[item.id || item.sku] = item.quantity;
      });
      setReturnQuantities(initialQtys);
    } catch (err: any) {
      setError(err.message || "Failed to load commission details.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle Cancellation Submission
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCancelSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await requestOrderCancellationAction(order.orderNumber, cancelReason);
      if (!res.success) {
        setFeedbackMessage({ type: "error", text: res.error || "Failed to request cancellation." });
      } else {
        setFeedbackMessage({
          type: "success",
          text: "Cancellation request received. Our atelier concierge is processing your release.",
        });
        setIsCancelModalOpen(false);
        await fetchOrder();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Handle Return Submission
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setReturnSubmitting(true);
    setFeedbackMessage(null);

    const itemsToReturn = order.items
      .filter((it) => (returnQuantities[it.id || it.sku] || 0) > 0)
      .map((it) => ({
        orderItemId: it.id || it.sku,
        quantity: returnQuantities[it.id || it.sku],
        condition: "unopened",
      }));

    if (itemsToReturn.length === 0) {
      setFeedbackMessage({ type: "error", text: "Please select at least one garment to return." });
      setReturnSubmitting(false);
      return;
    }

    try {
      const res = await createReturnRequestAction({
        orderNumber: order.orderNumber,
        reason: returnReason,
        customerNotes: returnNotes,
        items: itemsToReturn,
      });

      if (!res.success) {
        setFeedbackMessage({ type: "error", text: res.error || "Failed to submit return request." });
      } else {
        setFeedbackMessage({
          type: "success",
          text: `Complimentary return request #${res.returnRecord?.returnNumber} submitted successfully. Pickup will be coordinated shortly.`,
        });
        setIsReturnModalOpen(false);
        await fetchOrder();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full max-w-[1200px] mx-auto px-6 lg:px-12 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <h2 className="font-serif text-lg text-primary">Accessing Atelier Commission Archive...</h2>
        <p className="text-xs text-on-surface-variant mt-1">Verifying encrypted order coordinates</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="w-full max-w-[800px] mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl text-primary font-semibold mb-2">Commission Not Available</h1>
        <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
          {error || "We could not access the requested order. You may need to verify your credentials."}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-xs tracking-wider uppercase hover:bg-primary-container transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Commission History</span>
        </Link>
      </main>
    );
  }

  const cancelEligibility = isOrderEligibleForCancellation(order);
  const returnEligibility = isOrderEligibleForReturn(order);

  // Timeline Progress Milestones
  const steps = [
    { key: "confirmed", label: "Commission Placed", icon: CheckCircle2 },
    { key: "tailoring", label: "Atelier Tailoring", icon: Scissors },
    { key: "inspection", label: "Quality Inspection", icon: ShieldCheck },
    { key: "dispatched", label: "Priority Air Transit", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Package },
  ];

  const statusHierarchy: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    tailoring: 2,
    processing: 2,
    inspection: 3,
    dispatched: 4,
    shipped: 4,
    delivered: 5,
    return_requested: 5,
    returned: 5,
    cancellation_requested: 1,
    cancelled: -1,
  };

  const currentLevel = statusHierarchy[order.fulfillmentStatus.toLowerCase()] ?? 1;
  const isCancelled = order.fulfillmentStatus === "cancelled";

  return (
    <main className="w-full max-w-[1200px] mx-auto px-6 lg:px-12 py-10 bg-surface">
      {/* Top Breadcrumb Navigation */}
      <div className="mb-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Commissions</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-secondary font-semibold uppercase tracking-widest">
                Commission Dossier
              </span>
              <span className="text-on-surface-variant/40">•</span>
              <span className="text-xs text-on-surface-variant">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="font-serif text-3xl text-primary font-semibold">
              Order #{order.orderNumber}
            </h1>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {cancelEligibility.eligible && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 rounded-lg border border-outline-variant/60 hover:border-error hover:bg-error/5 text-error text-xs font-semibold tracking-wide transition-all shadow-2xs"
              >
                Request Cancellation
              </button>
            )}

            {returnEligibility.eligible && (
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/40 text-xs font-semibold tracking-wide transition-all shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-secondary" />
                <span>Request Return / Exchange</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Notification Alert */}
      {feedbackMessage && (
        <div
          className={`mb-8 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-secondary/10 border border-secondary/20 text-secondary"
              : "bg-error/10 border border-error/20 text-error"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-xs font-medium">{feedbackMessage.text}</p>
        </div>
      )}

      {/* Cancellation / Return Review Alert Banners */}
      {order.fulfillmentStatus === "cancellation_requested" && (
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block text-sm">Cancellation Under Atelier Review</strong>
            <p className="mt-0.5 text-amber-800">
              Your cancellation request submitted on{" "}
              {order.cancellationRequestedAt ? new Date(order.cancellationRequestedAt).toLocaleDateString() : "recently"}{" "}
              is currently under review by our atelier team. Reason cited: &quot;{order.cancellationReason}&quot;.
            </p>
          </div>
        </div>
      )}

      {order.fulfillmentStatus === "return_requested" && (
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900">
          <RotateCcw className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block text-sm">Return Request Under Review</strong>
            <p className="mt-0.5 text-amber-800">
              Your complimentary return request is under review. Our concierge will contact you with pickup scheduling coordinates.
            </p>
          </div>
        </div>
      )}

      {order.fulfillmentStatus === "cancelled" && (
        <div className="mb-8 p-4 rounded-xl bg-neutral-100 border border-neutral-300 flex items-start gap-3 text-neutral-800">
          <XCircle className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block text-sm">Commission Cancelled</strong>
            <p className="mt-0.5 text-neutral-600">
              This order has been cancelled and any reserved pieces returned to archive.{" "}
              {order.paymentStatus === "refunded" && "Any captured funds have been queued for refund reversal."}
            </p>
          </div>
        </div>
      )}

      {/* Progress Timeline Stepper */}
      {!isCancelled && (
        <div className="mb-10 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-4">
            Atelier Progress Timeline
          </span>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
            {steps.map((st, index) => {
              const Icon = st.icon;
              const isPastOrCurrent = currentLevel >= index + 1;
              const isCurrent = currentLevel === index + 1;

              return (
                <div key={st.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isPastOrCurrent
                        ? isCurrent
                          ? "bg-secondary text-surface shadow-sm ring-4 ring-secondary/20"
                          : "bg-secondary/15 text-secondary border border-secondary/30"
                        : "bg-surface-container text-on-surface-variant/40 border border-outline-variant/30"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        isPastOrCurrent ? "text-primary" : "text-on-surface-variant/50"
                      }`}
                    >
                      {st.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        Active Stage
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column Grid: Left (Garments & Tracking), Right (Coordinates & Payment) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col (Garments & Courier Tracking) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Garments List */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="font-serif text-lg text-primary font-semibold">Handcrafted Garments</h2>

            <div className="divide-y divide-outline-variant/30">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/40 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600"}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-sm text-sm font-semibold text-primary truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {item.variantDescription || `Size: ${item.sku}`}
                    </p>
                    <p className="text-xs font-mono text-on-surface-variant/70 mt-0.5">
                      SKU: {item.sku}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-on-surface-variant">Qty: {item.quantity}</span>
                      <strong className="text-sm font-semibold text-primary">
                        {formatPrice(item.lineTotal || item.unitPrice * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courier Air Transit Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-primary font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5 text-secondary" />
                <span>Priority Air Courier Tracking</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                {order.carrier}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <div>
                <span className="text-on-surface-variant block">Air Waybill (AWB)</span>
                <span className="font-mono font-bold text-primary text-sm mt-0.5 block">
                  {order.trackingNumber || "Pending Dispatch Manifest"}
                </span>
              </div>

              <div>
                <span className="text-on-surface-variant block">Estimated Transit Window</span>
                <span className="font-medium text-primary mt-0.5 block">
                  {order.estimatedDelivery}
                </span>
              </div>
            </div>

            {sanitizeTrackingUrl(order.trackingUrl) ? (
              <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-end">
                <a
                  href={sanitizeTrackingUrl(order.trackingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-secondary hover:underline font-semibold"
                >
                  <span>Track Live on Courier Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-on-surface-variant/70 italic">
                {currentLevel < 4
                  ? "Bespoke tailoring in progress. Air tracking will activate once dispatched."
                  : "Tracking details recorded by atelier."}
              </div>
            )}
          </div>
        </div>

        {/* Right Col (Coordinates & Financial Settlement) */}
        <div className="space-y-8">
          {/* Delivery Coordinates */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-base text-primary font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>Delivery Coordinates</span>
            </h2>

            <div className="text-xs text-on-surface-variant space-y-1 leading-relaxed">
              <p className="font-semibold text-primary">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
                <span className="font-mono font-medium">{order.shippingAddress.pincode}</span>
              </p>
              <p className="font-mono pt-1 text-primary">📞 +91 {order.shippingAddress.phone}</p>
            </div>

            {order.deliveryNotes && (
              <div className="mt-3 pt-3 border-t border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant font-medium block">Concierge Notes:</span>
                <p className="italic text-primary mt-0.5">&quot;{order.deliveryNotes}&quot;</p>
              </div>
            )}
          </div>

          {/* Payment & Financial Settlement Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-base text-primary font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-secondary" />
              <span>Financial Settlement</span>
            </h2>

            <div className="space-y-2 text-xs border-b border-outline-variant/30 pb-4">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Promotional Courtesy</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-on-surface-variant">
                <span>Priority Air Courier</span>
                <span>{order.shippingFee === 0 ? "Complimentary" : formatPrice(order.shippingFee)}</span>
              </div>

              <div className="flex justify-between text-on-surface-variant">
                <span>GST (12% Included)</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-semibold text-primary pt-2 border-t border-outline-variant/30">
                <span>Total Amount</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Method</span>
                <span className="uppercase font-semibold text-primary">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Payment Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    order.paymentStatus === "paid" || order.paymentStatus === "captured"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>

              {order.bankReferenceNumber && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-on-surface-variant">Bank UTR</span>
                  <span className="font-mono text-primary font-medium">{order.bankReferenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/50 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-primary font-semibold">Request Cancellation</h3>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Commissions may be cancelled prior to custom cutting or air dispatch. Please provide your reason:
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ORDER_POLICY.CANCELLATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary"
                >
                  Keep Commission
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-5 py-2 rounded-lg bg-error text-surface font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {cancelSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN REQUEST MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/50 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-primary font-semibold">Initiate Complimentary Return</h3>
                <p className="text-xs text-on-surface-variant">
                  {returnEligibility.daysRemaining} days remaining in your 14-day return window
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary mb-2">Select Garments to Return</label>
                <div className="space-y-2 border border-outline-variant/40 rounded-xl p-3 bg-surface-container-low/50">
                  {order.items.map((item) => {
                    const itemKey = item.id || item.sku;
                    const currentQty = returnQuantities[itemKey] || 0;

                    return (
                      <div key={itemKey} className="flex items-center justify-between text-xs py-1.5 border-b border-outline-variant/20 last:border-b-0">
                        <div className="pr-2">
                          <p className="font-semibold text-primary">{item.productName}</p>
                          <p className="text-on-surface-variant text-[11px]">{item.variantDescription}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant">Return Qty:</span>
                          <select
                            value={currentQty}
                            onChange={(e) =>
                              setReturnQuantities((prev) => ({
                                ...prev,
                                [itemKey]: Number(e.target.value),
                              }))
                            }
                            className="p-1 rounded border border-outline-variant bg-surface text-primary text-xs"
                          >
                            {Array.from({ length: item.quantity + 1 }, (_, i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ORDER_POLICY.RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Patron Notes / Fit Observations (Optional)
                </label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Tell our tailors what can be refined for your exchange or return..."
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary"
                >
                  Keep Garments
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="px-5 py-2 rounded-lg bg-primary text-surface font-semibold text-xs tracking-wider uppercase hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {returnSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Return Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
