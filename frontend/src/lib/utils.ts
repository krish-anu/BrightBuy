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
