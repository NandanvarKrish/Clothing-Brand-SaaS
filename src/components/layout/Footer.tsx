"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Leaf, Award, MessageCircle, Globe, Check } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 pt-16 pb-12 mt-20">
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <span className="font-headline-lg text-headline-lg tracking-tight uppercase text-primary font-bold block mb-3">
              Vélure Atelier
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6 leading-relaxed">
              An artisanal dialogue between heritage loom craftsmanship and quiet luxury silhouettes. Each garment is meticulously tailored in small-batch runs using sustainably sourced fibers.
            </p>
            <div className="flex items-center gap-4 text-on-surface-variant font-label-md text-label-md">
              <span className="flex items-center gap-1.5 text-secondary">
                <Leaf className="w-[18px] h-[18px]" /> Pure Organic Fibers
              </span>
              <span className="flex items-center gap-1.5 text-secondary">
                <Award className="w-[18px] h-[18px]" /> Hand-Finished
              </span>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-5">
              Shop
            </h4>
            <ul className="space-y-3 font-body-md text-body-md text-on-surface-variant">
              <li>
                <Link href="/shop?filter=new-arrivals" className="hover:text-primary transition-colors">
                  New In
                </Link>
              </li>
              <li>
                <Link href="/collections/everyday-linen" className="hover:text-primary transition-colors">
                  Core Linen
                </Link>
              </li>
              <li>
                <Link href="/collections/artisanal-silk" className="hover:text-primary transition-colors">
                  Silk Heritage
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Outerwear" className="hover:text-primary transition-colors">
                  Outerwear
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=bestsellers" className="hover:text-primary transition-colors">
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Care Column */}
          <div>
            <h4 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-5">
              Client Care
            </h4>
            <ul className="space-y-3 font-body-md text-body-md text-on-surface-variant">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Shipping &amp; Returns
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Size &amp; Fit Guide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Garment Care
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Atelier
                </Link>
              </li>
            </ul>
          </div>

          {/* Private Drops Newsletter Column */}
          <div className="lg:col-span-1">
            <h4 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider mb-2">
              Private Drops
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 leading-relaxed">
              Receive intimate previews of limited textile editions and atelier invitations.
            </p>
            {subscribed ? (
              <div className="p-3 bg-in-stock-bg text-in-stock rounded-lg text-body-sm font-medium flex items-center gap-2 mb-6">
                <Check className="w-4 h-4" /> You are on the atelier guest list.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 mb-6">
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full h-10 px-3 rounded bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="w-full h-10 px-4 rounded bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-primary-container transition-colors"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            )}
            <div className="pt-2 border-t border-outline-variant/30">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Concierge
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://wa.me/919820144521"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary font-label-md text-label-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Concierge
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 font-tabular-num text-tabular-num font-medium text-on-surface">
              <Globe className="w-4 h-4" /> India (INR ₹)
            </span>
            <span className="hidden md:inline text-outline-variant">•</span>
            <span>Handcrafted in India</span>
          </div>
          <div className="text-center md:text-right">
            © 2024 Vélure Atelier Private Limited. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
