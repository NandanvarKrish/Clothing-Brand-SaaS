"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser } from "@/lib/adminAuth";
import {
  updateOrderFulfillment,
  reviewOrderCancellation,
  OrderRecord,
} from "@/services/orderService";
import { reviewReturnRequest, ReviewReturnInput, getAllReturns } from "@/services/returnService";
import { FulfillmentStatus } from "@/types";

/**
 * Asserts that the current session is authenticated for administrative operations.
 */
async function assertAdminSession() {
  const { user, role } = await assertAdminUser();
  return { user, role };
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
    revalidatePath("/admin/returns");
    revalidatePath("/account/orders");
  }

  return result;
}

/**
 * Admin action: fetches all return requests for administrative review.
 */
export async function getAllReturnsAction() {
  await assertAdminSession();
  const returns = await getAllReturns();
  return { success: true, returns };
}
