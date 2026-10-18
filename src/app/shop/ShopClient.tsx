"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Grid, Columns, ChevronDown, X, ArrowDown, Scissors } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { getProducts, getFilterFacets, FilterFacets } from "@/services/productService";
import { ProductCategory, Product } from "@/types";
import { formatPrice } from "@/lib/utils";

const CATEGORIES: ProductCategory[] = ["All", "Tops", "Bottoms", "Outerwear", "Dresses", "Knitwear"];

const QUICK_COLORS = [
  { name: "Warm Cream", hex: "#FAF3E0" },
  { name: "Espresso Brown", hex: "#3D1B00" },
  { name: "Olive Drab", hex: "#556B2F" },
  { name: "Charcoal", hex: "#2B2D2F" },
];

const FABRICS = [
  "Belgian Organic Linen",
  "Mulberry & Tussar Silk",
  "Handspun Amber Khadi",
];

const SIZES = ["XS", "S", "M", "L", "XL"];

export function ShopClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<FilterFacets | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL state initialization
  const initialCategory = (searchParams.get("category") as ProductCategory) || "All";
  const initialFilter = searchParams.get("filter") || "";
  const initialSearch = searchParams.get("search") || "";

  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedWeave, setSelectedWeave] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(8000);
  const [sortOption, setSortOption] = useState<string>("featured");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Load catalog dynamically from data service
  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const [loadedProducts, loadedFacets] = await Promise.all([
          getProducts(),
          getFilterFacets(),
        ]);
        setRawProducts(loadedProducts);
        setFacets(loadedFacets);
      } catch (err) {
        console.error("Failed to load catalog products", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sync when searchParams change
  useEffect(() => {
    const cat = searchParams.get("category") as ProductCategory;
    if (cat && CATEGORIES.includes(cat)) {
      setCategory(cat);
    }
  }, [searchParams]);

  // Handle category change
  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    const params = new URLSearchParams(searchParams.toString());
    if (newCat === "All") {
      params.delete("category");
    } else {
      params.set("category", newCat);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
    );
  };

  const clearAllFilters = () => {
    setCategory("All");
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
    setSelectedWeave("");
    setMaxPrice(8000);
    setSortOption("featured");
    router.push("/shop");
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list: Product[] = [...rawProducts];

    // URL filter special handling (bestsellers, new-arrivals)
    if (initialFilter === "bestsellers") {
      list = list.filter((p) => p.bestseller);
    } else if (initialFilter === "new-arrivals") {
      list = list.filter((p) => p.newArrival);
    }

    // Search query
    if (initialSearch) {
      const q = initialSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "All") {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Colors
    if (selectedColors.length > 0) {
      list = list.filter((p) =>
        p.colors.some((c) =>
          selectedColors.some((sc) => c.name.toLowerCase().includes(sc.toLowerCase()))
        )
      );
    }

    // Sizes
    if (selectedSizes.length > 0) {
      list = list.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    // Fabrics
    if (selectedFabrics.length > 0) {
      list = list.filter((p) => p.fabricOrigin && selectedFabrics.includes(p.fabricOrigin));
    }

    // Weave Technique
    if (selectedWeave) {
      list = list.filter((p) => p.weaveTechnique === selectedWeave);
    }

    // Max Price
    list = list.filter((p) => p.price <= maxPrice);

    // Sorting
    switch (sortOption) {
      case "newest":
        list.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "weight":
        list.sort((a, b) => (b.gsm || 0) - (a.gsm || 0));
        break;
      case "featured":
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }, [
    category,
    initialFilter,
    initialSearch,
    selectedColors,
    selectedSizes,
    selectedFabrics,
    selectedWeave,
    maxPrice,
    sortOption,
    rawProducts,
  ]);

  const activeFiltersCount =
    (category !== "All" ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length +
    selectedFabrics.length +
    (selectedWeave ? 1 : 0) +
    (maxPrice < 8000 ? 1 : 0);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const percentViewed = Math.min(
    100,
    Math.round((displayedProducts.length / Math.max(filteredProducts.length, 1)) * 100)
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="text-outline-variant font-normal">/</span>
        <span className="text-primary font-semibold">Shop All</span>
      </nav>

      {/* 2. Editorial Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-semibold">
              Autumn 24 Capsule
            </span>
            <span className="w-8 h-[1px] bg-secondary/40" />
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {filteredProducts.length} Handcrafted Pieces
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-primary tracking-tight font-semibold">
            All Garments &amp; Silhouettes
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 leading-relaxed">
            Mindfully designed everyday essentials cut from organic Belgian linen, handspun khadi, and raw Mulberry silk. Structured silhouettes woven in numbered small batches.
          </p>
        </div>

        {/* Live Atelier Metric Pill */}
        <div className="flex items-center gap-4 bg-surface-container-low px-4 py-3 rounded-lg shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Weaving Batch No.
            </span>
            <span className="font-tabular-num text-tabular-num text-primary font-semibold">
              #ATELIER-24/09 • 100% Traceable
            </span>
          </div>
        </div>
      </section>

      {/* 3. Control & Filter Architecture (Sticky Bar) */}
      <div className="sticky top-20 z-30 -mx-6 px-6 lg:-mx-12 lg:px-12 py-4 bg-surface/90 backdrop-blur-md transition-all shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filter Bar Trigger Group */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Primary Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className="flex items-center gap-2 h-10 px-4 rounded bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold shadow-sm hover:bg-primary-container transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-secondary text-on-secondary font-tabular-num text-body-sm flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Category Quick Chips */}
            <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`h-8 px-3 rounded font-label-md text-label-md font-medium transition-colors ${
                    category === cat
                      ? "text-primary font-semibold bg-surface-container-lowest shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Color Swatches Quick Filter */}
            <div className="hidden xl:flex items-center gap-2 pl-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Palette:
              </span>
              <div className="flex items-center gap-1.5">
                {QUICK_COLORS.map((color) => {
                  const isSelected = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => toggleColor(color.name)}
                      title={color.name}
                      aria-label={color.name}
                      className={`w-6 h-6 rounded-full shadow-sm transition-all relative ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sort and Grid View Controls */}
          <div className="flex items-center justify-between lg:justify-end gap-4">
            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-2">
              <label
                htmlFor="sortDropdown"
                className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hidden sm:inline"
              >
                Sort By:
              </label>
              <div className="relative">
                <select
                  id="sortDropdown"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="featured">Curated • Featured</option>
                  <option value="newest">Newest In</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="weight">Fabric Weight</option>
                </select>
                <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Grid Density Switcher (3 vs 4) */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setGridColumns(3)}
                aria-label="3 Column Grid"
                className={`p-1.5 rounded transition-colors ${
                  gridColumns === 3
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <Columns className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setGridColumns(4)}
                aria-label="4 Column Grid"
                className={`p-1.5 rounded transition-colors ${
                  gridColumns === 4
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Tags Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-1">
              Active Criteria:
            </span>

            {category !== "All" && (
              <span className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                Category: {category}
                <button
                  type="button"
                  onClick={() => handleCategoryChange("All")}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedColors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"
              >
                Color: {c}
                <button
                  type="button"
                  onClick={() => toggleColor(c)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedSizes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"
              >
                Size: {s}
                <button
                  type="button"
                  onClick={() => toggleSize(s)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {maxPrice < 8000 && (
              <span className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                Price: Up to {formatPrice(maxPrice)}
                <button
                  type="button"
                  onClick={() => setMaxPrice(8000)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="font-label-sm text-label-sm text-secondary hover:text-primary uppercase tracking-wider font-semibold underline underline-offset-4 ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 4. Collapsible Advanced Drawer Filter Panel */}
      {isFilterDrawerOpen && (
        <div className="bg-surface-container-lowest rounded-xl p-6 my-6 shadow-md border border-outline-variant/30 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Fabric Origin Column */}
            <div>
              <h2 className="font-title-md text-title-md text-primary font-semibold mb-3">
                Fabric Origin
              </h2>
              <div className="space-y-2">
                {FABRICS.map((fabric) => (
                  <label
                    key={fabric}
                    className="flex items-center gap-2 cursor-pointer font-body-md text-body-md text-on-surface-variant hover:text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fabric)}
                      onChange={() => toggleFabric(fabric)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <span>{fabric}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Sieve Column */}
            <div>
              <h2 className="font-title-md text-title-md text-primary font-semibold mb-3">
                Available Sizing
              </h2>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`w-10 h-10 rounded font-label-md text-label-md font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-title-md text-title-md text-primary font-semibold">
                  Price Horizon
                </h2>
                <span className="font-tabular-num text-tabular-num text-primary font-bold">
                  Up to {formatPrice(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="8000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer mb-2"
              />
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>₹1,500</span>
                <span>₹8,000+</span>
              </div>
            </div>

            {/* Craft Technique */}
            <div>
              <h2 className="font-title-md text-title-md text-primary font-semibold mb-3">
                Weave Technique
              </h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-body-md text-body-md text-on-surface-variant hover:text-on-surface">
                  <input
                    type="radio"
                    name="weave"
                    checked={selectedWeave === ""}
                    onChange={() => setSelectedWeave("")}
                    className="accent-primary"
                  />
                  <span>All Techniques</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-body-md text-body-md text-on-surface-variant hover:text-on-surface">
                  <input
                    type="radio"
                    name="weave"
                    checked={selectedWeave === "Single Origin Handloom"}
                    onChange={() => setSelectedWeave("Single Origin Handloom")}
                    className="accent-primary"
                  />
                  <span>Single Origin Handloom</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-body-md text-body-md text-on-surface-variant hover:text-on-surface">
                  <input
                    type="radio"
                    name="weave"
                    checked={selectedWeave === "Natural Herbal Washed"}
                    onChange={() => setSelectedWeave("Natural Herbal Washed")}
                    className="accent-primary"
                  />
                  <span>Natural Herbal Washed</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Responsive Catalog Grid */}
      {isLoading ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            gridColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
          } gap-x-6 gap-y-12 mt-8`}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="w-full aspect-[3/4] bg-surface-container-high rounded-xl" />
              <div className="w-2/3 h-5 bg-surface-container-high rounded" />
              <div className="w-1/3 h-4 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="my-24 text-center py-12 bg-surface-container-low rounded-2xl max-w-lg mx-auto p-8">
          <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-2">
            No Silhouettes Match Your Criteria
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            We couldn&apos;t find any garments matching your active filters. Try broadening your criteria or reset filters to browse the complete catalog.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-6 py-3 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold tracking-wide hover:bg-primary-container transition-colors shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            gridColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
          } gap-x-6 gap-y-12 mt-8 transition-all duration-300`}
        >
          {displayedProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 4} />
          ))}
        </div>
      )}

      {/* 6. Editorial Pagination & Load More Section */}
      {filteredProducts.length > displayedProducts.length && (
        <div className="mt-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-full flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mb-2">
            <span>
              Showing {displayedProducts.length} of {filteredProducts.length} garments
            </span>
            <span className="font-tabular-num text-tabular-num font-semibold text-primary">
              {percentViewed}% viewed
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${percentViewed}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 4)}
            className="group relative px-8 py-3.5 rounded bg-primary text-on-primary font-label-md text-label-md uppercase tracking-[0.2em] font-semibold hover:bg-primary-container transition-all duration-200 shadow-md flex items-center gap-3"
          >
            <span>Load More Pieces</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
          <span className="font-body-sm text-body-sm text-on-surface-variant mt-4">
            Small-batch releases guarantee zero deadstock fabric.
          </span>
        </div>
      )}

      {/* 7. Atelier Commitment Ribbon Banner */}
      <section className="mt-24 p-8 rounded-2xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-title-md text-title-md text-primary font-semibold">
              Complimentary Atelier Custom Hemming
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Need a bespoke trouser inseam or sleeve adjustment? Specify in notes at checkout free of charge.
            </p>
          </div>
        </div>
        <Link
          href="/about#sizing"
          className="shrink-0 font-label-md text-label-md uppercase tracking-wider text-secondary hover:text-primary font-semibold flex items-center gap-1.5 transition-colors"
        >
          Read Sizing Protocol →
        </Link>
      </section>
    </div>
  );
}
