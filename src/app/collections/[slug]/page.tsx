import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollections, getCollectionBySlug, getProducts } from "@/services/productService";
import { ProductCard } from "@/components/products/ProductCard";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const collection = await getCollectionBySlug(params.slug);
  if (!collection) {
    return { title: "Collection Not Found | Vélure Atelier" };
  }
  return {
    title: `${collection.title} | Vélure Atelier`,
    description: collection.description,
  };
}

export default async function SingleCollectionPage({ params }: CollectionPageProps) {
  const collection = await getCollectionBySlug(params.slug);

  if (!collection) {
    notFound();
  }

  // Filter products by collection slug dynamically
  const collectionProducts = await getProducts({ collectionId: collection.slug });

  return (
    <main className="w-full bg-surface pb-24">
      {/* Editorial Hero Banner */}
      <section className="relative w-full -mt-28 min-h-[500px] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={collection.image}
            alt={collection.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/20" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-36">
          <nav className="flex items-center gap-2 text-surface/70 font-label-sm text-label-sm uppercase tracking-wider mb-4">
            <Link href="/" className="hover:text-surface">Atelier</Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-surface">Collections</Link>
            <span>/</span>
            <span className="text-surface font-semibold">{collection.title}</span>
          </nav>
          <span className="inline-block px-3 py-1 rounded bg-surface/20 backdrop-blur-sm text-surface font-label-sm text-label-sm uppercase tracking-widest mb-3">
            {collection.editionBadge || collection.tagline}
          </span>
          <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-surface font-bold tracking-tight mb-4">
            {collection.title}
          </h1>
          <p className="font-body-lg text-body-lg text-surface/90 max-w-2xl leading-relaxed">
            {collection.description}
          </p>
        </div>
      </section>

      {/* Garments Grid */}
      <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-16">
        <div className="flex items-center justify-between pb-6 mb-10 border-b border-outline-variant/40">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary font-semibold">
              Capsule Silhouettes
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Showing {collectionProducts.length} numbered wearable garments
            </p>
          </div>
          <Link
            href="/shop"
            className="text-secondary hover:text-primary font-title-md text-title-md font-semibold"
          >
            Browse All Garments
          </Link>
        </div>

        {collectionProducts.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-xl">
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              No silhouettes currently in this capsule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {collectionProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
