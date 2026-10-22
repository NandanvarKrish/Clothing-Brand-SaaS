import { CartItem, Product } from "@/types";
import { getProductBySlugOrId, getProducts } from "@/services/productService";
import { getSupabase } from "@/lib/supabase";

export const FREE_SHIPPING_THRESHOLD = 1999;
export const STANDARD_SHIPPING_FEE = 250;

export interface RawCartInputItem {
  id?: string;
  productId: string;
  variantId?: string;
  sku?: string;
  size: string;
  color: string;
  colorHex?: string;
  quantity: number;
  price?: number;
}

export interface ValidatedCartResult {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon: string | null;
  couponError: string | null;
  shipping: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  total: number;
  hasUnavailableItems: boolean;
}

/**
 * Validates a coupon code against known promotions and DB coupons table.
 */
export async function validateCoupon(
  code: string | null | undefined,
  subtotal: number
): Promise<{ valid: boolean; discount: number; error: string | null; code: string | null }> {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, error: null, code: null };
  }

  const clean = code.trim().toUpperCase();

  // 1. Check Supabase DB coupons table if accessible
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("code, discount_type, value, min_subtotal, max_uses, times_used, starts_at, expires_at")
        .eq("code", clean)
        .maybeSingle();

      if (!error && data) {
        const now = new Date();
        if (data.starts_at && new Date(data.starts_at) > now) {
          return { valid: false, discount: 0, error: "Coupon promotion has not started yet.", code: clean };
        }
        if (data.expires_at && new Date(data.expires_at) < now) {
          return { valid: false, discount: 0, error: "Coupon promotion has expired.", code: clean };
        }
        if (data.max_uses && data.times_used >= data.max_uses) {
          return { valid: false, discount: 0, error: "Coupon usage limit reached.", code: clean };
        }
        const minSub = Number(data.min_subtotal || 0);
        if (subtotal < minSub) {
          return {
            valid: false,
            discount: 0,
            error: `Minimum order subtotal of ₹${minSub.toLocaleString()} required for this coupon.`,
            code: clean,
          };
        }

        let discount = 0;
        if (data.discount_type === "percentage") {
          discount = Math.round((subtotal * Number(data.value)) / 100);
        } else {
          discount = Math.min(subtotal, Math.round(Number(data.value)));
        }
        return { valid: true, discount, error: null, code: clean };
      }
    } catch {
      // Fallback to recognized promo codes below
    }
  }

  // 2. Recognized atelier promo codes
  if (clean === "FESTIVE10") {
    return { valid: true, discount: Math.round(subtotal * 0.1), error: null, code: clean };
  }
  if (clean === "WELCOME15") {
    return { valid: true, discount: Math.round(subtotal * 0.15), error: null, code: clean };
  }
  if (clean === "ATELIER20") {
    if (subtotal < 3000) {
      return { valid: false, discount: 0, error: "ATELIER20 requires a minimum subtotal of ₹3,000.", code: clean };
    }
    return { valid: true, discount: Math.round(subtotal * 0.2), error: null, code: clean };
  }

  return {
    valid: false,
    discount: 0,
    error: "Invalid promotional code. Try 'FESTIVE10' for 10% off.",
    code: clean,
  };
}

/**
 * Validates cart items against the authoritative database catalog.
 * Never trusts prices or quantities sent by the browser.
 */
export async function validateAndRecalculateCart(
  rawItems: RawCartInputItem[],
  couponCode?: string | null
): Promise<ValidatedCartResult> {
  const validatedItems: CartItem[] = [];
  let hasUnavailable = false;

  for (const raw of rawItems) {
    const product = await getProductBySlugOrId(raw.productId);
    const itemKey = `${raw.productId}-${raw.size}-${raw.color}`.toLowerCase().replace(/\s+/g, "-");

    // Case 1: Product missing or unpublished
    if (!product || product.status !== "published") {
      hasUnavailable = true;
      validatedItems.push({
        id: raw.id || itemKey,
        productId: raw.productId,
        productSlug: product?.slug || raw.productId,
        name: product?.name || "Archival Garment",
        price: 0,
        originalPrice: undefined,
        image: product?.images[0]?.url || "",
        size: raw.size,
        color: raw.color,
        colorHex: raw.colorHex,
        quantity: 0,
        maxStock: 0,
        sku: raw.sku,
        isAvailable: false,
        stockStatus: "unavailable",
        message: "This silhouette is no longer available in our catalog.",
      });
      continue;
    }

    // Case 2: Variant lookup
    const variant = product.variants.find(
      (v) =>
        (raw.variantId && v.id === raw.variantId) ||
        (raw.sku && v.sku.toLowerCase() === raw.sku.toLowerCase()) ||
        (v.size.toLowerCase() === raw.size.toLowerCase() && v.color.toLowerCase() === raw.color.toLowerCase())
    );

    if (!variant) {
      hasUnavailable = true;
      validatedItems.push({
        id: raw.id || itemKey,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.compareAtPrice,
        image: product.images[0]?.url || "",
        size: raw.size,
        color: raw.color,
        colorHex: raw.colorHex,
        quantity: 0,
        maxStock: 0,
        sku: raw.sku,
        isAvailable: false,
        stockStatus: "unavailable",
        message: `Size ${raw.size} / ${raw.color} is no longer produced.`,
      });
      continue;
    }

    // Case 3: Authoritative stock calculation
    const availableStock = Math.max(0, Number(variant.stock || 0));
    const authoritativePrice = Number(variant.price || product.price);
    const priceChanged = raw.price !== undefined && Number(raw.price) !== authoritativePrice;
    const colorObj = product.colors.find((c) => c.name.toLowerCase() === raw.color.toLowerCase());

    if (availableStock === 0) {
      hasUnavailable = true;
      validatedItems.push({
        id: raw.id || itemKey,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        price: authoritativePrice,
        originalPrice: product.compareAtPrice,
        image: product.images[0]?.url || "",
        size: variant.size,
        color: variant.color,
        colorHex: colorObj?.hex || raw.colorHex || "#3D1B00",
        quantity: 0,
        maxStock: 0,
        sku: variant.sku,
        variantId: variant.id,
        isAvailable: false,
        stockStatus: "out_of_stock",
        priceChanged,
        message: "Currently sold out for this batch edition.",
      });
      continue;
    }

    // Cap requested quantity at real stock
    let validQuantity = Math.max(1, Math.min(Number(raw.quantity) || 1, availableStock));
    const stockAdjusted = Number(raw.quantity) > availableStock;

    validatedItems.push({
      id: raw.id || itemKey,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: authoritativePrice,
      originalPrice: product.compareAtPrice,
      image: product.images[0]?.url || "",
      size: variant.size,
      color: variant.color,
      colorHex: colorObj?.hex || raw.colorHex || "#3D1B00",
      quantity: validQuantity,
      maxStock: availableStock,
      sku: variant.sku,
      variantId: variant.id,
      isAvailable: true,
      stockStatus: availableStock <= 5 ? "low_stock" : "in_stock",
      priceChanged,
      message: stockAdjusted ? `Quantity capped to available stock (${availableStock} pieces).` : undefined,
    });
  }

  // Authoritative calculations (only including available items)
  const availableItems = validatedItems.filter((i) => i.isAvailable !== false);
  const itemCount = availableItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const couponRes = await validateCoupon(couponCode, subtotal);
  const discount = couponRes.discount;
  const appliedCoupon = couponRes.valid ? couponRes.code : null;
  const couponError = couponRes.error;

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const freeShippingProgress =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 100 : Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    items: validatedItems,
    itemCount,
    subtotal,
    discount,
    appliedCoupon,
    couponError,
    shipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingProgress,
    total,
    hasUnavailableItems: hasUnavailable,
  };
}

/**
 * Reconciles guest cart items with authenticated customer cart items.
 * Merges matching variants by summing quantities (capped at available inventory).
 */
export function reconcileCartItems(guestItems: CartItem[], userItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();

  // Add existing user items first
  for (const item of userItems) {
    merged.set(item.id, { ...item });
  }

  // Merge in guest items
  for (const guestItem of guestItems) {
    const existing = merged.get(guestItem.id);
    if (existing) {
      const mergedQty = Math.min(existing.quantity + guestItem.quantity, existing.maxStock || 20);
      merged.set(guestItem.id, { ...existing, quantity: mergedQty });
    } else {
      merged.set(guestItem.id, { ...guestItem });
    }
  }

  return Array.from(merged.values());
}
