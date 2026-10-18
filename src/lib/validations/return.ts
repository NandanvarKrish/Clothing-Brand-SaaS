import * as z from "zod";

export const createReturnRequestSchema = z.object({
  orderNumber: z.string().trim().min(3, "Order number is required"),
  email: z.string().trim().email("Valid email associated with the order is required"),
  itemSku: z.string().min(1, "Garment SKU is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.enum([
    "size_too_small",
    "size_too_large",
    "fabric_preference",
    "color_difference",
    "defective_stitching",
    "other",
  ], {
    errorMap: () => ({ message: "Please select a valid return reason" }),
  }),
  comments: z.string().trim().max(1000).optional(),
});

export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
