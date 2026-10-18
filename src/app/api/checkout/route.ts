import { NextRequest, NextResponse } from "next/server";
import { validateStock } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer, shippingAddress, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate stock for all items
    const stockCheck = validateStock(
      items.map((i: any) => ({ sku: i.sku, quantity: i.quantity || 1 }))
    );

    if (!stockCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Some items in your cart exceed available atelier stock.",
          details: stockCheck.errors,
        },
        { status: 409 }
      );
    }

    // Calculate dynamic totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = 0; // Complimentary express priority shipping
    const discount = body.discount || 0;
    const total = Math.max(0, subtotal - discount + shipping);

    const orderId = `VEL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        items,
        subtotal,
        shipping,
        discount,
        total,
        customer,
        shippingAddress,
        paymentMethod: paymentMethod || "card",
        status: "confirmed",
        estimatedDelivery: "2–3 business days via BlueDart Express",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process checkout" },
      { status: 500 }
    );
  }
}
