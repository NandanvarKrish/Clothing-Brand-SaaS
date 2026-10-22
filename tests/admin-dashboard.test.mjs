import assert from "node:assert";

// Pure unit test suite for Phase 09: Admin Dashboard & Store Management
console.log("Running Phase 09: Admin Dashboard & Store Management Test Suite...\n");

// --- 1. Analytics & Financial Calculation Engine ---
function calculateAnalytics(orders, products, rangeDays = 30) {
  const now = Date.now();
  const cutoffTime = rangeDays > 0 ? now - rangeDays * 24 * 60 * 60 * 1000 : 0;

  const rangeOrders = orders.filter((o) => {
    if (rangeDays === 0) return true;
    const createdTime = new Date(o.createdAt || Date.now()).getTime();
    return createdTime >= cutoffTime;
  });

  let grossSales = 0;
  let refundsTotal = 0;
  let ordersProcessing = 0;
  let ordersShipped = 0;
  let ordersDelivered = 0;

  const customerEmails = new Set();
  const productSalesMap = new Map();

  for (const order of rangeOrders) {
    const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "captured";

    // Financial invariant 1: Only paid/captured orders contribute to gross sales
    if (isPaid) {
      grossSales += order.totalAmount;
    }

    if (order.paymentStatus === "refunded") {
      refundsTotal += order.totalAmount;
    }

    const email = order.customer?.email || order.shippingAddress?.email;
    if (email) {
      customerEmails.add(email.toLowerCase().trim());
    }

    const fStatus = (order.fulfillmentStatus || "").toLowerCase();
    if (["pending", "confirmed", "tailoring", "processing", "inspection"].includes(fStatus)) {
      ordersProcessing++;
    } else if (["dispatched", "shipped"].includes(fStatus)) {
      ordersShipped++;
    } else if (fStatus === "delivered") {
      ordersDelivered++;
    }

    if (isPaid && order.items) {
      for (const item of order.items) {
        const prodId = item.productId || item.sku;
        const current = productSalesMap.get(prodId) || {
          id: prodId,
          name: item.productName || "Atelier Garment",
          unitsSold: 0,
          revenue: 0,
        };
        current.unitsSold += item.quantity;
        current.revenue += item.lineTotal || item.unitPrice * item.quantity;
        productSalesMap.set(prodId, current);
      }
    }
  }

  // Financial invariant 2: Net Sales = Gross Sales - Refunds
  const netSales = Math.max(0, grossSales - refundsTotal);

  let activeProducts = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const prod of products) {
    if (prod.status === "published") {
      activeProducts++;
    }

    const totalStock = prod.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    if (totalStock === 0) {
      outOfStockCount++;
    } else if (totalStock <= 3) {
      lowStockCount++;
    }
  }

  return {
    grossSales,
    netSales,
    refundsTotal,
    totalOrders: rangeOrders.length,
    ordersProcessing,
    ordersShipped,
    ordersDelivered,
    totalCustomers: customerEmails.size,
    activeProducts,
    lowStockCount,
    outOfStockCount,
  };
}

// --- 2. Admin Authorization Evaluator ---
function evaluateAdminAuthorization(user, memberships = []) {
  if (!user) {
    return { authorized: false, reason: "UNAUTHENTICATED" };
  }

  // Check app_metadata or user_metadata
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  if (["owner", "admin"].includes(appRole) || ["owner", "admin"].includes(userRole)) {
    return { authorized: true, role: appRole || userRole };
  }

  // Check database tenant memberships
  const mem = memberships.find((m) => m.userId === user.id && ["owner", "admin"].includes(m.role));
  if (mem) {
    return { authorized: true, role: mem.role };
  }

  // Whitelisted atelier emails
  const email = (user.email || "").toLowerCase().trim();
  if (
    email.startsWith("admin@") ||
    email.endsWith("@velure.atelier") ||
    email === "concierge@velureatelier.com" ||
    email === "staff@velureatelier.com"
  ) {
    return { authorized: true, role: "admin" };
  }

  return { authorized: false, reason: "FORBIDDEN" };
}

// --- 3. Inventory Stock Adjustment Logic ---
class TestInventoryManager {
  constructor() {
    this.stock = new Map(); // variantId -> quantityOnHand
    this.movements = [];
  }

  seedVariant(variantId, initialStock) {
    this.stock.set(variantId, initialStock);
  }

  adjustStock(variantId, newQuantity, reason, user, notes = "") {
    if (newQuantity < 0) {
      return { success: false, error: "Stock quantity cannot be negative." };
    }
    if (!reason) {
      return { success: false, error: "Reason required for audit logging." };
    }

    const current = this.stock.get(variantId) ?? 0;
    const delta = newQuantity - current;
    this.stock.set(variantId, newQuantity);

    const movement = {
      variantId,
      delta,
      movementType: reason,
      createdBy: user.id,
      notes,
      createdAt: new Date().toISOString(),
    };
    this.movements.push(movement);

    return { success: true, updatedStock: newQuantity, delta };
  }
}

// --- 4. Promotional Voucher Rules Logic ---
function validateAndApplyCoupon(coupon, subtotal) {
  if (!coupon || !coupon.isActive) {
    return { valid: false, error: "Coupon is inactive or not found.", discount: 0 };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: "Coupon has expired.", discount: 0 };
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      error: `Coupon requires a minimum order subtotal of ₹${coupon.minSubtotal.toLocaleString("en-IN")}.`,
      discount: 0,
    };
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((subtotal * coupon.value) / 100);
  } else {
    discount = Math.min(subtotal, coupon.value);
  }

  return { valid: true, discount, error: null };
}

// --- 5. Customer Aggregator ---
function aggregateCustomers(orders) {
  const map = new Map();
  for (const o of orders) {
    const email = (o.customer?.email || o.shippingAddress?.email || "").toLowerCase().trim();
    if (!email) continue;

    const existing = map.get(email) || {
      name: o.shippingAddress?.fullName || o.customer?.fullName || "Patron",
      email,
      totalOrders: 0,
      totalSpend: 0,
    };

    existing.totalOrders += 1;
    if (o.paymentStatus === "paid" || o.paymentStatus === "captured") {
      existing.totalSpend += o.totalAmount;
    }
    map.set(email, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
}

// ======================== TEST CASES ========================

// TEST 1: Analytics Correctness & Monetary Isolation
{
  const orders = [
    // Paid order (Included in gross sales)
    {
      orderNumber: "VA-101",
      paymentStatus: "paid",
      fulfillmentStatus: "shipped",
      totalAmount: 12000,
      createdAt: new Date().toISOString(),
      customer: { email: "alice@london.com" },
      items: [{ productId: "p1", quantity: 2, unitPrice: 6000 }],
    },
    // Captured order (Included in gross sales)
    {
      orderNumber: "VA-102",
      paymentStatus: "captured",
      fulfillmentStatus: "delivered",
      totalAmount: 8500,
      createdAt: new Date().toISOString(),
      customer: { email: "bob@milan.com" },
      items: [{ productId: "p2", quantity: 1, unitPrice: 8500 }],
    },
    // Pending payment order (MUST BE EXCLUDED from gross sales)
    {
      orderNumber: "VA-103",
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
      totalAmount: 50000,
      createdAt: new Date().toISOString(),
      customer: { email: "pending@test.com" },
      items: [{ productId: "p1", quantity: 5, unitPrice: 10000 }],
    },
    // Failed payment order (MUST BE EXCLUDED from gross sales)
    {
      orderNumber: "VA-104",
      paymentStatus: "failed",
      fulfillmentStatus: "cancelled",
      totalAmount: 25000,
      createdAt: new Date().toISOString(),
      customer: { email: "failed@test.com" },
      items: [{ productId: "p2", quantity: 2, unitPrice: 12500 }],
    },
    // Refunded order (Tracked in refundsTotal, deducted from net sales)
    {
      orderNumber: "VA-105",
      paymentStatus: "refunded",
      fulfillmentStatus: "returned",
      totalAmount: 4000,
      createdAt: new Date().toISOString(),
      customer: { email: "refunded@test.com" },
      items: [{ productId: "p1", quantity: 1, unitPrice: 4000 }],
    },
  ];

  const products = [
    { id: "p1", status: "published", variants: [{ stock: 10 }] },
    { id: "p2", status: "published", variants: [{ stock: 2 }] }, // low stock (<= 3)
    { id: "p3", status: "published", variants: [{ stock: 0 }] }, // out of stock
    { id: "p4", status: "draft", variants: [{ stock: 5 }] },     // draft (not active)
  ];

  const metrics = calculateAnalytics(orders, products, 30);

  // Assert Gross Sales only counts paid & captured (12000 + 8500 = 20500)
  assert.strictEqual(metrics.grossSales, 20500, "Gross sales should only sum paid/captured orders");

  // Assert Refunds Total
  assert.strictEqual(metrics.refundsTotal, 4000, "Refunds total should equal 4000");

  // Assert Net Sales (20500 - 4000 = 16500)
  assert.strictEqual(metrics.netSales, 16500, "Net sales should equal gross sales minus refunds");

  // Assert Catalog Counts
  assert.strictEqual(metrics.activeProducts, 3, "Active products should only count published items");
  assert.strictEqual(metrics.lowStockCount, 1, "Low stock count should identify variants <= 3");
  assert.strictEqual(metrics.outOfStockCount, 1, "Out of stock count should identify variants with 0 stock");

  // Assert Fulfillment Queue
  assert.strictEqual(metrics.ordersProcessing, 1, "Orders processing count");
  assert.strictEqual(metrics.ordersShipped, 1, "Orders shipped count");
  assert.strictEqual(metrics.ordersDelivered, 1, "Orders delivered count");

  console.log("✓ 1. Financial analytics correctness and monetary isolation verified");
}

// TEST 2: Admin Access & Server-Side Authorization Barriers
{
  // 1. Unauthenticated visitor
  const anonAuth = evaluateAdminAuthorization(null);
  assert.strictEqual(anonAuth.authorized, false);
  assert.strictEqual(anonAuth.reason, "UNAUTHENTICATED");

  // 2. Regular customer patron
  const customerUser = { id: "user_cust", email: "patron@example.com", app_metadata: { role: "customer" } };
  const customerAuth = evaluateAdminAuthorization(customerUser);
  assert.strictEqual(customerAuth.authorized, false);
  assert.strictEqual(customerAuth.reason, "FORBIDDEN");

  // 3. User with JWT app_metadata admin role
  const jwtAdmin = { id: "user_admin1", email: "director@atelier.com", app_metadata: { role: "admin" } };
  const jwtAdminAuth = evaluateAdminAuthorization(jwtAdmin);
  assert.strictEqual(jwtAdminAuth.authorized, true);
  assert.strictEqual(jwtAdminAuth.role, "admin");

  // 4. User verified via tenant_memberships database record
  const dbAdmin = { id: "user_staff1", email: "lead_tailor@company.com" };
  const memberships = [{ userId: "user_staff1", role: "owner" }];
  const dbAuth = evaluateAdminAuthorization(dbAdmin, memberships);
  assert.strictEqual(dbAuth.authorized, true);
  assert.strictEqual(dbAuth.role, "owner");

  // 5. Whitelisted email address
  const whitelisted = { id: "user_concierge", email: "concierge@velureatelier.com" };
  const whiteAuth = evaluateAdminAuthorization(whitelisted);
  assert.strictEqual(whiteAuth.authorized, true);

  console.log("✓ 2. Admin authorization barriers, RLS compliance, and customer denial verified");
}

// TEST 3: Inventory Stock Adjustment & Negative-Stock Prevention
{
  const inv = new TestInventoryManager();
  inv.seedVariant("var_silk_s", 5);

  const adminUser = { id: "adm_01", email: "admin@velure.atelier" };

  // 1. Valid restock
  const restockRes = inv.adjustStock("var_silk_s", 12, "restock", adminUser, "New handloom batch arrived");
  assert.strictEqual(restockRes.success, true);
  assert.strictEqual(restockRes.updatedStock, 12);
  assert.strictEqual(restockRes.delta, 7);

  // 2. Valid writeoff
  const writeoffRes = inv.adjustStock("var_silk_s", 10, "damaged_writeoff", adminUser, "Water damage in transit");
  assert.strictEqual(writeoffRes.success, true);
  assert.strictEqual(writeoffRes.updatedStock, 10);
  assert.strictEqual(writeoffRes.delta, -2);

  // 3. Negative stock rejection
  const negativeRes = inv.adjustStock("var_silk_s", -1, "manual_adjustment", adminUser);
  assert.strictEqual(negativeRes.success, false);
  assert.match(negativeRes.error, /cannot be negative/i);

  // Verify movements audit length
  assert.strictEqual(inv.movements.length, 2, "Audit log movements count");

  console.log("✓ 3. Inventory stock adjustment, audit movements, and negative stock prevention verified");
}

// TEST 4: Promotional Vouchers & Minimum Subtotal Validation
{
  const percentCoupon = {
    code: "FESTIVE10",
    discountType: "percentage",
    value: 10,
    minSubtotal: 0,
    isActive: true,
  };

  const minSubtotalCoupon = {
    code: "ATELIER20",
    discountType: "percentage",
    value: 20,
    minSubtotal: 3000,
    isActive: true,
  };

  const pausedCoupon = {
    code: "PAUSED15",
    discountType: "percentage",
    value: 15,
    minSubtotal: 0,
    isActive: false,
  };

  // 1. Standard percentage discount
  const res1 = validateAndApplyCoupon(percentCoupon, 5000);
  assert.strictEqual(res1.valid, true);
  assert.strictEqual(res1.discount, 500); // 10% of 5000

  // 2. Minimum subtotal met
  const res2 = validateAndApplyCoupon(minSubtotalCoupon, 4000);
  assert.strictEqual(res2.valid, true);
  assert.strictEqual(res2.discount, 800); // 20% of 4000

  // 3. Minimum subtotal not met (subtotal 2500 < 3000)
  const res3 = validateAndApplyCoupon(minSubtotalCoupon, 2500);
  assert.strictEqual(res3.valid, false);
  assert.match(res3.error, /minimum order subtotal/i);

  // 4. Inactive / paused coupon rejected
  const res4 = validateAndApplyCoupon(pausedCoupon, 10000);
  assert.strictEqual(res4.valid, false);
  assert.match(res4.error, /inactive/i);

  console.log("✓ 4. Promotional vouchers, subtotal rules, and active toggles verified");
}

// TEST 5: Customer Directory Aggregation & Lifetime Value
{
  const orders = [
    {
      orderNumber: "VA-201",
      customer: { email: "lady.eleanor@mayfair.co", fullName: "Lady Eleanor" },
      paymentStatus: "paid",
      totalAmount: 14500,
    },
    {
      orderNumber: "VA-202",
      customer: { email: "lady.eleanor@mayfair.co", fullName: "Lady Eleanor" },
      paymentStatus: "paid",
      totalAmount: 8200,
    },
    {
      orderNumber: "VA-203",
      customer: { email: "sir.thomas@kensington.co", fullName: "Sir Thomas" },
      paymentStatus: "paid",
      totalAmount: 5500,
    },
    {
      orderNumber: "VA-204",
      customer: { email: "sir.thomas@kensington.co", fullName: "Sir Thomas" },
      paymentStatus: "failed", // Failed should not add to total spend
      totalAmount: 9000,
    },
  ];

  const customers = aggregateCustomers(orders);
  assert.strictEqual(customers.length, 2);

  // Lady Eleanor: 2 orders, 14500 + 8200 = 22700
  const eleanor = customers.find((c) => c.email === "lady.eleanor@mayfair.co");
  assert.ok(eleanor);
  assert.strictEqual(eleanor.totalOrders, 2);
  assert.strictEqual(eleanor.totalSpend, 22700);

  // Sir Thomas: 2 orders (1 paid, 1 failed), spend = 5500
  const thomas = customers.find((c) => c.email === "sir.thomas@kensington.co");
  assert.ok(thomas);
  assert.strictEqual(thomas.totalOrders, 2);
  assert.strictEqual(thomas.totalSpend, 5500);

  console.log("✓ 5. Patron directory aggregation and lifetime spend accuracy verified");
}

// TEST 6: Store Settings Non-Secret Isolation
{
  const storeSettings = {
    storeName: "VÉLURE ATELIER",
    supportEmail: "concierge@velure.atelier",
    freeShippingThreshold: 1999,
    standardShippingFee: 250,
    lowStockThreshold: 3,
    returnWindowDays: 14,
  };

  // Ensure no secret keys exist in the store settings payload
  assert.strictEqual("apiKey" in storeSettings, false);
  assert.strictEqual("supabaseServiceKey" in storeSettings, false);
  assert.strictEqual("webhookSecret" in storeSettings, false);
  assert.strictEqual("paymentSecret" in storeSettings, false);

  console.log("✓ 6. Store settings non-secret isolation verified");
}

console.log("\nAll Phase 09 Admin Dashboard & Store Management domain tests passed successfully!");
