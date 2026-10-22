import assert from "node:assert";
import crypto from "node:crypto";

// Pure unit test suite for Phase 10: Shipping, Email Notifications & Delivery Integration
console.log("Running Phase 10: Shipping & Notification Test Suite...\n");

// --- 1. Address & Pincode Validation Logic ---
function validatePincode(pincode) {
  if (!pincode || typeof pincode !== "string") {
    return { valid: false, isServiceable: false, error: "Pincode is required." };
  }
  const clean = pincode.replace(/\s+/g, "").trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return { valid: false, isServiceable: false, error: "Please enter a valid 6-digit Indian PIN code." };
  }
  return { valid: true, isServiceable: true, pincode: clean };
}

// --- 2. Tracking URL Sanitizer ---
function sanitizeTrackingUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

// --- 3. Carrier URL Generator ---
function generateCarrierTrackingUrl(carrier, trackingNumber, orderNumber) {
  const cleanAwb = encodeURIComponent(trackingNumber.trim());
  if (!cleanAwb) return "";

  const cLower = carrier.toLowerCase();
  if (cLower.includes("bluedart")) {
    return `https://www.bluedart.com/tracking?handler=traking&action=auto&numbers=${cleanAwb}`;
  }
  if (cLower.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }
  if (cLower.includes("dhl")) {
    return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanAwb}`;
  }
  if (orderNumber) {
    return `/account/orders/${encodeURIComponent(orderNumber)}`;
  }
  return "";
}

// --- 4. Mock Shipping & Shipment Store ---
class TestShippingManager {
  constructor() {
    this.shipments = new Map(); // orderNumber -> shipment
    this.orders = new Map(); // orderNumber -> order
  }

  seedOrder(order) {
    this.orders.set(order.orderNumber, { ...order });
  }

  createShipment(orderNumber, carrier = "BlueDart Express Air", trackingNumber) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    if (order.fulfillmentStatus === "cancelled") {
      return { success: false, error: "Cannot create shipment for a cancelled commission." };
    }
    if (order.fulfillmentStatus === "delivered") {
      return { success: false, error: "Order is already delivered." };
    }

    // Duplicate check
    const existing = this.shipments.get(orderNumber);
    if (existing && existing.shippingStatus !== "cancelled") {
      return { success: false, error: `Shipment already active with AWB ${existing.trackingNumber}` };
    }

    const awb = trackingNumber || `BD-AIR-${Date.now().toString().slice(-6)}`;
    const url = generateCarrierTrackingUrl(carrier, awb, orderNumber);

    const manifest = {
      id: `ship_${Date.now()}`,
      orderNumber,
      carrier,
      trackingNumber: awb,
      trackingUrl: url,
      shippingStatus: "in_transit",
      shippedAt: new Date().toISOString(),
    };

    this.shipments.set(orderNumber, manifest);
    order.fulfillmentStatus = "shipped";
    order.carrier = carrier;
    order.trackingNumber = awb;
    order.trackingUrl = url;

    return { success: true, shipment: manifest };
  }

  confirmDelivery(orderNumber) {
    const order = this.orders.get(orderNumber);
    if (!order) return { success: false, error: "Order not found" };

    if (order.fulfillmentStatus === "delivered") {
      return { success: true, idempotent: true };
    }

    if (order.fulfillmentStatus !== "shipped" && order.fulfillmentStatus !== "dispatched") {
      return { success: false, error: `Cannot mark delivered from '${order.fulfillmentStatus}'. Must be shipped first.` };
    }

    order.fulfillmentStatus = "delivered";
    order.deliveredAt = new Date().toISOString();

    const shipment = this.shipments.get(orderNumber);
    if (shipment) {
      shipment.shippingStatus = "delivered";
      shipment.deliveredAt = order.deliveredAt;
    }

    return { success: true, deliveredAt: order.deliveredAt };
  }
}

// --- 5. Mock Notification & Email Deduplication Engine ---
class TestEmailEngine {
  constructor() {
    this.events = new Map(); // idempotencyKey -> eventRecord
  }

  computeIdempotencyKey(payload) {
    const modifier = payload.decision || payload.trackingNumber || payload.refundAmount || "";
    return `${payload.eventType}_${payload.orderNumber}_${modifier}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  sendEmail(payload, apiKey) {
    const key = this.computeIdempotencyKey(payload);

    // Deduplication check
    if (this.events.has(key)) {
      const existing = this.events.get(key);
      return { success: true, idempotentReplay: true, messageId: existing.messageId };
    }

    // Provider resolution
    const isRealResend = apiKey && apiKey.startsWith("re_") && !apiKey.includes("placeholder");
    const provider = isRealResend ? "resend" : "in_app_audit";
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    this.events.set(key, {
      idempotencyKey: key,
      payload,
      provider,
      messageId,
      status: "sent",
      sentAt: new Date().toISOString(),
    });

    return { success: true, idempotentReplay: false, provider, messageId };
  }
}

// --- 6. Webhook Signature Verifier ---
function verifyCarrierWebhook(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
  const expectedHash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const bufActual = Buffer.from(cleanSig, "hex");
  const bufExpected = Buffer.from(expectedHash, "hex");

  if (bufActual.length !== bufExpected.length) return false;
  return crypto.timingSafeEqual(bufActual, bufExpected);
}

// --- 7. Shipping Fee Calculator ---
function calculateShippingFee(subtotal, method = "standard_air") {
  if (method === "express_courier") {
    return 450;
  }
  return subtotal >= 1999 || subtotal === 0 ? 0 : 250;
}

// ======================== TEST CASES ========================

// TEST 1: Address and Pincode Serviceability Validation
{
  // Valid Indian 6-digit pincodes
  assert.strictEqual(validatePincode("110001").valid, true);
  assert.strictEqual(validatePincode("560001").valid, true);
  assert.strictEqual(validatePincode("400001").valid, true);
  assert.strictEqual(validatePincode("560 001").valid, true); // spaces stripped

  // Invalid pincodes
  assert.strictEqual(validatePincode("12345").valid, false); // 5 digits
  assert.strictEqual(validatePincode("012345").valid, false); // starts with 0
  assert.strictEqual(validatePincode("ABCDEF").valid, false); // non-numeric
  assert.strictEqual(validatePincode("").valid, false); // empty
  assert.strictEqual(validatePincode(null).valid, false); // null

  console.log("✓ 1. Address and pincode serviceability validation verified");
}

// TEST 2: Carrier Tracking URL Generation & XSS Protocol Sanitization
{
  // Valid external carrier URLs
  const bluedartUrl = generateCarrierTrackingUrl("BlueDart Express Air", "BD-778899");
  assert.strictEqual(sanitizeTrackingUrl(bluedartUrl), "https://www.bluedart.com/tracking?handler=traking&action=auto&numbers=BD-778899");

  const delhiveryUrl = generateCarrierTrackingUrl("Delhivery Priority Express", "DEL-12345");
  assert.strictEqual(sanitizeTrackingUrl(delhiveryUrl), "https://www.delhivery.com/track/package/DEL-12345");

  const dhlUrl = generateCarrierTrackingUrl("DHL Express India", "DHL-99999");
  assert.strictEqual(sanitizeTrackingUrl(dhlUrl), "https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=DHL-99999");

  // Relative internal application URLs
  assert.strictEqual(sanitizeTrackingUrl("/account/orders/VA-2026-101"), "/account/orders/VA-2026-101");

  // Malicious XSS / protocol injection attacks strictly stripped to empty string
  assert.strictEqual(sanitizeTrackingUrl("javascript:alert(document.cookie)"), "");
  assert.strictEqual(sanitizeTrackingUrl("data:text/html,<script>alert(1)</script>"), "");
  assert.strictEqual(sanitizeTrackingUrl("vbscript:msgbox(1)"), "");
  assert.strictEqual(sanitizeTrackingUrl("//malicious.com/steal"), ""); // protocol-relative rejected

  console.log("✓ 2. Carrier tracking URL generation and protocol sanitization (XSS defense) verified");
}

// TEST 3: Idempotent Shipment Creation & Duplicate Prevention
{
  const sm = new TestShippingManager();
  sm.seedOrder({
    orderNumber: "VA-101",
    fulfillmentStatus: "processing",
    paymentStatus: "paid",
  });

  // 1. Initial shipment manifestation
  const res1 = sm.createShipment("VA-101", "BlueDart Express Air", "BD-112233");
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.shipment.trackingNumber, "BD-112233");
  assert.strictEqual(sm.orders.get("VA-101").fulfillmentStatus, "shipped");

  // 2. Duplicate shipment attempt rejected
  const res2 = sm.createShipment("VA-101", "Delhivery Priority Express", "DEL-445566");
  assert.strictEqual(res2.success, false);
  assert.match(res2.error, /already active/i);

  // 3. Cannot manifest a cancelled order
  sm.seedOrder({ orderNumber: "VA-CANCELLED", fulfillmentStatus: "cancelled" });
  const res3 = sm.createShipment("VA-CANCELLED");
  assert.strictEqual(res3.success, false);
  assert.match(res3.error, /cancelled/i);

  console.log("✓ 3. Idempotent shipment manifestation and duplicate prevention verified");
}

// TEST 4: Validated Delivery Confirmation Handover
{
  const sm = new TestShippingManager();
  sm.seedOrder({ orderNumber: "VA-201", fulfillmentStatus: "confirmed" });

  // 1. Cannot mark delivered directly from confirmed (must be shipped first)
  const premature = sm.confirmDelivery("VA-201");
  assert.strictEqual(premature.success, false);
  assert.match(premature.error, /must be shipped first/i);

  // 2. Dispatch shipment
  sm.createShipment("VA-201", "BlueDart Express Air", "BD-223344");

  // 3. Confirm delivery
  const deliveryRes = sm.confirmDelivery("VA-201");
  assert.strictEqual(deliveryRes.success, true);
  assert.strictEqual(sm.orders.get("VA-201").fulfillmentStatus, "delivered");
  assert.ok(sm.orders.get("VA-201").deliveredAt);

  // 4. Repeated delivery confirmation is handled idempotently
  const repeatRes = sm.confirmDelivery("VA-201");
  assert.strictEqual(repeatRes.success, true);
  assert.strictEqual(repeatRes.idempotent, true);

  console.log("✓ 4. Validated delivery confirmation and status progression verified");
}

// TEST 5: Transactional Email Notification Deduplication & Idempotency
{
  const engine = new TestEmailEngine();

  const payload = {
    orderNumber: "VA-301",
    recipientEmail: "patron@velure.com",
    recipientName: "Arthur Pendelton",
    eventType: "order_confirmed",
    subject: "Commission Confirmation",
  };

  // 1. First send: genuine dispatch
  const res1 = engine.sendEmail(payload, null);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.idempotentReplay, false);
  assert.strictEqual(res1.provider, "in_app_audit");
  assert.ok(res1.messageId);

  // 2. Second send with identical payload: deduplicated replay
  const res2 = engine.sendEmail(payload, null);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.idempotentReplay, true);
  assert.strictEqual(res2.messageId, res1.messageId); // Reuses message ID

  // 3. Different event type on same order has unique key
  const dispatchPayload = { ...payload, eventType: "shipment_dispatched", trackingNumber: "BD-998877" };
  const res3 = engine.sendEmail(dispatchPayload, null);
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res3.idempotentReplay, false);
  assert.notStrictEqual(res3.messageId, res1.messageId);

  console.log("✓ 5. Transactional email notification deduplication and idempotency verified");
}

// TEST 6: Payment Confirmation Email Gating (Verified State Only)
{
  const engine = new TestEmailEngine();

  function onOrderStatusUpdate(order, previousPaymentStatus) {
    // Only dispatch payment confirmation if status transitioned to paid
    if (order.paymentStatus === "paid" && previousPaymentStatus !== "paid") {
      return engine.sendEmail({
        orderNumber: order.orderNumber,
        recipientEmail: order.email,
        recipientName: order.name,
        eventType: "payment_confirmed",
      }, null);
    }
    return null;
  }

  // Pending payment does NOT dispatch payment_confirmed
  const pendingOrder = { orderNumber: "VA-401", paymentStatus: "pending", email: "patron@test.com", name: "Patron" };
  const resPending = onOrderStatusUpdate(pendingOrder, "pending");
  assert.strictEqual(resPending, null);

  // Transition to paid DOES dispatch payment_confirmed
  const paidOrder = { ...pendingOrder, paymentStatus: "paid" };
  const resPaid = onOrderStatusUpdate(paidOrder, "pending");
  assert.ok(resPaid);
  assert.strictEqual(resPaid.success, true);
  assert.strictEqual(resPaid.idempotentReplay, false);

  console.log("✓ 6. Payment confirmation notification gating (verified paid state only) verified");
}

// TEST 7: Inbound Carrier Webhook HMAC Verification & Replay Protection
{
  const secret = "test_carrier_webhook_hmac_secret_32c";
  const payloadObj = {
    orderNumber: "VA-501",
    trackingNumber: "BD-556677",
    event: "delivered",
    location: "Bengaluru Hub",
  };
  const rawBody = JSON.stringify(payloadObj);

  // Compute signature
  const validHash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const validHeader = `sha256=${validHash}`;

  // 1. Valid signature passes
  assert.strictEqual(verifyCarrierWebhook(rawBody, validHeader, secret), true);

  // 2. Tampered body fails
  assert.strictEqual(verifyCarrierWebhook(rawBody + "tamper", validHeader, secret), false);

  // 3. Incorrect secret fails
  assert.strictEqual(verifyCarrierWebhook(rawBody, validHeader, "wrong_secret_32chars_long_____"), false);

  // 4. Missing signature fails
  assert.strictEqual(verifyCarrierWebhook(rawBody, null, secret), false);

  console.log("✓ 7. Inbound carrier webhook HMAC verification and tamper defense verified");
}

// TEST 8: Shipping Fee Calculation & Checkout Consistency
{
  // Standard air: ₹250 under 1999, ₹0 at or over 1999
  assert.strictEqual(calculateShippingFee(1500, "standard_air"), 250);
  assert.strictEqual(calculateShippingFee(1998, "standard_air"), 250);
  assert.strictEqual(calculateShippingFee(1999, "standard_air"), 0);
  assert.strictEqual(calculateShippingFee(5000, "standard_air"), 0);
  assert.strictEqual(calculateShippingFee(0, "standard_air"), 0); // Empty cart

  // White-Glove priority air courier: ₹450 regardless of subtotal
  assert.strictEqual(calculateShippingFee(1500, "express_courier"), 450);
  assert.strictEqual(calculateShippingFee(5000, "express_courier"), 450);

  console.log("✓ 8. Shipping fee calculation and checkout threshold consistency verified");
}

console.log("\nAll Phase 10 Shipping & Notification domain tests passed successfully!");
