"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser, getAdminSession } from "@/lib/adminAuth";
import {
  getAdminAnalytics,
  AnalyticsSummary,
} from "@/services/adminAnalyticsService";
import {
  getInventoryItems,
  adjustVariantStock,
  InventoryItemRow,
} from "@/services/adminInventoryService";
import {
  getAdminCustomers,
  CustomerSummaryRow,
} from "@/services/adminCustomerService";
import {
  getAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponStatus,
  CouponRecord,
  CreateCouponInput,
} from "@/services/adminDiscountService";
import {
  getStoreSettings,
  updateStoreSettings,
  StoreSettingsData,
} from "@/services/adminSettingsService";

/**
 * Server action to fetch executive dashboard analytics.
 */
export async function getDashboardAnalyticsAction(rangeDays: number = 30) {
  try {
    await assertAdminUser();
    const data = await getAdminAnalytics(rangeDays);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to fetch inventory items.
 */
export async function getInventoryItemsAction(options: {
  query?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
}) {
  try {
    await assertAdminUser();
    const items = await getInventoryItems(options);
    return { success: true, items };
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to perform an atomic inventory adjustment.
 */
export async function adjustInventoryStockAction(
  variantId: string,
  newQuantity: number,
  reason: "restock" | "manual_adjustment" | "damaged_writeoff" | "stock_intake",
  notes?: string
) {
  try {
    const { user } = await assertAdminUser();
    const result = await adjustVariantStock({
      variantId,
      newQuantity,
      reason,
      notes,
      user: { id: user.id, email: user.email },
    });

    if (result.success) {
      revalidatePath("/admin/inventory");
      revalidatePath("/admin");
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to fetch customers directory.
 */
export async function getCustomersAction(query?: string) {
  try {
    await assertAdminUser();
    const customers = await getAdminCustomers(query);
    return { success: true, customers };
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to fetch coupons.
 */
export async function getCouponsAction() {
  try {
    await assertAdminUser();
    const coupons = await getAdminCoupons();
    return { success: true, coupons };
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to create a new coupon code.
 */
export async function createCouponAction(input: CreateCouponInput) {
  try {
    const { user } = await assertAdminUser();
    const result = await createAdminCoupon(input, { id: user.id, email: user.email });

    if (result.success) {
      revalidatePath("/admin/discounts");
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to toggle coupon active status.
 */
export async function toggleCouponStatusAction(code: string, isActive: boolean) {
  try {
    const { user } = await assertAdminUser();
    const result = await toggleAdminCouponStatus(code, isActive, { id: user.id, email: user.email });

    if (result.success) {
      revalidatePath("/admin/discounts");
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to get store settings.
 */
export async function getStoreSettingsAction() {
  try {
    await assertAdminUser();
    const settings = await getStoreSettings();
    return { success: true, settings };
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to update store operational settings.
 */
export async function updateStoreSettingsAction(updates: Partial<StoreSettingsData>) {
  try {
    const { user } = await assertAdminUser();
    const result = await updateStoreSettings(updates, { id: user.id, email: user.email });

    if (result.success) {
      revalidatePath("/admin/settings");
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to verify administrator session authorization.
 * Used by AdminLayout to eliminate client-side email inspection.
 */
export async function verifyAdminAccessAction(): Promise<{
  authorized: boolean;
  user: { id: string; email?: string; role?: string } | null;
  error?: string;
}> {
  try {
    const auth = await getAdminSession();
    if (!auth.authorized || !auth.user) {
      return { authorized: false, user: null, error: auth.error || "Unauthorized" };
    }
    return {
      authorized: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.role || "admin",
      },
    };
  } catch (err: any) {
    return { authorized: false, user: null, error: err.message || "Failed to authenticate session" };
  }
}
