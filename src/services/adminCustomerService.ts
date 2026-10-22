import { getAllOrders, OrderRecord } from "@/services/orderService";
import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CustomerSummaryRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate?: string;
  lastOrderNumber?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

/**
 * Retrieves patron directory with aggregated spending and order history.
 * Strictly avoids exposing passwords, tokens, or private credentials.
 */
export async function getAdminCustomers(query?: string): Promise<CustomerSummaryRow[]> {
  const { orders } = await getAllOrders({ limit: 1000 });
  const customersMap = new Map<string, CustomerSummaryRow>();

  // 1. Check Supabase customer_profiles if available
  const supabase = createAdminClient() || getSupabase();
  if (supabase) {
    try {
      const { data: profiles } = await supabase
        .from("customer_profiles")
        .select("id, full_name, email, phone, created_at");

      if (profiles) {
        for (const p of profiles) {
          const key = p.email.toLowerCase().trim();
          customersMap.set(key, {
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: p.phone || undefined,
            totalOrders: 0,
            totalSpend: 0,
            createdAt: p.created_at,
          });
        }
      }
    } catch {
      // In-memory aggregation fallback
    }
  }

  // 2. Aggregate from order history
  for (const o of orders) {
    const email = o.customer?.email || o.shippingAddress?.email;
    if (!email) continue;

    const key = email.toLowerCase().trim();
    const existing = customersMap.get(key) || {
      id: o.customerId || `cust_${Math.abs(key.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`,
      name: o.shippingAddress?.fullName || o.customer?.fullName || "Atelier Patron",
      email,
      phone: o.shippingAddress?.phone || o.customer?.phone,
      totalOrders: 0,
      totalSpend: 0,
      city: o.shippingAddress?.city,
      state: o.shippingAddress?.state,
      createdAt: o.createdAt || new Date().toISOString(),
    };

    existing.totalOrders += 1;
    if (o.paymentStatus === "paid" || o.paymentStatus === "captured") {
      existing.totalSpend += o.totalAmount;
    }

    if (!existing.lastOrderDate || new Date(o.createdAt).getTime() > new Date(existing.lastOrderDate).getTime()) {
      existing.lastOrderDate = o.createdAt;
      existing.lastOrderNumber = o.orderNumber;
    }

    customersMap.set(key, existing);
  }

  let list = Array.from(customersMap.values());

  // Filter by search query
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }

  // Sort by highest total spend first
  return list.sort((a, b) => b.totalSpend - a.totalSpend);
}
