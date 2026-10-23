"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Users,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getDashboardAnalyticsAction } from "@/actions/adminDashboardActions";
import { AnalyticsSummary } from "@/services/adminAnalyticsService";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"revenue" | "orders" | "refunds" | "categories">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardAnalyticsAction(days);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load executive analytics.");
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
            Executive Intelligence
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Revenue Velocity &amp; Sales Insights
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Verified financial aggregation, historical order-item trends, and customer acquisition metrics.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg p-1 text-xs">
            {[
              { label: "7 Days", value: 7 },
              { label: "30 Days", value: 30 },
              { label: "90 Days", value: 90 },
              { label: "12 Months", value: 365 },
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
            title="Refresh Intelligence"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-medium">
            Aggregating Atelier Financial Ledgers...
          </p>
        </div>
      ) : error || !data ? (
        <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/40 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="font-serif text-xl text-primary mb-1">Intelligence Unavailable</h3>
          <p className="text-xs text-on-surface-variant mb-6">{error || "Could not retrieve financial data."}</p>
          <button
            type="button"
            onClick={() => fetchAnalytics(rangeDays)}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Retry Aggregation
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Executive KPI Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Gross Sales */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-on-surface-variant mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold">Gross Sales</span>
                <DollarSign className="w-4 h-4 text-secondary" />
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.grossSales)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-0.5 font-semibold ${
                  data.comparison.grossSalesDeltaPercent >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {data.comparison.grossSalesDeltaPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(data.comparison.grossSalesDeltaPercent)}% vs prior period
                </span>
                <span className="text-on-surface-variant/70 text-[10px]">Verified Paid</span>
              </div>
            </div>

            {/* 2. Net Sales */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-on-surface-variant mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold">Net Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.netSales)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-0.5 font-semibold ${
                  data.comparison.netSalesDeltaPercent >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {data.comparison.netSalesDeltaPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(data.comparison.netSalesDeltaPercent)}% vs prior period
                </span>
                <span className="text-on-surface-variant/70 text-[10px]">Less Refunds</span>
              </div>
            </div>

            {/* 3. Average Order Value (AOV) */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-on-surface-variant mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold">Avg. Order Value (AOV)</span>
                <ShoppingBag className="w-4 h-4 text-secondary" />
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.averageOrderValue)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center gap-0.5 font-semibold ${
                  data.comparison.aovDeltaPercent >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {data.comparison.aovDeltaPercent >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(data.comparison.aovDeltaPercent)}% vs prior
                </span>
                <span className="text-on-surface-variant/70 text-[10px]">Per Paid Order</span>
              </div>
            </div>

            {/* 4. Refunds & Cancellations Total */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-on-surface-variant mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold">Approved Refunds</span>
                <RotateCcw className="w-4 h-4 text-rose-600" />
              </div>
              <p className="font-serif text-3xl font-medium text-primary">
                {formatPrice(data.refundsTotal)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant font-medium">
                  {data.totalOrders > 0
                    ? `${Math.round((data.refundsTotal / (data.grossSales || 1)) * 100)}% of Gross`
                    : "0%"}
                </span>
                <span className="text-on-surface-variant/70 text-[10px]">Bank Settled</span>
              </div>
            </div>
          </div>

          {/* Operational Risk Bar: Pending Payments & Conversion Label */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold text-primary">Pending Checkouts:</span>
                <span className="text-on-surface-variant">
                  {data.pendingPaymentsCount} orders ({formatPrice(data.pendingPaymentsTotal)}) awaiting gateway capture
                </span>
              </div>
              <div className="hidden md:block w-px h-4 bg-outline-variant/60" />
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Users className="w-3.5 h-3.5 text-secondary" />
                <span>Patrons: {data.totalCustomers} total ({data.newCustomers} new in selected window)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-on-surface-variant/80">
              <HelpCircle className="w-3.5 h-3.5 text-secondary" />
              <span>Conversion Rate: <span className="font-medium text-primary">{data.conversionRate}</span></span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
              <div>
                <h2 className="font-serif text-xl text-primary font-medium">
                  Financial Trajectory &amp; Time-Series
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Visualizing verified store trends across the {rangeDays === 0 ? "entire history" : `${rangeDays}-day`} period.
                </p>
              </div>

              {/* Chart Series Toggle Tabs */}
              <div className="inline-flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg p-1 text-xs">
                {[
                  { id: "revenue", label: "Gross Revenue" },
                  { id: "orders", label: "Order Volume" },
                  { id: "refunds", label: "Revenue vs Refunds" },
                  { id: "categories", label: "Categories" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      activeTab === t.id
                        ? "bg-primary text-on-primary shadow-2xs"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: REVENUE OVER TIME (SVG Line / Area Chart) */}
            {activeTab === "revenue" && (
              <div className="space-y-4">
                <div className="h-64 w-full relative">
                  {data.salesTrend.length === 0 || data.salesTrend.every((d) => d.gross === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant/40 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-outline-variant mb-2" />
                      <p className="text-xs font-semibold text-primary">No Sales Recorded in Period</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        New orders with verified payment will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-end gap-1.5 pt-8 pb-4">
                      {data.salesTrend.map((day, idx) => {
                        const maxVal = Math.max(...data.salesTrend.map((d) => d.gross), 1000);
                        const heightPct = Math.max(8, Math.round((day.gross / maxVal) * 100));
                        const isHovered = hoveredIndex === idx;

                        return (
                          <div
                            key={day.date}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-14 bg-primary text-on-primary text-[10px] py-1.5 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                                <p className="font-semibold text-secondary">{day.date}</p>
                                <p className="font-bold">{formatPrice(day.gross)}</p>
                                <p className="text-on-primary/70">{day.orders} commissions</p>
                              </div>
                            )}

                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[32px] rounded-t transition-all ${
                                isHovered
                                  ? "bg-secondary"
                                  : day.gross > 0
                                  ? "bg-primary"
                                  : "bg-surface-container-high"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 border-t border-outline-variant/20 pt-2">
                  <span>{data.salesTrend[0]?.date}</span>
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Hover bar for day ledger
                  </span>
                  <span>{data.salesTrend[data.salesTrend.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS OVER TIME (Bar Breakdown) */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="h-64 w-full flex items-end gap-1.5 pt-8 pb-4">
                  {data.salesTrend.map((day, idx) => {
                    const maxOrders = Math.max(...data.salesTrend.map((d) => d.orders), 5);
                    const heightPct = Math.max(6, Math.round((day.orders / maxOrders) * 100));

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                          <p className="font-semibold">{day.date}</p>
                          <p>{day.orders} order{day.orders === 1 ? "" : "s"} placed</p>
                        </div>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[28px] rounded-t transition-all ${
                            day.orders > 0 ? "bg-secondary group-hover:bg-primary" : "bg-surface-container-high"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 border-t border-outline-variant/20 pt-2">
                  <span>{data.salesTrend[0]?.date}</span>
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Total: {data.totalOrders} Orders Placed
                  </span>
                  <span>{data.salesTrend[data.salesTrend.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* TAB 3: REVENUE VS REFUNDS (Dual Comparative Series) */}
            {activeTab === "refunds" && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-primary" />
                    <span className="font-semibold text-primary">Gross Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-600" />
                    <span className="font-semibold text-rose-600">Approved Refunds</span>
                  </div>
                </div>

                <div className="h-64 w-full flex items-end gap-2 pt-6 pb-2 border-b border-outline-variant/30">
                  {data.revenueRefundsTrend.map((day) => {
                    const maxVal = Math.max(
                      ...data.revenueRefundsTrend.map((d) => Math.max(d.gross, d.refunds)),
                      1000
                    );
                    const grossHeight = Math.max(6, Math.round((day.gross / maxVal) * 100));
                    const refundHeight = Math.max(day.refunds > 0 ? 6 : 0, Math.round((day.refunds / maxVal) * 100));

                    return (
                      <div key={day.date} className="flex-1 flex items-end justify-center gap-0.5 h-full group relative">
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                          <p className="font-semibold">{day.date}</p>
                          <p>Gross: {formatPrice(day.gross)}</p>
                          <p className="text-rose-400">Refund: {formatPrice(day.refunds)}</p>
                        </div>
                        <div style={{ height: `${grossHeight}%` }} className="w-full max-w-[14px] bg-primary rounded-t" />
                        {refundHeight > 0 && (
                          <div style={{ height: `${refundHeight}%` }} className="w-full max-w-[14px] bg-rose-600 rounded-t" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CATEGORY BREAKDOWN */}
            {activeTab === "categories" && (
              <div className="space-y-4 pt-2">
                {data.categorySales.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-10">No category sales in period.</p>
                ) : (
                  <div className="space-y-3">
                    {data.categorySales.map((cat) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary">{cat.category}</span>
                          <span className="text-on-surface-variant">
                            {cat.unitsSold} units • {formatPrice(cat.revenue)} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage}%` }}
                            className="h-full bg-secondary rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Grid: Order Status Distribution & Top Garments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Distribution (1 Col) */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-secondary" />
                  <h3 className="font-serif text-lg text-primary font-medium">Commission Status Mix</h3>
                </div>
                <span className="text-xs text-on-surface-variant font-semibold">
                  {data.totalOrders} total
                </span>
              </div>

              {data.statusDistribution.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">No order statuses to distribute.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {data.statusDistribution.map((item) => (
                    <div key={item.status} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full" />
                          <span className="font-medium text-primary">{item.label}</span>
                        </span>
                        <span className="text-on-surface-variant font-semibold">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bestselling Garments (2 Cols) */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-secondary" />
                  <h3 className="font-serif text-lg text-primary font-medium">Acclaimed Garments &amp; Bestsellers</h3>
                </div>
                <Link
                  href="/admin/products"
                  className="text-xs text-secondary hover:text-primary font-semibold inline-flex items-center gap-1"
                >
                  <span>Manage Catalog</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.topSellingProducts.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-10">No garments sold in this reporting window.</p>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {data.topSellingProducts.map((garment, idx) => (
                    <div key={garment.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary font-serif font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-primary">{garment.name}</p>
                          <p className="text-[11px] text-on-surface-variant">Code: {garment.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatPrice(garment.revenue)}</p>
                        <p className="text-[11px] text-on-surface-variant">{garment.unitsSold} units tailored</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
