import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const related = await getRelatedProducts(product.id, 4);

    return NextResponse.json({
      success: true,
      product,
      related,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
