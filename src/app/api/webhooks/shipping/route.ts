import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getOrderByNumber } from "@/services/orderService";
import { confirmShipmentDelivery } from "@/services/shipping/shippingService";

/**
 * Validates inbound carrier tracking webhook HMAC-SHA256 signature.
 */
function verifyCarrierSignature(rawBody: string, signatureHeader?: string | null): boolean {
  const secret =
    process.env.SHIPPING_WEBHOOK_SECRET ||
    process.env.MOCK_WEBHOOK_SECRET ||
    "atelier_default_shipping_webhook_secret_key_32c";

  if (!signatureHeader) return false;

  const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
  const expectedHash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const bufActual = Buffer.from(cleanSig, "hex");
  const bufExpected = Buffer.from(expectedHash, "hex");

  if (bufActual.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufActual, bufExpected);
}

/**
 * Carrier Tracking Webhook Handler.
 * Ingests external carrier tracking milestone callbacks (BlueDart, Delhivery, DHL).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-shipping-signature") ||
      req.headers.get("x-carrier-signature");

    // In production, signature verification is strictly mandatory
    if (process.env.NODE_ENV === "production" || signature) {
      const isValid = verifyCarrierSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature." },
          { status: 401 }
        );
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    const { orderNumber, trackingNumber, event, description, location } = payload;

    if (!orderNumber || !trackingNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required orderNumber or trackingNumber." },
        { status: 400 }
      );
    }

    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Referenced order not found." },
        { status: 404 }
      );
    }

    // Process delivery event
    if (event === "delivered") {
      if (order.fulfillmentStatus === "delivered") {
        return NextResponse.json({ success: true, message: "Order already delivered (idempotent)." });
      }

      // Validated transition: must be in transit/shipped first
      if (order.fulfillmentStatus !== "shipped" && order.fulfillmentStatus !== "dispatched") {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid transition: order in '${order.fulfillmentStatus}' cannot jump directly to delivered.`,
          },
          { status: 422 }
        );
      }

      const res = await confirmShipmentDelivery({
        orderNumber,
        notes: description || `Automated carrier delivery confirmation via ${location || "courier hub"}.`,
        user: { id: "system_carrier_webhook", email: "webhook@carrier.logistics" },
      });

      return NextResponse.json({ success: res.success, error: res.error });
    }

    // Standard in-transit update
    return NextResponse.json({
      success: true,
      message: `Tracking update recorded for Order #${orderNumber} (${event || "in_transit"}).`,
    });
  } catch (err: any) {
    console.error("Shipping webhook processing error:", err.message);
    return NextResponse.json({ success: false, error: "Internal processing error." }, { status: 500 });
  }
}
