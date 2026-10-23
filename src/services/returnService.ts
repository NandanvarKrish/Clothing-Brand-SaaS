import { getSupabase } from "@/lib/supabase";
import { getOrderByNumber, updateOrderStatus, OrderRecord } from "@/services/orderService";
import { ReturnRecord, ReturnItemRecord, ReturnStatus } from "@/types";
import { isOrderEligibleForReturn, ORDER_POLICY } from "@/lib/orderPolicyConfig";
import { sendOrderNotification } from "@/services/notificationService";

// In-memory return repository for offline/test resilience
const globalReturns = new Map<string, ReturnRecord>();

export interface CreateReturnInput {
  orderNumber: string;
  reason: string;
  customerNotes?: string;
  items: {
    orderItemId: string;
    quantity: number;
    condition?: string;
  }[];
  user: {
    id: string;
    email?: string;
  };
}

export interface ReviewReturnInput {
  returnNumber: string;
  decision: "approved" | "rejected";
  adminNotes?: string;
  restockApproved?: boolean;
  refundAmount?: number;
  adminUserId?: string;
}

/**
 * Generates an authoritative return commission number.
 */
function generateReturnNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RET-${year}-${random}`;
}

/**
 * Creates an authoritative customer return request for eligible delivered garments.
 */
export async function createReturnRequest(
  input: CreateReturnInput
): Promise<{ success: boolean; returnRecord?: ReturnRecord; error?: string }> {
  const order = await getOrderByNumber(input.orderNumber);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // 1. Authorize ownership (must be patron's own order or patron email)
  const isOwner =
    order.customerId === input.user.id ||
    (order.customer?.email && order.customer.email.toLowerCase() === input.user.email?.toLowerCase()) ||
    (order.shippingAddress?.email && order.shippingAddress.email.toLowerCase() === input.user.email?.toLowerCase());

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You can only request returns for your own garments." };
  }

  // 2. Validate policy eligibility (must be delivered and within return window)
  const eligibility = isOrderEligibleForReturn(order);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason || "This order is not eligible for return." };
  }

  // 3. Validate items selection
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Please select at least one garment to return." };
  }

  // Check duplicate return on same order
  const existingReturns = await getReturnsForOrder(order.id);
  const activeReturn = existingReturns.find(
    (r) => r.status === "requested" || r.status === "approved" || r.status === "in_transit"
  );
  if (activeReturn) {
    return {
      success: false,
      error: `Return request #${activeReturn.returnNumber} is already active for this order.`,
    };
  }

  // Map and calculate refund amount from authoritative snapshots
  const returnItemsSnapshot: ReturnItemRecord[] = [];
  let calculatedRefund = 0;

  for (const requestedItem of input.items) {
    const orderItem = order.items.find(
      (it) => it.id === requestedItem.orderItemId || it.sku === requestedItem.orderItemId
    );

    if (!orderItem) {
      return { success: false, error: `Invalid item reference: ${requestedItem.orderItemId}` };
    }

    if (requestedItem.quantity <= 0 || requestedItem.quantity > orderItem.quantity) {
      return {
        success: false,
        error: `Invalid return quantity for ${orderItem.productName}. Maximum returnable: ${orderItem.quantity}`,
      };
    }

    const lineTotal = orderItem.unitPrice * requestedItem.quantity;
    calculatedRefund += lineTotal;

    returnItemsSnapshot.push({
      id: `reti_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderItemId: orderItem.id || requestedItem.orderItemId,
      productName: orderItem.productName,
      variantDescription: orderItem.variantDescription,
      quantity: requestedItem.quantity,
      unitPrice: orderItem.unitPrice,
      lineTotal,
      condition: requestedItem.condition || "unopened",
      imageUrl: orderItem.imageUrl,
    });
  }

  const returnNumber = generateReturnNumber();
  const nowIso = new Date().toISOString();

  const record: ReturnRecord = {
    id: `ret_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: input.user.id,
    returnNumber,
    status: "requested",
    reason: input.reason,
    customerNotes: input.customerNotes,
    refundAmount: calculatedRefund,
    resolutionStatus: "under_atelier_review",
    items: returnItemsSnapshot,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 4. Update Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: dbReturn, error: retErr } = await supabase
        .from("returns")
        .insert({
          id: record.id,
          order_id: order.id,
          customer_id: order.customerId,
          return_number: record.returnNumber,
          status: "requested",
          reason: record.reason,
          customer_notes: record.customerNotes,
          refund_amount: record.refundAmount,
          resolution_status: record.resolutionStatus,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (!retErr && dbReturn) {
        const itemRows = returnItemsSnapshot.map((it) => ({
          return_id: record.id,
          order_item_id: it.orderItemId.includes("-") ? it.orderItemId : null,
          quantity: it.quantity,
          condition: it.condition,
        }));
        await supabase.from("return_items").insert(itemRows);
      }
    } catch (e) {
      console.warn("Database return persistence notice:", e);
    }
  }

  // 5. Transition order fulfillment status
  await updateOrderStatus(order.orderNumber, {
    fulfillmentStatus: "return_requested",
  });

  // 6. Cache locally
  globalReturns.set(record.returnNumber, record);

  // 7. Dispatch notification
  await sendOrderNotification({
    orderNumber: order.orderNumber,
    recipientEmail: order.customer?.email || input.user.email || "patron@example.com",
    recipientName: order.shippingAddress.fullName,
    type: "return_requested",
    title: `Return Request Received — #${record.returnNumber}`,
    message: `Your return inquiry for order #${order.orderNumber} has been received. Our concierge team will review and organize pickup.`,
  });

  return { success: true, returnRecord: record };
}

/**
 * Retrieves all return requests for a specific order.
 */
export async function getReturnsForOrder(orderId: string): Promise<ReturnRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("returns")
        .select(`
          id, order_id, customer_id, return_number, status, reason,
          customer_notes, admin_notes, refund_amount, resolution_status,
          created_at, updated_at,
          return_items (
            id, order_item_id, quantity, condition
          )
        `)
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          orderId: r.order_id,
          orderNumber: "",
          customerId: r.customer_id,
          returnNumber: r.return_number,
          status: r.status as ReturnStatus,
          reason: r.reason,
          customerNotes: r.customer_notes,
          adminNotes: r.admin_notes,
          refundAmount: Number(r.refund_amount || 0),
          resolutionStatus: r.resolution_status || "pending",
          items: (r.return_items || []).map((it: any) => ({
            id: it.id,
            returnId: r.id,
            orderItemId: it.order_item_id,
            productName: "Garment Return",
            quantity: Number(it.quantity),
            unitPrice: 0,
            lineTotal: 0,
            condition: it.condition,
          })),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch {}
  }

  // Memory fallback
  return Array.from(globalReturns.values()).filter((r) => r.orderId === orderId);
}

/**
 * Retrieves all return requests across all orders for administrative review.
 */
export async function getAllReturns(): Promise<ReturnRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("returns")
        .select(`
          id, order_id, customer_id, return_number, status, reason,
          customer_notes, admin_notes, refund_amount, resolution_status,
          created_at, updated_at,
          return_items (
            id, order_item_id, quantity, condition
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          orderId: r.order_id,
          orderNumber: "",
          customerId: r.customer_id,
          returnNumber: r.return_number,
          status: r.status as ReturnStatus,
          reason: r.reason,
          customerNotes: r.customer_notes,
          adminNotes: r.admin_notes,
          refundAmount: Number(r.refund_amount || 0),
          resolutionStatus: r.resolution_status || "pending",
          items: (r.return_items || []).map((it: any) => ({
            id: it.id,
            returnId: r.id,
            orderItemId: it.order_item_id,
            productName: "Garment Return",
            quantity: Number(it.quantity),
            unitPrice: 0,
            lineTotal: 0,
            condition: it.condition,
          })),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch {}
  }

  // Memory fallback
  return Array.from(globalReturns.values());
}

/**
 * Reviews a return request (admin decision: approved or rejected).
 */
export async function reviewReturnRequest(
  input: ReviewReturnInput
): Promise<{ success: boolean; returnRecord?: ReturnRecord; error?: string }> {
  let record = globalReturns.get(input.returnNumber);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("returns")
        .select("*, return_items(*)")
        .eq("return_number", input.returnNumber)
        .maybeSingle();

      if (data) {
        record = {
          id: data.id,
          orderId: data.order_id,
          orderNumber: "",
          customerId: data.customer_id,
          returnNumber: data.return_number,
          status: data.status,
          reason: data.reason,
          customerNotes: data.customer_notes,
          adminNotes: data.admin_notes,
          refundAmount: Number(data.refund_amount || 0),
          resolutionStatus: data.resolution_status,
          items: (data.return_items || []).map((it: any) => ({
            id: it.id,
            orderItemId: it.order_item_id,
            productName: "Garment Return",
            quantity: Number(it.quantity),
            unitPrice: 0,
            lineTotal: 0,
          })),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
  }

  if (!record) {
    return { success: false, error: "Return record not found." };
  }

  const nowIso = new Date().toISOString();
  const nextStatus: ReturnStatus = input.decision === "approved" ? "approved" : "rejected";
  const resolutionStatus = input.decision === "approved" ? "approved_pending_payout" : "rejected";

  record.status = nextStatus;
  record.resolutionStatus = resolutionStatus;
  record.adminNotes = input.adminNotes;
  record.updatedAt = nowIso;
  globalReturns.set(record.returnNumber, record);

  // 1. Update Supabase return record
  if (supabase) {
    try {
      await supabase
        .from("returns")
        .update({
          status: nextStatus,
          resolution_status: resolutionStatus,
          admin_notes: input.adminNotes,
          reviewed_at: nowIso,
          reviewed_by: input.adminUserId || null,
          updated_at: nowIso,
        })
        .eq("return_number", input.returnNumber);
    } catch {}
  }

  // 2. Fetch associated order
  let orderNumberToUpdate = record.orderNumber;
  if (!orderNumberToUpdate && record.orderId) {
    // Look up order number
    const ord = await getOrderByNumber(record.orderId);
    if (ord) orderNumberToUpdate = ord.orderNumber;
  }

  if (orderNumberToUpdate) {
    if (input.decision === "approved") {
      // Transition order status to returned
      await updateOrderStatus(orderNumberToUpdate, {
        fulfillmentStatus: "returned",
        paymentStatus: record.refundAmount > 0 ? "refunded" : undefined,
      });

      // 3. Restock inventory if rule permits
      if (input.restockApproved !== false && ORDER_POLICY.AUTO_RESTOCK_ON_RETURN_APPROVED) {
        if (supabase) {
          try {
            for (const item of record.items) {
              // Lookup variant_id from order_items
              const { data: oi } = await supabase
                .from("order_items")
                .select("variant_id, quantity")
                .eq("id", item.orderItemId)
                .maybeSingle();

              if (oi && oi.variant_id) {
                const { data: inv } = await supabase
                  .from("inventory_items")
                  .select("quantity_on_hand")
                  .eq("variant_id", oi.variant_id)
                  .maybeSingle();

                if (inv) {
                  const newQty = (inv.quantity_on_hand || 0) + item.quantity;
                  await supabase
                    .from("inventory_items")
                    .update({ quantity_on_hand: newQty })
                    .eq("variant_id", oi.variant_id);

                  await supabase.from("inventory_movements").insert({
                    variant_id: oi.variant_id,
                    delta: item.quantity,
                    movement_type: "return_restock",
                    reference_type: "return",
                    reference_id: record.id,
                    notes: `Return #${record.returnNumber} restocked into atelier inventory.`,
                  });
                }
              }
            }
          } catch (e) {
            console.warn("Inventory restock notice:", e);
          }
        }
      }

      // 4. Generate Refund Audit Record
      if (supabase && record.refundAmount > 0) {
        try {
          await supabase.from("refunds").insert({
            order_id: record.orderId,
            return_id: record.id,
            amount: record.refundAmount,
            reason: input.adminNotes || "Approved Atelier Return",
            status: "pending_manual_payout",
            created_at: nowIso,
          });
        } catch {}
      }
    } else {
      // Revert fulfillment status back to delivered
      await updateOrderStatus(orderNumberToUpdate, {
        fulfillmentStatus: "delivered",
      });
    }

    // 5. Send notification to customer
    const ord = await getOrderByNumber(orderNumberToUpdate);
    if (ord) {
      await sendOrderNotification({
        orderNumber: ord.orderNumber,
        recipientEmail: ord.customer?.email || "patron@example.com",
        recipientName: ord.shippingAddress.fullName,
        type: "return_decision",
        title: `Return Request ${input.decision === "approved" ? "Approved" : "Reviewed"} — #${record.returnNumber}`,
        message:
          input.decision === "approved"
            ? `Your return request for order #${ord.orderNumber} has been approved. Our team has scheduled pickup.`
            : `Your return request for order #${ord.orderNumber} was not approved: ${input.adminNotes || "Did not meet return criteria"}.`,
      });
    }
  }

  return { success: true, returnRecord: record };
}
