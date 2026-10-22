"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { requestOrderCancellation, getOrderByNumber } from "@/services/orderService";
import { createReturnRequest } from "@/services/returnService";

/**
 * Server action: Customer requests cancellation for an eligible commission.
 */
export async function requestOrderCancellationAction(
  orderNumber: string,
  reason: string
) {
  const supabase = await createServerClient();
  if (!supabase) {
    return { success: false, error: "Database service unavailable." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Authentication required to request commission cancellation.",
    };
  }

  const result = await requestOrderCancellation(orderNumber, reason, {
    id: user.id,
    email: user.email,
  });

  if (result.success) {
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${encodeURIComponent(orderNumber)}`);
    revalidatePath("/admin/orders");
  }

  return result;
}

/**
 * Server action: Customer requests complimentary return for eligible delivered garments.
 */
export async function createReturnRequestAction(input: {
  orderNumber: string;
  reason: string;
  customerNotes?: string;
  items: {
    orderItemId: string;
    quantity: number;
    condition?: string;
  }[];
}) {
  const supabase = await createServerClient();
  if (!supabase) {
    return { success: false, error: "Database service unavailable." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Authentication required to initiate a garment return.",
    };
  }

  const result = await createReturnRequest({
    ...input,
    user: {
      id: user.id,
      email: user.email,
    },
  });

  if (result.success) {
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${encodeURIComponent(input.orderNumber)}`);
    revalidatePath("/admin/orders");
  }

  return result;
}
