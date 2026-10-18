"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { getProducts } from "@/services/productService";
import { Product } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";

export function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getProducts();
        setProducts(list);
      } catch (err) {
        console.error("Failed to load products for search", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.fabricOrigin && p.fabricOrigin.toLowerCase().includes(q)) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query, products]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-semibold block mb-2">
          Atelier Search
        </span>
        <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-primary font-bold tracking-tight mb-6">
          Find Your Silhouette
        </h1>

        <div className="relative">
          <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by garment name, fiber, or color (e.g., Linen, Silk, Espresso, Blazer)..."
            className="w-full h-14 pl-12 pr-12 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-lg text-body-lg text-primary placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Tags */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap text-body-sm">
          <span className="text-on-surface-variant">Popular searches:</span>
          {["Linen Chore Jacket", "Raw Silk", "Blazer", "Trousers", "Espresso", "Khadi"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-medium text-xs transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pb-4 mb-8 border-b border-surface-container-high">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {query ? (
            <>
              Showing <strong>{results.length}</strong> {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
            </>
          ) : (
            <>Showing all {results.length} atelier silhouettes</>
          )}
        </p>
        <Link
          href="/shop"
          className="font-label-md text-label-md text-secondary hover:text-primary font-semibold uppercase tracking-wider"
        >
          View Full Catalog →
        </Link>
      </div>

      {/* Grid or Empty */}
      {results.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl max-w-md mx-auto p-8">
          <p className="font-headline-md text-headline-md text-primary font-semibold mb-2">
            No Matching Silhouettes Found
          </p>
          <p className="font-body-md text-on-surface-variant mb-6">
            We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try checking the spelling or browse our featured collections.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="px-6 py-2.5 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
