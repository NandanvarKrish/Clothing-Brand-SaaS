"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Tag, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    appliedCoupon,
    couponError,
    shipping,
    freeShippingThreshold,
    freeShippingProgress,
    total,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState(appliedCoupon || "FESTIVE10");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applyCoupon(couponInput);
  };

  if (items.length === 0) {
    return (
      <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-md mx-auto text-center py-16 bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
            <Tag className="w-8 h-8" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-semibold mb-2">
            Your Shopping Bag is Empty
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            Explore our curated chapters and limited-batch garments cut from organic Belgian flax and pure raw silk.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded bg-primary text-on-primary font-title-md text-title-md font-semibold tracking-wide hover:bg-primary-container transition-colors shadow-sm"
          >
            Explore Silhouettes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-primary font-bold tracking-tight">
          Your Shopping Bag
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {itemCount} {itemCount === 1 ? "Curated Piece" : "Curated Pieces"} • Complimentary Pan-India Delivery
        </p>
      </div>

      {/* Free Shipping Progress */}
      <div className="p-4 rounded-xl bg-surface-container-low mb-8 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {subtotal >= freeShippingThreshold ? (
                <>
                  You&apos;ve unlocked{" "}
                  <strong className="text-secondary font-semibold">Complimentary Express Delivery</strong> across India!
                </>
              ) : (
                <>
                  Add{" "}
                  <strong className="text-secondary font-semibold">
                    {formatPrice(freeShippingThreshold - subtotal)}
                  </strong>{" "}
                  for Complimentary Express Delivery
                </>
              )}
            </span>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            {freeShippingProgress}%
          </span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-secondary to-primary-container rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Cart Line Items */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm"
            >
              <div className="w-24 h-32 rounded-lg overflow-hidden relative flex-shrink-0 bg-surface-container">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-title-md text-title-md text-primary font-semibold hover:text-secondary transition-colors"
                >
                  {item.name}
                </Link>
                <div className="flex items-center gap-3 text-body-sm text-on-surface-variant mt-1">
                  <span>Size: {item.size}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    {item.colorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: item.colorHex }}
                      />
                    )}
                    {item.color}
                  </span>
                </div>
                <div className="mt-3 font-tabular-num text-tabular-num text-primary font-bold">
                  {formatPrice(item.price)} each
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                <div className="flex items-center bg-surface-container rounded-md px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-tabular-num text-tabular-num font-semibold text-primary">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label="Increase quantity"
                    className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[90px]">
                  <span className="font-headline-md text-headline-md text-primary font-bold font-tabular-num">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  className="p-1 text-on-surface-variant hover:text-error transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Browsing Collections
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/30 space-y-6 lg:sticky lg:top-28">
          <h2 className="font-title-md text-title-md text-primary font-semibold uppercase tracking-wider">
            Order Summary
          </h2>

          {/* Coupon Input */}
          <div>
            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 h-10 px-3 rounded-lg bg-surface-container-lowest font-body-md text-body-md text-primary uppercase tracking-wide border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold uppercase tracking-wider hover:bg-secondary/90 transition-colors"
              >
                {appliedCoupon ? "Applied" : "Apply"}
              </button>
            </form>

            {couponError && (
              <p className="text-body-sm text-error mt-1">{couponError}</p>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[#ebf2ec] text-[#386641] font-label-sm text-label-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>&apos;{appliedCoupon}&apos; applied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-tabular-num font-bold">-{formatPrice(discount)}</span>
                  <button type="button" onClick={removeCoupon} className="hover:underline">
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 pt-4 border-t border-surface-container-high font-body-md text-body-md">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal ({itemCount} pieces)</span>
              <span className="font-tabular-num text-on-surface">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-on-surface-variant">
              <span>Standard Express Shipping</span>
              <span className="font-label-md text-label-md font-semibold text-[#386641] uppercase">
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Promotional Discount</span>
                <span className="font-tabular-num font-semibold">-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="pt-4 border-t border-surface-container-high flex justify-between items-baseline">
              <div>
                <span className="font-title-md text-title-md text-primary font-bold">Total Amount</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Inclusive of all taxes</p>
              </div>
              <span className="font-headline-md text-headline-md text-primary font-bold font-tabular-num">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Proceed to Checkout CTA */}
          <Link
            href="/checkout"
            className="w-full h-12 rounded-lg bg-primary-container hover:bg-[#7F4F24] text-on-primary font-title-md text-title-md font-semibold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="font-body-sm text-[11px] text-center text-on-surface-variant">
            Small-batch handcrafted garments with 14-day complimentary exchanges.
          </p>
        </div>
      </div>
    </main>
  );
}
