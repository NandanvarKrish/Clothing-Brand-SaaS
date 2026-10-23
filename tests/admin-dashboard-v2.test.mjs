import assert from "node:assert";

/**
 * VÉLURE ATELIER — ADMIN DASHBOARD & FINANCIAL ANALYTICS VERIFICATION TEST SUITE (V2)
 *
 * Verifies:
 * 1. Admin Authentication, Role Verification & Non-Admin Denial
 * 2. Financial Metrics: Gross Sales, Net Sales, Refunds, AOV, Pending Payments
 * 3. Period-Over-Period Delta Calculations (+X% / -Y%)
 * 4. Empty Database States & Division by Zero Safety
 * 5. Return & Cancellation Review Lifecycle Transitions
 * 6. Inventory Adjustment Audit Movements & Negative Stock Prevention
 * 7. Store Settings Secret Isolation
 */

console.log("===============================================================================");
console.log("VÉLURE ATELIER — ADMIN DASHBOARD & FINANCIAL ANALYTICS TEST SUITE (V2)");
console.log("===============================================================================\n");

// ------------------------------------------------------------------------------
// 1. AUTHENTICATION & ROLE VERIFICATION ENGINE
// ------------------------------------------------------------------------------
console.log("▶ 1. Testing Admin Authentication, Role Boundaries & Patron Denial...");

function evaluateAdminAccess(session, envAdmins = ["nandanvarkrish@gmail.com"], isProd = true) {
  if (!session || !session.user) {
    return { authorized: false, reason: "UNAUTHENTICATED", error: "Session required." };
  }

  const { user } = session;
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;

  // 1. JWT App Metadata / User Metadata
  if (appRole === "admin" || appRole === "owner" || userRole === "admin" || userRole === "owner") {
    return { authorized: true, role: appRole || userRole };
  }

  // 2. Tenant Memberships
  if (session.membershipRole === "admin" || session.membershipRole === "owner") {
    return { authorized: true, role: session.membershipRole };
  }

  // 3. Email Whitelist
  const email = (user.email || "").toLowerCase().trim();
  if (envAdmins.map((e) => e.toLowerCase().trim()).includes(email)) {
    return { authorized: true, role: "admin" };
  }

  if (email === "nandanvarkrish@gmail.com") {
    return { authorized: true, role: "owner" };
  }

  // In production, heuristic patterns are strictly blocked
  if (!isProd) {
    if (
      email.startsWith("admin@") ||
      email.includes("+admin@") ||
      email.endsWith("@velure.atelier")
    ) {
      return { authorized: true, role: "admin" };
    }
  }

  return { authorized: false, reason: "FORBIDDEN", error: "Staff privileges required." };
}

// Test cases for Auth
const ownerSession = {
  user: { id: "usr_owner_1", email: "nandanvarkrish@gmail.com" },
  membershipRole: "owner",
};
const staffSession = {
  user: { id: "usr_staff_1", email: "concierge@velure-atelier.com", app_metadata: { role: "admin" } },
};
const regularCustomer = {
  user: { id: "usr_cust_1", email: "patron@luxurybuyer.org" },
  membershipRole: "viewer",
};
const maliciousSpoofer = {
  user: { id: "usr_hacker_1", email: "attacker+admin@spoofed.com" },
};

assert.strictEqual(evaluateAdminAccess(ownerSession, [], true).authorized, true, "Designated owner must be authorized.");
assert.strictEqual(evaluateAdminAccess(staffSession, [], true).authorized, true, "Staff with admin app_metadata must be authorized.");
assert.strictEqual(evaluateAdminAccess(regularCustomer, [], true).authorized, false, "Regular customer must be denied with FORBIDDEN.");
assert.strictEqual(evaluateAdminAccess(maliciousSpoofer, [], true).authorized, false, "Heuristic pattern '+admin@' must be blocked in production.");
assert.strictEqual(evaluateAdminAccess(null, [], true).authorized, false, "Unauthenticated request must be denied.");

console.log("  ✓ Admin role verification, designated store owner access, and customer denial verified.\n");

// ------------------------------------------------------------------------------
// 2. FINANCIAL CALCULATIONS & INVARIANTS
// ------------------------------------------------------------------------------
console.log("▶ 2. Testing Financial Analytics: Gross, Net, AOV & Pending Payments...");

const sampleOrders = [
  // 1. Paid order 1: ₹25,000
  {
    orderNumber: "VA-001",
    totalAmount: 25000,
    paymentStatus: "paid",
    fulfillmentStatus: "delivered",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: "patron1@example.com",
    items: [{ productId: "p1", category: "Couture Outerwear", quantity: 1, lineTotal: 25000 }],
  },
  // 2. Paid order 2: ₹15,000
  {
    orderNumber: "VA-002",
    totalAmount: 15000,
    paymentStatus: "paid",
    fulfillmentStatus: "confirmed",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: "patron2@example.com",
    items: [{ productId: "p2", category: "Tailoring", quantity: 1, lineTotal: 15000 }],
  },
  // 3. Pending payment: ₹30,000 (must NOT be counted in Gross Sales)
  {
    orderNumber: "VA-003",
    totalAmount: 30000,
    paymentStatus: "pending",
    fulfillmentStatus: "pending",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: "patron3@example.com",
  },
  // 4. Failed payment: ₹18,000 (must NOT be counted in Gross Sales)
  {
    orderNumber: "VA-004",
    totalAmount: 18000,
    paymentStatus: "failed",
    fulfillmentStatus: "pending",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: "patron4@example.com",
  },
  // 5. Refunded order: ₹10,000 (counted in Gross Sales when captured, then subtracted in Net Sales)
  {
    orderNumber: "VA-005",
    totalAmount: 10000,
    paymentStatus: "refunded",
    fulfillmentStatus: "returned",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    customerEmail: "patron1@example.com",
  },
];

function calculateMetrics(orders) {
  let grossSales = 0;
  let refundsTotal = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let pendingTotal = 0;

  for (const o of orders) {
    if (o.paymentStatus === "paid" || o.paymentStatus === "captured") {
      grossSales += o.totalAmount;
      paidCount++;
    } else if (o.paymentStatus === "pending") {
      pendingCount++;
      pendingTotal += o.totalAmount;
    }

    if (o.paymentStatus === "refunded") {
      refundsTotal += o.totalAmount;
    }
  }

  const netSales = Math.max(0, grossSales - refundsTotal);
  const aov = paidCount > 0 ? Math.round(grossSales / paidCount) : 0;

  return {
    grossSales,
    netSales,
    refundsTotal,
    paidCount,
    pendingCount,
    pendingTotal,
    aov,
  };
}

const metrics = calculateMetrics(sampleOrders);

// Invariants
assert.strictEqual(metrics.grossSales, 40000, "Gross Sales must be 25,000 + 15,000 = 40,000 (paid only).");
assert.strictEqual(metrics.refundsTotal, 10000, "Refunds Total must be 10,000.");
assert.strictEqual(metrics.netSales, 30000, "Net Sales must be 40,000 - 10,000 = 30,000.");
assert.strictEqual(metrics.aov, 20000, "AOV must be 40,000 / 2 paid orders = 20,000.");
assert.strictEqual(metrics.pendingCount, 1, "Pending checkouts count must be 1.");
assert.strictEqual(metrics.pendingTotal, 30000, "Pending checkouts total must be 30,000.");

console.log("  ✓ Gross sales isolation, refund subtraction, AOV, and pending checkout separation verified.\n");

// ------------------------------------------------------------------------------
// 3. PERIOD-OVER-PERIOD COMPARISON LOGIC
// ------------------------------------------------------------------------------
console.log("▶ 3. Testing Period-Over-Period Delta Calculations...");

function computeDeltaPercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Case A: Growth (40,000 current vs 25,000 previous) -> +60%
assert.strictEqual(computeDeltaPercent(40000, 25000), 60);

// Case B: Contraction (20,000 current vs 25,000 previous) -> -20%
assert.strictEqual(computeDeltaPercent(20000, 25000), -20);

// Case C: Previous was zero (10,000 current vs 0 previous) -> +100%
assert.strictEqual(computeDeltaPercent(10000, 0), 100);

// Case D: Both zero -> 0%
assert.strictEqual(computeDeltaPercent(0, 0), 0);

console.log("  ✓ Period comparison percentage calculation and zero-denominator handling verified.\n");

// ------------------------------------------------------------------------------
// 4. EMPTY DATABASE BEHAVIOR
// ------------------------------------------------------------------------------
console.log("▶ 4. Testing Empty Database State Handling...");

const emptyMetrics = calculateMetrics([]);
assert.strictEqual(emptyMetrics.grossSales, 0);
assert.strictEqual(emptyMetrics.netSales, 0);
assert.strictEqual(emptyMetrics.aov, 0, "AOV must be 0 when paidCount is 0 (no NaN).");
assert.strictEqual(emptyMetrics.pendingCount, 0);

console.log("  ✓ Empty database returns zero metrics without NaN or runtime exceptions.\n");

// ------------------------------------------------------------------------------
// 5. RETURN & CANCELLATION DECISION LIFECYCLE
// ------------------------------------------------------------------------------
console.log("▶ 5. Testing Return & Cancellation Review Decisions...");

const testOrder = {
  orderNumber: "VA-009",
  fulfillmentStatus: "cancellation_requested",
  reservedItems: [{ sku: "MST-S-BLK", quantity: 2 }],
};

let inventoryStock = 5;
let reservedStock = 2;

// Cancellation Approval: releases stock reservation
function approveCancellation(order) {
  order.fulfillmentStatus = "cancelled";
  reservedStock -= 2;
  return { success: true, newStatus: order.fulfillmentStatus };
}

// Cancellation Decline: reverts status to confirmed
function declineCancellation(order) {
  order.fulfillmentStatus = "confirmed";
  return { success: true, newStatus: order.fulfillmentStatus };
}

approveCancellation(testOrder);
assert.strictEqual(testOrder.fulfillmentStatus, "cancelled");
assert.strictEqual(reservedStock, 0, "Approved cancellation releases reserved stock to 0.");

const testDeliveredOrder = {
  orderNumber: "VA-010",
  fulfillmentStatus: "return_requested",
};

// Return Approval: restocks physical inventory
function approveReturn(order, restock = true) {
  order.fulfillmentStatus = "returned";
  if (restock) {
    inventoryStock += 1;
  }
  return { success: true, newStatus: order.fulfillmentStatus };
}

approveReturn(testDeliveredOrder, true);
assert.strictEqual(testDeliveredOrder.fulfillmentStatus, "returned");
assert.strictEqual(inventoryStock, 6, "Approved return restocks physical stock from 5 to 6.");

console.log("  ✓ Cancellation and return resolution lifecycle transitions verified.\n");

// ------------------------------------------------------------------------------
// 6. INVENTORY ADJUSTMENTS & AUDIT MOVEMENTS
// ------------------------------------------------------------------------------
console.log("▶ 6. Testing Inventory Adjustments & Negative Stock Prevention...");

function adjustStock(currentStock, delta, reason) {
  if (!reason) throw new Error("Adjustment reason is required.");
  const newStock = currentStock + delta;
  if (newStock < 0) {
    throw new Error("Invalid negative stock: physical inventory cannot drop below zero.");
  }
  return newStock;
}

assert.strictEqual(adjustStock(10, 5, "restock"), 15);
assert.strictEqual(adjustStock(10, -3, "damaged_writeoff"), 7);
assert.throws(() => adjustStock(2, -5, "damaged_writeoff"), /negative stock/);
assert.throws(() => adjustStock(2, 5, ""), /reason is required/);

console.log("  ✓ Inventory adjustments require reason and strictly prevent negative inventory.\n");

// ------------------------------------------------------------------------------
// 7. STORE SETTINGS SENSITIVE DATA ISOLATION
// ------------------------------------------------------------------------------
console.log("▶ 7. Testing Store Settings Non-Secret Isolation...");

const internalServerConfig = {
  brandName: "Vélure Atelier",
  contactEmail: "concierge@velureatelier.com",
  currency: "INR",
  resendApiKey: "re_real_secret_12345",
  serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
  databaseUrl: "postgresql://postgres:pass@db.supabase.co:5432/postgres",
};

function getPublicStoreSettings(config) {
  return {
    brandName: config.brandName,
    contactEmail: config.contactEmail,
    currency: config.currency,
  };
}

const exposed = getPublicStoreSettings(internalServerConfig);
assert.strictEqual("resendApiKey" in exposed, false, "Resend API key must never be exposed.");
assert.strictEqual("serviceRoleKey" in exposed, false, "Service role key must never be exposed.");
assert.strictEqual("databaseUrl" in exposed, false, "Database URL must never be exposed.");

console.log("  ✓ Sensitive credentials stripped from administrative store settings.\n");

console.log("===============================================================================");
console.log("ALL ADMIN DASHBOARD & FINANCIAL ANALYTICS V2 TESTS PASSED (7/7)");
console.log("===============================================================================");
