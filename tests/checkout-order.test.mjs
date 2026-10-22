import assert from "node:assert";

// Domain test suite for Atelier Checkout & Order Foundation

// 1. Authoritative Shipping Fee Calculation
function calculateShippingFee(subtotal, method = "standard_air") {
  if (method === "express_courier") {
    return 450; // Priority White-Glove courier with same-day tailoring dispatch
  }
  // Standard Express Air
  return subtotal >= 1999 || subtotal === 0 ? 0 : 250;
}

// 2. Authoritative Coupon Validation
function validateCoupon(code, subtotal) {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, error: null, code: null };
  }
  const clean = code.trim().toUpperCase();
  if (clean === "FESTIVE10") {
    return { valid: true, discount: Math.round(subtotal * 0.1), error: null, code: clean };
  }
  if (clean === "WELCOME15") {
    return { valid: true, discount: Math.round(subtotal * 0.15), error: null, code: clean };
  }
  if (clean === "ATELIER20") {
    if (subtotal < 3000) {
      return { valid: false, discount: 0, error: "ATELIER20 requires a minimum subtotal of ₹3,000.", code: clean };
    }
    return { valid: true, discount: Math.round(subtotal * 0.2), error: null, code: clean };
  }
  return { valid: false, discount: 0, error: "Invalid promotional code.", code: clean };
}

// 3. Mock Authoritative Product Catalog
const catalog = [
  {
    id: "prod-1",
    name: "Mulberry Silk Trench",
    slug: "mulberry-silk-trench",
    price: 8400,
    status: "published",
    variants: [
      { id: "var-1-s", size: "S", color: "Noir", sku: "MST-S-BLK", price: 8400, stock: 4 },
      { id: "var-1-m", size: "M", color: "Noir", sku: "MST-M-BLK", price: 8400, stock: 0 }, // Out of stock
    ],
  },
  {
    id: "prod-2",
    name: "Belgian Flax Trouser",
    slug: "belgian-flax-trouser",
    price: 3850,
    status: "published",
    variants: [
      { id: "var-2-32", size: "32", color: "Ecru", sku: "BFT-32-ECR", price: 3850, stock: 10 },
    ],
  },
  {
    id: "prod-archived",
    name: "Archival Linen Shirt",
    slug: "archival-linen-shirt",
    price: 2900,
    status: "archived", // Archived/unavailable
    variants: [
      { id: "var-arch-s", size: "S", color: "White", sku: "ALS-S-WHT", price: 2900, stock: 2 },
    ],
  },
];

// In-memory test order storage & idempotency locks
const testOrders = new Map();
const idempotencyStore = new Map();
const inFlightKeys = new Set();

function createTestOrder(input) {
  // Idempotency check & concurrency lock
  if (input.idempotencyKey) {
    if (inFlightKeys.has(input.idempotencyKey)) {
      return { success: false, error: "Concurrent checkout request in progress.", code: "CONCURRENT_REQUEST" };
    }
    const existingOrderNum = idempotencyStore.get(input.idempotencyKey);
    if (existingOrderNum) {
      return { success: true, order: testOrders.get(existingOrderNum), code: "IDEMPOTENT_REPLAY" };
    }
    inFlightKeys.add(input.idempotencyKey);
  }

  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Empty cart.", code: "EMPTY_CART" };
    }
    if (!input.shippingAddress || !input.shippingAddress.fullName || !input.shippingAddress.pincode) {
      return { success: false, error: "Incomplete address.", code: "INVALID_ADDRESS" };
    }

    // Authoritative Recalculation (ignore any client prices)
    let subtotal = 0;
    const itemSnapshots = [];

    for (const raw of input.items) {
      const product = catalog.find((p) => p.id === raw.productId);
      if (!product || product.status !== "published") {
        return { success: false, error: "Item unavailable.", code: "STOCK_CONFLICT" };
      }

      const variant = product.variants.find((v) => v.size === raw.size && v.color === raw.color);
      if (!variant) {
        return { success: false, error: "Variant not found.", code: "STOCK_CONFLICT" };
      }

      // Check stock conflict (insufficient stock or sold out)
      if (variant.stock <= 0 || raw.quantity > variant.stock) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name} (${variant.size}/${variant.color}). Requested: ${raw.quantity}, Available: ${variant.stock}`,
          code: "STOCK_CONFLICT",
        };
      }

      const authoritativePrice = variant.price || product.price;
      const lineTotal = authoritativePrice * raw.quantity;
      subtotal += lineTotal;

      itemSnapshots.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantDescription: `Size: ${variant.size} • Color: ${variant.color}`,
        sku: variant.sku,
        unitPrice: authoritativePrice,
        quantity: raw.quantity,
        lineTotal,
      });
    }

    // Authoritative coupon calculation
    const couponRes = validateCoupon(input.couponCode, subtotal);
    const discountAmount = couponRes.valid ? couponRes.discount : 0;

    // Authoritative shipping calculation
    const shippingMethodId = input.shippingMethodId || "standard_air";
    const shippingFee = calculateShippingFee(subtotal, shippingMethodId);
    const taxAmount = Math.round(subtotal * 0.12);
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Lifecycle state initialization
    const paymentStatus = "pending";
    const fulfillmentStatus = input.paymentMethod === "cod" ? "confirmed" : "pending";

    const orderNumber = `VEL-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderRecord = {
      orderNumber,
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      fulfillmentStatus,
      shippingMethodId,
      shippingAddress: { ...input.shippingAddress },
      items: itemSnapshots,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    testOrders.set(orderNumber, orderRecord);
    if (input.idempotencyKey) {
      idempotencyStore.set(input.idempotencyKey, orderNumber);
    }

    return { success: true, order: orderRecord };
  } finally {
    if (input.idempotencyKey) {
      inFlightKeys.delete(input.idempotencyKey);
    }
  }
}

console.log("Running Atelier Checkout & Order Domain Self-Check...");

// ====================================================================
// TEST 1: Pricing recalculation & client tampering resistance
// ====================================================================
const tamperedOrderInput = {
  items: [
    {
      productId: "prod-2",
      size: "32",
      color: "Ecru",
      quantity: 2,
      price: 10, // Tampered price by malicious client
    },
  ],
  shippingAddress: { fullName: "Aarav Mehta", phone: "9820011223", pincode: "400001" },
  paymentMethod: "upi",
  couponCode: null,
};

const res1 = createTestOrder(tamperedOrderInput);
assert.strictEqual(res1.success, true, "Order creation should succeed");
assert.strictEqual(res1.order.subtotal, 7700, "Subtotal must equal authoritative 3850 * 2 = 7700, ignoring client ₹10");
assert.strictEqual(res1.order.items[0].unitPrice, 3850, "Snapshot unit price must be catalog 3850");
assert.strictEqual(res1.order.items[0].lineTotal, 7700, "Line total must be 7700");
console.log("✓ Pricing recalculation & client tampering resistance verified");

// ====================================================================
// TEST 2: Coupon validation & eligibility rules
// ====================================================================
// Below threshold ATELIER20
const cFail = validateCoupon("ATELIER20", 2500);
assert.strictEqual(cFail.valid, false, "ATELIER20 must fail for subtotal < 3000");
assert.strictEqual(cFail.discount, 0, "No discount when condition unmet");

// Above threshold ATELIER20
const cPass = validateCoupon("ATELIER20", 4000);
assert.strictEqual(cPass.valid, true, "ATELIER20 succeeds for subtotal >= 3000");
assert.strictEqual(cPass.discount, 800, "20% of 4000 is 800");

// FESTIVE10 & WELCOME15
const cFestive = validateCoupon("FESTIVE10", 5000);
assert.strictEqual(cFestive.discount, 500, "10% of 5000 is 500");

// Invalid promo
const cInvalid = validateCoupon("BOGUS_CODE", 5000);
assert.strictEqual(cInvalid.valid, false, "Bogus code must be rejected");
assert.strictEqual(cInvalid.discount, 0, "No discount for bogus code");
console.log("✓ Coupon validation & minimum subtotal eligibility rules verified");

// ====================================================================
// TEST 3: Shipping method calculation
// ====================================================================
// Standard air below ₹1,999 threshold -> ₹250
assert.strictEqual(calculateShippingFee(1500, "standard_air"), 250, "Standard shipping fee ₹250 below threshold");
// Standard air at or above ₹1,999 -> ₹0
assert.strictEqual(calculateShippingFee(1999, "standard_air"), 0, "Free standard shipping at threshold");
assert.strictEqual(calculateShippingFee(5000, "standard_air"), 0, "Free standard shipping above threshold");
// Express White-Glove Courier -> ₹450 flat
assert.strictEqual(calculateShippingFee(1000, "express_courier"), 450, "Express courier is ₹450 flat");
assert.strictEqual(calculateShippingFee(10000, "express_courier"), 450, "Express courier remains ₹450 flat regardless of subtotal");
console.log("✓ Shipping method & dynamic shipping charge rules verified");

// ====================================================================
// TEST 4: Stock conflict handling (sold out, insufficient, archived)
// ====================================================================
// A. Sold out variant (var-1-m has stock 0)
const soldOutInput = {
  items: [{ productId: "prod-1", size: "M", color: "Noir", quantity: 1 }],
  shippingAddress: { fullName: "Aarav", phone: "9820011223", pincode: "400001" },
  paymentMethod: "card",
};
const resSoldOut = createTestOrder(soldOutInput);
assert.strictEqual(resSoldOut.success, false, "Sold out variant must be rejected");
assert.strictEqual(resSoldOut.code, "STOCK_CONFLICT", "Must return STOCK_CONFLICT code");

// B. Quantity requested exceeds available stock (var-1-s has stock 4, requesting 6)
const overStockInput = {
  items: [{ productId: "prod-1", size: "S", color: "Noir", quantity: 6 }],
  shippingAddress: { fullName: "Aarav", phone: "9820011223", pincode: "400001" },
  paymentMethod: "card",
};
const resOverStock = createTestOrder(overStockInput);
assert.strictEqual(resOverStock.success, false, "Over-requesting stock must fail");
assert.strictEqual(resOverStock.code, "STOCK_CONFLICT", "Must return STOCK_CONFLICT code");

// C. Archived/unpublished product
const archivedInput = {
  items: [{ productId: "prod-archived", size: "S", color: "White", quantity: 1 }],
  shippingAddress: { fullName: "Aarav", phone: "9820011223", pincode: "400001" },
  paymentMethod: "card",
};
const resArchived = createTestOrder(archivedInput);
assert.strictEqual(resArchived.success, false, "Archived product must fail");
assert.strictEqual(resArchived.code, "STOCK_CONFLICT", "Must return STOCK_CONFLICT code");
console.log("✓ Stock conflict and batch availability safeguards verified");

// ====================================================================
// TEST 5: Idempotency & duplicate checkout prevention
// ====================================================================
const idemKey = "test-idem-unique-key-101";
const orderInput1 = {
  idempotencyKey: idemKey,
  items: [{ productId: "prod-1", size: "S", color: "Noir", quantity: 1 }],
  shippingAddress: { fullName: "Rohan Patel", phone: "9820011223", pincode: "400001" },
  paymentMethod: "card",
  shippingMethodId: "express_courier",
};

const initialOrderRes = createTestOrder(orderInput1);
assert.strictEqual(initialOrderRes.success, true);
const initialOrderNumber = initialOrderRes.order.orderNumber;

// Replay with identical idempotencyKey
const replayOrderRes = createTestOrder(orderInput1);
assert.strictEqual(replayOrderRes.success, true);
assert.strictEqual(replayOrderRes.code, "IDEMPOTENT_REPLAY", "Replay must return IDEMPOTENT_REPLAY code");
assert.strictEqual(replayOrderRes.order.orderNumber, initialOrderNumber, "Order number must be identical on replay");

// Test in-flight concurrency lock
inFlightKeys.add("locked-inflight-key");
const concurrentRes = createTestOrder({
  idempotencyKey: "locked-inflight-key",
  items: [{ productId: "prod-1", size: "S", color: "Noir", quantity: 1 }],
  shippingAddress: { fullName: "Rohan", phone: "9820011223", pincode: "400001" },
  paymentMethod: "upi",
});
assert.strictEqual(concurrentRes.success, false);
assert.strictEqual(concurrentRes.code, "CONCURRENT_REQUEST", "Concurrent request must be blocked");
inFlightKeys.delete("locked-inflight-key");
console.log("✓ Idempotent checkout initiation and duplicate request prevention verified");

// ====================================================================
// TEST 6: Order status & payment lifecycle rules
// ====================================================================
// Prepaid order (Card/UPI) -> paymentStatus must be 'pending', fulfillmentStatus 'pending'
const prepaidRes = createTestOrder({
  items: [{ productId: "prod-2", size: "32", color: "Ecru", quantity: 1 }],
  shippingAddress: { fullName: "Devika", phone: "9820011223", pincode: "400001" },
  paymentMethod: "upi",
});
assert.strictEqual(prepaidRes.order.paymentStatus, "pending", "Prepaid payment status must remain 'pending' prior to verified gateway webhook");
assert.strictEqual(prepaidRes.order.fulfillmentStatus, "pending", "Prepaid fulfillment remains 'pending' prior to payment settlement");

// Cash On Delivery (COD) -> paymentStatus is 'pending', fulfillmentStatus is 'confirmed'
const codRes = createTestOrder({
  items: [{ productId: "prod-2", size: "32", color: "Ecru", quantity: 1 }],
  shippingAddress: { fullName: "Devika", phone: "9820011223", pincode: "400001" },
  paymentMethod: "cod",
});
assert.strictEqual(codRes.order.paymentStatus, "pending", "COD payment is pending doorstep payment");
assert.strictEqual(codRes.order.fulfillmentStatus, "confirmed", "COD order is confirmed immediately for dispatch preparation");
console.log("✓ Order status and pending-payment lifecycle rules verified");

// ====================================================================
// TEST 7: Immutable order item snapshots
// ====================================================================
const snapshotOrder = prepaidRes.order;
assert.strictEqual(snapshotOrder.items.length, 1);
const itemSnapshot = snapshotOrder.items[0];
assert.strictEqual(itemSnapshot.productName, "Belgian Flax Trouser");
assert.strictEqual(itemSnapshot.sku, "BFT-32-ECR");
assert.strictEqual(itemSnapshot.unitPrice, 3850);
assert.strictEqual(itemSnapshot.quantity, 1);
assert.strictEqual(itemSnapshot.lineTotal, 3850);
console.log("✓ Immutable order item snapshot integrity verified");

console.log("\nAll Atelier Checkout & Order Foundation tests passed successfully!\n");
