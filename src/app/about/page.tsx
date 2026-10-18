import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Award, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Our Story & Manifesto | Vélure Atelier",
  description:
    "An artisanal dialogue between heritage loom craftsmanship and quiet luxury silhouettes. Meticulously cut in limited editions.",
};

export default function AboutPage() {
  return (
    <main className="w-full bg-surface pb-24">
      {/* Hero Banner */}
      <section className="relative w-full -mt-28 min-h-[540px] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1600&auto=format&fit=crop"
            alt="Macro organic linen weave"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-primary/25" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-36">
          <span className="inline-block px-3 py-1 rounded-full bg-surface/20 backdrop-blur-md text-surface font-label-sm text-label-sm tracking-[0.2em] uppercase mb-4">
            Maison de Couture
          </span>
          <h1 className="font-display-lg text-display-lg lg:text-[60px] text-surface font-bold tracking-tight mb-4">
            Less Noise. Better Essentials.
          </h1>
          <p className="font-body-lg text-body-lg text-surface/90 max-w-xl leading-relaxed">
            Founded on the conviction that everyday clothing should possess tactile dignity, lasting structure, and genuine artisanal heritage.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="w-full max-w-[1000px] mx-auto px-6 py-20">
        <div className="prose prose-lg text-on-surface-variant space-y-6">
          <span className="font-label-sm text-label-sm tracking-[0.25em] text-secondary uppercase font-semibold block">
            Our Origin Story
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            An Artisanal Dialogue Between Loom &amp; Silhouette
          </h2>
          <p className="font-body-lg text-body-lg leading-relaxed">
            At Vélure Atelier, every garment begins not on a design computer, but at the loom. We collaborate directly with multi-generational weaving clusters in Bengal and historic flax mills in Flanders to create textiles with character, subtle natural slubs, and quiet authority.
          </p>
          <p className="font-body-lg text-body-lg leading-relaxed">
            We discard seasonal retail panic. Instead of churning out endless inventory that ends up discarded, we construct tight capsule editions—capped at between 35 and 180 numbered pieces per silhouette. This eliminates deadstock fabric and guarantees that every stitch receives dedicated master-tailor attention.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-title-md text-title-md text-primary font-bold">100% Traceable Fibers</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              From European flax certified by Master of Linen® to cruelty-free wild Tussar and mulberry silks.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-title-md text-title-md text-primary font-bold">Hand-Finished Tailoring</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Every seam is cleanly bound with cotton tape. Hand-carved horn buttons, reinforced patch pockets, and French hems.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-title-md text-title-md text-primary font-bold">Zero-Plastic Promise</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Your garments arrive inside reusable organic cotton pouches and compostable botanical boxes with recycled paper tags.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-primary-container text-on-primary flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-surface">
              Explore Our Current Autumn Capsule
            </h3>
            <p className="font-body-sm text-on-primary-container mt-1">
              Limited-lot editions woven in numbered batches.
            </p>
          </div>
          <Link
            href="/shop"
            className="px-6 py-3 rounded-lg bg-surface text-primary hover:bg-surface-container-high font-title-md text-title-md font-semibold transition-colors shrink-0 shadow-sm inline-flex items-center gap-2"
          >
            <span>Shop Silhouettes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
