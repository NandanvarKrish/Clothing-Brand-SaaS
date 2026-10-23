"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  MapPin,
  Heart,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Truck,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/utils";
import { OrderSummary, CustomerAddress } from "@/types";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function AccountOverviewPage() {
  const { user, profile, isAdmin } = useAuth();
  const { itemCount: wishlistCount } = useWishlist();
  const [recentOrder, setRecentOrder] = useState<OrderSummary | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<CustomerAddress | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadOverviewData() {
      if (!user) return;

      try {
        // 1. Try to fetch orders from Supabase
        const { data: dbOrders, error: orderError } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!orderError && dbOrders && dbOrders.length > 0) {
          const first = dbOrders[0];
          setRecentOrder({
            orderId: first.id,
            orderNumber: first.order_number,
            createdAt: first.created_at,
            customer: first.shipping_address,
            items: (first.order_items || []).map((it: any) => ({
              id: it.id,
              productId: it.product_id,
              productSlug: "",
              name: it.product_name,
              price: Number(it.unit_price),
              image: it.image_url || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600",
              size: it.size,
              color: it.color,
              quantity: it.quantity,
              maxStock: 10,
            })),
            subtotal: Number(first.subtotal),
            shipping: Number(first.shipping_fee),
            discount: Number(first.discount_amount),
            tax: Number(first.tax_amount),
            total: Number(first.total_amount),
            paymentMethod: first.payment_method || "upi",
            status: first.fulfillment_status === "delivered" ? "delivered" : "confirmed",
            trackingNumber: `BD-AIR-${first.order_number.replace(/\D/g, "").slice(0, 6) || "984210"}`,
            estimatedDelivery: "2–3 business days via BlueDart Air",
          });
          setOrderCount(dbOrders.length);
        } else {
          // Check local session storage for orders placed in this browser session
          if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("velure_latest_order");
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setRecentOrder(parsed);
                setOrderCount(1);
              } catch (e) {}
            }
          }
        }

        // 2. Fetch default address
        const { data: addrData, error: addrError } = await supabase
          .from("customer_addresses")
          .select("*")
          .order("is_default", { ascending: false })
          .limit(1);

        if (!addrError && addrData && addrData.length > 0) {
          const a = addrData[0];
          setDefaultAddress({
            id: a.id,
            customerId: a.customer_id,
            fullName: a.full_name,
            phone: a.phone,
            addressLine1: a.address_line1,
            addressLine2: a.address_line2,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            isDefault: a.is_default,
          });
        } else {
          // Check localStorage fallback for saved addresses
          if (typeof window !== "undefined") {
            const localAddrs = localStorage.getItem(`velure_addresses_${user.id}`);
            if (localAddrs) {
              try {
                const parsed = JSON.parse(localAddrs);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setDefaultAddress(parsed.find((a: any) => a.isDefault) || parsed[0]);
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.warn("Could not load full account stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOverviewData();
  }, [user, supabase]);

  return (
    <div className="space-y-8">
      {/* Atelier Director Command Banner */}
      {isAdmin && (
        <div className="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-title-md text-title-md font-semibold text-primary">
                  Atelier Command Privileges Active
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary/15 text-secondary">
                  Store Owner
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Your account is authorized with administrative governance. You can switch between patron orders and executive store operations seamlessly.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="self-start sm:self-auto px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold tracking-wide hover:bg-primary-container transition-all flex items-center gap-2 shadow-2xs whitespace-nowrap"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Orders Placed
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-headline-md text-headline-md font-serif text-primary mt-2">
            {orderCount}
          </p>
          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 group-hover:text-primary">
            <span>View order history</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/account/addresses"
          className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Saved Addresses
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="font-headline-md text-headline-md font-serif text-primary mt-2">
            {defaultAddress ? "1" : "0"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 group-hover:text-primary">
            <span>Manage delivery points</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/wishlist"
          className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Saved Wishlist
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="font-headline-md text-headline-md font-serif text-primary mt-2">
            {wishlistCount}
          </p>
          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 group-hover:text-primary">
            <span>Review private wishlist</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Order Preview */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                <h3 className="font-title-md text-title-md font-semibold text-primary">
                  Latest Atelier Commission
                </h3>
              </div>
              <Link
                href="/account/orders"
                className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentOrder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-on-surface-variant">Order No: </span>
                    <strong className="text-primary font-mono">{recentOrder.orderNumber}</strong>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold uppercase text-[10px] tracking-wider">
                    {recentOrder.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {recentOrder.items.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="w-14 h-18 rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-container relative flex-shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="text-xs text-on-surface-variant">
                    <p className="font-medium text-primary">
                      {recentOrder.items.length} {recentOrder.items.length === 1 ? "garment" : "garments"}
                    </p>
                    <p className="mt-0.5">{formatPrice(recentOrder.total)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2">
                  <Truck className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{recentOrder.estimatedDelivery}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                <Package className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                <p>No commissions recorded yet.</p>
                <p className="text-xs mt-1 text-on-surface-variant/70">
                  Your tailored orders will appear here once confirmed.
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-4 px-4 py-2 rounded-lg bg-surface-container text-primary font-title-sm text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Explore Silhouettes
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Default Delivery Address Preview */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <h3 className="font-title-md text-title-md font-semibold text-primary">
                  Default Delivery Atelier
                </h3>
              </div>
              <Link
                href="/account/addresses"
                className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Edit Addresses</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {defaultAddress ? (
              <div className="space-y-2 text-sm text-on-surface">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">{defaultAddress.fullName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] uppercase font-semibold">
                    Primary
                  </span>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  {defaultAddress.addressLine1}
                  {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ""}
                  <br />
                  {defaultAddress.city}, {defaultAddress.state} — {defaultAddress.pincode}
                </p>
                <p className="text-xs text-on-surface-variant font-mono pt-1">
                  📞 +91 {defaultAddress.phone}
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                <MapPin className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                <p>No delivery address saved.</p>
                <p className="text-xs mt-1 text-on-surface-variant/70">
                  Save your address to experience one-click boutique checkout.
                </p>
                <Link
                  href="/account/addresses"
                  className="inline-block mt-4 px-4 py-2 rounded-lg bg-surface-container text-primary font-title-sm text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Add Address
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
