"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser } from "@/lib/adminAuth";
import {
  createShipment,
  confirmShipmentDelivery,
  validateShippingAddress,
  getShipmentForOrder,
} from "@/services/shipping/shippingService";
import { CarrierName } from "@/services/shipping/types";

/**
 * Server action to manifest an order shipment with a priority air courier.
 */
export async function manifestShipmentAction(params: {
  orderNumber: string;
  carrier: CarrierName;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;
}) {
  try {
    const { user } = await assertAdminUser();
    const result = await createShipment({
      ...params,
      user: { id: user.id, email: user.email },
    });

    if (result.success) {
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
      revalidatePath(`/account/orders/${params.orderNumber}`);
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to authoritatively confirm physical delivery handover.
 */
export async function confirmDeliveryAction(orderNumber: string, notes?: string) {
  try {
    const { user } = await assertAdminUser();
    const result = await confirmShipmentDelivery({
      orderNumber,
      notes,
      user: { id: user.id, email: user.email },
    });

    if (result.success) {
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
      revalidatePath(`/account/orders/${orderNumber}`);
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }
}

/**
 * Server action to validate delivery address pincode serviceability.
 */
export async function validatePincodeAction(pincode: string) {
  try {
    return await validateShippingAddress(pincode);
  } catch (err: any) {
    return { valid: false, isServiceable: false, error: err.message };
  }
}

/**
 * Server action to get shipment manifest and tracking history for an order.
 */
export async function getShipmentAction(orderNumber: string) {
  try {
    const manifest = await getShipmentForOrder(orderNumber);
    return { success: true, manifest };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
