import { NextRequest, NextResponse } from "next/server";
import { getProducts, getFilterFacets } from "@/services/productService";
import { ProductCategory } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") as ProductCategory | "All" | null;
    const collectionId = searchParams.get("collection") || searchParams.get("collectionId");
    const search = searchParams.get("search") || searchParams.get("q");
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const colorsParam = searchParams.get("colors");
    const sizesParam = searchParams.get("sizes");
    const fabricsParam = searchParams.get("fabrics");
    const sort = searchParams.get("sort") as any;
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const bestseller = searchParams.get("bestseller") === "true" ? true : undefined;
    const newArrival = searchParams.get("newArrival") === "true" ? true : undefined;

    const colors = colorsParam ? colorsParam.split(",").map((c) => c.trim()) : undefined;
    const sizes = sizesParam ? sizesParam.split(",").map((s) => s.trim()) : undefined;
    const fabricOrigin = fabricsParam ? fabricsParam.split(",").map((f) => f.trim()) : undefined;

    const products = await getProducts({
      category: category || undefined,
      collectionId: collectionId || undefined,
      search: search || undefined,
      minPrice,
      maxPrice,
      colors,
      sizes,
      fabricOrigin,
      sort,
      featured,
      bestseller,
      newArrival,
    });

    const facets = await getFilterFacets();

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
      facets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
