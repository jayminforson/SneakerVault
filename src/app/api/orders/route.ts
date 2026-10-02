import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getOrders, getSneakerById, addOrder, getOrderById, updateOrder,
  type Order, type OrderItem,
} from "@/lib/db";
import {
  computeTotalsForLines, isValidQuantity, MAX_QUANTITY, MAX_ORDER_LINES,
} from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

interface RawLine {
  sneakerId?: unknown;
  color?: unknown;
  size?: unknown;
  quantity?: unknown;
}

// Stable fingerprint of what the customer is buying, used to decide whether a
// still-pending order from an earlier attempt can be reused.
function linesSignature(
  lines: Pick<OrderItem, "sneakerId" | "size" | "color" | "quantity">[]
): string {
  return lines
    .map((l) => `${l.sneakerId}|${l.size}|${l.color}|${l.quantity}`)
    .sort()
    .join(";");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName, customerEmail, customerPhone, deliveryAddress, notes,
      existingOrderId, sneakerId, color, size, quantity,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, "");
    if (cleanPhone.length < 9) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    // Multi-item carts send `items`; the single-product buy-now flow sends the
    // top-level fields instead. Both end up as the same line list below.
    const rawLines: RawLine[] = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : [{ sneakerId, color, size, quantity }];

    if (rawLines.length > MAX_ORDER_LINES) {
      return NextResponse.json({ error: `An order can contain at most ${MAX_ORDER_LINES} items` }, { status: 400 });
    }

    const lines: OrderItem[] = [];
    const catalogue = new Map<string, Awaited<ReturnType<typeof getSneakerById>>>();

    for (const raw of rawLines) {
      if (typeof raw.sneakerId !== "string" || !raw.sneakerId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      if (!isValidQuantity(raw.quantity)) {
        return NextResponse.json(
          { error: `Quantity must be a whole number between 1 and ${MAX_QUANTITY}` },
          { status: 400 }
        );
      }
      const lineQty: number = raw.quantity;

      if (!catalogue.has(raw.sneakerId)) {
        catalogue.set(raw.sneakerId, await getSneakerById(raw.sneakerId));
      }
      const sneaker = catalogue.get(raw.sneakerId);
      if (!sneaker) {
        return NextResponse.json({ error: "Sneaker not found" }, { status: 404 });
      }

      const lineSize = typeof raw.size === "string" ? raw.size : "";
      const sizeEntry = sneaker.sizes.find((s) => s.size === lineSize);
      if (!sizeEntry) return NextResponse.json({ error: "Size not available" }, { status: 400 });
      if (!sizeEntry.available || sizeEntry.stock < lineQty) {
        return NextResponse.json(
          { error: `Only ${sizeEntry.stock} left in size ${lineSize}` },
          { status: 409 }
        );
      }

      const colorName = typeof raw.color === "string" ? raw.color : "";
      const colorEntry = sneaker.colors.find((c) => c.name === colorName);

      lines.push({
        sneakerId: sneaker.id,
        name: sneaker.name,
        brand: sneaker.brand,
        size: lineSize,
        color: colorName,
        quantity: lineQty,
        // Priced from the catalogue, never from the request body.
        unitPrice: sneaker.price,
        image: colorEntry?.image || sneaker.heroImage,
      });
    }

    const first = lines[0];
    const signature = linesSignature(lines);

    // Reuse a still-pending order from an earlier attempt instead of
    // inserting a duplicate row every time the customer retries payment.
    if (typeof existingOrderId === "string" && existingOrderId) {
      const existing = await getOrderById(existingOrderId);
      const existingLines = existing?.items ?? (existing ? [{
        sneakerId: existing.sneakerId,
        size: existing.size,
        color: existing.color,
        quantity: existing.quantity,
      }] : []);
      if (
        existing &&
        existing.status === "PENDING" &&
        linesSignature(existingLines) === signature
      ) {
        return NextResponse.json({
          success: true,
          orderId: existing.orderId,
          status: existing.status,
          date: existing.date,
          totals: pickTotals(existing),
        });
      }
    }

    const orderId = `SV-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const now = new Date();
    const totals = computeTotalsForLines(lines);

    const order: Order = {
      orderId,
      // Legacy single-item columns mirror the first line so older readers
      // (admin list, historical exports) keep working unchanged.
      sneakerId: first.sneakerId,
      sneakerName: first.name,
      brand: first.brand,
      color: first.color,
      size: first.size,
      quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
      items: lines,
      customerName,
      customerEmail,
      customerPhone: `+233${cleanPhone}`,
      deliveryAddress,
      notes: notes || "",
      ...totals,
      status: "PENDING",
      createdAt: now.toISOString(),
      date: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    await addOrder(order);
    console.log(`New Order: ${orderId}`, {
      customer: customerName,
      email: customerEmail,
      items: lines.map((l) => `${l.brand} ${l.name} (${l.size}) x${l.quantity}`),
      amount: `${totals.currency} ${totals.totalAmount}`,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status: "PENDING",
      date: order.date,
      totals,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  // Single-order lookup stays public so checkout can re-confirm a payment,
  // but it deliberately exposes no customer PII.
  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentReference: order.paymentReference,
        paymentChannel: order.paymentChannel,
        totalAmount: order.totalAmount,
        currency: order.currency,
      },
    });
  }

  const denied = requireAdmin(request);
  if (denied) return denied;

  const allOrders = await getOrders();
  allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ success: true, count: allOrders.length, orders: allOrders });
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { orderId, status } = await request.json();
    const valid: Order["status"][] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];
    if (!orderId || !valid.includes(status)) {
      return NextResponse.json({ error: "Missing orderId or invalid status" }, { status: 400 });
    }
    const updated = await updateOrder(orderId, { status });
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

function pickTotals(order: Order) {
  return {
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    totalAmount: order.totalAmount,
    currency: order.currency,
  };
}
