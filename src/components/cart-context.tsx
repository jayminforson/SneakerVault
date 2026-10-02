"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export interface CartItem {
  sneakerId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  /** Stock captured when the line was added, used for client-side clamping. */
  maxStock: number;
}

interface Snapshot {
  items: CartItem[];
  /** false until localStorage has been read on the client. */
  ready: boolean;
}

interface CartContextValue {
  items: CartItem[];
  /** Total units across all lines — what the nav badge shows. */
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "sneakervault.cart.v1";
const MAX_LINES = 30;
const MAX_UNITS_PER_LINE = 99;

const EMPTY_ITEMS: CartItem[] = [];
/** Server and first hydration render — never reads storage. */
const SERVER_SNAPSHOT: Snapshot = { items: EMPTY_ITEMS, ready: false };

// The cart lives outside React so several components can share it without a
// provider ordering constraint. React reads it through useSyncExternalStore,
// which is also what keeps the server HTML and the first client render equal.
let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

/** Same size + colour of the same pair is one line, not two. */
export function cartLineKey(item: Pick<CartItem, "sneakerId" | "size" | "color">): string {
  return `${item.sneakerId}|${item.size}|${item.color}`;
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        !!i &&
        typeof i.sneakerId === "string" &&
        typeof i.size === "string" &&
        typeof i.color === "string" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0
    );
  } catch {
    return [];
  }
}

function commit(items: CartItem[]) {
  snapshot = { items, ready: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private mode or a full quota — the cart still works for this session.
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  snapshot = { items: readStorage(), ready: true };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // React re-reads the snapshot after subscribing, so hydrating here is
    // enough — no notification needed.
    if (!snapshot.ready) snapshot = { items: readStorage(), ready: true };
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((incoming: Omit<CartItem, "quantity">, quantity = 1) => {
    const current = snapshot.items;
    const key = cartLineKey(incoming);
    const existing = current.find((i) => cartLineKey(i) === key);

    if (existing) {
      const limit = existing.maxStock || MAX_UNITS_PER_LINE;
      commit(current.map((i) =>
        i === existing ? { ...i, quantity: Math.min(existing.quantity + quantity, limit) } : i
      ));
      return;
    }
    if (current.length >= MAX_LINES) return;
    const limit = incoming.maxStock || MAX_UNITS_PER_LINE;
    commit([...current, { ...incoming, quantity: Math.min(quantity, limit) }]);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const next = snapshot.items
      .map((i) => {
        if (cartLineKey(i) !== key) return i;
        const limit = i.maxStock || MAX_UNITS_PER_LINE;
        return { ...i, quantity: Math.max(1, Math.min(quantity, limit)) };
      })
      .filter((i) => i.quantity > 0);
    commit(next);
  }, []);

  const remove = useCallback((key: string) => {
    commit(snapshot.items.filter((i) => cartLineKey(i) !== key));
  }, []);

  const clear = useCallback(() => commit([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = Math.round(
      state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
    ) / 100;
    return { items: state.items, count, subtotal, ready: state.ready, add, setQuantity, remove, clear };
  }, [state, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
