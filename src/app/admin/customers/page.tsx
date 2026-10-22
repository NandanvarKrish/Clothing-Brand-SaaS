"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Package,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getCustomersAction } from "@/actions/adminDashboardActions";
import { CustomerSummaryRow } from "@/services/adminCustomerService";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomersAction(searchQuery);
      if (res.success && res.customers) {
        setCustomers(res.customers);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to load customer directory." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load customers." });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Client Relationship Desk
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Patrons &amp; Client Accounts
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            View luxury clientele records, lifetime atelier expenditure, purchase frequency, and delivery coordinates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCustomers()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold tracking-wide transition-all self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Patrons</span>
        </button>
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

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patron name, email, phone or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary placeholder:text-on-surface-variant focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-on-surface-variant self-center">
          Showing <span className="font-semibold text-primary">{customers.length}</span> registered patrons
        </p>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
              Accessing Patron Records...
            </p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-primary">No patrons found</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Client records will appear here as orders and registrations are placed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Patron Name &amp; Email</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Contact Phone</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Primary Location</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-center">Orders</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Lifetime Spend</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Last Commission</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-primary">{c.name}</p>
                      <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-secondary" />
                        {c.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {c.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-on-surface-variant" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="italic text-on-surface-variant/60">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface">
                      {c.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-secondary" />
                          {c.city}{c.state ? `, ${c.state}` : ""}
                        </span>
                      ) : (
                        <span className="italic text-on-surface-variant/60">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">
                      {c.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {formatPrice(c.totalSpend)}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {c.lastOrderNumber ? (
                        <Link
                          href="/admin/orders"
                          className="font-medium text-primary hover:text-secondary transition-colors underline decoration-dotted"
                        >
                          #{c.lastOrderNumber}
                        </Link>
                      ) : (
                        <span className="italic text-on-surface-variant/60">No orders yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
