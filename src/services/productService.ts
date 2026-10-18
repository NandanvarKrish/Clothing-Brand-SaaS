import { Product, ProductCategory, Collection } from "@/types";
import { PRODUCTS } from "@/data/products";
import { COLLECTIONS } from "@/data/collections";
import { getSupabase } from "@/lib/supabase";

export interface ProductFilterOptions {
  category?: ProductCategory | 'All';
  collectionId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  fabricOrigin?: string[];
  weaveTechnique?: string;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'weight';
  limit?: number;
  offset?: number;
}

export interface FilterFacets {
  categories: { name: ProductCategory; count: number }[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  fabrics: string[];
  weaves: string[];
  minPrice: number;
  maxPrice: number;
}

export async function getProducts(options: ProductFilterOptions = {}): Promise<Product[]> {
  const supabase = getSupabase();
  if (supabase) {
    // If Supabase is connected in the future, queries can run here.
    // For now we transparently use the typed local repository.
  }

  let results = [...PRODUCTS];

  // Category filter
  if (options.category && options.category !== 'All') {
    results = results.filter((p) => p.category.toLowerCase() === options.category!.toLowerCase());
  }

  // Collection filter
  if (options.collectionId) {
    results = results.filter((p) => p.collectionIds.includes(options.collectionId!));
  }

  // Flag filters
  if (options.featured !== undefined) {
    results = results.filter((p) => Boolean(p.featured) === options.featured);
  }
  if (options.bestseller !== undefined) {
    results = results.filter((p) => Boolean(p.bestseller) === options.bestseller);
  }
  if (options.newArrival !== undefined) {
    results = results.filter((p) => Boolean(p.newArrival) === options.newArrival);
  }

  // Search query
  if (options.search && options.search.trim() !== '') {
    const q = options.search.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        (p.fabricOrigin && p.fabricOrigin.toLowerCase().includes(q)) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }

  // Price range
  if (typeof options.minPrice === 'number') {
    results = results.filter((p) => p.price >= options.minPrice!);
  }
  if (typeof options.maxPrice === 'number') {
    results = results.filter((p) => p.price <= options.maxPrice!);
  }

  // Colors
  if (options.colors && options.colors.length > 0) {
    results = results.filter((p) =>
      p.colors.some((c) => options.colors!.some((optColor) => c.name.toLowerCase().includes(optColor.toLowerCase())))
    );
  }

  // Sizes
  if (options.sizes && options.sizes.length > 0) {
    results = results.filter((p) => p.sizes.some((s) => options.sizes!.includes(s)));
  }

  // Fabric Origin
  if (options.fabricOrigin && options.fabricOrigin.length > 0) {
    results = results.filter((p) => p.fabricOrigin && options.fabricOrigin!.includes(p.fabricOrigin));
  }

  // Weave Technique
  if (options.weaveTechnique) {
    results = results.filter((p) => p.weaveTechnique === options.weaveTechnique);
  }

  // Sorting
  if (options.sort) {
    switch (options.sort) {
      case 'newest':
        results.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
        break;
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'weight':
        results.sort((a, b) => (b.gsm || 0) - (a.gsm || 0));
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }
  }

  if (typeof options.offset === 'number' && options.offset > 0) {
    results = results.slice(options.offset);
  }
  if (typeof options.limit === 'number' && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = PRODUCTS.find((p) => p.slug === slug);
  return product || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = PRODUCTS.find((p) => p.id === id);
  return product || null;
}

export async function getBestsellers(): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.bestseller);
}

export async function getNewArrivals(): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.newArrival);
}

export async function getRelatedProducts(productId: string, limit: number = 3): Promise<Product[]> {
  const current = PRODUCTS.find((p) => p.id === productId);
  if (!current) return PRODUCTS.slice(0, limit);

  const related = PRODUCTS.filter(
    (p) => p.id !== productId && (p.category === current.category || p.collectionIds.some((cid) => current.collectionIds.includes(cid)))
  );

  return related.slice(0, limit);
}

export async function getCollections(): Promise<Collection[]> {
  // Augment collections with dynamic itemCount calculated from actual products
  return COLLECTIONS.map((c) => {
    const count = PRODUCTS.filter((p) => p.collectionIds.includes(c.slug)).length;
    return {
      ...c,
      itemCount: count > 0 ? count : c.itemCount,
    };
  });
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const col = COLLECTIONS.find((c) => c.slug === slug);
  if (!col) return null;
  const count = PRODUCTS.filter((p) => p.collectionIds.includes(col.slug)).length;
  return {
    ...col,
    itemCount: count > 0 ? count : col.itemCount,
  };
}

export async function getFilterFacets(): Promise<FilterFacets> {
  const categoriesMap = new Map<ProductCategory, number>();
  categoriesMap.set('All', PRODUCTS.length);

  const colorsMap = new Map<string, string>();
  const sizesSet = new Set<string>();
  const fabricsSet = new Set<string>();
  const weavesSet = new Set<string>();

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  PRODUCTS.forEach((p) => {
    // Categories
    categoriesMap.set(p.category, (categoriesMap.get(p.category) || 0) + 1);

    // Colors
    p.colors.forEach((c) => {
      if (!colorsMap.has(c.name)) {
        colorsMap.set(c.name, c.hex);
      }
    });

    // Sizes
    p.sizes.forEach((s) => sizesSet.add(s));

    // Fabrics
    if (p.fabricOrigin) fabricsSet.add(p.fabricOrigin);

    // Weaves
    if (p.weaveTechnique) weavesSet.add(p.weaveTechnique);

    // Price
    if (p.price < minPrice) minPrice = p.price;
    if (p.price > maxPrice) maxPrice = p.price;
  });

  const categories = Array.from(categoriesMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
  }));

  return {
    categories,
    colors,
    sizes: Array.from(sizesSet),
    fabrics: Array.from(fabricsSet),
    weaves: Array.from(weavesSet),
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice: maxPrice === -Infinity ? 10000 : maxPrice,
  };
}

export interface StockValidationItem {
  sku: string;
  quantity: number;
}

export interface StockValidationResult {
  valid: boolean;
  errors: { sku: string; requested: number; available: number }[];
}

export function validateStock(items: StockValidationItem[]): StockValidationResult {
  const errors: { sku: string; requested: number; available: number }[] = [];

  for (const item of items) {
    let variantFound = false;
    for (const prod of PRODUCTS) {
      const v = prod.variants.find((variant) => variant.sku === item.sku);
      if (v) {
        variantFound = true;
        if (v.stock < item.quantity) {
          errors.push({ sku: item.sku, requested: item.quantity, available: v.stock });
        }
        break;
      }
    }
    if (!variantFound) {
      errors.push({ sku: item.sku, requested: item.quantity, available: 0 });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface PincodeDeliveryInfo {
  valid: boolean;
  days: string;
  city: string;
  pincode: string;
  courier: string;
}

export function checkPincodeDelivery(pincode: string): PincodeDeliveryInfo {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      valid: false,
      days: '',
      city: '',
      pincode: clean,
      courier: '',
    };
  }

  // Intelligent demo mapping for common Indian PIN code regions
  let city = 'Metro Hub';
  let days = '2–3 business days';

  const prefix = clean.substring(0, 2);
  if (prefix === '40') {
    city = 'Mumbai';
    days = '1–2 business days';
  } else if (prefix === '11') {
    city = 'New Delhi';
    days = '2–3 business days';
  } else if (prefix === '56') {
    city = 'Bengaluru';
    days = '2–3 business days';
  } else if (prefix === '60') {
    city = 'Chennai';
    days = '2–3 business days';
  } else if (prefix === '70') {
    city = 'Kolkata';
    days = '3–4 business days';
  } else if (prefix === '50') {
    city = 'Hyderabad';
    days = '2–3 business days';
  } else if (prefix === '38') {
    city = 'Ahmedabad';
    days = '2–3 business days';
  } else {
    city = 'Your Delivery Area';
    days = '3–5 business days';
  }

  return {
    valid: true,
    days,
    city,
    pincode: clean,
    courier: 'BlueDart Express Air',
  };
}
