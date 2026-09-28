import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getOrders, getSneakerById, addOrder, getOrderById, updateOrder,
  type Order,
} from "@/lib/db";
import { computeTotals, isValidQuantity, MAX_QUANTITY } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sneakerId, color, size, quantity, customerName, customerEmail,
      customerPhone, deliveryAddress, notes, existingOrderId,
    } = body;

    if (!sneakerId || !customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidQuantity(quantity)) {
      return NextResponse.json({ error: `Quantity must be a whole number between 1 and ${MAX_QUANTITY}` }, { status: 400 });
    }
    const qty: number = quantity;

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    const sneaker = await getSneakerById(sneakerId);
    if (!sneaker) return NextResponse.json({ error: "Sneaker not found" }, { status: 404 });

    const sizeEntry = sneaker.sizes.find((s) => s.size === size);
    if (!sizeEntry) return NextResponse.json({ error: "Size not available" }, { status: 400 });
    if (!sizeEntry.available || sizeEntry.stock < qty) {
      return NextResponse.json(
        { error: `Only ${sizeEntry.stock} left in size ${size}` },
        { status: 409 }
      );
    }

    // Reuse a still-pending order from an earlier attempt instead of
    // inserting a duplicate row every time the customer retries payment.
    if (typeof existingOrderId === "string" && existingOrderId) {
      const existing = await getOrderById(existingOrderId);
      if (existing && existing.status === "PENDING" && existing.sneakerId === sneakerId) {
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
    const totals = computeTotals(sneaker.price, qty);

    const order: Order = {
      orderId,
      sneakerId,
      sneakerName: sneaker.name,
      brand: sneaker.brand,
      color: typeof color === "string" ? color : "",
      size: typeof size === "string" ? size : "",
      quantity: qty,
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
      sneaker: `${sneaker.brand} ${sneaker.name}`,
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
  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order });
  }
  const allOrders = await getOrders();
  allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ success: true, count: allOrders.length, orders: allOrders });
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();
    const valid: Order["status"][] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];
    if (!orderId || !valid.includes(status)) {
      return NextResponse.json({ error: "Missing orderId or invalid status" }, { status: 400 });
    }
    const updated = await updateOrder(orderId, { status });
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order: updated });
  } catch {
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
