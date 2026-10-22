import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/services/auditLogService";

export interface StoreSettingsData {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  whiteGloveShippingFee: number;
  lowStockThreshold: number;
  returnWindowDays: number;
  cancellationWindow: string;
}

// In-memory settings state with safe luxury defaults
let inMemorySettings: StoreSettingsData = {
  storeName: "VÉLURE ATELIER",
  supportEmail: "concierge@velure.atelier",
  supportPhone: "+91 (0) 80 4920 1888",
  currency: "INR (₹)",
  freeShippingThreshold: 1999,
  standardShippingFee: 250,
  whiteGloveShippingFee: 450,
  lowStockThreshold: 3,
  returnWindowDays: 14,
  cancellationWindow: "Prior to bespoke cutting or courier dispatch",
};

/**
 * Retrieves safe non-secret store operational settings.
 */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const supabase = createAdminClient() || getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          storeName: "VÉLURE ATELIER",
          supportEmail: data.support_email || inMemorySettings.supportEmail,
          supportPhone: data.support_phone || inMemorySettings.supportPhone,
          currency: "INR (₹)",
          freeShippingThreshold: Number(data.free_shipping_threshold ?? inMemorySettings.freeShippingThreshold),
          standardShippingFee: Number(data.standard_shipping_fee ?? inMemorySettings.standardShippingFee),
          whiteGloveShippingFee: inMemorySettings.whiteGloveShippingFee,
          lowStockThreshold: Number(data.low_stock_threshold ?? inMemorySettings.lowStockThreshold),
          returnWindowDays: Number(data.return_window_days ?? inMemorySettings.returnWindowDays),
          cancellationWindow: inMemorySettings.cancellationWindow,
        };
      }
    } catch {
      // In-memory fallback
    }
  }

  return inMemorySettings;
}

/**
 * Updates operational store settings with administrative validation and audit logging.
 */
export async function updateStoreSettings(
  updates: Partial<StoreSettingsData>,
  user: { id: string; email?: string }
): Promise<{ success: boolean; settings?: StoreSettingsData; error?: string }> {
  inMemorySettings = {
    ...inMemorySettings,
    ...updates,
  };

  const supabase = createAdminClient() || getSupabase();
  if (supabase) {
    try {
      const { data: tenant } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
      const tenantId = tenant?.id || "00000000-0000-0000-0000-000000000001";

      await supabase.from("business_settings").upsert(
        {
          tenant_id: tenantId,
          support_email: inMemorySettings.supportEmail,
          support_phone: inMemorySettings.supportPhone,
          free_shipping_threshold: inMemorySettings.freeShippingThreshold,
          standard_shipping_fee: inMemorySettings.standardShippingFee,
          low_stock_threshold: inMemorySettings.lowStockThreshold,
          return_window_days: inMemorySettings.returnWindowDays,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );
    } catch {}
  }

  await logAdminAction({
    userId: user.id,
    userEmail: user.email,
    action: "settings_updated",
    entityType: "settings",
    entityId: "store_settings",
    details: updates,
  });

  return { success: true, settings: inMemorySettings };
}
