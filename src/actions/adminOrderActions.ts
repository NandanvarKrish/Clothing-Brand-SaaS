"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  updateOrderFulfillment,
  reviewOrderCancellation,
  OrderRecord,
} from "@/services/orderService";
import { reviewReturnRequest, ReviewReturnInput } from "@/services/returnService";
import { FulfillmentStatus } from "@/types";

/**
 * Asserts that the current session is authenticated for administrative operations.
 */
async function assertAdminSession() {
  const supabase = await createServerClient();
  if (!supabase) {
    throw new Error("Server database connection unavailable.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: You must be logged in to access atelier management.");
  }

  return { user, supabase };
}

/**
 * Admin action: updates fulfillment milestone and carrier tracking coordinates.
 */
export async function updateOrderFulfillmentAction(
  orderNumber: string,
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    adminNotes?: string;
  }
) {
  const { user } = await assertAdminSession();

  const result = await updateOrderFulfillment(orderNumber, updates, user.id);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${encodeURIComponent(orderNumber)}`);
  }

  return result;
}

/**
 * Admin action: reviews patron cancellation request (approve or reject).
 */
export async function reviewOrderCancellationAction(
  orderNumber: string,
  decision: "approved" | "rejected",
  notes?: string
) {
  const { user } = await assertAdminSession();

  const result = await reviewOrderCancellation(orderNumber, decision, notes, user.id);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${encodeURIComponent(orderNumber)}`);
  }

  return result;
}

/**
 * Admin action: reviews patron return request (approve or reject with restocking and refund).
 */
export async function reviewReturnRequestAction(input: {
  returnNumber: string;
  decision: "approved" | "rejected";
  adminNotes?: string;
  restockApproved?: boolean;
  refundAmount?: number;
}) {
  const { user } = await assertAdminSession();

  const result = await reviewReturnRequest({
    ...input,
    adminUserId: user.id,
  });

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
  }

  return result;
}
