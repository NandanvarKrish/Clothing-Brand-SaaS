"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Eye,
  Filter,
  Search,
  Package,
  Layers,
  Tag,
  Check,
  ChevronDown,
} from "lucide-react";
import { getProducts } from "@/services/productService";
import { Product, ProductCategory } from "@/types";
import { formatPrice } from "@/lib/utils";
import {
  createProductAction,
  updateProductAction,
  updateProductStatusAction,
  updateVariantStockAction,
  uploadProductImageAction,
} from "@/actions/adminProductActions";
import { ProductFormData, VariantFormData, ImageFormData } from "@/lib/validations/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Outerwear");
  const [fabric, setFabric] = useState("Pure Linen");
  const [fabricOrigin, setFabricOrigin] = useState("Belgian Organic Linen");
  const [weaveTechnique, setWeaveTechnique] = useState("Single Origin Handloom");
  const [gsm, setGsm] = useState<number | "">(320);
  const [edition, setEdition] = useState("Edition 08 / 120");
  const [badge, setBadge] = useState("Bestseller");
  const [price, setPrice] = useState<number | "">(4200);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [tagsInput, setTagsInput] = useState("linen, tailored, chore");
  const [detailsInput, setDetailsInput] = useState("Belgian flax\nGenuine horn buttons\nFrench seams");
  const [careInput, setCareInput] = useState("Dry clean gently\nSteam iron medium");
  const [shippingInfo, setShippingInfo] = useState("Complimentary BlueDart air shipping.");

  const [variants, setVariants] = useState<VariantFormData[]>([
    { sku: "LCJ-ESP-S", size: "S", color: "Espresso Brown", colorHex: "#3D1B00", stock: 8, price: undefined },
    { sku: "LCJ-ESP-M", size: "M", color: "Espresso Brown", colorHex: "#3D1B00", stock: 12, price: undefined },
    { sku: "LCJ-ESP-L", size: "L", color: "Espresso Brown", colorHex: "#3D1B00", stock: 6, price: undefined },
  ]);

  const [images, setImages] = useState<ImageFormData[]>([
    {
      url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
      alt: "Front view of bespoke garment",
      label: "Front",
      sortOrder: 0,
      isPrimary: true,
    },
  ]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const list = await getProducts();
      setProducts(list);
    } catch (err: any) {
      setNotification({ type: "error", message: "Failed to load product catalog: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const openCreateModal = () => {
    setSelectedProduct(null);
    setName("");
    setSlug("");
    setSubtitle("");
    setDescription("");
    setCategory("Outerwear");
    setFabric("Pure Linen");
    setFabricOrigin("Belgian Organic Linen");
    setWeaveTechnique("Single Origin Handloom");
    setGsm(320);
    setEdition("Edition 08 / 120");
    setBadge("New Silhouette");
    setPrice(4200);
    setCompareAtPrice("");
    setStatus("published");
    setFeatured(false);
    setBestseller(false);
    setNewArrival(true);
    setTagsInput("linen, tailored, coat");
    setDetailsInput("320 GSM natural unbleached flax\nGenuine horn button fastenings\nInternal cotton seam binding");
    setCareInput("Dry clean gently\nSteam iron on medium");
    setShippingInfo("Complimentary domestic priority air shipping via BlueDart.");
    setVariants([
      { sku: "NEW-ESP-S", size: "S", color: "Espresso Brown", colorHex: "#3D1B00", stock: 10 },
      { sku: "NEW-ESP-M", size: "M", color: "Espresso Brown", colorHex: "#3D1B00", stock: 15 },
      { sku: "NEW-ESP-L", size: "L", color: "Espresso Brown", colorHex: "#3D1B00", stock: 8 },
    ]);
    setImages([
      {
        url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
        alt: "Front portrait",
        label: "Front",
        sortOrder: 0,
        isPrimary: true,
      },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setSubtitle(p.subtitle || "");
    setDescription(p.description);
    setCategory(p.category);
    setFabric(p.fabric);
    setFabricOrigin(p.fabricOrigin || "");
    setWeaveTechnique(p.weaveTechnique || "");
    setGsm(p.gsm || "");
    setEdition(p.edition || "");
    setBadge(p.badge || "");
    setPrice(p.price);
    setCompareAtPrice(p.compareAtPrice || "");
    setStatus((p.status as any) || (p.featured ? "published" : "published"));
    setFeatured(Boolean(p.featured));
    setBestseller(Boolean(p.bestseller));
    setNewArrival(Boolean(p.newArrival));
    setTagsInput(p.tags ? p.tags.join(", ") : "");
    setDetailsInput(p.details ? p.details.join("\n") : "");
    setCareInput(p.care ? p.care.join("\n") : "");
    setShippingInfo(p.shippingInfo || "");
    setVariants(
      p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: p.colors.find((c) => c.name === v.color)?.hex || "#3D1B00",
        stock: v.stock,
        price: v.price !== p.price ? v.price : undefined,
      }))
    );
    setImages(
      p.images.map((img, idx) => ({
        id: (img as any).id,
        url: img.url,
        alt: img.alt,
        label: (img.label as any) || "Front",
        sortOrder: (img as any).sortOrder ?? idx,
        isPrimary: (img as any).isPrimary ?? idx === 0,
      }))
    );
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!selectedProduct) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setNotification(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadProductImageAction(formData);
        if (res.success && res.url) {
          setImages((prev) => [
            ...prev,
            {
              url: res.url,
              alt: `${name || "Product"} photography`,
              label: prev.length === 0 ? "Front" : "Detail",
              sortOrder: prev.length,
              isPrimary: prev.length === 0,
            },
          ]);
        }
      }
      setNotification({ type: "success", message: "Image(s) uploaded to Supabase Storage successfully." });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to upload image." });
    } finally {
      setIsUploading(false);
    }
  };

  const addVariantRow = () => {
    const nextSku = `${(slug || "PROD").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setVariants((prev) => [
      ...prev,
      {
        sku: nextSku,
        size: "M",
        color: "Espresso Brown",
        colorHex: "#3D1B00",
        stock: 10,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    try {
      const payload: ProductFormData = {
        name,
        slug,
        subtitle: subtitle || undefined,
        description,
        category,
        fabric,
        fabricOrigin: fabricOrigin || undefined,
        weaveTechnique: weaveTechnique || undefined,
        gsm: gsm ? Number(gsm) : undefined,
        edition: edition || undefined,
        badge: badge || undefined,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        status,
        featured,
        bestseller,
        newArrival,
        collectionIds: [],
        tags: tagsInput
          ? tagsInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        details: detailsInput
          ? detailsInput
              .split("\n")
              .map((d) => d.trim())
              .filter(Boolean)
          : [],
        care: careInput
          ? careInput
              .split("\n")
              .map((c) => c.trim())
              .filter(Boolean)
          : [],
        shippingInfo: shippingInfo || undefined,
        variants,
        images,
      };

      if (selectedProduct) {
        await updateProductAction(selectedProduct.id, payload);
        setNotification({ type: "success", message: `Garment '${name}' updated successfully.` });
      } else {
        await createProductAction(payload);
        setNotification({ type: "success", message: `New garment '${name}' published to catalog.` });
      }

      setIsModalOpen(false);
      await loadCatalog();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to save product." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (productId: string, nextStatus: "draft" | "published" | "archived") => {
    try {
      await updateProductStatusAction(productId, nextStatus);
      setNotification({ type: "success", message: `Product status changed to ${nextStatus}.` });
      await loadCatalog();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update status." });
    }
  };

  const handleStockUpdate = async (variantId: string, qty: number) => {
    try {
      await updateVariantStockAction(variantId, qty);
      setNotification({ type: "success", message: "Stock quantity updated." });
      await loadCatalog();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update stock." });
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter !== "all") {
      const pStatus = p.status || "published";
      if (pStatus !== statusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10 bg-surface">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-outline-variant/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Atelier Catalog Studio
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-primary">
            Garment &amp; Catalog Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Create, edit, price, and manage small-batch luxury silhouettes, variants, and photography.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Garment</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`my-6 p-4 rounded-xl flex items-start justify-between gap-3 text-sm animate-in fade-in ${
            notification.type === "success"
              ? "bg-secondary/10 border border-secondary/20 text-secondary"
              : "bg-error/10 border border-error/20 text-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-xs font-medium">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-on-surface-variant hover:text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold">
          {["all", "published", "draft", "archived"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, slug or category..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-xs focus:outline-none focus:ring-1 focus:border-primary"
          />
        </div>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/40 rounded-2xl text-on-surface-variant">
          <Package className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
          <p className="font-semibold text-primary">No products match your criteria.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Garment</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Variants / Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredProducts.map((p) => {
                  const totalStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
                  const pStatus = p.status || (p.featured ? "published" : "published");
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-12 h-16 rounded-lg bg-surface-container overflow-hidden border border-outline-variant/40 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]?.url || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=200"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-sm">{p.name}</p>
                          <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{p.slug}</p>
                          <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{p.fabric}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-on-surface font-medium">{p.category}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-primary">{formatPrice(p.price)}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="block text-[10px] text-on-surface-variant line-through mt-0.5">
                            {formatPrice(p.compareAtPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={pStatus}
                          onChange={(e) => handleStatusChange(p.id, e.target.value as any)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            pStatus === "published"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : pStatus === "draft"
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                          }`}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-primary">
                          {p.variants.length} {p.variants.length === 1 ? "variant" : "variants"}
                        </span>
                        <span
                          className={`block text-[10px] font-semibold mt-0.5 ${
                            totalStock > 5 ? "text-secondary" : "text-amber-600"
                          }`}
                        >
                          {totalStock} units on hand
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors"
                            title="View on Storefront"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors"
                            title="Edit Garment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
              <div>
                <h3 className="font-title-lg text-title-lg font-serif text-primary">
                  {selectedProduct ? `Edit Garment: ${selectedProduct.name}` : "Commission New Garment"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Configure apparel taxonomy, pricing, inventory, variants, and high-resolution imagery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Section 1: Basic Identifiers */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-outline-variant/30">
                  1. Silhouette &amp; Taxonomy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Garment Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Belgian Linen Chore Jacket"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Slug (URL identifier)</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. belgian-linen-chore-jacket"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-mono focus:ring-1 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:border-primary"
                    >
                      {["Outerwear", "Dresses", "Tops", "Bottoms", "Knitwear"].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Subtitle / Line Tag</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Espresso Brown • 320 GSM"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Curator Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tailoring contours, fabric weight, drape, and button appointments..."
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs focus:ring-1 focus:border-primary"
                  />
                </div>
              </div>

              {/* Section 2: Craft & Textile Details */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-outline-variant/30">
                  2. Textile Craft &amp; Provenance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Fabric Composition</label>
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="Pure Linen"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Fiber Origin</label>
                    <input
                      type="text"
                      value={fabricOrigin}
                      onChange={(e) => setFabricOrigin(e.target.value)}
                      placeholder="Belgian Organic Linen"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Weave Technique</label>
                    <input
                      type="text"
                      value={weaveTechnique}
                      onChange={(e) => setWeaveTechnique(e.target.value)}
                      placeholder="Single Origin Handloom"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">GSM Weight</label>
                    <input
                      type="number"
                      value={gsm}
                      onChange={(e) => setGsm(e.target.value ? Number(e.target.value) : "")}
                      placeholder="320"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Batch / Edition</label>
                    <input
                      type="text"
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      placeholder="Edition 08 / 120"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Curator Badge</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Low Batch (8 left)"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing & State */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary uppercase tracking-wider text-[11px] pb-1 border-b border-outline-variant/30">
                  3. Pricing &amp; Publication State
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Current Price (INR ₹)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">Original Price (Compare-At)</label>
                    <input
                      type="number"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Optional original price"
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-medium mb-1">State</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-low text-xs font-semibold"
                    >
                      <option value="published">Published (Live on Store)</option>
                      <option value="draft">Draft (Internal Only)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Featured Hero</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bestseller}
                      onChange={(e) => setBestseller(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newArrival}
                      onChange={(e) => setNewArrival(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Variants & Inventory */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
                  <h4 className="font-semibold text-primary uppercase tracking-wider text-[11px]">
                    4. Garment Variants &amp; Inventory Ledger
                  </h4>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-secondary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 items-center"
                    >
                      <div className="col-span-3">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">SKU</label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, sku: val } : item)));
                          }}
                          className="w-full px-2 py-1 rounded border border-outline-variant/50 bg-surface-container-lowest font-mono text-[11px]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">Size</label>
                        <select
                          value={v.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, size: val } : item)));
                          }}
                          className="w-full px-2 py-1 rounded border border-outline-variant/50 bg-surface-container-lowest text-[11px]"
                        >
                          {["XS", "S", "M", "L", "XL", "XXL", "One Size"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">Color Name</label>
                        <input
                          type="text"
                          required
                          value={v.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, color: val } : item)));
                          }}
                          className="w-full px-2 py-1 rounded border border-outline-variant/50 bg-surface-container-lowest text-[11px]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">Hex</label>
                        <input
                          type="text"
                          value={v.colorHex}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, colorHex: val } : item)));
                          }}
                          className="w-full px-2 py-1 rounded border border-outline-variant/50 bg-surface-container-lowest font-mono text-[11px]"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">Stock</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={v.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariants((prev) => prev.map((item, i) => (i === idx ? { ...item, stock: val } : item)));
                          }}
                          className="w-full px-2 py-1 rounded border border-outline-variant/50 bg-surface-container-lowest text-[11px]"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          disabled={variants.length <= 1}
                          className="text-on-surface-variant hover:text-error disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Photography & Storage Uploads */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
                  <h4 className="font-semibold text-primary uppercase tracking-wider text-[11px]">
                    5. High-Resolution Apparel Photography
                  </h4>
                  <label className="cursor-pointer text-secondary hover:underline font-semibold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Computer</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={handleImageFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {isUploading && (
                  <div className="p-3 rounded-lg bg-surface-container flex items-center gap-2 text-primary font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                    <span>Uploading apparel image to Supabase Storage...</span>
                  </div>
                )}

                <div className="space-y-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center gap-3"
                    >
                      <div className="w-12 h-16 rounded overflow-hidden bg-surface-container border flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 grid grid-cols-12 gap-2 text-[11px]">
                        <input
                          type="text"
                          value={img.url}
                          placeholder="Image URL"
                          onChange={(e) => {
                            const val = e.target.value;
                            setImages((prev) => prev.map((item, i) => (i === idx ? { ...item, url: val } : item)));
                          }}
                          className="col-span-6 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-lowest font-mono text-[10px]"
                        />

                        <input
                          type="text"
                          value={img.alt}
                          placeholder="Alt description"
                          onChange={(e) => {
                            const val = e.target.value;
                            setImages((prev) => prev.map((item, i) => (i === idx ? { ...item, alt: val } : item)));
                          }}
                          className="col-span-3 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-lowest"
                        />

                        <select
                          value={img.label}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setImages((prev) => prev.map((item, i) => (i === idx ? { ...item, label: val } : item)));
                          }}
                          className="col-span-2 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-lowest"
                        >
                          <option value="Front">Front</option>
                          <option value="Back">Back</option>
                          <option value="Detail">Detail</option>
                          <option value="Lookbook">Lookbook</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={images.length <= 1}
                          className="col-span-1 text-on-surface-variant hover:text-error disabled:opacity-30 text-right"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/60 font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Silhouette...</span>
                    </>
                  ) : (
                    <span>{selectedProduct ? "Update Garment" : "Publish to Catalog"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
