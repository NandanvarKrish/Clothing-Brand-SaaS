import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlugOrId, getRelatedProducts, getProducts } from "@/services/productService";
import { ProductDetailClient } from "./ProductDetailClient";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlugOrId(params.slug);
  if (!product || product.status !== "published") {
    return {
      title: "Garment Not Found | Vélure Atelier",
    };
  }

  return {
    title: `${product.name} | Vélure Atelier`,
    description: product.description,
    openGraph: {
      title: `${product.name} — Vélure Atelier`,
      description: product.description,
      images: [product.images[0]?.url || ""],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlugOrId(params.slug);

  if (!product || product.status !== "published") {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, 3);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
