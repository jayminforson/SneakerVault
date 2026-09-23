import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getOrders, addOrder, getOrderById, updateOrderStatus, type Order } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sneakerId, sneakerName, brand, color, size, quantity, customerName, customerEmail, customerPhone, deliveryAddress, notes, subtotal, deliveryFee, tax, totalAmount, currency, paymentReference, paymentChannel } = body;

    if (!sneakerId || !customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    const orderId = `SV-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const now = new Date();

    const order: Order = {
      orderId, sneakerId, sneakerName, brand, color, size, quantity,
      customerName, customerEmail, customerPhone: `+233${cleanPhone}`,
      deliveryAddress, notes: notes || "", subtotal, deliveryFee, tax, totalAmount,
      currency: currency || "GHS", status: "PENDING",
      paymentReference: paymentReference || undefined,
      paymentChannel: paymentChannel || undefined,
      createdAt: now.toISOString(),
      date: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    await addOrder(order);
    console.log(`New Order: ${orderId}`, { customer: customerName, email: customerEmail, sneaker: `${brand} ${sneakerName}`, amount: `GHS ${totalAmount}` });

    return NextResponse.json({ success: true, orderId, status: "PENDING", date: order.date });
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
    const updated = await updateOrderStatus(orderId, status);
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, order: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
