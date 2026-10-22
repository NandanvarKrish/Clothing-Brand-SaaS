"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Infinity as InfinityIcon, Leaf, Truck, ShieldCheck, Mail, Star, Check } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { getBestsellers, getCollections } from "@/services/productService";
import { TESTIMONIALS } from "@/data/products";
import { Product, Collection } from "@/types";

export default function HomePage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [best, cols] = await Promise.all([getBestsellers(), getCollections()]);
        setBestsellers(best);
        setCollections(cols);
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main className="w-full bg-surface">
      <div className="flex flex-col w-full">
        {/* SECTION 1: Editorial Hero Campaign */}
        <section className="relative w-full -mt-28 min-h-[942px] flex items-end pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop"
              alt="High-fashion cinematic editorial campaign of two models in courtyard wearing tailored apparel"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-primary/10" />
          </div>

          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-40">
            <div className="max-w-2xl text-surface">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/15 backdrop-blur-md text-surface font-label-sm text-label-sm tracking-[0.2em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                Autumn Dusk 2024 Capsule
              </span>
              <h1 className="font-display-lg text-display-lg lg:text-[64px] lg:leading-[70px] text-surface font-semibold tracking-tight mb-5">
                Designed to Be Different.
              </h1>
              <p className="font-body-lg text-body-lg text-surface/90 max-w-lg mb-8 leading-relaxed">
                Everyday essentials. Elevated by heritage looms and contemporary tailoring. Meticulously cut in limited editions.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/shop?filter=new-arrivals"
                  className="px-8 py-3.5 rounded bg-primary-container text-surface hover:bg-secondary transition-all shadow-sm font-title-md text-title-md tracking-wide"
                >
                  Shop New Arrivals
                </Link>
                <Link
                  href="/collections"
                  className="px-8 py-3.5 rounded bg-surface/10 hover:bg-surface/20 text-surface backdrop-blur-sm transition-all font-title-md text-title-md tracking-wide"
                >
                  Explore the Collection
                </Link>
              </div>
            </div>

            {/* Quick Highlights Bar */}
            <div className="mt-16 pt-8 border-t border-surface/20 grid grid-cols-2 md:grid-cols-4 gap-6 text-surface/80">
              <div className="flex items-center gap-3">
                <InfinityIcon className="w-5 h-5 text-secondary-container" />
                <span className="font-label-md text-label-md tracking-wider uppercase">Small-Batch Lots</span>
              </div>
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-secondary-container" />
                <span className="font-label-md text-label-md tracking-wider uppercase">100% Organic Fibers</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-secondary-container" />
                <span className="font-label-md text-label-md tracking-wider uppercase">Complimentary Express</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-secondary-container" />
                <span className="font-label-md text-label-md tracking-wider uppercase">Artisanal Loom Heritage</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Curated Collection Mosaic */}
        <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="font-label-sm text-label-sm tracking-[0.25em] text-secondary uppercase font-semibold block mb-2">
                Curated Chapters
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
                Featured Collections
              </h2>
            </div>
            <Link
              href="/collections"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 font-title-md text-title-md text-secondary hover:text-primary transition-colors group"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container-high rounded-xl h-[480px]" />
              ))
            ) : collections.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <p className="font-headline-md text-headline-md text-primary font-semibold mb-2">
                  Capsules In Preparation
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  Our artisans are currently tailoring upcoming seasonal chapters. Explore the full catalog in the atelier shop.
                </p>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors shadow-sm"
                >
                  Browse All Silhouettes
                </Link>
              </div>
            ) : (
              collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group relative h-[480px] rounded-xl overflow-hidden bg-surface-container shadow-sm flex flex-col justify-end p-8"
                >
                  <Image
                    src={col.image || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop"}
                    alt={col.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                  <div className="relative z-10 text-surface">
                    <span className="font-label-sm text-label-sm tracking-[0.2em] uppercase text-secondary-container font-semibold block mb-1">
                      {col.editionBadge || col.tagline}
                    </span>
                    <h3 className="font-headline-md text-headline-md font-semibold text-surface mb-2">
                      {col.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-surface/80 line-clamp-2">
                      {col.description}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* SECTION 3: Bestsellers Grid */}
        <section className="w-full bg-surface-container-low py-24">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="font-label-sm text-label-sm tracking-[0.25em] text-secondary uppercase font-semibold block mb-2">
                  Atelier Favorites
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
                  The Bestsellers
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-4 md:mt-0">
                Individual numbered editions spun from raw natural threads, finished with corozo buttons and hand-rolled hems.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-surface-container-high rounded-xl h-[420px]" />
                ))
              ) : bestsellers.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                  <p className="font-headline-md text-headline-md text-primary font-semibold mb-2">
                    Curated Editions Coming Soon
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                    No silhouettes are currently flagged as bestsellers. Explore all available garments in our atelier catalog.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors shadow-sm"
                  >
                    View All Garments
                  </Link>
                </div>
              ) : (
                bestsellers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: Editorial Brand Story Split Section */}
        <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Fabric Photo Mosaic */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full h-[540px] rounded-2xl overflow-hidden shadow-md bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1600&auto=format&fit=crop"
                  alt="Macro tactile photograph of unbleached pure Belgian linen fabric texture and carved horn buttons"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* Floating Accent Card */}
              <div className="absolute -bottom-8 -right-4 sm:right-6 bg-surface-container-lowest p-6 rounded-xl shadow-lg max-w-xs border border-outline-variant/30 hidden sm:block">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="font-title-md text-title-md text-primary font-semibold">100% Traceable</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  From the handloom clusters of Bengal to European flax certified by Master of Linen®.
                </p>
              </div>
            </div>

            {/* Right: Typography & Manifesto */}
            <div className="lg:col-span-6 lg:pl-6">
              <span className="font-label-sm text-label-sm tracking-[0.25em] text-secondary uppercase font-semibold block mb-3">
                Our Manifesto
              </span>
              <h2 className="font-display-lg text-display-lg text-primary tracking-tight font-semibold mb-6">
                Less Noise. Better Essentials.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                At Vélure, every collection begins in dialogue with our weavers. We discard fast fashion calendar pressure in pursuit of garment longevity—producing solely in limited-lot runs that preserve natural resources.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pt-4 border-t border-surface-container-high">
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-semibold mb-1">Small-Batch Masters</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Crafted in tight capsules of only 150 numbered pieces per silhouette to prevent waste.
                  </p>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-semibold mb-1">Zero-Plastic Packaging</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Delivered inside unbleached cotton atelier pouches and compostable botanical cardboard.
                  </p>
                </div>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded bg-primary-container text-on-primary hover:bg-primary transition-all font-title-md text-title-md shadow-sm"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 5: Seasonal Drop Banner */}
        <section className="w-full bg-primary-container text-on-primary py-20 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-on-primary/10 text-on-primary-container font-label-sm text-label-sm uppercase tracking-widest mb-4">
                Limited Lot Edition • 180 Pieces Only
              </span>
              <h3 className="font-display-lg text-display-lg font-semibold tracking-tight mb-4 text-surface">
                The Autumn Dusk Capsule
              </h3>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
                Warm tobacco silks, textured hazelnut linens, and unlined evening coats designed for seasonal twilight. Hand-finished with French seams.
              </p>
            </div>

            {/* Batch Countdown & CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 bg-on-primary/5 p-6 rounded-xl backdrop-blur-md border border-on-primary/10">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-primary/40 rounded p-3 w-16 text-center">
                  <span className="font-display-lg text-headline-lg font-bold text-surface-container-lowest">04</span>
                  <span className="font-label-sm text-[10px] tracking-wider uppercase text-on-primary-container">Days</span>
                </div>
                <span className="font-display-lg text-headline-lg text-on-primary-container font-light">:</span>
                <div className="flex flex-col items-center justify-center bg-primary/40 rounded p-3 w-16 text-center">
                  <span className="font-display-lg text-headline-lg font-bold text-surface-container-lowest">18</span>
                  <span className="font-label-sm text-[10px] tracking-wider uppercase text-on-primary-container">Hours</span>
                </div>
                <span className="font-display-lg text-headline-lg text-on-primary-container font-light">:</span>
                <div className="flex flex-col items-center justify-center bg-primary/40 rounded p-3 w-16 text-center">
                  <span className="font-display-lg text-headline-lg font-bold text-surface-container-lowest">42</span>
                  <span className="font-label-sm text-[10px] tracking-wider uppercase text-on-primary-container">Mins</span>
                </div>
              </div>
              <Link
                href="/collections/autumn-dusk-2024"
                className="w-full sm:w-auto px-8 py-3.5 rounded bg-surface text-primary hover:bg-surface-container-high transition-colors font-title-md text-title-md font-semibold text-center whitespace-nowrap shadow-sm"
              >
                Explore the Drop
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 6: Verified Client Reviews */}
        <section className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-24">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="font-label-sm text-label-sm tracking-[0.25em] text-secondary uppercase font-semibold block mb-2">
              Patron Testimonials
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
              In the Words of Our Clients
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-1 text-secondary mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <h5 className="font-title-md text-title-md text-primary font-semibold">{t.author}</h5>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {t.location} • Verified Patron
                    </span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: Newsletter Section */}
        <section className="w-full bg-surface-container py-20">
          <div className="w-full max-w-[800px] mx-auto px-6 text-center">
            <Mail className="w-8 h-8 text-secondary mx-auto mb-3" />
            <h3 className="font-headline-lg text-headline-lg text-primary font-semibold mb-3">
              Get First Access to Private Ateliers
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto mb-8 leading-relaxed">
              Be invited to private capsule previews, rare textile releases, and our private concierge salon drops before general release.
            </p>
            {newsletterSubscribed ? (
              <div className="p-4 bg-in-stock-bg text-in-stock rounded-xl font-medium max-w-md mx-auto flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span>You have been invited to private atelier drops.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail.trim()) {
                    setNewsletterSubscribed(true);
                  }
                }}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  required
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 h-12 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
                <button
                  type="submit"
                  className="h-12 px-6 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md font-semibold tracking-wide transition-colors whitespace-nowrap shadow-sm"
                >
                  Subscribe
                </button>
              </form>
            )}
            <span className="font-body-sm text-[11px] text-on-surface-variant block mt-3">
              We respect your inbox. Unsubscribe anytime.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
