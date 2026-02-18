/**
 * Currency formatting utilities for Georgian Lari (₾)
 */

/**
 * Format a number as Georgian Lari currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string with ₾ symbol
 */
export function formatGEL(
  amount: number,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    decimals = 2,
    locale = 'en-US', // Using en-US for proper thousand separators
  } = options;

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return showSymbol ? `₾ ${formatted}` : formatted;
}

/**
 * Format a number as compact Georgian Lari (e.g., ₾ 1.2K)
 * @param amount - The amount to format
 * @returns Compact formatted currency string
 */
export function formatGELCompact(amount: number): string {
  if (amount >= 1000000) {
    return `₾ ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₾ ${(amount / 1000).toFixed(1)}K`;
  }
  return formatGEL(amount, { decimals: 0 });
}

/**
 * Parse a GEL currency string to a number
 * @param gelString - Currency string (e.g., "₾ 1,234.56")
 * @returns Parsed number
 */
export function parseGEL(gelString: string): number {
  const cleaned = gelString.replace(/[₾,\s]/g, '');
  return parseFloat(cleaned) || 0;
}
