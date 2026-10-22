"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  productSchema,
  ProductFormData,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE,
} from "@/lib/validations/product";

/**
 * Returns a privileged client if service role is configured,
 * otherwise returns authenticated server client enforcing RLS.
 */
async function getAuthorizedDbClient() {
  const serverClient = await createServerClient();
  if (!serverClient) {
    throw new Error("Supabase server connection is not configured");
  }

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: You must be logged in to manage atelier products");
  }

  // Use admin client if service role key exists, otherwise fall back to authenticated client
  const adminClient = createAdminClient();
  return {
    db: adminClient || serverClient,
    user,
  };
}

/**
 * Creates a complete product record with variants, initial inventory, images, and collections.
 */
export async function createProductAction(payload: ProductFormData) {
  // 1. Validate payload at the boundary
  const validated = productSchema.parse(payload);
  const { db, user } = await getAuthorizedDbClient();

  // 2. Resolve default tenant
  let tenantId = "00000000-0000-0000-0000-000000000001";
  try {
    const { data: tenant } = await db.from("tenants").select("id").limit(1).maybeSingle();
    if (tenant?.id) tenantId = tenant.id;
  } catch (e) {}

  // 3. Resolve category ID
  let categoryId: string | null = null;
  if (validated.category && validated.category !== "All") {
    try {
      const { data: cat } = await db
        .from("categories")
        .select("id")
        .ilike("name", validated.category)
        .maybeSingle();
      if (cat?.id) categoryId = cat.id;
    } catch (e) {}
  }

  const isPublished = validated.status === "published";

  // 4. Insert base product record
  const { data: productRow, error: productError } = await db
    .from("products")
    .insert({
      tenant_id: tenantId,
      category_id: categoryId,
      name: validated.name,
      slug: validated.slug,
      subtitle: validated.subtitle || null,
      description: validated.description,
      fabric: validated.fabric,
      fabric_origin: validated.fabricOrigin || null,
      weave_technique: validated.weaveTechnique || null,
      gsm: validated.gsm || null,
      edition: validated.edition || null,
      badge: validated.badge || null,
      price: validated.price,
      compare_at_price: validated.compareAtPrice || null,
      is_featured: validated.featured,
      is_bestseller: validated.bestseller,
      is_new_arrival: validated.newArrival,
      is_active: isPublished,
      status: validated.status,
      tags: validated.tags || [],
      details: validated.details || [],
      care: validated.care || [],
      shipping_info: validated.shippingInfo || null,
    })
    .select()
    .single();

  if (productError || !productRow) {
    throw new Error(`Failed to create product: ${productError?.message || "Unknown error"}`);
  }

  const productId = productRow.id;

  // 5. Insert variants and inventory records
  for (const v of validated.variants) {
    const { data: variantRow, error: variantError } = await db
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: v.sku,
        size: v.size,
        color_name: v.color,
        color_hex: v.colorHex,
        price_override: v.price || null,
        is_active: true,
      })
      .select()
      .single();

    if (!variantError && variantRow) {
      // Create associated inventory row
      await db.from("inventory_items").upsert({
        variant_id: variantRow.id,
        quantity_on_hand: v.stock,
        quantity_reserved: 0,
        low_stock_threshold: 5,
      });

      // Record inventory intake
      try {
        await db.from("inventory_movements").insert({
          variant_id: variantRow.id,
          delta: v.stock,
          movement_type: "restock",
          reference_type: "initial_intake",
          notes: `Initial catalog creation by ${user.email}`,
          created_by: user.id,
        });
      } catch (e) {}
    }
  }

  // 6. Insert images
  if (validated.images && validated.images.length > 0) {
    const imageInserts = validated.images.map((img, index) => ({
      product_id: productId,
      url: img.url,
      alt_text: img.alt || validated.name,
      label: img.label || "Front",
      sort_order: img.sortOrder ?? index,
      is_primary: img.isPrimary ?? index === 0,
    }));
    await db.from("product_images").insert(imageInserts);
  }

  // 7. Associate collections
  if (validated.collectionIds && validated.collectionIds.length > 0) {
    for (const colSlug of validated.collectionIds) {
      try {
        const { data: col } = await db
          .from("collections")
          .select("id")
          .eq("slug", colSlug)
          .maybeSingle();

        if (col?.id) {
          await db.from("product_collections").upsert({
            product_id: productId,
            collection_id: col.id,
          });
        }
      } catch (e) {}
    }
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/products/${validated.slug}`);
  revalidatePath("/collections");

  return { success: true, productId, slug: validated.slug };
}

/**
 * Updates an existing product and synchronizes variants and images.
 */
export async function updateProductAction(productId: string, payload: ProductFormData) {
  const validated = productSchema.parse(payload);
  const { db } = await getAuthorizedDbClient();

  let categoryId: string | null = null;
  if (validated.category && validated.category !== "All") {
    try {
      const { data: cat } = await db
        .from("categories")
        .select("id")
        .ilike("name", validated.category)
        .maybeSingle();
      if (cat?.id) categoryId = cat.id;
    } catch (e) {}
  }

  const isPublished = validated.status === "published";

  // Update base product
  const { error: updateError } = await db
    .from("products")
    .update({
      category_id: categoryId,
      name: validated.name,
      slug: validated.slug,
      subtitle: validated.subtitle || null,
      description: validated.description,
      fabric: validated.fabric,
      fabric_origin: validated.fabricOrigin || null,
      weave_technique: validated.weaveTechnique || null,
      gsm: validated.gsm || null,
      edition: validated.edition || null,
      badge: validated.badge || null,
      price: validated.price,
      compare_at_price: validated.compareAtPrice || null,
      is_featured: validated.featured,
      is_bestseller: validated.bestseller,
      is_new_arrival: validated.newArrival,
      is_active: isPublished,
      status: validated.status,
      tags: validated.tags || [],
      details: validated.details || [],
      care: validated.care || [],
      shipping_info: validated.shippingInfo || null,
    })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }

  // Update images
  if (validated.images && validated.images.length > 0) {
    await db.from("product_images").delete().eq("product_id", productId);
    const imageInserts = validated.images.map((img, index) => ({
      product_id: productId,
      url: img.url,
      alt_text: img.alt || validated.name,
      label: img.label || "Front",
      sort_order: img.sortOrder ?? index,
      is_primary: img.isPrimary ?? index === 0,
    }));
    await db.from("product_images").insert(imageInserts);
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/products/${validated.slug}`);
  revalidatePath("/admin/products");

  return { success: true, productId, slug: validated.slug };
}

/**
 * Updates a product's publication status ('draft', 'published', 'archived').
 */
export async function updateProductStatusAction(
  productId: string,
  status: "draft" | "published" | "archived"
) {
  const { db } = await getAuthorizedDbClient();
  const isPublished = status === "published";

  const { error } = await db
    .from("products")
    .update({
      status,
      is_active: isPublished,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");

  return { success: true };
}

/**
 * Adjusts variant inventory on hand and logs the audit movement.
 */
export async function updateVariantStockAction(
  variantId: string,
  quantityOnHand: number,
  notes?: string
) {
  if (quantityOnHand < 0) {
    throw new Error("Inventory quantity cannot be negative");
  }

  const { db, user } = await getAuthorizedDbClient();

  // Get current quantity
  const { data: current } = await db
    .from("inventory_items")
    .select("quantity_on_hand")
    .eq("variant_id", variantId)
    .maybeSingle();

  const prevQty = current?.quantity_on_hand ?? 0;
  const delta = quantityOnHand - prevQty;

  const { error } = await db.from("inventory_items").upsert({
    variant_id: variantId,
    quantity_on_hand: quantityOnHand,
  });

  if (error) {
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  // Audit log
  try {
    await db.from("inventory_movements").insert({
      variant_id: variantId,
      delta,
      movement_type: "manual_adjustment",
      reference_type: "stock_update",
      notes: notes || `Stock updated to ${quantityOnHand} by ${user.email}`,
      created_by: user.id,
    });
  } catch (e) {}

  revalidatePath("/shop");
  revalidatePath("/admin/products");

  return { success: true, quantityOnHand };
}

/**
 * Uploads a clothing image to Supabase Storage `product-images` bucket
 * with strict MIME type and file size boundaries.
 */
export async function uploadProductImageAction(formData: FormData) {
  const { db } = await getAuthorizedDbClient();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("No image file provided");
  }

  // 1. Boundary check: MIME type
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file format: ${file.type}. Permitted formats: JPEG, PNG, WebP, AVIF.`
    );
  }

  // 2. Boundary check: File size (5MB)
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error(
      `File size exceeds limit (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 5MB.`
    );
  }

  // 3. Generate sanitized unique storage key
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `apparel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `catalog/${uniqueName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from("product-images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: publicData } = db.storage.from("product-images").getPublicUrl(filePath);

  return {
    success: true,
    url: publicData.publicUrl,
    filename: file.name,
  };
}
