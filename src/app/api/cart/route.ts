import { NextRequest, NextResponse } from "next/server";
import { validateAndRecalculateCart } from "@/services/cartService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const couponCode = typeof body.couponCode === "string" ? body.couponCode : null;

    const validated = await validateAndRecalculateCart(items, couponCode);

    return NextResponse.json({
      success: true,
      cart: validated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate cart" },
      { status: 500 }
    );
  }
}
