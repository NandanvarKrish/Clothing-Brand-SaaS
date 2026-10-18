import * as z from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20, "Max quantity per line is 20"),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"),
  addressLine1: z.string().trim().min(5, "Address must be at least 5 characters").max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"),
  deliveryNotes: z.string().trim().max(500).optional(),
});

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Order must contain at least one garment"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"], {
    errorMap: () => ({ message: "Invalid payment method selected" }),
  }),
  couponCode: z.string().trim().toUpperCase().max(30).optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
