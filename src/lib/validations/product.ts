import * as z from "zod";

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z
    .string()
    .trim()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .toUpperCase(),
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color name is required"),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color format (e.g. #3D1B00)"),
  stock: z
    .number({ invalid_type_error: "Stock must be a number" })
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than zero")
    .optional(),
});

export type VariantFormData = z.infer<typeof variantSchema>;

export const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("Image URL must be valid"),
  alt: z.string().trim().min(2, "Alt text must be at least 2 characters"),
  label: z.enum(["Front", "Back", "Detail", "Lookbook", "Gallery"]).default("Front"),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export type ImageFormData = z.infer<typeof imageSchema>;

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Product name must be at least 2 characters")
      .max(255, "Product name cannot exceed 255 characters"),
    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g. linen-chore-jacket)"),
    subtitle: z.string().trim().max(255).optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters"),
    category: z.enum(["Outerwear", "Dresses", "Tops", "Bottoms", "Knitwear", "All"]),
    fabric: z.string().trim().min(2, "Fabric composition is required"),
    fabricOrigin: z.string().trim().optional(),
    weaveTechnique: z.string().trim().optional(),
    gsm: z
      .number({ invalid_type_error: "GSM must be a number" })
      .int()
      .positive("GSM must be greater than 0")
      .optional()
      .nullable(),
    edition: z.string().trim().optional().nullable(),
    badge: z.string().trim().optional().nullable(),
    price: z
      .number({ invalid_type_error: "Price must be a number" })
      .positive("Price must be greater than zero"),
    compareAtPrice: z
      .number({ invalid_type_error: "Compare price must be a number" })
      .positive("Compare price must be greater than zero")
      .optional()
      .nullable(),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    featured: z.boolean().default(false),
    bestseller: z.boolean().default(false),
    newArrival: z.boolean().default(false),
    collectionIds: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    details: z.array(z.string()).default([]),
    care: z.array(z.string()).default([]),
    shippingInfo: z.string().trim().optional().nullable(),
    variants: z.array(variantSchema).min(1, "At least one product variant (size/color) is required"),
    images: z.array(imageSchema).min(1, "At least one product image is required"),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice !== null && data.compareAtPrice !== undefined) {
        return data.compareAtPrice >= data.price;
      }
      return true;
    },
    {
      message: "Compare-at price (original price) must be greater than or equal to current price",
      path: ["compareAtPrice"],
    }
  );

export type ProductFormData = z.infer<typeof productSchema>;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
