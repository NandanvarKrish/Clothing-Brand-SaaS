import assert from "node:assert";

// Pure unit test suite for Phase 08: Order Lifecycle Management
console.log("Running Phase 08: Order Lifecycle Management Test Suite...\n");

// --- 1. Fulfillment State Machine Logic ---
function validateFulfillmentTransition(current, next) {
  if (current === next) return { valid: true };

  const validTransitions = {
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

// --- 2. Payment State Machine Logic ---
function validatePaymentTransition(current, next) {
  if (current === next) return { valid: true };

  const validTransitions = {
    pending: ["authorized", "captured", "paid", "failed"],
    authorized: ["captured", "paid", "failed"],
    captured: ["partially_refunded", "refunded"],
    paid: ["partially_refunded", "refunded"],
    failed: ["pending"],
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

// --- 3. Policy Engine: Cancellation & Return Eligibility ---
const ORDER_POLICY = {
  RETURN_WINDOW_DAYS: 14,
  CANCELLATION_ELIGIBLE_STATUSES: ["pending", "confirmed"],
  RETURN_ELIGIBLE_STATUSES: ["delivered"],
};

function isOrderEligibleForCancellation(order) {
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

  const isEligibleStatus = ORDER_POLICY.CANCELLATION_ELIGIBLE_STATUSES.includes(status);
  if (!isEligibleStatus) {
    return { eligible: false, reason: `Orders in '${status}' status cannot be cancelled online.` };
  }

  return { eligible: true };
}

function isOrderEligibleForReturn(order) {
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

// --- 4. IDOR Defense & Commission Authorization ---
function authorizeOrderAccess(order, user, isAdmin = false) {
  if (!order) return { success: false, error: "Order not found", code: "NOT_FOUND" };
  if (isAdmin) return { success: true, order };
  if (!user) return { success: false, error: "Authentication required", code: "UNAUTHORIZED" };

  const isOwner =
    order.customerId === user.id ||
    (order.customer && order.customer.email && order.customer.email.toLowerCase() === user.email?.toLowerCase()) ||
    (order.shippingAddress && order.shippingAddress.email && order.shippingAddress.email.toLowerCase() === user.email?.toLowerCase());

  if (!isOwner) {
    return { success: false, error: "Access denied", code: "FORBIDDEN" };
  }
  return { success: true, order };
}

// --- 5. Mock In-Memory Store for Lifecycle Flow Testing ---
class LifecycleDomainStore {
  constructor() {
    this.orders = new Map();
    this.returns = new Map();
    this.refunds = [];
    this.inventory = new Map(); // sku -> { onHand, reserved }
  }

  seedOrder(order) {
    this.orders.set(order.orderNumber, { ...order });
  }

  seedInventory(sku, onHand, reserved) {
    this.inventory.set(sku, { onHand, reserved });
  }

  requestCancellation(orderNumber, reason, user) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    const auth = authorizeOrderAccess(order, user);
    if (!auth.success) return auth;

    const eligibility = isOrderEligibleForCancellation(order);
    if (!eligibility.eligible) return { success: false, error: eligibility.reason };

    const transition = validateFulfillmentTransition(order.fulfillmentStatus, "cancellation_requested");
    if (!transition.valid) return { success: false, error: transition.error };

    order.fulfillmentStatus = "cancellation_requested";
    order.cancellationReason = reason;
    order.cancellationRequestedAt = new Date().toISOString();
    return { success: true, order };
  }

  reviewCancellation(orderNumber, decision, notes) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    if (order.fulfillmentStatus !== "cancellation_requested") {
      return { success: false, error: "Order not in cancellation_requested state" };
    }

    if (decision === "approved") {
      order.fulfillmentStatus = "cancelled";
      order.cancelledAt = new Date().toISOString();
      order.cancellationReviewNotes = notes;

      // Release reserved inventory
      for (const item of order.items) {
        const inv = this.inventory.get(item.sku);
        if (inv) {
          inv.reserved = Math.max(0, inv.reserved - item.quantity);
        }
      }

      // Record refund audit if order was paid
      if (order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
        this.refunds.push({
          orderId: order.id,
          amount: order.totalAmount,
          reason: notes || "Order Cancellation Approved",
          status: "pending_manual_payout",
          createdAt: new Date().toISOString(),
        });
      } else {
        order.paymentStatus = "failed";
      }

      return { success: true, order };
    } else {
      order.fulfillmentStatus = "confirmed";
      order.cancellationReviewNotes = notes || "Declined";
      return { success: true, order };
    }
  }

  requestReturn(orderNumber, items, reason, user) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    const auth = authorizeOrderAccess(order, user);
    if (!auth.success) return auth;

    const eligibility = isOrderEligibleForReturn(order);
    if (!eligibility.eligible) return { success: false, error: eligibility.reason };

    if (!items || items.length === 0) return { success: false, error: "No items specified" };

    // Prevent duplicate active return
    for (const ret of this.returns.values()) {
      if (ret.orderNumber === orderNumber && ["requested", "approved", "in_transit"].includes(ret.status)) {
        return { success: false, error: `Return #${ret.returnNumber} is already active` };
      }
    }

    // Validate item quantities against order items
    let calculatedRefund = 0;
    const returnItems = [];
    for (const reqItem of items) {
      const orderItem = order.items.find((it) => it.sku === reqItem.sku);
      if (!orderItem) return { success: false, error: `Invalid item SKU: ${reqItem.sku}` };
      if (reqItem.quantity <= 0 || reqItem.quantity > orderItem.quantity) {
        return { success: false, error: `Invalid return quantity for ${reqItem.sku}` };
      }
      calculatedRefund += orderItem.unitPrice * reqItem.quantity;
      returnItems.push({
        sku: reqItem.sku,
        quantity: reqItem.quantity,
        unitPrice: orderItem.unitPrice,
        refundAmount: orderItem.unitPrice * reqItem.quantity,
      });
    }

    const returnNumber = `RET-${Date.now().toString().slice(-4)}`;
    const retRecord = {
      id: `ret_${Date.now()}`,
      returnNumber,
      orderId: order.id,
      orderNumber,
      status: "requested",
      reason,
      refundAmount: calculatedRefund,
      items: returnItems,
      createdAt: new Date().toISOString(),
    };

    this.returns.set(returnNumber, retRecord);
    order.fulfillmentStatus = "return_requested";
    return { success: true, returnRecord: retRecord };
  }

  reviewReturn(returnNumber, decision, { restock = true, notes = "" } = {}) {
    const ret = this.returns.get(returnNumber);
    if (!ret) return { success: false, error: "Return not found" };

    const order = this.orders.get(ret.orderNumber);

    if (decision === "approved") {
      ret.status = "approved";
      ret.adminNotes = notes;

      // Restock inventory on approval
      if (restock) {
        for (const item of ret.items) {
          const inv = this.inventory.get(item.sku);
          if (inv) {
            inv.onHand += item.quantity;
          }
        }
      }

      if (order) {
        order.fulfillmentStatus = "returned";
        if (order.paymentStatus === "paid") {
          order.paymentStatus = "refunded";
        }
      }

      // Safe payout audit record
      this.refunds.push({
        returnId: ret.id,
        orderId: ret.orderId,
        amount: ret.refundAmount,
        reason: notes || `Return Approved: ${ret.reason}`,
        status: "pending_manual_payout",
        createdAt: new Date().toISOString(),
      });

      return { success: true, returnRecord: ret };
    } else {
      ret.status = "rejected";
      ret.adminNotes = notes;
      if (order) {
        order.fulfillmentStatus = "delivered"; // Revert to delivered
      }
      return { success: true, returnRecord: ret };
    }
  }

  updateFulfillment(orderNumber, updates) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    if (updates.fulfillmentStatus && updates.fulfillmentStatus !== order.fulfillmentStatus) {
      const check = validateFulfillmentTransition(order.fulfillmentStatus, updates.fulfillmentStatus);
      if (!check.valid) return { success: false, error: check.error };
      order.fulfillmentStatus = updates.fulfillmentStatus;
    }

    if (updates.carrier) order.carrier = updates.carrier;
    if (updates.trackingNumber) order.trackingNumber = updates.trackingNumber;
    if (updates.trackingUrl) order.trackingUrl = updates.trackingUrl;

    if (order.fulfillmentStatus === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date().toISOString();
      // On dispatch, permanently deduct on-hand inventory
      for (const item of order.items) {
        const inv = this.inventory.get(item.sku);
        if (inv) {
          inv.onHand = Math.max(0, inv.onHand - item.quantity);
          inv.reserved = Math.max(0, inv.reserved - item.quantity);
        }
      }
    }

    if (order.fulfillmentStatus === "delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date().toISOString();
    }

    return { success: true, order };
  }
}

// ======================== TEST CASES ========================

// TEST 1: Fulfillment State Machine Transition Rules
{
  // Valid forward paths
  assert.strictEqual(validateFulfillmentTransition("pending", "confirmed").valid, true);
  assert.strictEqual(validateFulfillmentTransition("confirmed", "tailoring").valid, true);
  assert.strictEqual(validateFulfillmentTransition("tailoring", "processing").valid, true);
  assert.strictEqual(validateFulfillmentTransition("processing", "shipped").valid, true);
  assert.strictEqual(validateFulfillmentTransition("shipped", "delivered").valid, true);
  assert.strictEqual(validateFulfillmentTransition("delivered", "return_requested").valid, true);
  assert.strictEqual(validateFulfillmentTransition("return_requested", "returned").valid, true);

  // Cancellation paths
  assert.strictEqual(validateFulfillmentTransition("pending", "cancellation_requested").valid, true);
  assert.strictEqual(validateFulfillmentTransition("confirmed", "cancellation_requested").valid, true);
  assert.strictEqual(validateFulfillmentTransition("cancellation_requested", "cancelled").valid, true);
  assert.strictEqual(validateFulfillmentTransition("cancellation_requested", "confirmed").valid, true); // Rejected cancellation

  // Return rejection path
  assert.strictEqual(validateFulfillmentTransition("return_requested", "delivered").valid, true); // Return rejected

  // Illegal transitions
  assert.strictEqual(validateFulfillmentTransition("shipped", "cancellation_requested").valid, false);
  assert.strictEqual(validateFulfillmentTransition("delivered", "cancellation_requested").valid, false);
  assert.strictEqual(validateFulfillmentTransition("cancelled", "processing").valid, false);
  assert.strictEqual(validateFulfillmentTransition("returned", "shipped").valid, false);
  assert.strictEqual(validateFulfillmentTransition("pending", "returned").valid, false);

  console.log("✓ 1. Fulfillment state machine transition rules and terminal states verified");
}

// TEST 2: Payment State Machine Transition Rules
{
  // Legal paths
  assert.strictEqual(validatePaymentTransition("pending", "paid").valid, true);
  assert.strictEqual(validatePaymentTransition("pending", "failed").valid, true);
  assert.strictEqual(validatePaymentTransition("paid", "refunded").valid, true);
  assert.strictEqual(validatePaymentTransition("paid", "partially_refunded").valid, true);
  assert.strictEqual(validatePaymentTransition("failed", "pending").valid, true); // Re-attempt

  // Illegal paths
  assert.strictEqual(validatePaymentTransition("refunded", "paid").valid, false);
  assert.strictEqual(validatePaymentTransition("paid", "pending").valid, false);

  console.log("✓ 2. Payment state machine transition rules and terminal states verified");
}

// TEST 3: Customer Commission Authorization & IDOR Defense
{
  const order = {
    id: "ord_101",
    orderNumber: "VA-2026-9001",
    customerId: "cust_alice",
    customer: { email: "alice@velure.com" },
    shippingAddress: { fullName: "Alice Beaumont", email: "alice@velure.com" },
  };

  const userAlice = { id: "cust_alice", email: "alice@velure.com" };
  const userEve = { id: "cust_eve", email: "eve@intruder.com" };

  // Owner access
  const ownerCheck = authorizeOrderAccess(order, userAlice, false);
  assert.strictEqual(ownerCheck.success, true);
  assert.strictEqual(ownerCheck.order.orderNumber, "VA-2026-9001");

  // Attacker access blocked (IDOR defense)
  const attackerCheck = authorizeOrderAccess(order, userEve, false);
  assert.strictEqual(attackerCheck.success, false);
  assert.strictEqual(attackerCheck.code, "FORBIDDEN");

  // Anonymous unauthenticated access blocked
  const anonCheck = authorizeOrderAccess(order, null, false);
  assert.strictEqual(anonCheck.success, false);
  assert.strictEqual(anonCheck.code, "UNAUTHORIZED");

  // Admin access permitted
  const adminCheck = authorizeOrderAccess(order, userEve, true);
  assert.strictEqual(adminCheck.success, true);

  console.log("✓ 3. IDOR defense and patron ownership authorization verified");
}

// TEST 4: Customer Order Cancellation Policy & Request Workflow
{
  const store = new LifecycleDomainStore();
  store.seedInventory("MST-S-BLK", 10, 2);

  const pendingOrder = {
    id: "ord_201",
    orderNumber: "VA-2026-0001",
    customerId: "cust_001",
    fulfillmentStatus: "confirmed",
    paymentStatus: "paid",
    totalAmount: 8400,
    shippingAddress: { fullName: "Lord Sterling", email: "sterling@atelier.com" },
    items: [{ sku: "MST-S-BLK", quantity: 2, unitPrice: 4200 }],
  };
  store.seedOrder(pendingOrder);

  // 1. Patron requests cancellation
  const user = { id: "cust_001", email: "sterling@atelier.com" };
  const reqRes = store.requestCancellation("VA-2026-0001", "Changed Mind / Ordered by Mistake", user);
  assert.strictEqual(reqRes.success, true);
  assert.strictEqual(reqRes.order.fulfillmentStatus, "cancellation_requested");
  assert.strictEqual(reqRes.order.cancellationReason, "Changed Mind / Ordered by Mistake");

  // 2. Duplicate cancellation request rejected
  const dupRes = store.requestCancellation("VA-2026-0001", "Duplicate request", user);
  assert.strictEqual(dupRes.success, false);
  assert.match(dupRes.error, /already under review/i);

  // 3. Admin approves cancellation: releases reserved stock and records refund
  const reviewRes = store.reviewCancellation("VA-2026-0001", "approved", "Customer requested before cutting.");
  assert.strictEqual(reviewRes.success, true);
  assert.strictEqual(reviewRes.order.fulfillmentStatus, "cancelled");
  assert.strictEqual(reviewRes.order.paymentStatus, "refunded");

  // Verify reserved stock was released
  const inv = store.inventory.get("MST-S-BLK");
  assert.strictEqual(inv.reserved, 0); // 2 reserved units released back

  // Verify refund record created with pending_manual_payout status (payout desk safety)
  assert.strictEqual(store.refunds.length, 1);
  assert.strictEqual(store.refunds[0].amount, 8400);
  assert.strictEqual(store.refunds[0].status, "pending_manual_payout");

  console.log("✓ 4. Cancellation lifecycle, stock reservation release, and refund record verified");
}

// TEST 5: Cancellation Rejection Returns Order to Active Status
{
  const store = new LifecycleDomainStore();
  const order = {
    id: "ord_202",
    orderNumber: "VA-2026-0002",
    customerId: "cust_002",
    fulfillmentStatus: "confirmed",
    paymentStatus: "paid",
    totalAmount: 3850,
    shippingAddress: { fullName: "Lady Catherine", email: "catherine@atelier.com" },
    items: [{ sku: "BFT-32-ECR", quantity: 1, unitPrice: 3850 }],
  };
  store.seedOrder(order);

  const user = { id: "cust_002", email: "catherine@atelier.com" };
  store.requestCancellation("VA-2026-0002", "Modifying Delivery Coordinates", user);

  // Admin declines cancellation
  const review = store.reviewCancellation("VA-2026-0002", "rejected", "Fabric has already entered bespoke laser cutting.");
  assert.strictEqual(review.success, true);
  assert.strictEqual(review.order.fulfillmentStatus, "confirmed");
  assert.strictEqual(review.order.cancellationReviewNotes, "Fabric has already entered bespoke laser cutting.");

  console.log("✓ 5. Cancellation decline reverts fulfillment to confirmed with audit notes");
}

// TEST 6: Dispatched & Delivered Orders Ineligible for Cancellation
{
  const shippedOrder = { fulfillmentStatus: "shipped" };
  const deliveredOrder = { fulfillmentStatus: "delivered" };
  const tailoringOrder = { fulfillmentStatus: "tailoring" };

  assert.strictEqual(isOrderEligibleForCancellation(shippedOrder).eligible, false);
  assert.strictEqual(isOrderEligibleForCancellation(deliveredOrder).eligible, false);
  assert.strictEqual(isOrderEligibleForCancellation(tailoringOrder).eligible, false);

  console.log("✓ 6. Dispatched, shipped, and tailoring orders correctly rejected for online cancellation");
}

// TEST 7: 14-Day Return Window Policy Validation
{
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Order delivered 5 days ago (eligible)
  const recentOrder = {
    fulfillmentStatus: "delivered",
    deliveredAt: new Date(now - 5 * dayMs).toISOString(),
  };
  const recentCheck = isOrderEligibleForReturn(recentOrder);
  assert.strictEqual(recentCheck.eligible, true);
  assert.strictEqual(recentCheck.daysRemaining, 9);

  // Order delivered 15 days ago (ineligible - exceeded 14-day window)
  const expiredOrder = {
    fulfillmentStatus: "delivered",
    deliveredAt: new Date(now - 15 * dayMs).toISOString(),
  };
  const expiredCheck = isOrderEligibleForReturn(expiredOrder);
  assert.strictEqual(expiredCheck.eligible, false);
  assert.strictEqual(expiredCheck.daysRemaining, 0);
  assert.match(expiredCheck.reason, /14-day/);

  // Order not yet delivered (ineligible)
  const undeliveredOrder = { fulfillmentStatus: "shipped" };
  assert.strictEqual(isOrderEligibleForReturn(undeliveredOrder).eligible, false);

  console.log("✓ 7. 14-Day return window enforcement and day calculations verified");
}

// TEST 8: Item-Level Return Request, Stock Restocking & Safe Payout Desk
{
  const store = new LifecycleDomainStore();
  store.seedInventory("MST-S-BLK", 5, 0); // 5 on hand

  const deliveredOrder = {
    id: "ord_301",
    orderNumber: "VA-2026-0003",
    customerId: "cust_003",
    fulfillmentStatus: "delivered",
    paymentStatus: "paid",
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    shippingAddress: { fullName: "Marcus Vance", email: "marcus@vance.com" },
    items: [
      { sku: "MST-S-BLK", quantity: 2, unitPrice: 8400 },
      { sku: "BFT-32-ECR", quantity: 1, unitPrice: 3850 },
    ],
  };
  store.seedOrder(deliveredOrder);

  const user = { id: "cust_003", email: "marcus@vance.com" };

  // 1. Attempt to return invalid quantity (> ordered)
  const invalidQtyRes = store.requestReturn(
    "VA-2026-0003",
    [{ sku: "MST-S-BLK", quantity: 5 }],
    "Size / Fit Adjustment Required",
    user
  );
  assert.strictEqual(invalidQtyRes.success, false);
  assert.match(invalidQtyRes.error, /Invalid return quantity/);

  // 2. Submit valid partial item return (1 of 2 Silk Trenches)
  const retRes = store.requestReturn(
    "VA-2026-0003",
    [{ sku: "MST-S-BLK", quantity: 1 }],
    "Size / Fit Adjustment Required",
    user
  );
  assert.strictEqual(retRes.success, true);
  assert.strictEqual(retRes.returnRecord.refundAmount, 8400); // 1 * 8400
  assert.strictEqual(retRes.returnRecord.status, "requested");

  // 3. Duplicate return request rejected while one is active
  const dupReturn = store.requestReturn(
    "VA-2026-0003",
    [{ sku: "BFT-32-ECR", quantity: 1 }],
    "Fabric Drape or Texture Not as Anticipated",
    user
  );
  assert.strictEqual(dupReturn.success, false);
  assert.match(dupReturn.error, /already (under review|active)/i);

  // 4. Admin reviews and approves return with physical restock
  const returnNumber = retRes.returnRecord.returnNumber;
  const reviewReturnRes = store.reviewReturn(returnNumber, "approved", {
    restock: true,
    notes: "Garment inspected at atelier: tags intact, pristine silk condition.",
  });
  assert.strictEqual(reviewReturnRes.success, true);
  assert.strictEqual(reviewReturnRes.returnRecord.status, "approved");

  // Check inventory restocked (5 -> 6)
  const updatedInv = store.inventory.get("MST-S-BLK");
  assert.strictEqual(updatedInv.onHand, 6);

  // Check refund audit record created
  const refundEntry = store.refunds.find((r) => r.returnId === retRes.returnRecord.id);
  assert.ok(refundEntry);
  assert.strictEqual(refundEntry.amount, 8400);
  assert.strictEqual(refundEntry.status, "pending_manual_payout");

  console.log("✓ 8. Item-level return validation, inventory restocking, and refund audit verified");
}

// TEST 9: White-Glove Dispatch, AWB Tracking & Delivery Timestamps
{
  const store = new LifecycleDomainStore();
  store.seedInventory("BFT-32-ECR", 10, 2);

  const order = {
    id: "ord_401",
    orderNumber: "VA-2026-0004",
    customerId: "cust_004",
    fulfillmentStatus: "processing",
    paymentStatus: "paid",
    items: [{ sku: "BFT-32-ECR", quantity: 2, unitPrice: 3850 }],
  };
  store.seedOrder(order);

  // 1. Dispatch with carrier and tracking number
  const dispatchRes = store.updateFulfillment("VA-2026-0004", {
    fulfillmentStatus: "shipped",
    carrier: "BlueDart Express Air",
    trackingNumber: "BD-AIR-778899",
    trackingUrl: "https://track.bluedart.com/BD-AIR-778899",
  });
  assert.strictEqual(dispatchRes.success, true);
  assert.strictEqual(dispatchRes.order.fulfillmentStatus, "shipped");
  assert.strictEqual(dispatchRes.order.trackingNumber, "BD-AIR-778899");
  assert.ok(dispatchRes.order.shippedAt);

  // Inventory on hand and reserved permanently deducted on dispatch
  const inv = store.inventory.get("BFT-32-ECR");
  assert.strictEqual(inv.onHand, 8); // 10 - 2
  assert.strictEqual(inv.reserved, 0); // 2 - 2

  // 2. Mark as delivered
  const deliverRes = store.updateFulfillment("VA-2026-0004", {
    fulfillmentStatus: "delivered",
  });
  assert.strictEqual(deliverRes.success, true);
  assert.strictEqual(deliverRes.order.fulfillmentStatus, "delivered");
  assert.ok(deliverRes.order.deliveredAt);

  console.log("✓ 9. Courier AWB tracking, permanent dispatch stock deduction, and delivery timestamps verified");
}

// TEST 10: Admin Studio Order Querying, Search & Filtering
{
  const orders = [
    { orderNumber: "VA-2026-1001", shippingAddress: { fullName: "Arthur Pendelton", email: "arthur@london.co" }, fulfillmentStatus: "shipped", paymentStatus: "paid", trackingNumber: "BD-111" },
    { orderNumber: "VA-2026-1002", shippingAddress: { fullName: "Beatrice Webb", email: "beatrice@webb.com" }, fulfillmentStatus: "cancellation_requested", paymentStatus: "paid", trackingNumber: "BD-222" },
    { orderNumber: "VA-2026-1003", shippingAddress: { fullName: "Charles Xavier", email: "charles@mansion.org" }, fulfillmentStatus: "delivered", paymentStatus: "paid", trackingNumber: "BD-333" },
    { orderNumber: "VA-2026-1004", shippingAddress: { fullName: "Diana Prince", email: "diana@themyscira.com" }, fulfillmentStatus: "pending", paymentStatus: "pending", trackingNumber: "BD-444" },
  ];

  function filterOrders(list, { query, fulfillmentStatus, paymentStatus, limit, offset }) {
    let result = [...list];
    if (fulfillmentStatus && fulfillmentStatus !== "all") {
      result = result.filter((o) => o.fulfillmentStatus === fulfillmentStatus);
    }
    if (paymentStatus && paymentStatus !== "all") {
      result = result.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.shippingAddress.fullName.toLowerCase().includes(q) ||
          o.shippingAddress.email.toLowerCase().includes(q) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }
    const total = result.length;
    if (offset) result = result.slice(offset);
    if (limit) result = result.slice(0, limit);
    return { orders: result, total };
  }

  // Filter by fulfillment status
  const cancelReqs = filterOrders(orders, { fulfillmentStatus: "cancellation_requested" });
  assert.strictEqual(cancelReqs.total, 1);
  assert.strictEqual(cancelReqs.orders[0].orderNumber, "VA-2026-1002");

  // Filter by query (email or name)
  const charlieQuery = filterOrders(orders, { query: "charles" });
  assert.strictEqual(charlieQuery.total, 1);
  assert.strictEqual(charlieQuery.orders[0].shippingAddress.fullName, "Charles Xavier");

  // Filter by AWB tracking number
  const awbQuery = filterOrders(orders, { query: "BD-111" });
  assert.strictEqual(awbQuery.total, 1);
  assert.strictEqual(awbQuery.orders[0].orderNumber, "VA-2026-1001");

  // Pagination
  const pageQuery = filterOrders(orders, { limit: 2, offset: 2 });
  assert.strictEqual(pageQuery.total, 4);
  assert.strictEqual(pageQuery.orders.length, 2);
  assert.strictEqual(pageQuery.orders[0].orderNumber, "VA-2026-1003");

  console.log("✓ 10. Admin studio search, multi-field filtering, and pagination verified");
}

console.log("\nAll Phase 08 Order Lifecycle Management domain tests passed successfully!");
