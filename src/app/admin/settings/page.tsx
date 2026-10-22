"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Sparkles,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Truck,
  RotateCcw as ReturnIcon,
  HelpCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getStoreSettingsAction,
  updateStoreSettingsAction,
} from "@/actions/adminDashboardActions";
import { StoreSettingsData } from "@/services/adminSettingsService";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStoreSettingsAction();
      if (res.success && res.settings) {
        setSettings(res.settings);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to load store settings." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setNotification(null);

    try {
      const res = await updateStoreSettingsAction(settings);
      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to update settings." });
      } else {
        setNotification({ type: "success", message: "Atelier operational settings saved successfully." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error updating settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Operational Parameters
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Atelier Store Settings
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Configure boutique identity, priority shipping rules, stock alert thresholds, and complimentary return policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSettings()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold tracking-wide transition-all self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Settings</span>
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

      {loading || !settings ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">
            Loading Atelier Parameters...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
          {/* Section 1: Store Identity */}
          <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <h3 className="font-serif text-xl text-primary font-medium mb-1">Boutique Identity &amp; Concierge</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Contact coordinates displayed on invoices, customer confirmations, and delivery notifications.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Store Currency
                </label>
                <input
                  type="text"
                  disabled
                  value={settings.currency}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low/50 border border-outline-variant/20 rounded-lg text-xs text-on-surface-variant cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Concierge Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Concierge Telephone
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Rules */}
          <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <h3 className="font-serif text-xl text-primary font-medium mb-1">Luxury Shipping &amp; Logistics</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Complimentary air dispatch thresholds and white-glove courier fees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Free Shipping Minimum (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Standard Express Air (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.standardShippingFee}
                  onChange={(e) =>
                    setSettings({ ...settings, standardShippingFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  White-Glove Priority Air (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.whiteGloveShippingFee}
                  onChange={(e) =>
                    setSettings({ ...settings, whiteGloveShippingFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Inventory & Order Policies */}
          <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <h3 className="font-serif text-xl text-primary font-medium mb-1">Inventory &amp; Client Policies</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Low-stock warning thresholds and complimentary return timeframes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Low-Stock Warning Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Triggers amber alerts on the overview and inventory desks.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Complimentary Return Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.returnWindowDays}
                  onChange={(e) =>
                    setSettings({ ...settings, returnWindowDays: parseInt(e.target.value) || 14 })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Days from recorded delivery date where patrons may initiate returns.
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary">Cryptographic &amp; Secret Isolation</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                Payment gateway API keys, webhook signing HMAC secrets, and database service-role credentials remain securely vaulted in server-side environment variables and cannot be viewed or altered in the browser.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-secondary" />}
              <span>Save Atelier Configuration</span>
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
