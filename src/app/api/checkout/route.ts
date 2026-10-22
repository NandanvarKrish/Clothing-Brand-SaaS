import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderCreateInput } from "@/services/orderService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const idempotencyKey =
      request.headers.get("x-idempotency-key") ||
      request.headers.get("idempotency-key") ||
      body.idempotencyKey ||
      undefined;

    const {
      items,
      customer,
      shippingAddress,
      billingAddress,
      deliveryNotes,
      paymentMethod,
      couponCode,
      shippingMethodId,
      customerId,
    } = body;

    // Build authoritative order input
    const orderInput: OrderCreateInput = {
      idempotencyKey,
      customerId: customerId || undefined,
      guestEmail: customer?.email || undefined,
      items: Array.isArray(items) ? items : [],
      shippingAddress: shippingAddress || {
        fullName: customer?.fullName,
        phone: customer?.phone,
        addressLine1: customer?.addressLine1,
        addressLine2: customer?.addressLine2,
        city: customer?.city,
        state: customer?.state,
        pincode: customer?.pincode,
      },
      billingAddress,
      deliveryNotes,
      paymentMethod: paymentMethod || "card",
      couponCode: typeof couponCode === "string" ? couponCode : null,
      shippingMethodId: shippingMethodId === "express_courier" ? "express_courier" : "standard_air",
    };

    const result = await createOrder(orderInput);

    if (!result.success) {
      const statusCode =
        result.code === "STOCK_CONFLICT" || result.code === "CONCURRENT_REQUEST"
          ? 409
          : 400;

      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      code: result.code,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process order" },
      { status: 500 }
    );
  }
}
