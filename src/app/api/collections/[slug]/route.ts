import { NextRequest, NextResponse } from "next/server";
import { getCollectionBySlug, getProducts } from "@/services/productService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const collection = await getCollectionBySlug(slug);

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    const products = await getProducts({ collectionId: collection.slug });

    return NextResponse.json({
      success: true,
      collection,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collection" },
      { status: 500 }
    );
  }
}
