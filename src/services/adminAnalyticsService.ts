import { getAllOrders, OrderRecord } from "@/services/orderService";
import { getProducts } from "@/services/productService";

export interface PeriodComparison {
  previousGrossSales: number;
  grossSalesDeltaPercent: number;
  previousNetSales: number;
  netSalesDeltaPercent: number;
  previousTotalOrders: number;
  totalOrdersDeltaPercent: number;
  previousAov: number;
  aovDeltaPercent: number;
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CategorySalesItem {
  category: string;
  unitsSold: number;
  revenue: number;
  percentage: number;
}

export interface RevenueRefundSeriesItem {
  date: string;
  gross: number;
  refunds: number;
  orders: number;
}

export interface AnalyticsSummary {
  grossSales: number;
  netSales: number;
  refundsTotal: number;
  totalOrders: number;
  ordersProcessing: number;
  ordersShipped: number;
  ordersDelivered: number;
  totalCustomers: number;
  newCustomers: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageOrderValue: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
  conversionRate: string;
  comparison: PeriodComparison;
  statusDistribution: StatusDistributionItem[];
  categorySales: CategorySalesItem[];
  revenueRefundsTrend: RevenueRefundSeriesItem[];
  salesTrend: Array<{
    date: string;
    gross: number;
    orders: number;
  }>;
  recentOrders: OrderRecord[];
  topSellingProducts: Array<{
    id: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Payment", color: "#F59E0B" },
  confirmed: { label: "Confirmed", color: "#3B82F6" },
  tailoring: { label: "In Tailoring", color: "#8B5CF6" },
  processing: { label: "Studio Processing", color: "#6366F1" },
  inspection: { label: "Quality Inspection", color: "#EC4899" },
  dispatched: { label: "Dispatched", color: "#06B6D4" },
  shipped: { label: "In Transit", color: "#0EA5E9" },
  delivered: { label: "Delivered", color: "#10B981" },
  cancellation_requested: { label: "Cancellation Review", color: "#F97316" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
  return_requested: { label: "Return Review", color: "#EAB308" },
  returned: { label: "Returned & Refunded", color: "#64748B" },
};

/**
 * Calculates authoritative, server-verified atelier business metrics.
 *
 * Strict Financial Invariants:
 * 1. Gross Sales ONLY includes orders with paymentStatus === 'paid' or 'captured'.
 * 2. Pending, failed, and cancelled orders are strictly excluded from sales.
 * 3. Net Sales = Gross Sales - Approved Refunds.
 * 4. AOV = Gross Sales / Paid Orders Count.
 */
export async function getAdminAnalytics(rangeDays: number = 30): Promise<AnalyticsSummary> {
  const { orders } = await getAllOrders({ limit: 1000 });
  const products = await getProducts();

  const now = Date.now();
  const windowMs = rangeDays > 0 ? rangeDays * 24 * 60 * 60 * 1000 : 0;
  const currentCutoff = windowMs > 0 ? now - windowMs : 0;
  const previousCutoff = windowMs > 0 ? now - 2 * windowMs : 0;

  // Filter orders by date range
  const currentOrders = orders.filter((o) => {
    if (rangeDays === 0) return true;
    const t = new Date(o.createdAt || now).getTime();
    return t >= currentCutoff;
  });

  const previousOrders = orders.filter((o) => {
    if (rangeDays === 0) return false;
    const t = new Date(o.createdAt || now).getTime();
    return t >= previousCutoff && t < currentCutoff;
  });

  // Calculate current window metrics
  let grossSales = 0;
  let refundsTotal = 0;
  let paidOrdersCount = 0;
  let pendingPaymentsCount = 0;
  let pendingPaymentsTotal = 0;
  let ordersProcessing = 0;
  let ordersShipped = 0;
  let ordersDelivered = 0;

  const currentCustomerEmails = new Set<string>();
  const productSalesMap = new Map<string, { id: string; name: string; unitsSold: number; revenue: number }>();
  const categorySalesMap = new Map<string, { category: string; unitsSold: number; revenue: number }>();
  const statusCounts = new Map<string, number>();

  for (const order of currentOrders) {
    const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "captured";

    if (isPaid) {
      grossSales += order.totalAmount;
      paidOrdersCount++;
    } else if (order.paymentStatus === "pending") {
      pendingPaymentsCount++;
      pendingPaymentsTotal += order.totalAmount;
    }

    if (order.paymentStatus === "refunded") {
      refundsTotal += order.totalAmount;
    }

    const email = order.customer?.email || order.shippingAddress?.email;
    if (email) {
      currentCustomerEmails.add(email.toLowerCase().trim());
    }

    // Fulfillment categorization
    const fStatus = (order.fulfillmentStatus || "pending").toLowerCase();
    statusCounts.set(fStatus, (statusCounts.get(fStatus) || 0) + 1);

    if (["pending", "confirmed", "tailoring", "processing", "inspection"].includes(fStatus)) {
      ordersProcessing++;
    } else if (["dispatched", "shipped"].includes(fStatus)) {
      ordersShipped++;
    } else if (fStatus === "delivered") {
      ordersDelivered++;
    }

    // Item-level breakdown
    if (isPaid && order.items) {
      for (const item of order.items) {
        const prodId = item.productId || item.sku;
        const currentProd = productSalesMap.get(prodId) || {
          id: prodId,
          name: item.productName || "Atelier Garment",
          unitsSold: 0,
          revenue: 0,
        };
        currentProd.unitsSold += item.quantity;
        currentProd.revenue += item.lineTotal || item.unitPrice * item.quantity;
        productSalesMap.set(prodId, currentProd);

        // Category breakdown
        const matchedCatalogProd = products.find((p) => p.id === item.productId || p.slug === item.productId);
        const category = matchedCatalogProd?.category || "Couture";
        const currentCat = categorySalesMap.get(category) || {
          category,
          unitsSold: 0,
          revenue: 0,
        };
        currentCat.unitsSold += item.quantity;
        currentCat.revenue += item.lineTotal || item.unitPrice * item.quantity;
        categorySalesMap.set(category, currentCat);
      }
    }
  }

  const netSales = Math.max(0, grossSales - refundsTotal);
  const averageOrderValue = paidOrdersCount > 0 ? Math.round(grossSales / paidOrdersCount) : 0;

  // Calculate new customers: customer whose FIRST order across ALL history was in current window
  const allCustomerEarliestOrder = new Map<string, number>();
  for (const o of orders) {
    const em = o.customer?.email || o.shippingAddress?.email;
    if (em) {
      const cleanEm = em.toLowerCase().trim();
      const t = new Date(o.createdAt || now).getTime();
      const existing = allCustomerEarliestOrder.get(cleanEm);
      if (!existing || t < existing) {
        allCustomerEarliestOrder.set(cleanEm, t);
      }
    }
  }

  let newCustomers = 0;
  allCustomerEarliestOrder.forEach((firstOrderTime) => {
    if (rangeDays === 0 || firstOrderTime >= currentCutoff) {
      newCustomers++;
    }
  });

  // Calculate previous period metrics for comparison
  let previousGrossSales = 0;
  let previousRefundsTotal = 0;
  let previousPaidCount = 0;

  for (const o of previousOrders) {
    if (o.paymentStatus === "paid" || o.paymentStatus === "captured") {
      previousGrossSales += o.totalAmount;
      previousPaidCount++;
    }
    if (o.paymentStatus === "refunded") {
      previousRefundsTotal += o.totalAmount;
    }
  }

  const previousNetSales = Math.max(0, previousGrossSales - previousRefundsTotal);
  const previousAov = previousPaidCount > 0 ? Math.round(previousGrossSales / previousPaidCount) : 0;

  function calcDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const comparison: PeriodComparison = {
    previousGrossSales,
    grossSalesDeltaPercent: calcDelta(grossSales, previousGrossSales),
    previousNetSales,
    netSalesDeltaPercent: calcDelta(netSales, previousNetSales),
    previousTotalOrders: previousOrders.length,
    totalOrdersDeltaPercent: calcDelta(currentOrders.length, previousOrders.length),
    previousAov,
    aovDeltaPercent: calcDelta(averageOrderValue, previousAov),
  };

  // Status distribution
  const totalOrdersInWindow = currentOrders.length || 1;
  const statusDistribution: StatusDistributionItem[] = Array.from(statusCounts.entries()).map(([st, cnt]) => {
    const meta = STATUS_LABELS[st] || { label: st, color: "#64748B" };
    return {
      status: st,
      label: meta.label,
      count: cnt,
      percentage: Math.round((cnt / totalOrdersInWindow) * 100),
      color: meta.color,
    };
  });

  // Category sales
  const totalCatRevenue = Array.from(categorySalesMap.values()).reduce((sum, c) => sum + c.revenue, 0) || 1;
  const categorySales: CategorySalesItem[] = Array.from(categorySalesMap.values()).map((c) => ({
    category: c.category,
    unitsSold: c.unitsSold,
    revenue: c.revenue,
    percentage: Math.round((c.revenue / totalCatRevenue) * 100),
  }));

  // Catalog inventory health
  let activeProducts = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const prod of products) {
    if (prod.status === "published") {
      activeProducts++;
    }

    const totalStock = prod.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    if (totalStock === 0) {
      outOfStockCount++;
    } else if (totalStock <= 3) {
      lowStockCount++;
    }
  }

  // Daily time series for trend charts
  const daysToSeed = Math.min(rangeDays || 30, 30);
  const trendMap = new Map<string, { gross: number; refunds: number; orders: number }>();

  for (let i = daysToSeed - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    trendMap.set(key, { gross: 0, refunds: 0, orders: 0 });
  }

  for (const order of currentOrders) {
    if (order.createdAt) {
      const key = order.createdAt.split("T")[0];
      if (trendMap.has(key)) {
        const item = trendMap.get(key)!;
        item.orders += 1;
        if (order.paymentStatus === "paid" || order.paymentStatus === "captured") {
          item.gross += order.totalAmount;
        }
        if (order.paymentStatus === "refunded") {
          item.refunds += order.totalAmount;
        }
      }
    }
  }

  const revenueRefundsTrend: RevenueRefundSeriesItem[] = Array.from(trendMap.entries()).map(([date, val]) => ({
    date,
    gross: val.gross,
    refunds: val.refunds,
    orders: val.orders,
  }));

  const salesTrend = revenueRefundsTrend.map((t) => ({
    date: t.date,
    gross: t.gross,
    orders: t.orders,
  }));

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5);

  return {
    grossSales,
    netSales,
    refundsTotal,
    totalOrders: currentOrders.length,
    ordersProcessing,
    ordersShipped,
    ordersDelivered,
    totalCustomers: Math.max(allCustomerEarliestOrder.size, 1),
    newCustomers,
    activeProducts,
    lowStockCount,
    outOfStockCount,
    averageOrderValue,
    pendingPaymentsCount,
    pendingPaymentsTotal,
    conversionRate: "Unavailable (Requires Web Analytics)",
    comparison,
    statusDistribution,
    categorySales,
    revenueRefundsTrend,
    salesTrend,
    recentOrders,
    topSellingProducts,
  };
}
