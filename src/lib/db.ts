import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "sneakers.json");

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

export async function getSneakers(): Promise<Sneaker[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getSneakerById(id: string): Promise<Sneaker | undefined> {
  const sneakers = await getSneakers();
  return sneakers.find((s) => s.id === id);
}

export async function saveSneakers(sneakers: Sneaker[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(sneakers, null, 2));
}

export async function addSneaker(sneaker: Sneaker): Promise<Sneaker> {
  const sneakers = await getSneakers();
  sneakers.push(sneaker);
  await saveSneakers(sneakers);
  return sneaker;
}

export async function updateSneaker(id: string, updates: Partial<Sneaker>): Promise<Sneaker | null> {
  const sneakers = await getSneakers();
  const idx = sneakers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sneakers[idx] = { ...sneakers[idx], ...updates, id };
  await saveSneakers(sneakers);
  return sneakers[idx];
}

export async function deleteSneaker(id: string): Promise<boolean> {
  const sneakers = await getSneakers();
  const filtered = sneakers.filter((s) => s.id !== id);
  if (filtered.length === sneakers.length) return false;
  await saveSneakers(filtered);
  return true;
}

// ---------- Orders ----------

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

export interface Order {
  orderId: string;
  sneakerId: string;
  sneakerName: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
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

export async function getOrders(): Promise<Order[]> {
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

export async function addOrder(order: Order): Promise<Order> {
  const orders = await getOrders();
  orders.push(order);
  await saveOrders(orders);
  return order;
}

export async function getOrderById(orderId: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.orderId === orderId);
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
  const orders = await getOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], status };
  await saveOrders(orders);
  return orders[idx];
}
