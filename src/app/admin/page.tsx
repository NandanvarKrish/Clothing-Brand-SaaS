"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getDashboardAnalyticsAction } from "@/actions/adminDashboardActions";
import { AnalyticsSummary } from "@/services/adminAnalyticsService";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardAnalyticsAction(days);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load atelier business metrics.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load executive analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(rangeDays);
  }, [rangeDays, fetchAnalytics]);

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Command Suite
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Store Performance &amp; Analytics
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Authoritative sales figures, real-time inventory health, and commission fulfillment metrics.
          </p>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg p-1 text-xs">
            {[
              { label: "7 Days", value: 7 },
              { label: "30 Days", value: 30 },
              { label: "90 Days", value: 90 },
              { label: "All Time", value: 0 },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRangeDays(option.value)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  rangeDays === option.value
                    ? "bg-primary text-on-primary shadow-2xs"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(rangeDays)}
            className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary transition-colors"
            title="Refresh Metrics"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchAnalytics(rangeDays)}
            className="text-xs font-bold underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">
            Computing Financial Metrics...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Primary Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Sales */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  Gross Sales
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.grossSales)}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-2">
                Paid transactions excluding uncaptured attempts
              </p>
            </div>

            {/* Net Sales */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  Net Sales
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.netSales)}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-2">
                Gross sales minus ₹{data.refundsTotal.toLocaleString("en-IN")} in refunds
              </p>
            </div>

            {/* Total Orders */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  Commissions Placed
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {data.totalOrders}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-2">
                Total commissions recorded in selected timeframe
              </p>
            </div>

            {/* Active Catalog */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  Active Garments
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {data.activeProducts}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-2">
                Published bespoke apparel pieces in storefront
              </p>
            </div>
          </div>

          {/* Operational Breakdown Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                In Tailoring
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.ordersProcessing}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                Air Dispatched
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.ordersShipped}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Delivered
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.ordersDelivered}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Low Stock (≤3)
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.lowStockCount}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Out of Stock
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.outOfStockCount}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-secondary" />
                Active Patrons
              </span>
              <p className="font-serif text-2xl font-medium text-primary mt-1">
                {data.totalCustomers}
              </p>
            </div>
          </div>

          {/* Sales Trend Visualizer */}
          <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl text-primary font-medium">Daily Revenue Velocity</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Daily revenue trajectory across the active {rangeDays === 0 ? "lifetime" : `${rangeDays}-day`} window
                </p>
              </div>
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                INR (₹) Sales
              </span>
            </div>

            {/* Bar Chart Representation */}
            <div className="h-48 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-outline-variant/40">
              {data.salesTrend.map((day, idx) => {
                const maxVal = Math.max(...data.salesTrend.map((d) => d.gross), 1000);
                const heightPercent = Math.max(8, Math.round((day.gross / maxVal) * 100));

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <p className="font-semibold">{day.date}</p>
                      <p>{formatPrice(day.gross)} • {day.orders} orders</p>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t transition-all ${
                        day.gross > 0
                          ? "bg-primary group-hover:bg-secondary"
                          : "bg-surface-container-high"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-3 px-1">
              <span>{data.salesTrend[0]?.date}</span>
              <span>{data.salesTrend[Math.floor(data.salesTrend.length / 2)]?.date}</span>
              <span>{data.salesTrend[data.salesTrend.length - 1]?.date}</span>
            </div>
          </div>

          {/* Bottom Split: Recent Commissions & Bestselling Garments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders (2 Columns) */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-serif text-xl text-primary font-medium">Recent Commissions</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Latest atelier orders awaiting fulfillment or updates
                  </p>
                </div>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
                >
                  <span>View All Commissions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-8 text-center italic">
                  No commissions recorded in this timeframe.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-on-surface-variant">
                        <th className="pb-3 font-semibold uppercase tracking-wider">Commission #</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Patron</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Total</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Payment</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Fulfillment</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {data.recentOrders.map((o) => (
                        <tr key={o.orderNumber} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 font-medium text-primary">
                            #{o.orderNumber}
                          </td>
                          <td className="py-3 text-on-surface truncate max-w-[140px]">
                            {o.shippingAddress?.fullName || o.customer?.fullName || "Atelier Patron"}
                          </td>
                          <td className="py-3 font-semibold text-primary">
                            {formatPrice(o.totalAmount)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                o.paymentStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : o.paymentStatus === "refunded"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                o.fulfillmentStatus === "delivered"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : o.fulfillmentStatus === "shipped"
                                  ? "bg-blue-50 text-blue-700"
                                  : o.fulfillmentStatus === "cancelled"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {o.fulfillmentStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/admin/orders`}
                              className="text-secondary hover:text-primary font-semibold transition-colors"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bestselling Pieces (1 Column) */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-serif text-xl text-primary font-medium">Top Garments</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">By volume sold</p>
                </div>
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors"
                >
                  Catalog
                </Link>
              </div>

              {data.topSellingProducts.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-8 text-center italic">
                  Sales data will appear here once orders are confirmed.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.topSellingProducts.map((p, index) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20"
                    >
                      <div className="flex items-center gap-3 truncate mr-2">
                        <span className="w-5 h-5 rounded-full bg-surface-container-highest text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-primary truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {p.unitsSold} {p.unitsSold === 1 ? "piece" : "pieces"} dispatched
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0">
                        {formatPrice(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
