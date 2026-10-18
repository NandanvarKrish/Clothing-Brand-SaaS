"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/types";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ProductImage[];
  initialIndex?: number;
}

export function ImageLightboxModal({ isOpen, onClose, images, initialIndex = 0 }: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface/20 text-surface hover:bg-surface/40 flex items-center justify-center transition-colors z-20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface/20 text-surface hover:bg-surface/40 flex items-center justify-center transition-colors z-20"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
        <Image
          src={current.url}
          alt={current.alt || "Product image"}
          fill
          sizes="90vw"
          className="object-contain"
        />
        {current.label && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface/90 text-primary px-4 py-1.5 rounded-full font-label-md text-label-md uppercase tracking-wider font-semibold shadow-sm">
            {current.label} Perspective ({currentIndex + 1} / {images.length})
          </div>
        )}
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface/20 text-surface hover:bg-surface/40 flex items-center justify-center transition-colors z-20"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
