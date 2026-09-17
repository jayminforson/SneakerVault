import { NextRequest, NextResponse } from "next/server";
import { sendCustomerReceipt, sendOwnerNotification, OrderEmailData } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId, customerName, customerEmail, customerPhone,
      sneakerName, brand, size, color, quantity,
      subtotal, deliveryFee, tax, totalAmount,
      paymentMethod, paymentStatus, deliveryAddress, heroImage,
    } = body;

    if (!orderId || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields: orderId, customerName, customerEmail" }, { status: 400 });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const orderData: OrderEmailData = {
      orderId,
      customerName,
      customerEmail,
      sneakerName: sneakerName || "",
      brand: brand || "",
      size: size || "",
      color: color || "",
      quantity: quantity || 1,
      subtotal: subtotal || totalAmount || 0,
      deliveryFee: deliveryFee || 0,
      tax: tax || 0,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || "MTN Mobile Money",
      paymentStatus: paymentStatus || "SUCCESSFUL",
      deliveryAddress: deliveryAddress || "",
      date: dateStr,
      heroImage: heroImage || "",
    };

    console.log(`Sending notifications for order ${orderId}`);

    const [receiptResult, notificationResult] = await Promise.allSettled([
      sendCustomerReceipt(orderData),
      sendOwnerNotification(orderData),
    ]);

    const receiptSent = receiptResult.status === "fulfilled" && receiptResult.value;
    const ownerNotified = notificationResult.status === "fulfilled" && notificationResult.value;

    console.log(`Order ${orderId} — Receipt: ${receiptSent ? "sent" : "failed"}, Owner: ${ownerNotified ? "notified" : "failed"}`);

    return NextResponse.json({
      success: true,
      receiptSent,
      ownerNotified,
      message: "Notifications processed",
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
