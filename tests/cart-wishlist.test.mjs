import assert from "node:assert";

// Pure unit tests for Cart & Wishlist algorithms & domain rules

const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 250;

function calculateCartTotals(items, couponCode) {
  const availableItems = items.filter((i) => i.isAvailable !== false);
  const itemCount = availableItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = availableItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  let discount = 0;
  let appliedCoupon = null;
  let couponError = null;

  if (couponCode) {
    const clean = couponCode.trim().toUpperCase();
    if (clean === "FESTIVE10") {
      discount = Math.round(subtotal * 0.1);
      appliedCoupon = clean;
    } else if (clean === "WELCOME15") {
      discount = Math.round(subtotal * 0.15);
      appliedCoupon = clean;
    } else if (clean === "ATELIER20") {
      if (subtotal >= 3000) {
        discount = Math.round(subtotal * 0.2);
        appliedCoupon = clean;
      } else {
        couponError = "ATELIER20 requires minimum subtotal of ₹3,000.";
      }
    } else {
      couponError = "Invalid promotional code.";
    }
  }

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shipping);

  return { itemCount, subtotal, discount, shipping, total, appliedCoupon, couponError };
}

function reconcileCartItems(guestItems, userItems) {
  const merged = new Map();
  for (const item of userItems) {
    merged.set(item.id, { ...item });
  }
  for (const guestItem of guestItems) {
    const existing = merged.get(guestItem.id);
    if (existing) {
      const mergedQty = Math.min(existing.quantity + guestItem.quantity, existing.maxStock || 20);
      merged.set(guestItem.id, { ...existing, quantity: mergedQty });
    } else {
      merged.set(guestItem.id, { ...guestItem });
    }
  }
  return Array.from(merged.values());
}

function reconcileWishlistIds(guestIds, userIds) {
  return Array.from(new Set([...userIds, ...guestIds]));
}

console.log("Running cart & wishlist domain self-check...");

// 1. Line item subtotals, free shipping & total calculation
const testCart = [
  { id: "i1", price: 1200, quantity: 1, isAvailable: true, maxStock: 5 },
  { id: "i2", price: 800, quantity: 1, isAvailable: true, maxStock: 3 },
  { id: "i3", price: 5000, quantity: 1, isAvailable: false, maxStock: 0 } // unavailable
];

const res1 = calculateCartTotals(testCart, "FESTIVE10");
assert.strictEqual(res1.itemCount, 2, "Only available items are counted");
assert.strictEqual(res1.subtotal, 2000, "Subtotal must exclude unavailable items (1200 + 800 = 2000)");
assert.strictEqual(res1.discount, 200, "10% coupon discount applied");
assert.strictEqual(res1.shipping, 0, "Free shipping unlocked at >= ₹1999");
assert.strictEqual(res1.total, 1800, "2000 - 200 + 0 = 1800");

// Below threshold shipping test
const testCartBelow = [{ id: "i1", price: 1500, quantity: 1, isAvailable: true, maxStock: 5 }];
const resBelow = calculateCartTotals(testCartBelow, null);
assert.strictEqual(resBelow.shipping, 250, "Shipping must be 250 below ₹1999");
assert.strictEqual(resBelow.total, 1750, "1500 + 250 = 1750");

// 2. Minimum subtotal coupon checks
const resAtelierFail = calculateCartTotals(testCart, "ATELIER20");
assert.strictEqual(resAtelierFail.discount, 0, "ATELIER20 requires subtotal >= 3000");
assert.notStrictEqual(resAtelierFail.couponError, null, "Should return coupon error");

const highSubtotalCart = [{ id: "i1", price: 4000, quantity: 1, isAvailable: true, maxStock: 5 }];
const resAtelierPass = calculateCartTotals(highSubtotalCart, "ATELIER20");
assert.strictEqual(resAtelierPass.discount, 800, "20% of 4000 is 800");

// 3. Cart reconciliation on login (merging guest items into user cart)
const guest = [
  { id: "v-1", quantity: 2, maxStock: 5 },
  { id: "v-guest", quantity: 1, maxStock: 3 }
];
const user = [
  { id: "v-1", quantity: 1, maxStock: 5 },
  { id: "v-user", quantity: 1, maxStock: 2 }
];
const merged = reconcileCartItems(guest, user);
assert.strictEqual(merged.length, 3, "Should have 3 distinct line items");

const mergedV1 = merged.find((i) => i.id === "v-1");
assert.strictEqual(mergedV1.quantity, 3, "Quantities merge: 1 + 2 = 3");

// Capping at variant maxStock
const guestOver = [{ id: "v-cap", quantity: 4, maxStock: 5 }];
const userOver = [{ id: "v-cap", quantity: 3, maxStock: 5 }];
const mergedCapped = reconcileCartItems(guestOver, userOver);
assert.strictEqual(mergedCapped[0].quantity, 5, "Capped at maxStock 5 instead of 7");

// 4. Wishlist reconciliation on login (unique union)
const guestW = ["prod-001", "prod-002", "prod-003"];
const userW = ["prod-002", "prod-004"];
const mergedW = reconcileWishlistIds(guestW, userW);
assert.strictEqual(mergedW.length, 4, "Unique product union (prod-001, 002, 003, 004)");
assert.deepStrictEqual(mergedW.sort(), ["prod-001", "prod-002", "prod-003", "prod-004"].sort());

console.log("All cart & wishlist self-checks passed successfully!");
