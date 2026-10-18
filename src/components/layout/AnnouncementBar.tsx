"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/utils";

const STORAGE_KEY = "velure_announcement_dismissed";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = getFromStorage<boolean>(STORAGE_KEY, false);
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    saveToStorage(STORAGE_KEY, true);
  };

  if (dismissed) return null;

  return (
    <aside aria-label="Announcement" className="bg-primary-container text-on-primary-container text-label-sm font-label-sm px-4 py-2 flex items-center justify-between tracking-wide">
      <div className="w-6 hidden md:block" />
      <p className="flex-1 text-center font-medium">
        Complimentary express shipping across India on orders above ₹1,999 • Artisanal Small-Batch Autumn 24
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="text-on-primary-container hover:text-on-primary transition-colors flex items-center justify-center p-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
}
