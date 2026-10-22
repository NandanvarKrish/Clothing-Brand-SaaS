/**
 * VÉLURE ATELIER — ORDER LIFECYCLE & RETURN POLICY CONFIGURATION
 *
 * Configurable business rules governing order cancellations, returns,
 * carrier selection, and refund payout modes.
 */

export const ORDER_POLICY = {
  /**
   * Return window in days starting from the recorded delivery timestamp.
   * If delivery timestamp is absent, defaults to updatedAt of delivered status.
   */
  RETURN_WINDOW_DAYS: 14,

  /**
   * Fulfillment statuses eligible for initiating a return request.
   */
  RETURN_ELIGIBLE_STATUSES: ["delivered"] as const,

  /**
   * Curated reasons for luxury garment return requests.
   */
  RETURN_REASONS: [
    "Size / Fit Adjustment Required",
    "Fabric Drape or Texture Not as Anticipated",
    "Color Shade Variance Under Ambient Light",
    "Crafting or Seam Inconsistency",
    "Incorrect Garment Delivered",
    "Other Bespoke Inquiry",
  ] as const,

  /**
   * Fulfillment statuses eligible for immediate customer cancellation request.
   * Cancellations are permitted prior to custom tailoring or dispatch.
   */
  CANCELLATION_ELIGIBLE_STATUSES: ["pending", "confirmed"] as const,

  /**
   * Standard cancellation reasons.
   */
  CANCELLATION_REASONS: [
    "Changed Mind / Ordered by Mistake",
    "Incorrect Size or Color Selected",
    "Need Delivery by Earlier Date",
    "Modifying Delivery Coordinates",
    "Other Concierge Reason",
  ] as const,

  /**
   * Priority air courier carriers supported for luxury delivery.
   */
  CARRIERS: [
    "BlueDart Express Air",
    "Delhivery Priority Express",
    "DHL Express India",
  ] as const,

  DEFAULT_CARRIER: "BlueDart Express Air",

  /**
   * Automated inventory restocking settings.
   */
  AUTO_RESTOCK_ON_CANCELLATION: true,
  AUTO_RESTOCK_ON_RETURN_APPROVED: true,

  /**
   * Payout / Refund strategy:
   * 'manual_review' — Default for experimental/unverified rails (YouPI / COD).
   * Generates audited pending payout records for merchant bank reconciliation.
   */
  REFUND_MODE: "manual_review" as const,
};

export type ReturnReason = typeof ORDER_POLICY.RETURN_REASONS[number];
export type CancellationReason = typeof ORDER_POLICY.CANCELLATION_REASONS[number];

/**
 * Evaluates whether an order is eligible for customer cancellation.
 */
export function isOrderEligibleForCancellation(order: {
  fulfillmentStatus?: string;
  paymentStatus?: string;
}): { eligible: boolean; reason?: string } {
  const status = (order.fulfillmentStatus || "").toLowerCase();

  if (status === "cancelled") {
    return { eligible: false, reason: "This order has already been cancelled." };
  }
  if (status === "cancellation_requested") {
    return { eligible: false, reason: "A cancellation request is already under review by our atelier team." };
  }
  if (["dispatched", "shipped", "delivered"].includes(status)) {
    return { eligible: false, reason: "Garments that have already been dispatched or delivered cannot be cancelled. You may initiate a return upon receipt." };
  }
  if (["tailoring", "processing", "inspection"].includes(status)) {
    return { eligible: false, reason: "Bespoke cutting and tailoring has already commenced. Please contact atelier concierge for assistance." };
  }

  const isEligibleStatus = ORDER_POLICY.CANCELLATION_ELIGIBLE_STATUSES.map(s => s.toLowerCase()).includes(status as any);
  if (!isEligibleStatus) {
    return { eligible: false, reason: `Orders in '${status}' status cannot be cancelled online.` };
  }

  return { eligible: true };
}

/**
 * Evaluates whether an order is eligible for customer return.
 */
export function isOrderEligibleForReturn(order: {
  fulfillmentStatus?: string;
  paymentStatus?: string;
  deliveredAt?: string | null;
  updatedAt?: string;
}): { eligible: boolean; daysRemaining?: number; reason?: string } {
  const status = (order.fulfillmentStatus || "").toLowerCase();

  if (status === "return_requested") {
    return { eligible: false, reason: "A return request is already under review for this order." };
  }
  if (status === "returned") {
    return { eligible: false, reason: "This order has already been returned and resolved." };
  }
  if (status === "cancelled") {
    return { eligible: false, reason: "Cancelled orders cannot be returned." };
  }
  if (status !== "delivered") {
    return { eligible: false, reason: "Only delivered garments can be considered for complimentary returns or exchanges." };
  }

  // Calculate elapsed time from delivery
  const deliveryDateStr = order.deliveredAt || order.updatedAt;
  if (!deliveryDateStr) {
    return { eligible: true, daysRemaining: ORDER_POLICY.RETURN_WINDOW_DAYS };
  }

  const deliveryTime = new Date(deliveryDateStr).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - deliveryTime) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, ORDER_POLICY.RETURN_WINDOW_DAYS - diffDays);

  if (diffDays > ORDER_POLICY.RETURN_WINDOW_DAYS) {
    return {
      eligible: false,
      daysRemaining: 0,
      reason: `The ${ORDER_POLICY.RETURN_WINDOW_DAYS}-day complimentary return window has elapsed.`,
    };
  }

  return { eligible: true, daysRemaining };
}
