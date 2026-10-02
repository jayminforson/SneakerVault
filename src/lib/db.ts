import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import * as q from "@/lib/queries";

// Data layer. The public API is unchanged from the original JSON-file
// implementation so callers in src/app and src/lib do not need to know which
// storage backend is in use. All SQL lives in ./queries.

export interface SneakerSize {
  size: string;
  available: boolean;
  stock: number;
}

export interface SneakerColor {
  name: string;
  hex: string;
  image: string;
}

export interface Sneaker {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  colors: SneakerColor[];
  sizes: SneakerSize[];
  tags: string[];
}

export interface OrderItem {
  sneakerId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

export interface Order {
  orderId: string;
  sneakerId: string;
  sneakerName: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
  /**
   * Full line list for multi-item carts. Legacy single-item orders have no
   * value here — callers fall back to the top-level fields above.
   */
  items?: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";
  paymentReference?: string;
  paymentChannel?: string;
  createdAt: string;
  date: string;
}

// Created lazily so that `next build` (and any environment without a database)
// can import route modules without throwing at module scope.
let client: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
    );
  }
  if (!client) client = neon(url);
  return client;
}

async function run(query: q.Query): Promise<Record<string, unknown>[]> {
  const rows = await getSql().query(query.text, query.params as unknown[]);
  return rows as Record<string, unknown>[];
}

interface SneakerRow {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number | string;
  original_price: number | string | null;
  rating: number | string;
  review_count: number;
  hero_image: string;
  colors: SneakerColor[] | null;
  tags: string[] | null;
  sizes: SneakerSize[] | null;
}

interface OrderRow {
  order_id: string;
  sneaker_id: string;
  sneaker_name: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
  items: OrderItem[] | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  notes: string;
  subtotal: number | string;
  delivery_fee: number | string;
  tax: number | string;
  total_amount: number | string;
  currency: string;
  status: string;
  payment_reference: string | null;
  payment_channel: string | null;
  created_at: string | Date;
  date: string;
}

function toSneaker(row: SneakerRow): Sneaker {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price == null ? undefined : Number(row.original_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    heroImage: row.hero_image,
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    tags: row.tags ?? [],
  };
}

function toOrder(row: OrderRow): Order {
  return {
    orderId: row.order_id,
    sneakerId: row.sneaker_id,
    sneakerName: row.sneaker_name,
    brand: row.brand,
    color: row.color,
    size: row.size,
    quantity: Number(row.quantity),
    items: row.items ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    tax: Number(row.tax),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    status: row.status as Order["status"],
    paymentReference: row.payment_reference ?? undefined,
    paymentChannel: row.payment_channel ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    date: row.date,
  };
}

// Drops keys whose value is undefined so a partial update never blanks a column.
function definedOnly<T extends object>(input: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

// ---------- Sneakers ----------

export async function getSneakers(): Promise<Sneaker[]> {
  const rows = (await run(q.selectSneakers)) as unknown as SneakerRow[];
  return rows.map(toSneaker);
}

export async function getSneakerById(id: string): Promise<Sneaker | undefined> {
  const rows = (await run(q.selectSneakerById(id))) as unknown as SneakerRow[];
  return rows[0] ? toSneaker(rows[0]) : undefined;
}

async function replaceSizes(sneakerId: string, sizes: SneakerSize[]): Promise<void> {
  await run(q.deleteSizes(sneakerId));
  for (let i = 0; i < sizes.length; i++) {
    const entry = sizes[i];
    if (!entry?.size) continue;
    await run(
      q.insertSize(
        sneakerId,
        entry.size,
        entry.available !== false,
        Math.max(0, Math.trunc(Number(entry.stock) || 0)),
        i
      )
    );
  }
}

function sneakerPayload(sneaker: Sneaker) {
  return {
    id: sneaker.id,
    name: sneaker.name,
    brand: sneaker.brand,
    description: sneaker.description,
    price: sneaker.price,
    originalPrice: sneaker.originalPrice,
    rating: sneaker.rating,
    reviewCount: sneaker.reviewCount,
    heroImage: sneaker.heroImage,
    colors: JSON.stringify(sneaker.colors ?? []),
    tags: JSON.stringify(sneaker.tags ?? []),
  };
}

export async function addSneaker(sneaker: Sneaker): Promise<Sneaker> {
  await run(q.insertSneaker(sneakerPayload(sneaker)));
  await replaceSizes(sneaker.id, sneaker.sizes ?? []);
  return sneaker;
}

export async function updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker | null> {
  const existing = await getSneakerById(id);
  if (!existing) return null;

  const patch = definedOnly(updates);
  const merged: Sneaker = { ...existing, ...patch, id };

  await run(q.updateSneaker(sneakerPayload(merged)));
  if (patch.sizes) await replaceSizes(id, merged.sizes);

  return (await getSneakerById(id)) ?? null;
}

export async function deleteSneaker(id: string): Promise<boolean> {
  const existing = await getSneakerById(id);
  if (!existing) return false;
  await run(q.deleteSneaker(id));
  return true;
}

// ---------- Orders ----------

export async function getOrders(): Promise<Order[]> {
  const rows = (await run(q.selectOrders)) as unknown as OrderRow[];
  return rows.map(toOrder);
}

export async function addOrder(order: Order): Promise<Order> {
  await run(q.insertOrder({ ...order, items: JSON.stringify(order.items ?? null) }));
  return order;
}

export async function getOrderById(orderId: string): Promise<Order | undefined> {
  const rows = (await run(q.selectOrderById(orderId))) as unknown as OrderRow[];
  return rows[0] ? toOrder(rows[0]) : undefined;
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
  const existing = await getOrderById(orderId);
  if (!existing) return null;

  const patch = definedOnly(updates);
  const merged: Order = { ...existing, ...patch, orderId };

  await run(q.updateOrder({ ...merged, items: JSON.stringify(merged.items ?? null) }));
  return (await getOrderById(orderId)) ?? null;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
  return updateOrder(orderId, { status });
}

// Resolves a Paystack reference back to its order. Also matches references of
// the form SV-<orderId>-<timestamp> so a superseded reference still resolves.
export async function getOrderByPaymentReference(reference: string): Promise<Order | undefined> {
  const rows = (await run(q.selectOrderByPaymentReference(reference))) as unknown as OrderRow[];
  return rows[0] ? toOrder(rows[0]) : undefined;
}

// ---------- Stock ----------

export async function decrementStock(sneakerId: string, size: string, quantity: number): Promise<void> {
  await run(q.decrementStock(sneakerId, size, Math.trunc(quantity)));
}
