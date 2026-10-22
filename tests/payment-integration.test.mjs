import assert from "node:assert";
import crypto from "node:crypto";

// Domain Unit Tests for Phase 07: Payment Gateway Evaluation & Integration

console.log("Running Phase 07: Payment Gateway Integration Test Suite...\n");

// --- Mock Provider Implementation for Pure Unit Testing ---
class TestSandboxProvider {
  constructor(secret = "test_webhook_secret_key_32chars_long") {
    this.secret = secret;
    this.isProductionReady = false;
  }

  assertSafeExecutionEnvironment(nodeEnv, allowTest) {
    if (nodeEnv === "production" && allowTest !== "true") {
      throw new Error("SECURITY EXCEPTION: Test payment provider cannot be activated in production.");
    }
  }

  createSession(params, env = {}) {
    this.assertSafeExecutionEnvironment(env.NODE_ENV, env.ALLOW_TEST_PAYMENTS);

    if (!params.orderNumber || !params.amountPaise) {
      throw new Error("Missing required order fields");
    }

    const paymentId = `test_pay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return {
      success: true,
      paymentId,
      checkoutUrl: `http://localhost:7000/checkout/${paymentId}`,
      status: "initiated",
      orderNumber: params.orderNumber,
      amountPaise: params.amountPaise,
    };
  }

  generateSignedWebhook(payload, secretOverride) {
    const rawBody = JSON.stringify(payload);
    const secret = secretOverride || this.secret;
    const hash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    return {
      rawBody,
      headers: {
        "content-type": "application/json",
        "x-gateway-signature": `sha256=${hash}`,
        "x-gateway-delivery-id": `del_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      },
    };
  }

  verifyWebhook(rawBody, headers) {
    const sigHeader = headers["x-gateway-signature"] || "";
    if (!sigHeader.startsWith("sha256=")) {
      return { isValid: false, error: "Missing or malformed signature header", httpStatus: 401 };
    }

    const actualHash = sigHeader.replace("sha256=", "").trim();
    const expectedHash = crypto.createHmac("sha256", this.secret).update(rawBody, "utf8").digest("hex");

    const bufActual = Buffer.from(actualHash, "hex");
    const bufExpected = Buffer.from(expectedHash, "hex");

    if (bufActual.length !== bufExpected.length || !crypto.timingSafeEqual(bufActual, bufExpected)) {
      return { isValid: false, error: "Signature mismatch", httpStatus: 401 };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { isValid: false, error: "Malformed JSON", httpStatus: 400 };
    }

    if (!parsed.event || !parsed.paymentId || !parsed.orderId) {
      return { isValid: false, error: "Missing required payload fields", httpStatus: 400 };
    }

    return { isValid: true, payload: parsed, httpStatus: 200 };
  }
}

// --- In-Memory Test Order Repository & Payment State Machine ---
const testOrderStore = new Map();
const processedDeliveries = new Set();

function resetStore() {
  testOrderStore.clear();
  processedDeliveries.clear();
}

function seedOrder(order) {
  testOrderStore.set(order.orderNumber, { ...order });
}

function processWebhook(rawBody, headers, provider) {
  const verification = provider.verifyWebhook(rawBody, headers);
  if (!verification.isValid) {
    return { success: false, httpStatus: verification.httpStatus, error: verification.error };
  }

  const deliveryId = headers["x-gateway-delivery-id"] || "default_del";
  if (processedDeliveries.has(deliveryId)) {
    return { success: true, httpStatus: 200, duplicate: true, message: "Already processed" };
  }

  const payload = verification.payload;
  const order = testOrderStore.get(payload.orderId);
  if (!order) {
    return { success: false, httpStatus: 404, error: "Order not found" };
  }

  // Anti-tampering: verify amount in paise
  const expectedPaise = Math.round(order.totalAmount * 100);
  if (payload.amountPaise !== expectedPaise) {
    return { success: false, httpStatus: 400, error: "Amount mismatch" };
  }

  if (payload.currency && payload.currency !== "INR") {
    return { success: false, httpStatus: 400, error: "Currency mismatch" };
  }

  // Idempotent duplicate check if already paid
  if (order.paymentStatus === "paid" && payload.event === "SUCCESS") {
    processedDeliveries.add(deliveryId);
    return { success: true, httpStatus: 200, duplicate: true };
  }

  // Transition state
  if (payload.event === "SUCCESS") {
    order.paymentStatus = "paid";
    order.fulfillmentStatus = "confirmed";
    order.bankReferenceNumber = payload.utr;
  } else if (payload.event === "FAILED") {
    order.paymentStatus = "failed";
  } else if (payload.event === "EXPIRED") {
    order.paymentStatus = "failed";
  } else if (payload.event === "CANCELLED") {
    order.paymentStatus = "failed";
    order.fulfillmentStatus = "cancelled";
  }

  testOrderStore.set(order.orderNumber, order);
  processedDeliveries.add(deliveryId);

  return { success: true, httpStatus: 200, newStatus: order.paymentStatus, order };
}

const provider = new TestSandboxProvider("secret_hmac_key_test_2026");

// ====================================================================
// TEST 1: Payment session creation from trusted internal order
// ====================================================================
resetStore();
seedOrder({
  orderNumber: "VEL-2024-1001",
  totalAmount: 3850,
  paymentStatus: "pending",
  fulfillmentStatus: "pending",
});

const session = provider.createSession({
  orderNumber: "VEL-2024-1001",
  amountPaise: 385000,
});
assert.strictEqual(session.success, true);
assert.ok(session.paymentId.startsWith("test_pay_"));
assert.ok(session.checkoutUrl.includes("checkout/"));
console.log("✓ 1. Payment session creation from trusted order verified");

// ====================================================================
// TEST 2: Invalid or missing order rejected
// ====================================================================
const fakeWebhook = provider.generateSignedWebhook({
  event: "SUCCESS",
  paymentId: "pay_123",
  orderId: "NON_EXISTENT_ORDER_999",
  amountPaise: 100000,
  currency: "INR",
});
const resMissing = processWebhook(fakeWebhook.rawBody, fakeWebhook.headers, provider);
assert.strictEqual(resMissing.success, false);
assert.strictEqual(resMissing.httpStatus, 404, "Missing order must return HTTP 404");
console.log("✓ 2. Non-existent order rejected with 404");

// ====================================================================
// TEST 3: Amount mismatch (anti-tampering check)
// ====================================================================
// Order total is ₹3,850 (385000 paise). Attacker sends webhook for ₹10 (1000 paise).
const tamperedWebhook = provider.generateSignedWebhook({
  event: "SUCCESS",
  paymentId: "pay_tamper_1",
  orderId: "VEL-2024-1001",
  amountPaise: 1000, // Malicious amount mismatch
  currency: "INR",
});
const resTampered = processWebhook(tamperedWebhook.rawBody, tamperedWebhook.headers, provider);
assert.strictEqual(resTampered.success, false);
assert.strictEqual(resTampered.httpStatus, 400);
assert.strictEqual(resTampered.error, "Amount mismatch");
assert.strictEqual(testOrderStore.get("VEL-2024-1001").paymentStatus, "pending", "Order must NOT be marked paid when amount mismatches");
console.log("✓ 3. Amount mismatch & tampering rejected with 400");

// ====================================================================
// TEST 4: Currency mismatch rejected
// ====================================================================
const currencyMismatchWebhook = provider.generateSignedWebhook({
  event: "SUCCESS",
  paymentId: "pay_curr_1",
  orderId: "VEL-2024-1001",
  amountPaise: 385000,
  currency: "USD", // Mismatched currency
});
const resCurrency = processWebhook(currencyMismatchWebhook.rawBody, currencyMismatchWebhook.headers, provider);
assert.strictEqual(resCurrency.success, false);
assert.strictEqual(resCurrency.httpStatus, 400);
console.log("✓ 4. Foreign currency mismatch rejected");

// ====================================================================
// TEST 5: Invalid cryptographic signature rejected (HMAC mismatch)
// ====================================================================
const invalidSigWebhook = provider.generateSignedWebhook(
  { event: "SUCCESS", paymentId: "pay_1", orderId: "VEL-2024-1001", amountPaise: 385000, currency: "INR" },
  "wrong_signing_secret_key"
);
const resInvalidSig = processWebhook(invalidSigWebhook.rawBody, invalidSigWebhook.headers, provider);
assert.strictEqual(resInvalidSig.success, false);
assert.strictEqual(resInvalidSig.httpStatus, 401, "Invalid signature must return 401 Unauthorized");
console.log("✓ 5. Invalid HMAC signature rejected with 401");

// ====================================================================
// TEST 6: Malformed webhook payload (missing required fields / invalid JSON)
// ====================================================================
const malformedWebhook = {
  rawBody: "{ not_valid_json: true }",
  headers: {
    "content-type": "application/json",
    "x-gateway-signature": "sha256=" + crypto.createHmac("sha256", provider.secret).update("{ not_valid_json: true }").digest("hex"),
  },
};
const resMalformed = processWebhook(malformedWebhook.rawBody, malformedWebhook.headers, provider);
assert.strictEqual(resMalformed.success, false);
assert.strictEqual(resMalformed.httpStatus, 400);
console.log("✓ 6. Malformed JSON payload rejected with 400");

// ====================================================================
// TEST 7: Valid SUCCESS webhook transitions order to 'paid' & stores UTR
// ====================================================================
const validSuccess = provider.generateSignedWebhook({
  event: "SUCCESS",
  paymentId: "pay_ok_101",
  orderId: "VEL-2024-1001",
  amountPaise: 385000,
  currency: "INR",
  utr: "429482109841",
});
const resSuccess = processWebhook(validSuccess.rawBody, validSuccess.headers, provider);
assert.strictEqual(resSuccess.success, true);
assert.strictEqual(resSuccess.httpStatus, 200);
const paidOrder = testOrderStore.get("VEL-2024-1001");
assert.strictEqual(paidOrder.paymentStatus, "paid");
assert.strictEqual(paidOrder.fulfillmentStatus, "confirmed");
assert.strictEqual(paidOrder.bankReferenceNumber, "429482109841");
console.log("✓ 7. Valid SUCCESS webhook transitions order to paid and stores UTR");

// ====================================================================
// TEST 8: Duplicate webhook delivery handled idempotently
// ====================================================================
const resDup = processWebhook(validSuccess.rawBody, validSuccess.headers, provider);
assert.strictEqual(resDup.success, true);
assert.strictEqual(resDup.duplicate, true, "Duplicate delivery must return duplicate flag");
assert.strictEqual(paidOrder.paymentStatus, "paid", "Order remains paid without duplicate mutations");
console.log("✓ 8. Duplicate webhook delivery handled idempotently");

// ====================================================================
// TEST 9: Failed and Expired payment events transition order to 'failed'
// ====================================================================
seedOrder({
  orderNumber: "VEL-2024-2002",
  totalAmount: 1800,
  paymentStatus: "pending",
  fulfillmentStatus: "pending",
});
const failWebhook = provider.generateSignedWebhook({
  event: "FAILED",
  paymentId: "pay_fail_202",
  orderId: "VEL-2024-2002",
  amountPaise: 180000,
  currency: "INR",
});
const resFail = processWebhook(failWebhook.rawBody, failWebhook.headers, provider);
assert.strictEqual(resFail.success, true);
assert.strictEqual(testOrderStore.get("VEL-2024-2002").paymentStatus, "failed");

// Expiry
seedOrder({
  orderNumber: "VEL-2024-3003",
  totalAmount: 5000,
  paymentStatus: "pending",
  fulfillmentStatus: "pending",
});
const expireWebhook = provider.generateSignedWebhook({
  event: "EXPIRED",
  paymentId: "pay_exp_303",
  orderId: "VEL-2024-3003",
  amountPaise: 500000,
  currency: "INR",
});
const resExpire = processWebhook(expireWebhook.rawBody, expireWebhook.headers, provider);
assert.strictEqual(resExpire.success, true);
assert.strictEqual(testOrderStore.get("VEL-2024-3003").paymentStatus, "failed");
console.log("✓ 9. Failed & Expired webhook events transition order safely");

// ====================================================================
// TEST 10: Cancelled payment transitions fulfillment to 'cancelled'
// ====================================================================
seedOrder({
  orderNumber: "VEL-2024-4004",
  totalAmount: 4200,
  paymentStatus: "pending",
  fulfillmentStatus: "pending",
});
const cancelWebhook = provider.generateSignedWebhook({
  event: "CANCELLED",
  paymentId: "pay_cnl_404",
  orderId: "VEL-2024-4004",
  amountPaise: 420000,
  currency: "INR",
});
const resCancel = processWebhook(cancelWebhook.rawBody, cancelWebhook.headers, provider);
assert.strictEqual(resCancel.success, true);
const cnlOrder = testOrderStore.get("VEL-2024-4004");
assert.strictEqual(cnlOrder.paymentStatus, "failed");
assert.strictEqual(cnlOrder.fulfillmentStatus, "cancelled");
console.log("✓ 10. Cancelled payment event transitions fulfillment to cancelled");

// ====================================================================
// TEST 11: Production safeguard blocks test providers
// ====================================================================
assert.throws(
  () => {
    provider.createSession(
      { orderNumber: "VEL-PROD-TEST", amountPaise: 10000 },
      { NODE_ENV: "production", ALLOW_TEST_PAYMENTS: "false" }
    );
  },
  /SECURITY EXCEPTION/,
  "Production environment must throw security exception when test payment attempted"
);
console.log("✓ 11. Production safeguard strictly blocks uncertified test providers");

// ====================================================================
// TEST 12: Constant-time comparison defends against timing attacks
// ====================================================================
const rawTest = JSON.stringify({ event: "SUCCESS", paymentId: "pay_ping_123", orderId: "VEL-2024-1001" });
const legitSig = "sha256=" + crypto.createHmac("sha256", provider.secret).update(rawTest).digest("hex");
const forgedSig = "sha256=" + crypto.createHmac("sha256", "wrong_key").update(rawTest).digest("hex");

assert.strictEqual(provider.verifyWebhook(rawTest, { "x-gateway-signature": legitSig }).isValid, true);
assert.strictEqual(provider.verifyWebhook(rawTest, { "x-gateway-signature": forgedSig }).isValid, false);
console.log("✓ 12. Constant-time timing-safe HMAC verification verified");

// ====================================================================
// TEST 13 to 17: Live YouPI Payment Gateway HTTP Core Simulation
// ====================================================================
import http from "node:http";

const mockGatewayServer = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    // 1. Session Creation Endpoint
    if (req.url === "/api/v1/payments" && req.method === "POST") {
      const merchantId = req.headers["x-merchant-id"];
      const merchantKey = req.headers["x-merchant-key"];
      if (merchantId !== "test-merchant-001" || merchantKey !== "test_secret_key_youpi_32_chars") {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized: Invalid merchant credentials" }));
      }

      const parsed = JSON.parse(body);
      if (!parsed.orderId || !parsed.amount) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing required order fields" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        paymentId: `youpi_session_${Date.now()}`,
        status: "INITIATED",
        checkoutUrl: `http://localhost:${mockGatewayServer.address().port}/checkout/youpi_session_test`,
        orderId: parsed.orderId,
        amount: parsed.amount,
      }));
    }

    // 2. Query Status Endpoint
    if (req.url?.startsWith("/api/v1/payments/") && req.method === "GET") {
      const paymentId = req.url.split("/").pop();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        paymentId,
        status: "SUCCESS",
        amountPaise: 420000,
        completedAt: new Date().toISOString(),
      }));
    }

    // 3. Fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
});

await new Promise((resolve) => mockGatewayServer.listen(0, "127.0.0.1", resolve));
const gatewayPort = mockGatewayServer.address().port;
const gatewayUrl = `http://127.0.0.1:${gatewayPort}`;

class LiveYoupiTestAdapter {
  constructor(apiUrl, merchantId, secret) {
    this.apiUrl = apiUrl.replace(/\/+$/, "");
    this.merchantId = merchantId;
    this.webhookSecret = secret;
  }

  async createSession(params) {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": this.merchantId,
          "X-Merchant-Key": this.webhookSecret,
          "Idempotency-Key": params.idempotencyKey || `idem_${Date.now()}`,
        },
        body: JSON.stringify({
          orderId: params.orderNumber,
          amount: (params.amountPaise / 100).toFixed(2),
          currency: params.currency || "INR",
          returnUrl: params.returnUrl || "http://localhost:3000/order-confirmation",
          customer: params.customer || { name: "Test Patron", email: "patron@example.com", phoneNumber: "9820000000" },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `YouPI gateway rejected session [HTTP ${res.status}]: ${errorText}` };
      }

      const data = await res.json();
      return {
        success: true,
        paymentId: data.paymentId,
        checkoutUrl: data.checkoutUrl,
        status: data.status,
      };
    } catch (err) {
      return { success: false, error: `Connection failed: ${err.message}` };
    }
  }

  async getStatus(paymentId) {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { "X-Merchant-Key": this.webhookSecret },
      });
      if (!res.ok) return { status: "ERROR" };
      return await res.json();
    } catch (err) {
      return { status: "UNKNOWN", error: err.message };
    }
  }

  verifyWebhook(rawBody, headers) {
    const signature = headers["x-gateway-signature"] || headers["X-Gateway-Signature"] || "";
    if (!signature.startsWith("sha256=")) {
      return { isValid: false, error: "Missing or malformed signature header", httpStatus: 401 };
    }
    const actualHash = signature.replace("sha256=", "").trim();
    const expectedHash = crypto.createHmac("sha256", this.webhookSecret).update(rawBody, "utf8").digest("hex");
    const bufA = Buffer.from(actualHash, "hex");
    const bufB = Buffer.from(expectedHash, "hex");
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return { isValid: false, error: "Cryptographic signature mismatch", httpStatus: 401 };
    }
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { isValid: false, error: "Invalid JSON", httpStatus: 400 };
    }
    return { isValid: true, payload, httpStatus: 200 };
  }
}

const youpi = new LiveYoupiTestAdapter(gatewayUrl, "test-merchant-001", "test_secret_key_youpi_32_chars");

// TEST 13: YouPI Payment Core Gateway HTTP Session Creation
const youpiSession = await youpi.createSession({
  orderNumber: "VEL-YOUPI-5005",
  amountPaise: 420000,
});
assert.strictEqual(youpiSession.success, true);
assert.ok(youpiSession.paymentId.startsWith("youpi_session_"));
assert.ok(youpiSession.checkoutUrl.includes(`/checkout/`));
assert.strictEqual(youpiSession.status, "INITIATED");
console.log("✓ 13. YouPI Core HTTP session creation over live socket verified");

// TEST 14: YouPI Core Gateway Error Handling (Unauthorized Merchant)
const invalidYoupi = new LiveYoupiTestAdapter(gatewayUrl, "wrong-merchant", "wrong_secret");
const failedSession = await invalidYoupi.createSession({
  orderNumber: "VEL-YOUPI-FAIL",
  amountPaise: 100000,
});
assert.strictEqual(failedSession.success, false);
assert.ok(failedSession.error.includes("401"), "Rejected session must report HTTP 401");
console.log("✓ 14. YouPI Core rejection on invalid credentials handled safely");

// TEST 15: YouPI Core Query Status API
const statusCheck = await youpi.getStatus(youpiSession.paymentId);
assert.strictEqual(statusCheck.status, "SUCCESS");
assert.strictEqual(statusCheck.amountPaise, 420000);
console.log("✓ 15. YouPI Core status polling API verified");

// TEST 16: YouPI Core Webhook Signature Verification & State Transition
seedOrder({
  orderNumber: "VEL-YOUPI-5005",
  totalAmount: 4200,
  paymentStatus: "pending",
  fulfillmentStatus: "pending",
});

const youpiWebhookPayload = {
  event: "SUCCESS",
  paymentId: youpiSession.paymentId,
  orderId: "VEL-YOUPI-5005",
  amount: "4200.00",
  amountPaise: 420000,
  currency: "INR",
  method: "UPI",
  utr: "YOUPI-UTR-11223344",
};

const rawYoupiBody = JSON.stringify(youpiWebhookPayload);
const youpiSig = "sha256=" + crypto.createHmac("sha256", youpi.webhookSecret).update(rawYoupiBody, "utf8").digest("hex");
const youpiHeaders = {
  "content-type": "application/json",
  "x-gateway-signature": youpiSig,
  "x-gateway-delivery-id": `del_youpi_${Date.now()}`,
};

const youpiWebhookResult = processWebhook(rawYoupiBody, youpiHeaders, youpi);
assert.strictEqual(youpiWebhookResult.success, true);
assert.strictEqual(youpiWebhookResult.httpStatus, 200);

const youpiPaidOrder = testOrderStore.get("VEL-YOUPI-5005");
assert.strictEqual(youpiPaidOrder.paymentStatus, "paid");
assert.strictEqual(youpiPaidOrder.fulfillmentStatus, "confirmed");
assert.strictEqual(youpiPaidOrder.bankReferenceNumber, "YOUPI-UTR-11223344");
console.log("✓ 16. YouPI Core webhook successfully verified and order transitioned to paid");

// TEST 17: YouPI Core Network Disconnect / Offline Recovery
const deadYoupi = new LiveYoupiTestAdapter("http://127.0.0.1:1", "test-merchant-001", "secret");
const offlineResult = await deadYoupi.createSession({ orderNumber: "VEL-OFFLINE", amountPaise: 1000 });
assert.strictEqual(offlineResult.success, false);
assert.ok(offlineResult.error.includes("Connection failed"));
console.log("✓ 17. Offline gateway connection failure handled gracefully without crash");

mockGatewayServer.close();

console.log("\nAll Phase 07 Payment Gateway Integration tests passed successfully!\n");
