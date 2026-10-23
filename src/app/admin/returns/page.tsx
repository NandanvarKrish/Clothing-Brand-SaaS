"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  Package,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getAllOrders, OrderRecord } from "@/services/orderService";
import {
  reviewReturnRequestAction,
  reviewOrderCancellationAction,
  getAllReturnsAction,
} from "@/actions/adminOrderActions";
import { ReturnRecord } from "@/types";

export default function AdminReturnsPage() {
  const [activeTab, setActiveTab] = useState<"returns" | "cancellations">("returns");
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [ordersWithCancellations, setOrdersWithCancellations] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Review Modals State
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [adminNotes, setAdminNotes] = useState("");
  const [restockApproved, setRestockApproved] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch returns
      const returnRes = await getAllReturnsAction();
      if (returnRes.success && returnRes.returns) {
        setReturns(returnRes.returns);
      }

      // 2. Fetch orders with cancellation requests or cancelled status
      const { orders } = await getAllOrders({ limit: 500 });
      const cancelOrders = orders.filter(
        (o) =>
          o.fulfillmentStatus === "cancellation_requested" ||
          o.cancellationRequestedAt ||
          o.cancellationReason
      );
      setOrdersWithCancellations(cancelOrders);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load returns ledger." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReturnDecision = async () => {
    if (!selectedReturn) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await reviewReturnRequestAction({
        returnNumber: selectedReturn.returnNumber,
        decision,
        adminNotes,
        restockApproved: decision === "approved" ? restockApproved : false,
      });

      if (res.success) {
        setNotification({
          type: "success",
          message: `Return ${selectedReturn.returnNumber} has been ${decision} successfully.`,
        });
        setIsReturnModalOpen(false);
        setSelectedReturn(null);
        setAdminNotes("");
        await loadData();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to process return decision." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to process return decision." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancellationDecision = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await reviewOrderCancellationAction(
        selectedOrder.orderNumber,
        decision,
        adminNotes
      );

      if (res.success) {
        setNotification({
          type: "success",
          message: `Commission cancellation for #${selectedOrder.orderNumber} ${decision}.`,
        });
        setIsCancelModalOpen(false);
        setSelectedOrder(null);
        setAdminNotes("");
        await loadData();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to process cancellation." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to process cancellation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter returns
  const filteredReturns = returns.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.returnNumber.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === "all" ||
      r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  // Filter cancellations
  const filteredCancellations = ordersWithCancellations.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customer?.email && o.customer.email.toLowerCase().includes(q)) ||
      (o.cancellationReason && o.cancellationReason.toLowerCase().includes(q));

    const isPending = o.fulfillmentStatus === "cancellation_requested";
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && isPending) ||
      (statusFilter === "approved" && o.fulfillmentStatus === "cancelled") ||
      (statusFilter === "rejected" && !isPending && o.fulfillmentStatus !== "cancelled");

    return matchSearch && matchStatus;
  });

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Client Concierge Resolution
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Returns, Refunds &amp; Cancellations
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            14-Day garment satisfaction claims, cancellation assessments, and restocking audits.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("returns")}
            className={`px-4 py-2 rounded-md font-semibold transition-all ${
              activeTab === "returns"
                ? "bg-primary text-on-primary shadow-2xs"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Garment Returns ({returns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancellations")}
            className={`px-4 py-2 rounded-md font-semibold transition-all ${
              activeTab === "cancellations"
                ? "bg-primary text-on-primary shadow-2xs"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Cancellation Requests ({ordersWithCancellations.length})
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl mb-6 text-xs flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-on-surface-variant hover:text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "returns" ? "returns, orders, reasons..." : "order # or customer..."}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:border-primary text-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-primary focus:outline-none focus:border-primary"
          >
            <option value="all">All Resolutions</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Declined</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-medium">
            Loading Resolution Ledger...
          </p>
        </div>
      ) : activeTab === "returns" ? (
        /* ---------------- RETURNS TABLE ---------------- */
        filteredReturns.length === 0 ? (
          <div className="p-12 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-center">
            <RotateCcw className="w-10 h-10 text-outline-variant mx-auto mb-3" />
            <h3 className="font-serif text-lg text-primary">No Return Requests Found</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Patrons have not requested garment returns within this resolution filter.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    <th className="py-3.5 px-4">Return Number</th>
                    <th className="py-3.5 px-4">Garment Items</th>
                    <th className="py-3.5 px-4">Customer Reason</th>
                    <th className="py-3.5 px-4">Refund Amount</th>
                    <th className="py-3.5 px-4">Resolution Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredReturns.map((ret) => {
                    const isPending = ret.status === "requested" || ret.resolutionStatus === "pending";

                    return (
                      <tr key={ret.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-primary">
                          <p>{ret.returnNumber}</p>
                          <p className="text-[10px] text-on-surface-variant font-normal">
                            {new Date(ret.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-primary">
                          <p className="font-medium">
                            {ret.items?.length || 1} item{ret.items?.length === 1 ? "" : "s"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            Condition: {ret.items?.[0]?.condition || "Pristine"}
                          </p>
                        </td>

                        <td className="py-4 px-4 max-w-xs truncate text-on-surface-variant">
                          <p className="truncate font-medium text-primary">{ret.reason}</p>
                          {ret.customerNotes && (
                            <p className="text-[11px] truncate text-on-surface-variant/80 italic">
                              &ldquo;{ret.customerNotes}&rdquo;
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4 font-semibold text-primary">
                          {formatPrice(ret.refundAmount || 0)}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : ret.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isPending ? <Clock className="w-3 h-3" /> : null}
                            {ret.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReturn(ret);
                                  setDecision("approved");
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900 transition-colors text-[11px]"
                              >
                                Review &amp; Restock
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReturn(ret);
                                  setDecision("rejected");
                                  setIsReturnModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-rose-700 font-semibold hover:bg-rose-50 transition-colors text-[11px]"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant italic">
                              Resolved: {ret.adminNotes || "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ---------------- CANCELLATIONS TABLE ---------------- */
        filteredCancellations.length === 0 ? (
          <div className="p-12 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-primary">No Active Cancellation Requests</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              All commissioned orders are proceeding through tailoring and dispatch.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    <th className="py-3.5 px-4">Commission #</th>
                    <th className="py-3.5 px-4">Patron Email</th>
                    <th className="py-3.5 px-4">Cancellation Reason</th>
                    <th className="py-3.5 px-4">Order Value</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredCancellations.map((ord) => {
                    const isPending = ord.fulfillmentStatus === "cancellation_requested";

                    return (
                      <tr key={ord.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-primary">
                          <p>#{ord.orderNumber}</p>
                          <p className="text-[10px] text-on-surface-variant font-normal">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-on-surface-variant">
                          {ord.customer?.email || ord.shippingAddress?.email || "Patron"}
                        </td>

                        <td className="py-4 px-4 max-w-xs truncate text-primary font-medium">
                          {ord.cancellationReason || "Customer changed mind"}
                        </td>

                        <td className="py-4 px-4 font-semibold text-primary">
                          {formatPrice(ord.totalAmount)}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : ord.fulfillmentStatus === "cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {ord.fulfillmentStatus}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setDecision("approved");
                                  setIsCancelModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-800 text-white font-semibold hover:bg-rose-900 transition-colors text-[11px]"
                              >
                                Approve Cancellation
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setDecision("rejected");
                                  setIsCancelModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary font-semibold hover:bg-surface-container-highest transition-colors text-[11px]"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant italic">
                              {ord.cancellationReviewNotes || "Reviewed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Return Review Modal */}
      {isReturnModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg text-primary font-medium">
                {decision === "approved" ? "Approve Return & Restock" : "Decline Return Request"}
              </h3>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-on-surface-variant">
                Return Claim: <strong className="text-primary">{selectedReturn.returnNumber}</strong>
              </p>
              <p className="text-on-surface-variant">
                Customer Reason: <span className="text-primary font-medium">{selectedReturn.reason}</span>
              </p>

              {decision === "approved" && (
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restockApproved}
                      onChange={(e) => setRestockApproved(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    <span className="font-semibold text-primary">
                      Restock returned garments to available physical inventory
                    </span>
                  </label>
                  <p className="text-[10px] text-on-surface-variant">
                    Increments inventory_items.quantity_on_hand and logs restock in audit trail.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-primary mb-1">
                  Atelier Concierge Notes (Required)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record verification notes or reason for patron..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnDecision}
                disabled={isSubmitting || !adminNotes.trim()}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity ${
                  decision === "approved" ? "bg-emerald-800 hover:bg-emerald-900" : "bg-rose-800 hover:bg-rose-900"
                } disabled:opacity-50`}
              >
                {isSubmitting ? "Processing..." : `Confirm ${decision === "approved" ? "Approval" : "Decline"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Review Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg text-primary font-medium">
                {decision === "approved" ? "Approve Cancellation" : "Decline Cancellation"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-on-surface-variant">
                Commission: <strong className="text-primary">#{selectedOrder.orderNumber}</strong> ({formatPrice(selectedOrder.totalAmount)})
              </p>
              <p className="text-on-surface-variant">
                Customer Reason: <span className="text-primary font-medium">{selectedOrder.cancellationReason || "Changed mind"}</span>
              </p>

              {decision === "approved" && (
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Stock Reservation Release Notice:
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Approving cancellation immediately releases the reserved garment inventory back to available stock.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-primary mb-1">
                  Atelier Concierge Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record review notes..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCancellationDecision}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity ${
                  decision === "approved" ? "bg-rose-800 hover:bg-rose-900" : "bg-primary hover:bg-primary/90"
                } disabled:opacity-50`}
              >
                {isSubmitting ? "Processing..." : `Confirm ${decision === "approved" ? "Cancellation" : "Decline"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
