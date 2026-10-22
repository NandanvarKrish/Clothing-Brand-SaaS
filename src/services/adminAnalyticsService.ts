import { getAllOrders, OrderRecord } from "@/services/orderService";
import { getProducts } from "@/services/productService";
import { getSupabase } from "@/lib/supabase";

export interface AnalyticsSummary {
  grossSales: number;
  netSales: number;
  refundsTotal: number;
  totalOrders: number;
  ordersProcessing: number;
  ordersShipped: number;
  ordersDelivered: number;
  totalCustomers: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
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

/**
 * Calculates authoritative, server-verified atelier business metrics.
 * 
 * Strict Financial Invariants:
 * 1. Gross Sales ONLY includes orders with paymentStatus === 'paid' or 'captured'.
 * 2. Pending, failed, and cancelled orders are strictly excluded from sales.
 * 3. Net Sales = Gross Sales - Approved Refunds.
 */
export async function getAdminAnalytics(rangeDays: number = 30): Promise<AnalyticsSummary> {
  const { orders } = await getAllOrders({ limit: 1000 });
  const products = await getProducts();

  const now = Date.now();
  const cutoffTime = rangeDays > 0 ? now - rangeDays * 24 * 60 * 60 * 1000 : 0;

  // Filter orders by date range for time-sensitive metrics
  const rangeOrders = orders.filter((o) => {
    if (rangeDays === 0) return true; // all time
    const createdTime = new Date(o.createdAt || Date.now()).getTime();
    return createdTime >= cutoffTime;
  });

  // Calculate monetary totals
  let grossSales = 0;
  let refundsTotal = 0;
  let ordersProcessing = 0;
  let ordersShipped = 0;
  let ordersDelivered = 0;

  const customerEmails = new Set<string>();
  const productSalesMap = new Map<string, { id: string; name: string; unitsSold: number; revenue: number }>();

  // Process orders
  for (const order of rangeOrders) {
    const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "captured";

    if (isPaid) {
      grossSales += order.totalAmount;
    }

    if (order.paymentStatus === "refunded") {
      refundsTotal += order.totalAmount;
    }

    // Customer tracking
    const email = order.customer?.email || order.shippingAddress?.email;
    if (email) {
      customerEmails.add(email.toLowerCase().trim());
    }

    // Fulfillment categorization
    const fStatus = (order.fulfillmentStatus || "").toLowerCase();
    if (["pending", "confirmed", "tailoring", "processing", "inspection"].includes(fStatus)) {
      ordersProcessing++;
    } else if (["dispatched", "shipped"].includes(fStatus)) {
      ordersShipped++;
    } else if (fStatus === "delivered") {
      ordersDelivered++;
    }

    // Garment sales breakdown
    if (isPaid && order.items) {
      for (const item of order.items) {
        const prodId = item.productId || item.sku;
        const current = productSalesMap.get(prodId) || {
          id: prodId,
          name: item.productName || "Atelier Garment",
          unitsSold: 0,
          revenue: 0,
        };
        current.unitsSold += item.quantity;
        current.revenue += item.lineTotal || item.unitPrice * item.quantity;
        productSalesMap.set(prodId, current);
      }
    }
  }

  // Net sales calculation
  const netSales = Math.max(0, grossSales - refundsTotal);

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

  // Aggregate daily sales trend for chart
  const salesByDay = new Map<string, { gross: number; orders: number }>();
  // Pre-seed days in range
  const daysToSeed = Math.min(rangeDays || 30, 30);
  for (let i = daysToSeed - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    salesByDay.set(key, { gross: 0, orders: 0 });
  }

  for (const order of rangeOrders) {
    if (order.createdAt) {
      const key = order.createdAt.split("T")[0];
      if (salesByDay.has(key)) {
        const entry = salesByDay.get(key)!;
        entry.orders += 1;
        if (order.paymentStatus === "paid" || order.paymentStatus === "captured") {
          entry.gross += order.totalAmount;
        }
      }
    }
  }

  const salesTrend = Array.from(salesByDay.entries()).map(([date, val]) => ({
    date,
    gross: val.gross,
    orders: val.orders,
  }));

  // Top selling products sorted by units sold
  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return {
    grossSales,
    netSales,
    refundsTotal,
    totalOrders: rangeOrders.length,
    ordersProcessing,
    ordersShipped,
    ordersDelivered,
    totalCustomers: Math.max(customerEmails.size, 1),
    activeProducts,
    lowStockCount,
    outOfStockCount,
    salesTrend,
    recentOrders,
    topSellingProducts,
  };
}
