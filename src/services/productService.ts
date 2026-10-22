import { Product, ProductCategory, Collection } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { PRODUCTS } from "@/data/products";
import { COLLECTIONS } from "@/data/collections";

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
  status?: 'draft' | 'published' | 'archived';
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

/**
 * Transforms a raw Supabase product relational row into the typed frontend Product object.
 */
export function transformDbProduct(row: any): Product {
  const images = (row.product_images || [])
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt_text || row.name,
      label: img.label || 'Front',
      sortOrder: img.sort_order || 0,
      isPrimary: Boolean(img.is_primary),
    }));

  const variants = (row.product_variants || [])
    .filter((v: any) => v.is_active !== false)
    .map((v: any) => {
      const inv = Array.isArray(v.inventory_items)
        ? v.inventory_items[0]
        : v.inventory_items;
      const onHand = inv ? Number(inv.quantity_on_hand ?? 0) : 0;
      const reserved = inv ? Number(inv.quantity_reserved ?? 0) : 0;
      const stock = Math.max(0, onHand - reserved);
      return {
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color_name,
        stock,
        price: v.price_override ? Number(v.price_override) : Number(row.price),
      };
    });

  const colorsMap = new Map<string, string>();
  (row.product_variants || []).forEach((v: any) => {
    if (v.color_name && !colorsMap.has(v.color_name)) {
      colorsMap.set(v.color_name, v.color_hex || '#000000');
    }
  });

  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
    inStock: true,
  }));

  const sizes: string[] = Array.from(new Set(variants.map((v: any) => v.size as string)));

  const collectionIds = (row.product_collections || [])
    .map((pc: any) => pc.collections?.slug || pc.collection_id)
    .filter(Boolean);

  const categoryName = (row.categories?.name || 'All') as ProductCategory;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || '',
    description: row.description,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    category: categoryName,
    fabric: row.fabric,
    fabricOrigin: row.fabric_origin || undefined,
    weaveTechnique: row.weave_technique || undefined,
    gsm: row.gsm ? Number(row.gsm) : undefined,
    edition: row.edition || undefined,
    badge: row.badge || undefined,
    featured: Boolean(row.is_featured),
    bestseller: Boolean(row.is_bestseller),
    newArrival: Boolean(row.is_new_arrival),
    status: row.status || (row.is_active ? 'published' : 'draft'),
    tags: Array.isArray(row.tags) ? row.tags : [],
    collectionIds: collectionIds.length > 0 ? collectionIds : (row.collection_ids || []),
    images: images.length > 0 ? images : (row.image_url ? [{ url: row.image_url, alt: row.name, label: 'Front' }] : []),
    colors,
    sizes,
    variants,
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    details: Array.isArray(row.details) ? row.details : [],
    care: Array.isArray(row.care) ? row.care : [],
    shippingInfo: row.shipping_info || undefined,
  };
}

export async function getProducts(options: ProductFilterOptions = {}): Promise<Product[]> {
  const supabase = getSupabase();
  let results: Product[] = [];

  if (supabase) {
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, slug, subtitle, description, price, compare_at_price,
          fabric, fabric_origin, weave_technique, gsm, edition, badge,
          is_featured, is_bestseller, is_new_arrival, is_active, status, tags,
          rating, review_count, details, care, shipping_info,
          categories(name, slug),
          product_images(id, url, alt_text, label, sort_order, is_primary),
          product_variants(id, sku, size, color_name, color_hex, price_override, is_active, inventory_items(quantity_on_hand, quantity_reserved)),
          product_collections(collection_id, collections(id, slug, title))
        `);

      if (options.status) {
        query = query.eq('status', options.status);
      } else {
        // Customer-facing default: only published or active
        query = query.or('is_active.eq.true,status.eq.published');
      }

      if (options.featured !== undefined) {
        query = query.eq('is_featured', options.featured);
      }
      if (options.bestseller !== undefined) {
        query = query.eq('is_bestseller', options.bestseller);
      }
      if (options.newArrival !== undefined) {
        query = query.eq('is_new_arrival', options.newArrival);
      }
      if (options.minPrice !== undefined) {
        query = query.gte('price', options.minPrice);
      }
      if (options.maxPrice !== undefined) {
        query = query.lte('price', options.maxPrice);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        results = data.map(transformDbProduct);
      }
    } catch {
      // Fallback to static catalog if DB query fails or tables unseeded
    }
  }

  // Graceful fallback to static product catalog if DB is unmigrated or empty
  if (results.length === 0) {
    results = [...PRODUCTS];
    if (options.featured !== undefined) {
      results = results.filter((p) => Boolean(p.featured) === options.featured);
    }
    if (options.bestseller !== undefined) {
      results = results.filter((p) => Boolean(p.bestseller) === options.bestseller);
    }
    if (options.newArrival !== undefined) {
      results = results.filter((p) => Boolean(p.newArrival) === options.newArrival);
    }
    if (options.minPrice !== undefined) {
      results = results.filter((p) => p.price >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= options.maxPrice!);
    }
  }

  if (options.category && options.category !== 'All') {
    results = results.filter((p) => p.category.toLowerCase() === options.category!.toLowerCase());
  }
  if (options.collectionId) {
    results = results.filter((p) => p.collectionIds.includes(options.collectionId!));
  }
  if (options.search && options.search.trim() !== '') {
    const q = options.search.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.fabricOrigin && p.fabricOrigin.toLowerCase().includes(q)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }
  if (options.colors && options.colors.length > 0) {
    results = results.filter((p) =>
      p.colors.some((c) => options.colors!.some((optColor) => c.name.toLowerCase().includes(optColor.toLowerCase())))
    );
  }
  if (options.sizes && options.sizes.length > 0) {
    results = results.filter((p) => p.sizes.some((s) => options.sizes!.includes(s)));
  }
  if (options.fabricOrigin && options.fabricOrigin.length > 0) {
    results = results.filter((p) => p.fabricOrigin && options.fabricOrigin!.includes(p.fabricOrigin));
  }
  if (options.weaveTechnique) {
    results = results.filter((p) => p.weaveTechnique === options.weaveTechnique);
  }
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

export async function getProductBySlugOrId(
  identifier: string,
  includeUnpublished = false
): Promise<Product | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      let query = supabase
        .from('products')
        .select(`
          id, name, slug, subtitle, description, price, compare_at_price,
          fabric, fabric_origin, weave_technique, gsm, edition, badge,
          is_featured, is_bestseller, is_new_arrival, is_active, status, tags,
          rating, review_count, details, care, shipping_info,
          categories(name, slug),
          product_images(id, url, alt_text, label, sort_order, is_primary),
          product_variants(id, sku, size, color_name, color_hex, price_override, is_active, inventory_items(quantity_on_hand, quantity_reserved)),
          product_collections(collection_id, collections(id, slug, title))
        `);

      if (isUuid) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }

      if (!includeUnpublished) {
        query = query.or('is_active.eq.true,status.eq.published');
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return transformDbProduct(data);
      }

      // If slug search missed and was not recognized as UUID, try querying by id
      if (!isUuid) {
        let fallbackQuery = supabase
          .from('products')
          .select(`
            id, name, slug, subtitle, description, price, compare_at_price,
            fabric, fabric_origin, weave_technique, gsm, edition, badge,
            is_featured, is_bestseller, is_new_arrival, is_active, status, tags,
            rating, review_count, details, care, shipping_info,
            categories(name, slug),
            product_images(id, url, alt_text, label, sort_order, is_primary),
            product_variants(id, sku, size, color_name, color_hex, price_override, is_active, inventory_items(quantity_on_hand, quantity_reserved)),
            product_collections(collection_id, collections(id, slug, title))
          `)
          .eq('id', identifier);

        if (!includeUnpublished) {
          fallbackQuery = fallbackQuery.or('is_active.eq.true,status.eq.published');
        }

        const { data: fallbackData } = await fallbackQuery.maybeSingle();
        if (fallbackData) {
          return transformDbProduct(fallbackData);
        }
      }
    } catch {
      // Fall through to static product catalog
    }
  }

  // Fallback to static catalog
  const staticProduct = PRODUCTS.find((p) => p.slug === identifier || p.id === identifier);
  return staticProduct || null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getProductBySlugOrId(slug);
}

export async function getProductById(id: string): Promise<Product | null> {
  return getProductBySlugOrId(id);
}

export async function getBestsellers(): Promise<Product[]> {
  return getProducts({ bestseller: true });
}

export async function getNewArrivals(): Promise<Product[]> {
  return getProducts({ newArrival: true });
}

export async function getRelatedProducts(productId: string, limit: number = 3): Promise<Product[]> {
  const current = await getProductBySlugOrId(productId);
  if (!current) {
    const list = await getProducts({ limit });
    return list;
  }

  const all = await getProducts();
  const related = all.filter(
    (p) =>
      p.id !== current.id &&
      (p.category === current.category ||
        p.collectionIds.some((cid) => current.collectionIds.includes(cid)))
  );

  return related.slice(0, limit);
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = getSupabase();
  if (!supabase) return COLLECTIONS;

  try {
    const { data, error } = await supabase
      .from('collections')
      .select('id, slug, title, tagline, description, image_url, edition_badge, is_active')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return COLLECTIONS;
    }

    const { data: pcData } = await supabase
      .from('product_collections')
      .select('collection_id');

    const counts = new Map<string, number>();
    (pcData || []).forEach((pc: any) => {
      counts.set(pc.collection_id, (counts.get(pc.collection_id) || 0) + 1);
    });

    return data.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      tagline: c.tagline || '',
      description: c.description || '',
      image: c.image_url || '',
      editionBadge: c.edition_badge,
      itemCount: counts.get(c.id) || 0,
    }));
  } catch {
    return COLLECTIONS;
  }
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const list = await getCollections();
  return list.find((c) => c.slug === slug) || null;
}

export async function getFilterFacets(): Promise<FilterFacets> {
  const products = await getProducts();
  const categoriesMap = new Map<ProductCategory, number>();
  categoriesMap.set('All', products.length);

  const colorsMap = new Map<string, string>();
  const sizesSet = new Set<string>();
  const fabricsSet = new Set<string>();
  const weavesSet = new Set<string>();

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  products.forEach((p) => {
    if (p.category) {
      categoriesMap.set(p.category, (categoriesMap.get(p.category) || 0) + 1);
    }

    (p.colors || []).forEach((c) => {
      if (!colorsMap.has(c.name)) {
        colorsMap.set(c.name, c.hex);
      }
    });

    (p.sizes || []).forEach((s) => sizesSet.add(s));
    if (p.fabricOrigin) fabricsSet.add(p.fabricOrigin);
    if (p.weaveTechnique) weavesSet.add(p.weaveTechnique);

    if (p.price < minPrice) minPrice = p.price;
    if (p.price > maxPrice) maxPrice = p.price;
  });

  return {
    categories: Array.from(categoriesMap.entries()).map(([name, count]) => ({
      name,
      count,
    })),
    colors: Array.from(colorsMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    })),
    sizes: Array.from(sizesSet),
    fabrics: Array.from(fabricsSet),
    weaves: Array.from(weavesSet),
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice: maxPrice === -Infinity ? 8000 : maxPrice,
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

export async function validateStock(items: StockValidationItem[]): Promise<StockValidationResult> {
  const errors: { sku: string; requested: number; available: number }[] = [];
  const supabase = getSupabase();

  if (supabase) {
    try {
      const skus = items.map((i) => i.sku);
      const { data, error } = await supabase
        .from('product_variants')
        .select('sku, inventory_items(quantity_on_hand, quantity_reserved)')
        .in('sku', skus);

      if (!error && data && data.length > 0) {
        const stockMap = new Map<string, number>();
        data.forEach((v: any) => {
          const inv = Array.isArray(v.inventory_items) ? v.inventory_items[0] : v.inventory_items;
          const onHand = inv ? Number(inv.quantity_on_hand ?? 0) : 0;
          const reserved = inv ? Number(inv.quantity_reserved ?? 0) : 0;
          stockMap.set(v.sku, Math.max(0, onHand - reserved));
        });

        for (const item of items) {
          const available = stockMap.get(item.sku);
          if (available === undefined) {
            errors.push({ sku: item.sku, requested: item.quantity, available: 0 });
          } else if (available < item.quantity) {
            errors.push({ sku: item.sku, requested: item.quantity, available });
          }
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback stock check against static catalog
  for (const item of items) {
    let foundStock: number | undefined;
    for (const p of PRODUCTS) {
      const v = p.variants.find((v) => v.sku.toLowerCase() === item.sku.toLowerCase() || v.id === item.sku);
      if (v) {
        foundStock = v.stock;
        break;
      }
    }
    if (foundStock === undefined) {
      errors.push({ sku: item.sku, requested: item.quantity, available: 0 });
    } else if (foundStock < item.quantity) {
      errors.push({ sku: item.sku, requested: item.quantity, available: foundStock });
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
