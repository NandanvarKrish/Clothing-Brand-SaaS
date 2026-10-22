"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  XCircle,
  FileText,
  Scissors,
  ShieldCheck,
  Sparkles,
  Layers,
  MapPin,
  CreditCard,
} from "lucide-react";
import { OrderRecord, getAllOrders } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import {
  updateOrderFulfillmentAction,
  reviewOrderCancellationAction,
  reviewReturnRequestAction,
} from "@/actions/adminOrderActions";
import { FulfillmentStatus, PaymentStatus } from "@/types";
import { ORDER_POLICY } from "@/lib/orderPolicyConfig";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Detail & Action Modals State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Form states for update modal
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState<FulfillmentStatus>("confirmed");
  const [carrier, setCarrier] = useState("BlueDart Express Air");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for review modals
  const [decisionNotes, setDecisionNotes] = useState("");
  const [restockApproved, setRestockApproved] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllOrders({
        query: searchQuery,
        fulfillmentStatus: statusFilter === "all" ? undefined : statusFilter,
      });
      setOrders(result.orders);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load orders." });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openUpdateModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setNewFulfillmentStatus(order.fulfillmentStatus);
    setCarrier(order.carrier || "BlueDart Express Air");
    setTrackingNumber(order.trackingNumber || "");
    setTrackingUrl(order.trackingUrl || "");
    setAdminNotes(order.adminNotes || "");
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await updateOrderFulfillmentAction(selectedOrder.orderNumber, {
        fulfillmentStatus: newFulfillmentStatus,
        carrier,
        trackingNumber,
        trackingUrl,
        adminNotes,
      });

      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to update order status." });
      } else {
        setNotification({ type: "success", message: `Order #${selectedOrder.orderNumber} updated to ${newFulfillmentStatus}.` });
        setIsUpdateModalOpen(false);
        await loadOrders();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error updating order." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancellationDecision = async (decision: "approved" | "rejected") => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await reviewOrderCancellationAction(selectedOrder.orderNumber, decision, decisionNotes);
      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to review cancellation." });
      } else {
        setNotification({
          type: "success",
          message: `Cancellation ${decision} for #${selectedOrder.orderNumber}.`,
        });
        setIsCancelModalOpen(false);
        setDecisionNotes("");
        await loadOrders();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error reviewing cancellation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnDecision = async (decision: "approved" | "rejected") => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Find return number from order or generate standard reference
      const returnNumber = `RET-${selectedOrder.orderNumber.replace(/\D/g, "")}`;
      const res = await reviewReturnRequestAction({
        returnNumber,
        decision,
        adminNotes: decisionNotes,
        restockApproved,
        refundAmount: selectedOrder.totalAmount,
      });

      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to review return." });
      } else {
        setNotification({
          type: "success",
          message: `Return ${decision} for #${selectedOrder.orderNumber}.`,
        });
        setIsReturnModalOpen(false);
        setDecisionNotes("");
        await loadOrders();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error reviewing return." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return { label: "Delivered", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "dispatched":
      case "shipped":
        return { label: "Dispatched", color: "bg-sky-50 text-sky-800 border-sky-200" };
      case "inspection":
        return { label: "QA Inspection", color: "bg-indigo-50 text-indigo-800 border-indigo-200" };
      case "tailoring":
      case "processing":
        return { label: "Tailoring", color: "bg-purple-50 text-purple-800 border-purple-200" };
      case "cancellation_requested":
        return { label: "Cancel Requested", color: "bg-amber-50 text-amber-900 border-amber-300 animate-pulse font-bold" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-neutral-100 text-neutral-600 border-neutral-300 line-through" };
      case "return_requested":
        return { label: "Return Requested", color: "bg-amber-50 text-amber-900 border-amber-300 animate-pulse font-bold" };
      case "returned":
        return { label: "Returned", color: "bg-rose-50 text-rose-800 border-rose-200" };
      case "confirmed":
      default:
        return { label: "Confirmed", color: "bg-secondary/10 text-secondary border-secondary/20" };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "captured":
        return { label: "Paid", color: "text-emerald-700 bg-emerald-50" };
      case "failed":
        return { label: "Failed", color: "text-rose-700 bg-rose-50" };
      case "refunded":
        return { label: "Refunded", color: "text-purple-700 bg-purple-50" };
      default:
        return { label: "Pending", color: "text-amber-700 bg-amber-50" };
    }
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10 bg-surface">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Atelier Order Command
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
            Commissions &amp; Lifecycle Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track luxury tailoring milestones, dispatch priority air couriers, review cancellation and return requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold tracking-wide transition-all shadow-2xs self-start md:self-auto"
        >
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start justify-between gap-3 text-sm animate-in fade-in ${
            notification.type === "success"
              ? "bg-secondary/10 border border-secondary/20 text-secondary"
              : "bg-error/10 border border-error/20 text-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-xs font-medium">{notification.message}</p>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, patron name, email, or AWB..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-xs text-primary placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "confirmed", label: "Confirmed" },
            { id: "tailoring", label: "Tailoring" },
            { id: "inspection", label: "Inspection" },
            { id: "dispatched", label: "Dispatched" },
            { id: "delivered", label: "Delivered" },
            { id: "cancellation_requested", label: "Cancel Requests ⚠️" },
            { id: "return_requested", label: "Return Requests ⚠️" },
            { id: "cancelled", label: "Cancelled" },
            { id: "returned", label: "Returned" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-primary text-surface font-semibold shadow-2xs"
                  : "bg-surface-container-low text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-on-surface-variant">Accessing atelier commission registry...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-16 text-center text-on-surface-variant">
          <Package className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-primary font-semibold">No Matching Commissions</h3>
          <p className="text-xs text-on-surface-variant mt-1">Try refining your search keyword or status filter.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low/60 border-b border-outline-variant/40 text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  <th className="py-3.5 px-4">Commission #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Patron &amp; Email</th>
                  <th className="py-3.5 px-4">Garments</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4">Air Tracking</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {orders.map((order) => {
                  const fBadge = getFulfillmentBadge(order.fulfillmentStatus);
                  const pBadge = getPaymentBadge(order.paymentStatus);

                  return (
                    <tr key={order.orderNumber} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-primary">
                        {order.orderNumber}
                      </td>

                      <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      <td className="py-4 px-4">
                        <strong className="text-primary font-semibold block truncate max-w-[140px]">
                          {order.shippingAddress?.fullName || "Guest Patron"}
                        </strong>
                        <span className="text-[11px] text-on-surface-variant truncate block max-w-[140px]">
                          {order.customer?.email || order.shippingAddress?.email || "—"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-primary font-medium">
                          {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
                        </span>
                        <span className="text-[11px] text-on-surface-variant block truncate max-w-[140px]">
                          {order.items[0]?.productName || "Tailored garment"}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-primary whitespace-nowrap">
                        {formatPrice(order.totalAmount)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pBadge.color}`}>
                          {pBadge.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${fBadge.color}`}>
                          {fBadge.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap font-mono text-[11px]">
                        {order.trackingNumber || "—"}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {order.fulfillmentStatus === "cancellation_requested" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsCancelModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-error/10 hover:bg-error/20 text-error font-semibold text-[11px] border border-error/30"
                            >
                              Review Cancel
                            </button>
                          )}

                          {order.fulfillmentStatus === "return_requested" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsReturnModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary font-semibold text-[11px] border border-secondary/30"
                            >
                              Review Return
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openUpdateModal(order)}
                            className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[11px] transition-colors border border-outline-variant/40"
                          >
                            Update Milestone
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPDATE MILESTONE MODAL */}
      {isUpdateModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/50 rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-primary font-semibold">Update Commission Milestone</h3>
                <p className="text-xs text-on-surface-variant font-mono">#{selectedOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-on-surface-variant hover:text-primary p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Fulfillment Status</label>
                <select
                  value={newFulfillmentStatus}
                  onChange={(e) => setNewFulfillmentStatus(e.target.value as FulfillmentStatus)}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="tailoring">In Atelier Tailoring</option>
                  <option value="inspection">Quality Inspection</option>
                  <option value="dispatched">Dispatched (Air Courier)</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Air Courier Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                >
                  {ORDER_POLICY.CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Air Waybill (AWB) Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., BD-AIR-942180"
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Direct Courier Tracking URL (Optional)</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://bluedart.com/tracking?awb=..."
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Atelier Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for atelier record..."
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-primary text-surface font-semibold text-xs tracking-wider uppercase hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Milestone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION REVIEW MODAL */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/50 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="font-serif text-lg text-primary font-semibold mb-2">Review Cancellation Request</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Order <strong className="text-primary">#{selectedOrder.orderNumber}</strong> • Reason: &quot;
              {selectedOrder.cancellationReason || "No reason given"}&quot;
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Atelier Decision Notes</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Reason for approval or why commission cannot be cancelled..."
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCancellationDecision("rejected")}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container"
                >
                  Decline Cancellation
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCancellationDecision("approved")}
                  className="px-5 py-2 rounded-lg bg-error text-surface font-semibold text-xs tracking-wider uppercase hover:opacity-90"
                >
                  Approve &amp; Release Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN REVIEW MODAL */}
      {isReturnModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/50 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="font-serif text-lg text-primary font-semibold mb-2">Review Return Request</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Commission <strong className="text-primary">#{selectedOrder.orderNumber}</strong> • Value:{" "}
              <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="restockCheck"
                  checked={restockApproved}
                  onChange={(e) => setRestockApproved(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="restockCheck" className="text-primary font-medium">
                  Restock returned pieces into available atelier inventory
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1">Decision / Inspection Notes</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="QA inspection notes and refund resolution..."
                  className="w-full text-xs p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReturnDecision("rejected")}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container"
                >
                  Reject Return
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReturnDecision("approved")}
                  className="px-5 py-2 rounded-lg bg-primary text-surface font-semibold text-xs tracking-wider uppercase hover:bg-primary-container"
                >
                  Approve &amp; Issue Refund Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
