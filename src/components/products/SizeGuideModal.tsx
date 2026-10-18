"use client";

import React from "react";
import { X, Ruler, MessageCircle } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

const SIZE_ROWS = [
  { size: "XS", chest: "38", shoulder: "17.5", length: "27" },
  { size: "S", chest: "40", shoulder: "18.0", length: "27.5" },
  { size: "M", chest: "42", shoulder: "18.5", length: "28.0" },
  { size: "L", chest: "44.5", shoulder: "19.2", length: "28.5" },
  { size: "XL", chest: "47", shoulder: "20.0", length: "29.0" },
];

export function SizeGuideModal({ isOpen, onClose, selectedSize = "M", onSelectSize }: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-[#24201D]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside aria-label="Size Guide" className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-high">
            <div className="flex items-center gap-2">
              <Ruler className="w-6 h-6 text-secondary" />
              <h3 className="font-headline-md text-headline-md font-bold text-primary">
                Garment Sizing Matrix
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close size guide"
              className="p-1 text-on-surface-variant hover:text-primary rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant my-6">
            Measurements are taken across garments laid flat. For the intended relaxed silhouette, we recommend choosing your standard size.
          </p>

          {/* Sizing Matrix Table */}
          <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm mb-6 border border-outline-variant/30">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Chest (in)</th>
                  <th className="p-3">Shoulder (in)</th>
                  <th className="p-3">Length (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {SIZE_ROWS.map((row) => {
                  const isSelected = selectedSize.toUpperCase() === row.size;
                  return (
                    <tr
                      key={row.size}
                      onClick={() => onSelectSize && onSelectSize(row.size)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-secondary-container/20 font-bold text-primary"
                          : "hover:bg-surface-container-low"
                      }`}
                    >
                      <td className="p-3 font-semibold">
                        {row.size} {isSelected && "(Selected)"}
                      </td>
                      <td className="p-3 font-tabular-num">{row.chest}</td>
                      <td className="p-3 font-tabular-num">{row.shoulder}</td>
                      <td className="p-3 font-tabular-num">{row.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Master Tailor Consultation Card */}
          <div className="p-4 bg-surface-container rounded-lg flex flex-col gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-secondary" /> Atelier Fit Guarantee
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Still undecided? Connect with our master tailor via WhatsApp for individualized fit consultations before placing your order.
            </p>
            <a
              href="https://wa.me/919820144521?text=Hello%2C%20I%20would%20like%20a%20sizing%20consultation%20for%20V%C3%A9lure%20Atelier."
              target="_blank"
              rel="noopener noreferrer"
              className="font-label-md text-label-md text-secondary hover:text-primary font-semibold inline-flex items-center gap-1 mt-1 transition-colors"
            >
              Consult with Master Tailor →
            </a>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-primary text-on-primary font-title-md text-title-md font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-primary-container transition-colors"
          >
            Confirm &amp; Return to Product
          </button>
        </div>
      </aside>
    </div>
  );
}
