"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Tag,
  Calendar,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getCouponsAction,
  createCouponAction,
  toggleCouponStatusAction,
} from "@/actions/adminDashboardActions";
import { CouponRecord, CreateCouponInput } from "@/services/adminDiscountService";

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCouponInput>({
    code: "",
    discountType: "percentage",
    value: 10,
    minSubtotal: 0,
    maxUses: null,
    expiresAt: null,
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCouponsAction();
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to load coupons." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load coupons." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await createCouponAction(formData);
      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to create coupon." });
      } else {
        setNotification({ type: "success", message: `Coupon code '${formData.code.toUpperCase()}' created successfully.` });
        setIsModalOpen(false);
        setFormData({
          code: "",
          discountType: "percentage",
          value: 10,
          minSubtotal: 0,
          maxUses: null,
          expiresAt: null,
        });
        await loadCoupons();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error creating coupon." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (code: string, currentStatus: boolean) => {
    setNotification(null);
    try {
      const res = await toggleCouponStatusAction(code, !currentStatus);
      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to toggle status." });
      } else {
        setNotification({
          type: "success",
          message: `Coupon ${code} ${!currentStatus ? "activated" : "paused"}.`,
        });
        await loadCoupons();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error updating coupon." });
    }
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Promotional Engine
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Vouchers &amp; Promotional Codes
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Configure promotional voucher campaigns, minimum subtotal thresholds, usage limits, and redemption rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadCoupons()}
            className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary transition-colors"
            title="Refresh Discounts"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity shadow-2xs"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span>Create Promotional Code</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg mb-6 text-sm flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Coupons Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
              Accessing Promotional Codes...
            </p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Percent className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-primary">No vouchers created yet</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Create your first promotional code using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Voucher Code</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Benefit Type</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Discount Value</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Min. Subtotal</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Redemptions</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Validity</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {coupons.map((c) => (
                  <tr key={c.id || c.code} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high font-mono font-bold text-xs text-primary tracking-wider border border-outline-variant/40">
                        <Tag className="w-3 h-3 text-secondary" />
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-on-surface-variant font-medium">
                      {c.discountType === "percentage" ? "Percentage Off" : "Fixed Deduction"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary text-sm">
                      {c.discountType === "percentage" ? `${c.value}%` : formatPrice(c.value)}
                    </td>
                    <td className="py-3.5 px-4 text-primary">
                      {c.minSubtotal > 0 ? (
                        <span>Requires {formatPrice(c.minSubtotal)}</span>
                      ) : (
                        <span className="text-on-surface-variant">No minimum</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface">
                      <span className="font-semibold text-primary">{c.timesUsed}</span>
                      {c.maxUses ? (
                        <span className="text-on-surface-variant"> / {c.maxUses} max</span>
                      ) : (
                        <span className="text-on-surface-variant"> (unlimited)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {c.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Until {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Perpetual</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">
                          <XCircle className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggle(c.code, c.isActive)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          c.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {c.isActive ? "Pause Code" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
              <div>
                <h3 className="font-serif text-xl text-primary font-medium">Create Promotional Code</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Define voucher redemption conditions and discount rules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-on-surface-variant hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LUXURY20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono uppercase text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Deduction (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === "percentage" ? 100 : 50000}
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Min Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 (no minimum)"
                    value={formData.minSubtotal || ""}
                    onChange={(e) => setFormData({ ...formData, minSubtotal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxUses || ""}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || null })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Voucher Code</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
