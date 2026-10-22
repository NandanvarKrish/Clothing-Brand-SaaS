"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { getProductById } from "@/services/productService";

export default function WishlistPage() {
  const { items, itemCount, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToBag = async (productId: string) => {
    const product = await getProductById(productId);
    if (product) {
      addItem(product, product.sizes[0] || "M", product.colors[0]?.name || "Standard", 1);
      removeFromWishlist(productId);
    }
  };

  if (itemCount === 0) {
    return (
      <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="max-w-md mx-auto text-center py-16 bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-semibold mb-2">
            Your Wishlist is Empty
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            Curate your personal collection of small-batch silhouettes by clicking the heart icon on any piece.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-8 border-b border-surface-container-high">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-[0.25em] text-secondary font-semibold block mb-1">
            Personal Atelier Curation
          </span>
          <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-primary font-bold tracking-tight">
            Saved Pieces ({itemCount})
          </h1>
        </div>
        <button
          type="button"
          onClick={clearWishlist}
          className="font-label-md text-label-md text-secondary hover:text-error transition-colors uppercase tracking-wider font-semibold self-start sm:self-auto"
        >
          Clear All Saved
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <article
            key={item.productId}
            className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-outline-variant/20"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => removeFromWishlist(item.productId)}
                aria-label="Remove from wishlist"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface hover:text-error hover:scale-110 flex items-center justify-center transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {item.isAvailable === false ? (
                <div className="absolute top-3 left-3 bg-error-container text-error font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold uppercase shadow-sm">
                  Unavailable
                </div>
              ) : item.badge ? (
                <div className="absolute top-3 left-3 bg-surface-container-lowest/90 text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold uppercase shadow-sm">
                  {item.badge}
                </div>
              ) : null}
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
                  {item.category}
                </span>
                {item.isAvailable === false ? (
                  <span className="font-title-md text-title-md text-on-surface-variant font-semibold block">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-title-md text-title-md text-primary font-semibold hover:text-secondary transition-colors block"
                  >
                    {item.name}
                  </Link>
                )}
                {item.isAvailable === false ? (
                  <p className="text-xs text-error mt-2">
                    No longer available in active catalog.
                  </p>
                ) : (
                  <span className="font-headline-md text-headline-md font-bold text-primary font-tabular-num mt-2 block">
                    {formatPrice(item.price)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
                {item.isAvailable === false ? (
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.productId)}
                    className="flex-1 py-2 rounded bg-surface-container text-on-surface-variant hover:text-error transition-colors font-title-md text-sm font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Piece
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleMoveToBag(item.productId)}
                      className="flex-1 py-2 rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-md text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-4 h-4" /> Move to Bag
                    </button>
                    <Link
                      href={`/products/${item.slug}`}
                      className="px-3 py-2 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
