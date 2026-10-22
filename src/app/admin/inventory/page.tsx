"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Edit2,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getInventoryItemsAction,
  adjustInventoryStockAction,
} from "@/actions/adminDashboardActions";
import { InventoryItemRow } from "@/services/adminInventoryService";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItemRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState<"restock" | "manual_adjustment" | "damaged_writeoff" | "stock_intake">("restock");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryItemsAction({
        query: searchQuery,
        lowStockOnly: filterMode === "low_stock",
        outOfStockOnly: filterMode === "out_of_stock",
      });

      if (res.success && res.items) {
        setItems(res.items);
      } else {
        setNotification({ type: "error", message: res.error || "Failed to load inventory." });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load inventory." });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterMode]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const openAdjustModal = (item: InventoryItemRow) => {
    setSelectedItem(item);
    setNewQuantity(item.quantityOnHand);
    setReason("restock");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await adjustInventoryStockAction(
        selectedItem.variantId,
        newQuantity,
        reason,
        notes
      );

      if (!res.success) {
        setNotification({ type: "error", message: res.error || "Failed to adjust stock." });
      } else {
        setNotification({
          type: "success",
          message: `Stock updated for ${selectedItem.productName} (${selectedItem.sku}) to ${newQuantity} units.`,
        });
        setIsModalOpen(false);
        await loadInventory();
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error updating inventory." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/40 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Stock Command
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-primary font-medium tracking-tight">
            Inventory &amp; SKU Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Monitor on-hand garments, resolve low-stock alerts, and perform audited inventory count reconciliations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadInventory()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold tracking-wide transition-all self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Stock</span>
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, Garment, Size or Color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary placeholder:text-on-surface-variant focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center bg-surface-container-low border border-outline-variant/40 rounded-lg p-1 text-xs">
          {[
            { label: "All SKUs", value: "all" },
            { label: "Low Stock (≤3)", value: "low_stock" },
            { label: "Out of Stock (0)", value: "out_of_stock" },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setFilterMode(pill.value as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterMode === pill.value
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
              Loading Atelier Inventory...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-primary">No inventory items found</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Try adjusting your search query or stock filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant">
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Garment &amp; SKU</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Category</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Variant Spec</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Retail Price</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-center">On Hand</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-center">Available</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider">Stock Status</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-primary">{item.productName}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">{item.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{item.category}</td>
                    <td className="py-3.5 px-4 text-primary">
                      Size: <span className="font-semibold">{item.size}</span> • Color: <span className="font-semibold">{item.color}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-primary">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">
                      {item.quantityOnHand}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">
                      {item.quantityAvailable}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700">
                          <XCircle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      ) : item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock (≤3)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Available
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openAdjustModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-6">
              <div>
                <h3 className="font-serif text-xl text-primary font-medium">Reconcile Garment Inventory</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {selectedItem.productName} ({selectedItem.sku})
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

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Variant:</span>
                <span className="font-semibold text-primary">
                  Size {selectedItem.size} • {selectedItem.color}
                </span>
                <span className="text-on-surface-variant">Current On-Hand:</span>
                <span className="font-bold text-primary">{selectedItem.quantityOnHand} units</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  New Physical Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-sm text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Negative inventory values are strictly prevented by atelier consistency rules.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Audit Adjustment Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="restock">Batch Restock / Atelier Intake</option>
                  <option value="manual_adjustment">Physical Count Reconciliation</option>
                  <option value="damaged_writeoff">Damaged / Quality Inspection Reject</option>
                  <option value="stock_intake">Bespoke Inbound Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                  Concierge Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received shipment from weaving mill batch #401..."
                  className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-primary placeholder:text-on-surface-variant focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
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
                  <span>Save Inventory Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
