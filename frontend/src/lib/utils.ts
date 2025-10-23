import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a value as USD consistently across the app
export function formatCurrencyUSD(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  const num = (() => {
    if (value == null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]+/g, '');
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  })();

  // Merge and sanitize fraction digit options to avoid RangeError
  const merged: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  // Clamp to valid ranges and ensure min <= max
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  if (typeof merged.maximumFractionDigits === 'number') {
    merged.maximumFractionDigits = clamp(merged.maximumFractionDigits, 0, 20);
  }
  if (typeof merged.minimumFractionDigits === 'number') {
    merged.minimumFractionDigits = clamp(merged.minimumFractionDigits, 0, 20);
  }
  if (
    typeof merged.minimumFractionDigits === 'number' &&
    typeof merged.maximumFractionDigits === 'number' &&
    merged.minimumFractionDigits > merged.maximumFractionDigits
  ) {
    merged.minimumFractionDigits = merged.maximumFractionDigits;
  }

  return new Intl.NumberFormat('en-US', merged).format(num);
}

// Shipping charge helper mirrored from backend rules
// - Store Pickup: always free
// - Standard Delivery: depends on city type (isMainCity) and order value thresholds
export function computeShippingCharge(
  isMainCity: boolean,
  orderValue: number,
  shippingMethod: "standard" | "pickup"
): number {
  if (shippingMethod === "pickup") return 0;
  const v = Number(orderValue);
  if (Number.isNaN(v)) return 0;
  if (isMainCity) {
    if (v <= 100) return 5.99;
    if (v <= 500) return 3.99;
    return 0; // > 500
  }
  if (v <= 100) return 9.99;
  if (v <= 500) return 6.99;
  return 3.99; // > 500
}
