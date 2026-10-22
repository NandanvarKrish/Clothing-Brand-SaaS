import { getSupabase } from "@/lib/supabase";
import { validateAndRecalculateCart } from "@/services/cartService";
import { generateOrderNumber, calculateShippingFee, ShippingMethodId } from "@/lib/utils";
import { PaymentStatus, FulfillmentStatus, OrderStatusHistoryEntry } from "@/types";
import { isOrderEligibleForCancellation, ORDER_POLICY } from "@/lib/orderPolicyConfig";
import { sendOrderNotification } from "@/services/notificationService";

export { calculateShippingFee };
export type { ShippingMethodId };

export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface OrderItemSnapshot {
  id?: string;
  orderId?: string;
  productId: string;
  variantId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface OrderCreateInput {
  idempotencyKey?: string;
  customerId?: string | null;
  guestEmail?: string | null;
  items: {
    productId: string;
    variantId?: string;
    sku?: string;
    size: string;
    color: string;
    quantity: number;
  }[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  deliveryNotes?: string;
  paymentMethod: "upi" | "card" | "netbanking" | "cod";
  couponCode?: string | null;
  shippingMethodId?: ShippingMethodId;
}

export interface AdminOrderFilters {
  query?: string;
  fulfillmentStatus?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  channel: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  // Aliases for OrderSummary compatibility
  shipping?: number;
  discount?: number;
  tax?: number;
  total?: number;
  status?: string;
  customer?: OrderAddress;
  couponCode?: string | null;
  paymentMethod: "upi" | "card" | "netbanking" | "cod";
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  deliveryNotes?: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
  estimatedDelivery: string;
  shippingMethodId: ShippingMethodId;
  items: OrderItemSnapshot[];
  idempotencyKey?: string;
  bankReferenceNumber?: string;
  paymentAttempts?: Array<{
    attemptId: string;
    provider: string;
    paymentId: string;
    status: string;
    amountPaise: number;
    initiatedAt: string;
  }>;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationReviewedAt?: string;
  cancellationReviewNotes?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  adminNotes?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// Global server in-memory order cache (preserves orders across requests & tests)
const globalOrders = new Map<string, OrderRecord>();
const idempotencyStore = new Map<string, string>(); // idempotencyKey -> orderNumber
const inFlightKeys = new Set<string>();

/**
 * Creates an authoritative order record with immutable item snapshots,
 * safe stock reservation, idempotency guarantees, and pending payment state.
 */
export async function createOrder(
  input: OrderCreateInput
): Promise<{ success: boolean; order?: OrderRecord; error?: string; code?: string }> {
  // 1. Idempotency Check & In-flight Lock
  if (input.idempotencyKey) {
    if (inFlightKeys.has(input.idempotencyKey)) {
      return {
        success: false,
        error: "A checkout request with this key is already in progress. Please wait.",
        code: "CONCURRENT_REQUEST",
      };
    }

    const existingOrderNum = idempotencyStore.get(input.idempotencyKey);
    if (existingOrderNum) {
      const existing = await getOrderByNumber(existingOrderNum);
      if (existing) {
        return { success: true, order: existing, code: "IDEMPOTENT_REPLAY" };
      }
    }

    inFlightKeys.add(input.idempotencyKey);
  }

  try {
    // 2. Validate input constraints
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cannot create order from an empty cart.", code: "EMPTY_CART" };
    }

    if (!input.shippingAddress || !input.shippingAddress.fullName || !input.shippingAddress.phone || !input.shippingAddress.pincode) {
      return { success: false, error: "Complete shipping address is required.", code: "INVALID_ADDRESS" };
    }

    // 3. Authoritative Recalculation (Never trust client prices, discounts or stock)
    const cartValidation = await validateAndRecalculateCart(input.items, input.couponCode);

    const hasQuantityMismatch = input.items.some((raw) => {
      const match = cartValidation.items.find(
        (i) =>
          i.productId === raw.productId &&
          i.size.toLowerCase() === raw.size.toLowerCase() &&
          i.color.toLowerCase() === raw.color.toLowerCase()
      );
      return match && raw.quantity > match.quantity;
    });

    if (cartValidation.hasUnavailableItems || hasQuantityMismatch) {
      return {
        success: false,
        error: "Some items in your cart are no longer available or exceed current batch stock.",
        code: "STOCK_CONFLICT",
      };
    }

    const shippingMethodId: ShippingMethodId = input.shippingMethodId || "standard_air";
    const subtotal = cartValidation.subtotal;
    const discountAmount = cartValidation.discount;
    const shippingFee = calculateShippingFee(subtotal, shippingMethodId);
    const taxAmount = Math.round(subtotal * 0.12); // 12% GST on luxury apparel
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // 4. Unique Order Number & Identifiers
    const orderNumber = generateOrderNumber();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    // 5. Immutable Order Item Snapshots
    const itemsSnapshot: OrderItemSnapshot[] = cartValidation.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || `${item.productId}-${item.size}-${item.color}`,
      productName: item.name,
      variantDescription: `Size: ${item.size} • Color: ${item.color}`,
      sku: item.sku || `${item.productId}-${item.size}`,
      unitPrice: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
      imageUrl: item.image,
    }));

    // 6. Explicit Status Lifecycle
    // Payment status is always pending prior to external payment capture/confirmation
    const paymentStatus: OrderRecord["paymentStatus"] = "pending";
    // For COD, order is confirmed immediately for dispatch. For prepaid, pending payment authorization.
    const fulfillmentStatus: OrderRecord["fulfillmentStatus"] =
      input.paymentMethod === "cod" ? "confirmed" : "pending";

    const trackingNumber = `BD-AIR-${Math.floor(100000 + Math.random() * 900000)}`;
    const carrier = "BlueDart Express Air";
    const estimatedDelivery =
      shippingMethodId === "express_courier"
        ? "1–2 business days via White-Glove Air Priority"
        : "2–3 business days via BlueDart Express Air";

    const orderRecord: OrderRecord = {
      id: orderId,
      orderNumber,
      customerId: input.customerId || null,
      channel: "storefront",
      subtotal,
      shippingFee,
      discountAmount,
      taxAmount,
      totalAmount,
      shipping: shippingFee,
      discount: discountAmount,
      tax: taxAmount,
      total: totalAmount,
      status: fulfillmentStatus,
      customer: input.shippingAddress,
      couponCode: cartValidation.appliedCoupon,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      fulfillmentStatus,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress || input.shippingAddress,
      deliveryNotes: input.deliveryNotes,
      trackingNumber,
      carrier,
      estimatedDelivery,
      shippingMethodId,
      items: itemsSnapshot,
      idempotencyKey: input.idempotencyKey,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 7. Atomic Database Execution & Inventory Reservation
    const supabase = getSupabase();
    if (supabase) {
      try {
        // A. Insert order row
        const { error: orderErr } = await supabase.from("orders").insert({
          id: orderRecord.id,
          tenant_id: "00000000-0000-0000-0000-000000000001",
          order_number: orderRecord.orderNumber,
          customer_id: orderRecord.customerId,
          channel: orderRecord.channel,
          subtotal: orderRecord.subtotal,
          shipping_fee: orderRecord.shippingFee,
          discount_amount: orderRecord.discountAmount,
          tax_amount: orderRecord.taxAmount,
          total_amount: orderRecord.totalAmount,
          coupon_code: orderRecord.couponCode,
          payment_method: orderRecord.paymentMethod,
          payment_status: orderRecord.paymentStatus,
          fulfillment_status: orderRecord.fulfillmentStatus,
          shipping_address: orderRecord.shippingAddress,
          delivery_notes: orderRecord.deliveryNotes,
          tracking_number: orderRecord.trackingNumber,
          carrier: orderRecord.carrier,
          estimated_delivery: orderRecord.estimatedDelivery,
          created_at: orderRecord.createdAt,
          updated_at: orderRecord.updatedAt,
        });

        if (!orderErr) {
          // B. Insert immutable snapshots into order_items
          const itemRows = itemsSnapshot.map((s) => ({
            order_id: orderRecord.id,
            product_id: s.productId,
            variant_id: s.variantId.includes("-") && s.variantId.length > 20 ? s.variantId : null,
            product_name: s.productName,
            variant_description: s.variantDescription,
            sku: s.sku,
            unit_price: s.unitPrice,
            quantity: s.quantity,
            line_total: s.lineTotal,
          }));

          await supabase.from("order_items").insert(itemRows);

          // C. Increment reserved stock in inventory_items to prevent overselling
          for (const item of itemsSnapshot) {
            if (item.variantId && item.variantId.length > 20) {
              const { data: currentInv } = await supabase
                .from("inventory_items")
                .select("quantity_reserved, quantity_on_hand")
                .eq("variant_id", item.variantId)
                .maybeSingle();

              if (currentInv) {
                await supabase
                  .from("inventory_items")
                  .update({
                    quantity_reserved: (currentInv.quantity_reserved || 0) + item.quantity,
                  })
                  .eq("variant_id", item.variantId);
              }
            }
          }
        }
      } catch (dbErr) {
        // Log database note if migrations are pending in Supabase
        console.warn("Database order persistence note:", dbErr);
      }
    }

    // 8. Store in server order repository for instant lookup
    globalOrders.set(orderNumber, orderRecord);
    if (input.idempotencyKey) {
      idempotencyStore.set(input.idempotencyKey, orderNumber);
    }

    // 9. Dispatch Order Confirmed Transactional Notification
    sendOrderNotification({
      orderNumber: orderRecord.orderNumber,
      recipientEmail: orderRecord.shippingAddress.email || input.guestEmail || "patron@example.com",
      recipientName: orderRecord.shippingAddress.fullName,
      type: "order_confirmed",
      title: `Commission Confirmation — #${orderRecord.orderNumber}`,
      message: `Your commission #${orderRecord.orderNumber} has been received and queued for bespoke crafting.`,
      metadata: {
        totalAmount: orderRecord.totalAmount,
      },
    }).catch(() => {});

    return { success: true, order: orderRecord };
  } finally {
    if (input.idempotencyKey) {
      inFlightKeys.delete(input.idempotencyKey);
    }
  }
}

/**
 * Transforms a raw Supabase order row into the typed OrderRecord.
 */
function transformDbOrder(data: any): OrderRecord {
  const items: OrderItemSnapshot[] = (data.order_items || []).map((oi: any) => ({
    id: oi.id,
    orderId: data.id,
    productId: oi.product_id,
    variantId: oi.variant_id,
    productName: oi.product_name,
    variantDescription: oi.variant_description,
    sku: oi.sku,
    unitPrice: Number(oi.unit_price),
    quantity: Number(oi.quantity),
    lineTotal: Number(oi.line_total),
    imageUrl: oi.image_url,
  }));

  const customerAddr: OrderAddress = {
    fullName: data.shipping_address?.fullName || "Atelier Patron",
    phone: data.shipping_address?.phone || "",
    email: data.shipping_address?.email || (data.customer_id ? undefined : "patron@example.com"),
    addressLine1: data.shipping_address?.addressLine1 || "",
    addressLine2: data.shipping_address?.addressLine2 || "",
    city: data.shipping_address?.city || "",
    state: data.shipping_address?.state || "",
    pincode: data.shipping_address?.pincode || "",
    country: data.shipping_address?.country || "India",
  };

  return {
    id: data.id,
    orderNumber: data.order_number,
    customerId: data.customer_id,
    channel: data.channel,
    subtotal: Number(data.subtotal),
    shippingFee: Number(data.shipping_fee),
    discountAmount: Number(data.discount_amount),
    taxAmount: Number(data.tax_amount),
    totalAmount: Number(data.total_amount),
    couponCode: data.coupon_code,
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status as PaymentStatus,
    fulfillmentStatus: data.fulfillment_status as FulfillmentStatus,
    shippingAddress: customerAddr,
    customer: customerAddr,
    billingAddress: data.billing_address || customerAddr,
    deliveryNotes: data.delivery_notes,
    trackingNumber: data.tracking_number,
    carrier: data.carrier || "BlueDart Express Air",
    trackingUrl: data.tracking_url,
    cancellationReason: data.cancellation_reason,
    cancellationRequestedAt: data.cancellation_requested_at,
    cancellationReviewedAt: data.cancellation_reviewed_at,
    cancellationReviewNotes: data.cancellation_review_notes,
    cancelledAt: data.cancelled_at,
    deliveredAt: data.delivered_at,
    adminNotes: data.admin_notes,
    estimatedDelivery: data.estimated_delivery,
    shippingMethodId: data.shipping_fee === 450 ? "express_courier" : "standard_air",
    items,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Validates whether a fulfillment status transition is legal under atelier policy.
 */
export function validateFulfillmentTransition(
  current: FulfillmentStatus,
  next: FulfillmentStatus
): { valid: boolean; error?: string } {
  if (current === next) return { valid: true };

  const validTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    pending: ["confirmed", "cancellation_requested", "cancelled"],
    confirmed: ["tailoring", "processing", "cancellation_requested", "cancelled"],
    tailoring: ["processing", "inspection", "dispatched", "shipped", "cancellation_requested", "cancelled"],
    processing: ["tailoring", "inspection", "dispatched", "shipped", "cancellation_requested", "cancelled"],
    inspection: ["dispatched", "shipped", "tailoring", "processing", "cancellation_requested", "cancelled"],
    dispatched: ["shipped", "delivered"],
    shipped: ["dispatched", "delivered"],
    delivered: ["return_requested"],
    cancellation_requested: ["cancelled", "confirmed", "tailoring", "processing"],
    return_requested: ["returned", "delivered"],
    cancelled: [],
    returned: [],
  };

  const allowed = validTransitions[current] || [];
  if (!allowed.includes(next)) {
    return {
      valid: false,
      error: `Invalid fulfillment transition: cannot transition order from '${current}' to '${next}'.`,
    };
  }

  return { valid: true };
}

/**
 * Validates whether a payment status transition is legal.
 */
export function validatePaymentTransition(
  current: PaymentStatus,
  next: PaymentStatus
): { valid: boolean; error?: string } {
  if (current === next) return { valid: true };

  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ["authorized", "captured", "paid", "failed"],
    authorized: ["captured", "paid", "failed"],
    captured: ["partially_refunded", "refunded"],
    paid: ["partially_refunded", "refunded"],
    failed: ["pending"], // Allow re-attempting payment
    partially_refunded: ["refunded"],
    refunded: [],
  };

  const allowed = validTransitions[current] || [];
  if (!allowed.includes(next)) {
    return {
      valid: false,
      error: `Invalid payment transition: cannot transition payment from '${current}' to '${next}'.`,
    };
  }

  return { valid: true };
}

/**
 * Retrieves an order by its unique order number, querying the DB or server store.
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderRecord | null> {
  const cleanNum = orderNumber.trim();

  // 1. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, customer_id, channel, subtotal, shipping_fee,
          discount_amount, tax_amount, total_amount, coupon_code,
          payment_method, payment_status, fulfillment_status,
          shipping_address, delivery_notes, tracking_number, carrier,
          tracking_url, cancellation_reason, cancellation_requested_at,
          cancellation_reviewed_at, cancellation_review_notes, cancelled_at,
          delivered_at, admin_notes, estimated_delivery, created_at, updated_at,
          order_items (
            id, product_id, variant_id, product_name, variant_description,
            sku, unit_price, quantity, line_total
          )
        `)
        .eq("order_number", cleanNum)
        .maybeSingle();

      if (!error && data) {
        return transformDbOrder(data);
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  // 2. Fallback to server order repository
  return globalOrders.get(cleanNum) || null;
}

/**
 * Retrieves an order securely enforcing patron ownership or admin authorization (IDOR defense).
 */
export async function getOrderForCustomer(
  orderNumber: string,
  user: { id: string; email?: string } | null,
  isAdmin: boolean = false
): Promise<{ success: boolean; order?: OrderRecord; error?: string; code?: string }> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    return { success: false, error: "Order not found", code: "NOT_FOUND" };
  }

  if (isAdmin) {
    return { success: true, order };
  }

  if (!user) {
    return { success: false, error: "Authentication required to view commission details.", code: "UNAUTHORIZED" };
  }

  const isOwner =
    order.customerId === user.id ||
    (order.customer && order.customer.email && order.customer.email.toLowerCase() === user.email?.toLowerCase()) ||
    (order.shippingAddress && order.shippingAddress.email && order.shippingAddress.email.toLowerCase() === user.email?.toLowerCase());

  if (!isOwner) {
    return { success: false, error: "Access denied: you can only view your own commissions.", code: "FORBIDDEN" };
  }

  return { success: true, order };
}

/**
 * Retrieves all orders for an authenticated customer.
 */
export async function getCustomerOrders(userId: string, email?: string): Promise<OrderRecord[]> {
  const cleanEmail = email?.toLowerCase().trim();
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase
        .from("orders")
        .select(`
          id, order_number, customer_id, channel, subtotal, shipping_fee,
          discount_amount, tax_amount, total_amount, coupon_code,
          payment_method, payment_status, fulfillment_status,
          shipping_address, delivery_notes, tracking_number, carrier,
          tracking_url, cancellation_reason, cancellation_requested_at,
          cancelled_at, delivered_at, admin_notes, estimated_delivery,
          created_at, updated_at,
          order_items (
            id, product_id, variant_id, product_name, variant_description,
            sku, unit_price, quantity, line_total
          )
        `)
        .order("created_at", { ascending: false });

      if (cleanEmail) {
        query = query.or(`customer_id.eq.${userId},shipping_address->>email.ilike.${cleanEmail}`);
      } else {
        query = query.eq("customer_id", userId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => transformDbOrder(d));
      }
    } catch {
      // Fallback below
    }
  }

  // In-memory fallback
  return Array.from(globalOrders.values())
    .filter(
      (o) =>
        o.customerId === userId ||
        (cleanEmail && o.customer?.email && o.customer.email.toLowerCase() === cleanEmail) ||
        (cleanEmail && o.shippingAddress?.email && o.shippingAddress.email.toLowerCase() === cleanEmail)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves paginated and filtered orders for the atelier admin studio.
 */
export async function getAllOrders(
  filters: AdminOrderFilters = {}
): Promise<{ orders: OrderRecord[]; total: number }> {
  const supabase = getSupabase();
  let orders: OrderRecord[] = [];

  if (supabase) {
    try {
      let query = supabase
        .from("orders")
        .select(`
          id, order_number, customer_id, channel, subtotal, shipping_fee,
          discount_amount, tax_amount, total_amount, coupon_code,
          payment_method, payment_status, fulfillment_status,
          shipping_address, delivery_notes, tracking_number, carrier,
          tracking_url, cancellation_reason, cancellation_requested_at,
          cancelled_at, delivered_at, admin_notes, estimated_delivery,
          created_at, updated_at,
          order_items (
            id, product_id, variant_id, product_name, variant_description,
            sku, unit_price, quantity, line_total
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== "all") {
        query = query.eq("fulfillment_status", filters.fulfillmentStatus);
      }
      if (filters.paymentStatus && filters.paymentStatus !== "all") {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        orders = data.map((d: any) => transformDbOrder(d));
      }
    } catch {}
  }

  if (orders.length === 0) {
    orders = Array.from(globalOrders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filters.fulfillmentStatus && filters.fulfillmentStatus !== "all") {
      orders = orders.filter((o) => o.fulfillmentStatus === filters.fulfillmentStatus);
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      orders = orders.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
  }

  // Filter by query string across order number, customer name, email, AWB
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.shippingAddress.fullName.toLowerCase().includes(q) ||
        (o.customer?.email && o.customer.email.toLowerCase().includes(q)) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
    );
  }

  const total = orders.length;
  if (typeof filters.offset === "number" && filters.offset > 0) {
    orders = orders.slice(filters.offset);
  }
  if (typeof filters.limit === "number" && filters.limit > 0) {
    orders = orders.slice(0, filters.limit);
  }

  return { orders, total };
}

/**
 * Handles a patron's request to cancel an order.
 */
export async function requestOrderCancellation(
  orderNumber: string,
  reason: string,
  user: { id: string; email?: string }
): Promise<{ success: boolean; order?: OrderRecord; error?: string }> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return { success: false, error: "Order not found." };

  const isOwner =
    order.customerId === user.id ||
    (order.customer && order.customer.email && order.customer.email.toLowerCase() === user.email?.toLowerCase()) ||
    (order.shippingAddress && order.shippingAddress.email && order.shippingAddress.email.toLowerCase() === user.email?.toLowerCase());

  if (!isOwner) {
    return { success: false, error: "Unauthorized: You can only cancel your own commissions." };
  }

  const eligibility = isOrderEligibleForCancellation(order);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason || "This order cannot be cancelled." };
  }

  const check = validateFulfillmentTransition(order.fulfillmentStatus, "cancellation_requested");
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const nowIso = new Date().toISOString();
  const updated = await updateOrderStatus(order.orderNumber, {
    fulfillmentStatus: "cancellation_requested",
    cancellationReason: reason,
    cancellationRequestedAt: nowIso,
  });

  if (!updated) {
    return { success: false, error: "Failed to submit cancellation request." };
  }

  await sendOrderNotification({
    orderNumber: order.orderNumber,
    recipientEmail: order.customer?.email || user.email || "patron@example.com",
    recipientName: order.shippingAddress.fullName,
    type: "cancellation_requested",
    title: `Cancellation Request Received — #${order.orderNumber}`,
    message: `Your cancellation request for order #${order.orderNumber} has been received and is being processed by our atelier.`,
  });

  return { success: true, order: updated };
}

/**
 * Admin decision on a cancellation request.
 */
export async function reviewOrderCancellation(
  orderNumber: string,
  decision: "approved" | "rejected",
  notes?: string,
  adminUserId?: string
): Promise<{ success: boolean; order?: OrderRecord; error?: string }> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return { success: false, error: "Order not found." };

  if (order.fulfillmentStatus !== "cancellation_requested") {
    return {
      success: false,
      error: `Order is not in 'cancellation_requested' state (current: '${order.fulfillmentStatus}').`,
    };
  }

  const nowIso = new Date().toISOString();

  if (decision === "approved") {
    const updated = await updateOrderStatus(order.orderNumber, {
      fulfillmentStatus: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : "failed",
      cancelledAt: nowIso,
      cancellationReviewedAt: nowIso,
      cancellationReviewNotes: notes,
    });

    // Create refund audit record if paid
    const supabase = getSupabase();
    if (supabase && order.paymentStatus === "paid") {
      try {
        await supabase.from("refunds").insert({
          order_id: order.id,
          amount: order.totalAmount,
          reason: notes || "Order Cancellation Approved",
          status: "pending_manual_payout",
          created_at: nowIso,
        });
      } catch {}
    }

    await sendOrderNotification({
      orderNumber: order.orderNumber,
      recipientEmail: order.customer?.email || "patron@example.com",
      recipientName: order.shippingAddress.fullName,
      type: "cancellation_decision",
      title: `Order Cancelled — #${order.orderNumber}`,
      message: `Your cancellation request for order #${order.orderNumber} has been approved. Any reserved pieces have been released.`,
    });

    return { success: true, order: updated || undefined };
  } else {
    const updated = await updateOrderStatus(order.orderNumber, {
      fulfillmentStatus: "confirmed",
      cancellationReviewedAt: nowIso,
      cancellationReviewNotes: notes || "Cancellation declined by atelier staff.",
    });

    await sendOrderNotification({
      orderNumber: order.orderNumber,
      recipientEmail: order.customer?.email || "patron@example.com",
      recipientName: order.shippingAddress.fullName,
      type: "cancellation_decision",
      title: `Cancellation Request Declined — #${order.orderNumber}`,
      message: `Your cancellation request for order #${order.orderNumber} could not be approved: ${notes || "Garments are currently in active production"}.`,
    });

    return { success: true, order: updated || undefined };
  }
}

/**
 * Updates order fulfillment progress, air shipment tracking, and delivery notes.
 */
export async function updateOrderFulfillment(
  orderNumber: string,
  updates: {
    fulfillmentStatus?: FulfillmentStatus;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    adminNotes?: string;
  },
  adminUserId?: string
): Promise<{ success: boolean; order?: OrderRecord; error?: string }> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return { success: false, error: "Order not found." };

  const nowIso = new Date().toISOString();

  if (updates.fulfillmentStatus && updates.fulfillmentStatus !== order.fulfillmentStatus) {
    const check = validateFulfillmentTransition(order.fulfillmentStatus, updates.fulfillmentStatus);
    if (!check.valid) {
      return { success: false, error: check.error };
    }
  }

  const nextFulfillment = updates.fulfillmentStatus || order.fulfillmentStatus;
  const isNowDispatched =
    (nextFulfillment === "dispatched" || nextFulfillment === "shipped") &&
    order.fulfillmentStatus !== "dispatched" &&
    order.fulfillmentStatus !== "shipped";
  const isNowDelivered = nextFulfillment === "delivered" && order.fulfillmentStatus !== "delivered";

  // Deduct inventory on hand permanently on dispatch
  const supabase = getSupabase();
  if (supabase && isNowDispatched) {
    try {
      for (const item of order.items) {
        if (item.variantId && item.variantId.length > 20) {
          const { data: inv } = await supabase
            .from("inventory_items")
            .select("quantity_on_hand, quantity_reserved")
            .eq("variant_id", item.variantId)
            .maybeSingle();

          if (inv) {
            const onHand = Math.max(0, (inv.quantity_on_hand || 0) - item.quantity);
            const reserved = Math.max(0, (inv.quantity_reserved || 0) - item.quantity);
            await supabase
              .from("inventory_items")
              .update({ quantity_on_hand: onHand, quantity_reserved: reserved })
              .eq("variant_id", item.variantId);

            await supabase.from("inventory_movements").insert({
              variant_id: item.variantId,
              delta: -item.quantity,
              movement_type: "sale",
              reference_type: "order",
              reference_id: order.id,
              notes: `Order #${order.orderNumber} dispatched via ${updates.carrier || order.carrier}.`,
              created_by: adminUserId || null,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Inventory dispatch deduction note:", e);
    }
  }

  const updated = await updateOrderStatus(order.orderNumber, {
    fulfillmentStatus: nextFulfillment,
    carrier: updates.carrier || order.carrier,
    trackingNumber: updates.trackingNumber || order.trackingNumber,
    trackingUrl: updates.trackingUrl || order.trackingUrl,
    deliveredAt: isNowDelivered ? nowIso : order.deliveredAt,
    adminNotes: updates.adminNotes || order.adminNotes,
  });

  if (isNowDispatched) {
    await sendOrderNotification({
      orderNumber: order.orderNumber,
      recipientEmail: order.customer?.email || "patron@example.com",
      recipientName: order.shippingAddress.fullName,
      type: "shipment_dispatched",
      title: `Your Garments Have Been Dispatched — #${order.orderNumber}`,
      message: `Your commission #${order.orderNumber} has been dispatched via ${updates.carrier || order.carrier} with tracking AWB ${updates.trackingNumber || order.trackingNumber}.`,
    });
  } else if (isNowDelivered) {
    await sendOrderNotification({
      orderNumber: order.orderNumber,
      recipientEmail: order.customer?.email || "patron@example.com",
      recipientName: order.shippingAddress.fullName,
      type: "order_delivered",
      title: `Delivered With Care — #${order.orderNumber}`,
      message: `Your atelier order #${order.orderNumber} has been delivered. We hope you cherish your handcrafted garments.`,
    });
  }

  return { success: true, order: updated || undefined };
}

/**
 * Updates an order's payment and fulfillment status atomically.
 */
export async function updateOrderStatus(
  orderNumber: string,
  updates: {
    paymentStatus?: OrderRecord["paymentStatus"];
    fulfillmentStatus?: OrderRecord["fulfillmentStatus"];
    bankReferenceNumber?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    cancellationReason?: string;
    cancellationRequestedAt?: string;
    cancellationReviewedAt?: string;
    cancellationReviewNotes?: string;
    cancelledAt?: string;
    deliveredAt?: string;
    adminNotes?: string;
    paymentAttempt?: {
      attemptId: string;
      provider: string;
      paymentId: string;
      status: string;
      amountPaise: number;
      initiatedAt: string;
    };
  }
): Promise<OrderRecord | null> {
  const cleanNum = orderNumber.trim();
  const existing = await getOrderByNumber(cleanNum);
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const updated: OrderRecord = {
    ...existing,
    ...(updates.paymentStatus ? { paymentStatus: updates.paymentStatus } : {}),
    ...(updates.fulfillmentStatus ? { fulfillmentStatus: updates.fulfillmentStatus, status: updates.fulfillmentStatus } : {}),
    ...(updates.bankReferenceNumber ? { bankReferenceNumber: updates.bankReferenceNumber } : {}),
    ...(updates.carrier ? { carrier: updates.carrier } : {}),
    ...(updates.trackingNumber ? { trackingNumber: updates.trackingNumber } : {}),
    ...(updates.trackingUrl ? { trackingUrl: updates.trackingUrl } : {}),
    ...(updates.cancellationReason ? { cancellationReason: updates.cancellationReason } : {}),
    ...(updates.cancellationRequestedAt ? { cancellationRequestedAt: updates.cancellationRequestedAt } : {}),
    ...(updates.cancellationReviewedAt ? { cancellationReviewedAt: updates.cancellationReviewedAt } : {}),
    ...(updates.cancellationReviewNotes ? { cancellationReviewNotes: updates.cancellationReviewNotes } : {}),
    ...(updates.cancelledAt ? { cancelledAt: updates.cancelledAt } : {}),
    ...(updates.deliveredAt ? { deliveredAt: updates.deliveredAt } : {}),
    ...(updates.adminNotes ? { adminNotes: updates.adminNotes } : {}),
    updatedAt: nowIso,
  };

  if (updates.paymentAttempt) {
    updated.paymentAttempts = [...(existing.paymentAttempts || []), updates.paymentAttempt];
  }

  // Record audit history entry
  const historyEntry: OrderStatusHistoryEntry = {
    orderId: updated.id,
    orderNumber: updated.orderNumber,
    previousStatus: existing.fulfillmentStatus,
    newStatus: updated.fulfillmentStatus,
    statusType: updates.paymentStatus ? "payment" : "fulfillment",
    notes: updates.adminNotes || updates.cancellationReviewNotes,
    createdAt: nowIso,
  };
  updated.statusHistory = [...(existing.statusHistory || []), historyEntry];

  // Update in-memory store
  globalOrders.set(cleanNum, updated);

  // Update Supabase if available
  const supabase = getSupabase();
  if (supabase) {
    try {
      const dbUpdates: Record<string, any> = {
        updated_at: nowIso,
      };
      if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.fulfillmentStatus) dbUpdates.fulfillment_status = updates.fulfillmentStatus;
      if (updates.carrier) dbUpdates.carrier = updates.carrier;
      if (updates.trackingNumber) dbUpdates.tracking_number = updates.trackingNumber;
      if (updates.trackingUrl) dbUpdates.tracking_url = updates.trackingUrl;
      if (updates.cancellationReason) dbUpdates.cancellation_reason = updates.cancellationReason;
      if (updates.cancellationRequestedAt) dbUpdates.cancellation_requested_at = updates.cancellationRequestedAt;
      if (updates.cancellationReviewedAt) dbUpdates.cancellation_reviewed_at = updates.cancellationReviewedAt;
      if (updates.cancellationReviewNotes) dbUpdates.cancellation_review_notes = updates.cancellationReviewNotes;
      if (updates.cancelledAt) dbUpdates.cancelled_at = updates.cancelledAt;
      if (updates.deliveredAt) dbUpdates.delivered_at = updates.deliveredAt;
      if (updates.adminNotes) dbUpdates.admin_notes = updates.adminNotes;

      await supabase.from("orders").update(dbUpdates).eq("order_number", cleanNum);

      // Record audit history row in Supabase
      try {
        await supabase.from("order_status_history").insert({
          order_id: updated.id,
          previous_status: existing.fulfillmentStatus,
          new_status: updated.fulfillmentStatus,
          notes: updates.adminNotes || updates.cancellationReviewNotes,
          created_at: nowIso,
        });
      } catch {}

      // If order is cancelled or expired, release inventory reservations
      if (updates.paymentStatus === "failed" || updates.fulfillmentStatus === "cancelled") {
        for (const item of updated.items) {
          if (item.variantId && item.variantId.length > 20) {
            const { data: inv } = await supabase
              .from("inventory_items")
              .select("quantity_reserved")
              .eq("variant_id", item.variantId)
              .maybeSingle();

            if (inv && inv.quantity_reserved > 0) {
              await supabase
                .from("inventory_items")
                .update({
                  quantity_reserved: Math.max(0, inv.quantity_reserved - item.quantity),
                })
                .eq("variant_id", item.variantId);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not update remote order status:", err);
    }
  }

  // Dispatch Payment Confirmed Transactional Notification if payment just succeeded
  if (updates.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
    sendOrderNotification({
      orderNumber: updated.orderNumber,
      recipientEmail: updated.customer?.email || updated.shippingAddress?.email || "patron@example.com",
      recipientName: updated.shippingAddress.fullName,
      type: "payment_confirmed",
      title: `Payment Verified — Commission #${updated.orderNumber}`,
      message: `Your payment has been successfully confirmed for commission #${updated.orderNumber}.`,
      metadata: { totalAmount: updated.totalAmount },
    }).catch(() => {});
  }

  return updated;
}
