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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrderSummary } from "@/types";
import { formatPrice } from "@/lib/utils";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setLoading(true);

      const combinedOrders: OrderSummary[] = [];

      try {
        // 1. Fetch from Supabase orders table
        const { data: dbOrders, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false });

        if (!error && dbOrders && dbOrders.length > 0) {
          dbOrders.forEach((o: any) => {
            combinedOrders.push({
              orderId: o.id,
              orderNumber: o.order_number,
              createdAt: o.created_at,
              customer: o.shipping_address || {},
              items: (o.order_items || []).map((it: any) => ({
                id: it.id,
                productId: it.product_id || "",
                productSlug: "",
                name: it.product_name,
                price: Number(it.unit_price),
                image: it.image_url || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600",
                size: it.size,
                color: it.color,
                quantity: it.quantity,
                maxStock: 10,
              })),
              subtotal: Number(o.subtotal),
              shipping: Number(o.shipping_fee),
              discount: Number(o.discount_amount),
              tax: Number(o.tax_amount),
              total: Number(o.total_amount),
              paymentMethod: o.payment_method || "upi",
              status: o.fulfillment_status === "delivered" ? "delivered" : "confirmed",
              trackingNumber: `BD-AIR-${o.order_number.replace(/\D/g, "").slice(0, 6) || "942180"}`,
              estimatedDelivery: "2–3 business days via BlueDart Air",
            });
          });
        }
      } catch (err) {
        console.warn("Could not query orders table:", err);
      }

      // 2. Also check sessionStorage for order placed in this active browser session
      if (typeof window !== "undefined") {
        const sessionOrder = sessionStorage.getItem("velure_latest_order");
        if (sessionOrder) {
          try {
            const parsed: OrderSummary = JSON.parse(sessionOrder);
            if (!combinedOrders.some((o) => o.orderNumber === parsed.orderNumber)) {
              combinedOrders.unshift(parsed);
            }
          } catch (e) {}
        }
      }

      setOrders(combinedOrders);
      // Expand the first order by default
      if (combinedOrders.length > 0) {
        setExpandedOrders({ [combinedOrders[0].orderNumber]: true });
      }
      setLoading(false);
    }

    fetchOrders();
  }, [user, supabase]);

  const toggleExpand = (orderNumber: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderNumber]: !prev[orderNumber],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return {
          label: "Delivered",
          color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        };
      case "dispatched":
        return {
          label: "In Transit",
          color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        };
      case "tailoring":
        return {
          label: "In Atelier Tailoring",
          color: "bg-purple-500/10 text-purple-700 border-purple-500/20",
        };
      default:
        return {
          label: "Order Confirmed",
          color: "bg-secondary/10 text-secondary border-secondary/20",
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-sm text-headline-sm font-serif text-primary">
          Commission History
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Review your current and historical garment orders, tailoring progress, and priority air shipments.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
            const badge = getStatusBadge(order.status);
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
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                    >
                      {badge.label}
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
                            AWB Tracking:{" "}
                            <span className="font-mono font-medium text-primary">
                              {order.trackingNumber}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span className="text-secondary font-semibold hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto">
                        <span>Live Courier Tracking</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
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
                          <span>Total Paid ({order.paymentMethod.toUpperCase()}):</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
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
