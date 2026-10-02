// Shared business constants. Imported by both the checkout UI (for display)
// and the order/payment API routes (authoritative totals).

export const CURRENCY = "GHS";
export const CURRENCY_SYMBOL = "GH₵";
export const DELIVERY_FEE = 25;
// Tax added on top of the subtotal. Set to 0 to disable it entirely — the
// cart, checkout and receipts then omit the row instead of showing a zero.
// Any non-zero value (e.g. 0.15) charges it and shows the percentage again.
export const TAX_RATE = 0;
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

/** One priced line of an order. */
export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

/** Upper bound on distinct lines in a single order, to keep abuse bounded. */
export const MAX_ORDER_LINES = 20;

// Single source of truth for pricing. The API recomputes these from the
// catalogue price — client-supplied amounts are never trusted. Delivery is
// charged once per order, regardless of how many lines it contains.
export function computeTotalsForLines(lines: readonly PricedLine[]): Totals {
  const subtotal = round(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  );
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

export function computeTotals(unitPrice: number, quantity: number): Totals {
  return computeTotalsForLines([{ unitPrice, quantity }]);
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
