import { WishlistItem } from "@/types";
import { getProductBySlugOrId } from "@/services/productService";

/**
 * Validates saved wishlist product IDs against the live database catalog.
 * Live catalog prices, imagery, and availability are refreshed.
 * Deleted or unpublished products are flagged with `isAvailable: false`.
 */
export async function validateAndSyncWishlist(
  items: { productId: string; addedAt?: string }[]
): Promise<WishlistItem[]> {
  const result: WishlistItem[] = [];

  for (const item of items) {
    const product = await getProductBySlugOrId(item.productId);

    if (!product || product.status !== "published") {
      result.push({
        productId: item.productId,
        slug: product?.slug || "",
        name: product?.name || "Archival Silhouette",
        price: product?.price || 0,
        compareAtPrice: product?.compareAtPrice,
        image: product?.images[0]?.url || "",
        category: product?.category || ("All" as any),
        badge: "Archived",
        addedAt: item.addedAt || new Date().toISOString(),
        isAvailable: false,
      });
      continue;
    }

    result.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images[0]?.url || "",
      category: product.category,
      badge: product.badge,
      addedAt: item.addedAt || new Date().toISOString(),
      isAvailable: true,
    });
  }

  return result;
}

/**
 * Merges guest wishlist items with authenticated customer wishlist items.
 */
export function reconcileWishlistIds(guestIds: string[], userIds: string[]): string[] {
  return Array.from(new Set([...userIds, ...guestIds]));
}
