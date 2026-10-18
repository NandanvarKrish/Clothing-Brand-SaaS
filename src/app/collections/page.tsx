import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCollections } from "@/services/productService";

export const metadata = {
  title: "Curated Chapters & Collections | Vélure Atelier",
  description: "Browse our seasonal capsules, core linen lines, and artisanal silk collections.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-semibold block mb-2">
          Curated Chapters
        </span>
        <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-primary tracking-tight font-semibold">
          Collections &amp; Capsules
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 leading-relaxed">
          Each chapter represents a dedicated dialogue with a single textile origin—from the humid looms of Bengal to ancient flax fields in Flanders.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.slug}`}
            className="group relative h-[440px] sm:h-[500px] rounded-2xl overflow-hidden bg-surface-container shadow-md flex flex-col justify-end p-8 sm:p-10 border border-outline-variant/30"
          >
            <Image
              src={col.image}
              alt={col.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />

            <div className="relative z-10 text-surface">
              <span className="font-label-sm text-label-sm tracking-[0.2em] uppercase text-secondary-container font-semibold block mb-2">
                {col.editionBadge || col.tagline} • {col.itemCount} Pieces
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold text-surface mb-2">
                {col.title}
              </h2>
              <p className="font-body-md text-body-md text-surface/80 max-w-lg mb-6 line-clamp-2">
                {col.description}
              </p>
              <div className="inline-flex items-center gap-2 font-title-md text-title-md text-secondary-container group-hover:text-surface transition-colors">
                <span>Explore Chapter</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
