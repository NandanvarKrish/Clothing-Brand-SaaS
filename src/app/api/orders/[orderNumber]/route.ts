import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, getOrderForCustomer } from "@/services/orderService";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authenticate caller
    let user: { id: string; email?: string } | null = null;
    let isAdmin = false;

    const supabase = await createServerClient();
    if (supabase) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        user = { id: authUser.id, email: authUser.email };
        // Check admin role if present in app_metadata / user_metadata
        if (
          authUser.app_metadata?.role === "admin" ||
          authUser.user_metadata?.role === "admin"
        ) {
          isAdmin = true;
        }
      }
    }

    // Enforce ownership check (IDOR Defense)
    if (order.customerId) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authentication required to view this commission." },
          { status: 401 }
        );
      }

      const check = await getOrderForCustomer(orderNumber, user, isAdmin);
      if (!check.success) {
        return NextResponse.json(
          { success: false, error: check.error },
          { status: check.code === "FORBIDDEN" ? 403 : 401 }
        );
      }

      return NextResponse.json({
        success: true,
        order: check.order,
      });
    }

    // Guest orders (customerId is null): verify guest email header or order confirmation query
    const guestEmailHeader = request.headers.get("x-guest-email");
    const isConfirmationPage = request.nextUrl.searchParams.get("confirmation") === "true";

    if (
      isConfirmationPage ||
      (guestEmailHeader &&
        order.shippingAddress?.email &&
        guestEmailHeader.toLowerCase() === order.shippingAddress.email.toLowerCase())
    ) {
      return NextResponse.json({
        success: true,
        order,
      });
    }

    if (user) {
      const check = await getOrderForCustomer(orderNumber, user, isAdmin);
      if (check.success) {
        return NextResponse.json({ success: true, order: check.order });
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}
