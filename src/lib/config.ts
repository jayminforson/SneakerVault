// Shared business constants. Imported by both the checkout UI (for display)
// and the order/payment API routes (authoritative totals).

export const CURRENCY = "GHS";
export const CURRENCY_SYMBOL = "GH₵";
export const DELIVERY_FEE = 25;
export const TAX_RATE = 0.15;
export const MAX_QUANTITY = 99;

export interface PaymentMethod {
  /** Full label, used in the checkout checklist. */
  label: string;
  /** Compact form for prose, e.g. "Pay securely with {short}". */
  short: string;
}

// Payment channels enabled on the Paystack dashboard. The checkout popup only
// offers what is selected there, so storefront copy is derived from this list
// — editing it in one place keeps every mention in sync.
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  { label: "Visa / Mastercard", short: "card" },
];

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  currency: string;
}

// Single source of truth for pricing. The API recomputes these from the
// catalogue price — client-supplied amounts are never trusted.
export function computeTotals(unitPrice: number, quantity: number): Totals {
  const subtotal = round(unitPrice * quantity);
  const deliveryFee = DELIVERY_FEE;
  const tax = round(subtotal * TAX_RATE);
  return {
    subtotal,
    deliveryFee,
    tax,
    totalAmount: round(subtotal + deliveryFee + tax),
    currency: CURRENCY,
  };
}

export function isValidQuantity(value: unknown): value is number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_QUANTITY;
}

/** Joins the short forms for prose: "card", "card and Mobile Money". */
export function paymentMethodsSentence(): string {
  const items = PAYMENT_METHODS.map((m) => m.short);
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
