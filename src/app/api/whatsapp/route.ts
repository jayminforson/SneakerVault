import { NextRequest, NextResponse } from "next/server";
import { notifyOwner, sendReceipt, OrderData, ReceiptData } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerName, customerPhone, sneakerName, brand, size, color, quantity, subtotal, deliveryFee, tax, totalAmount, paymentMethod, paymentStatus } = body;

    if (!orderId || !customerName || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const orderData: OrderData = {
      orderId, customerName, customerPhone, sneakerName, brand, size, color, quantity, totalAmount,
      subtotal: subtotal || totalAmount, deliveryFee: deliveryFee || 0, tax: tax || 0,
      paymentMethod: paymentMethod || "MTN Mobile Money", paymentStatus: paymentStatus || "SUCCESSFUL", date: dateStr,
    };

    const receiptData: ReceiptData = { ...orderData };

    console.log(`Sending WhatsApp notifications for order ${orderId}`);

    const ownerNotified = await notifyOwner(orderData);
    console.log(`Owner notification: ${ownerNotified ? "sent" : "failed"}`);

    const receiptSent = await sendReceipt(receiptData);
    console.log(`Customer receipt: ${receiptSent ? "sent" : "failed"}`);

    return NextResponse.json({ success: true, ownerNotified, receiptSent, message: "WhatsApp notifications processed" });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return NextResponse.json({ error: "Failed to send WhatsApp notifications" }, { status: 500 });
  }
}
