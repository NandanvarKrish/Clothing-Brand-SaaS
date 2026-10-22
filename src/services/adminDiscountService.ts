import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/services/auditLogService";

export interface CouponRecord {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minSubtotal: number;
  maxUses?: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

// In-memory fallback coupon store
const inMemoryCoupons: Map<string, CouponRecord> = new Map([
  [
    "FESTIVE10",
    {
      id: "coup_festive10",
      code: "FESTIVE10",
      discountType: "percentage",
      value: 10,
      minSubtotal: 0,
      maxUses: null,
      timesUsed: 14,
      isActive: true,
      expiresAt: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  [
    "WELCOME15",
    {
      id: "coup_welcome15",
      code: "WELCOME15",
      discountType: "percentage",
      value: 15,
      minSubtotal: 0,
      maxUses: 500,
      timesUsed: 62,
      isActive: true,
      expiresAt: null,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  [
    "ATELIER20",
    {
      id: "coup_atelier20",
      code: "ATELIER20",
      discountType: "percentage",
      value: 20,
      minSubtotal: 3000,
      maxUses: null,
      timesUsed: 8,
      isActive: true,
      expiresAt: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
]);

/**
 * Retrieves all promotional coupons from database or server store.
 */
export async function getAdminCoupons(): Promise<CouponRecord[]> {
  const supabase = createAdminClient() || getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          code: d.code,
          discountType: d.discount_type,
          value: Number(d.value),
          minSubtotal: Number(d.min_subtotal || 0),
          maxUses: d.max_uses,
          timesUsed: Number(d.times_used || 0),
          isActive: Boolean(d.is_active),
          expiresAt: d.expires_at,
          createdAt: d.created_at,
        }));
      }
    } catch {
      // In-memory fallback
    }
  }

  return Array.from(inMemoryCoupons.values());
}

/**
 * Creates a new promotional coupon code with server-side validation.
 */
export async function createAdminCoupon(
  input: CreateCouponInput,
  user: { id: string; email?: string }
): Promise<{ success: boolean; coupon?: CouponRecord; error?: string }> {
  const cleanCode = input.code.toUpperCase().replace(/[^A-Z0-9_-]/g, "").trim();
  if (!cleanCode || cleanCode.length < 3) {
    return { success: false, error: "Coupon code must contain at least 3 alphanumeric characters." };
  }

  if (input.value <= 0) {
    return { success: false, error: "Discount value must be greater than zero." };
  }

  if (input.discountType === "percentage" && input.value > 100) {
    return { success: false, error: "Percentage discount cannot exceed 100%." };
  }

  const supabase = createAdminClient() || getSupabase();
  const id = `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const record: CouponRecord = {
    id,
    code: cleanCode,
    discountType: input.discountType,
    value: input.value,
    minSubtotal: input.minSubtotal || 0,
    maxUses: input.maxUses || null,
    timesUsed: 0,
    isActive: input.isActive !== false,
    expiresAt: input.expiresAt || null,
    createdAt: nowIso,
  };

  if (supabase) {
    try {
      const { data: tenant } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
      const tenantId = tenant?.id || "00000000-0000-0000-0000-000000000001";

      const { data, error } = await supabase.from("coupons").insert({
        tenant_id: tenantId,
        code: cleanCode,
        discount_type: input.discountType,
        value: input.value,
        min_subtotal: input.minSubtotal || 0,
        max_uses: input.maxUses || null,
        times_used: 0,
        is_active: record.isActive,
        expires_at: input.expiresAt || null,
      }).select().single();

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: `Coupon code '${cleanCode}' already exists.` };
        }
        throw new Error(error.message);
      }

      if (data) {
        record.id = data.id;
      }
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        return { success: false, error: err.message };
      }
    }
  }

  // Update in-memory
  inMemoryCoupons.set(cleanCode, record);

  await logAdminAction({
    userId: user.id,
    userEmail: user.email,
    action: "coupon_created",
    entityType: "coupon",
    entityId: cleanCode,
    details: { code: cleanCode, value: input.value, type: input.discountType },
  });

  return { success: true, coupon: record };
}

/**
 * Toggles a coupon's active status.
 */
export async function toggleAdminCouponStatus(
  code: string,
  isActive: boolean,
  user: { id: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  const cleanCode = code.toUpperCase().trim();
  const existing = inMemoryCoupons.get(cleanCode);
  if (existing) {
    existing.isActive = isActive;
  }

  const supabase = createAdminClient() || getSupabase();
  if (supabase) {
    try {
      await supabase.from("coupons").update({ is_active: isActive }).eq("code", cleanCode);
    } catch {}
  }

  await logAdminAction({
    userId: user.id,
    userEmail: user.email,
    action: isActive ? "coupon_activated" : "coupon_deactivated",
    entityType: "coupon",
    entityId: cleanCode,
  });

  return { success: true };
}
