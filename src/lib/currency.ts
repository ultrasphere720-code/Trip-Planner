/**
 * Shared Currency Configuration & Utilities
 * Usable across both client components and server routes.
 */

export const BASE_DAILY_PER_PERSON: Record<string, number> = {
  INR: 6000,   // ₹6,000 / day / person
  USD: 75,     // $75 / day / person
  EUR: 70,     // €70 / day / person
  GBP: 60,     // £60 / day / person
  JPY: 11000,  // ¥11,000 / day / person
};

export const MIN_DAILY_BUDGET = BASE_DAILY_PER_PERSON;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export const DEFAULT_DAILY_BUDGET: Record<string, number> = {
  INR: 8000,
  USD: 100,
  EUR: 90,
  GBP: 80,
  JPY: 15000,
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
];

export function getCurrencyCode(curr?: string): string {
  if (!curr) return "USD";
  const upper = curr.trim().toUpperCase();
  if (upper === "INR" || curr === "₹") return "INR";
  if (upper === "EUR" || curr === "€") return "EUR";
  if (upper === "GBP" || curr === "£") return "GBP";
  if (upper === "JPY" || curr === "¥") return "JPY";
  return "USD";
}

export function getCurrencySymbol(curr?: string): string {
  if (!curr) return "$";
  const code = getCurrencyCode(curr);
  return CURRENCY_SYMBOLS[code] || "$";
}
