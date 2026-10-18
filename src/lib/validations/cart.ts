import * as z from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  size: z.string().min(1, "Size selection is required"),
  color: z.string().min(1, "Color selection is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20, "Maximum 20 items per line"),
});

export const updateCartQuantitySchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(0, "Quantity cannot be negative").max(20, "Maximum 20 items per line"),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(3, "Coupon code must be at least 3 characters").max(30).toUpperCase(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartQuantityInput = z.infer<typeof updateCartQuantitySchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
