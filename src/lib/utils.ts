import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format monetary amount in Indian Rupees (₹)
 * Examples: 4200 -> "₹4,200", 3850 -> "₹3,850"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validates 6-digit Indian PIN code
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Generate a realistic demo order number
 */
export function generateOrderNumber(): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `VEL-2024-${randomPart}`;
}

/**
 * Safe local storage reader that works with Next.js SSR
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe local storage writer
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
  }
}
