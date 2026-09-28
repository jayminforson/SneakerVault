import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystack";
import { getOrderById, updateOrder } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, orderId, customerName } = body;

    if (!email || !orderId) {
      return NextResponse.json({ error: "Missing required fields: email, orderId" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "This order has already been paid" }, { status: 409 });
    }

    // Amount comes from the stored order, never from the client.
    const amount = order.totalAmount;
    const reference = `SV-${orderId}-${Date.now()}`;

    const result = await initializeTransaction({
      email,
      amount,
      reference,
      metadata: {
        orderId,
        customerName: customerName || order.customerName,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId,
          },
        ],
      },
    });

    // Record the reference so verification can resolve back to this order.
    await updateOrder(orderId, { paymentReference: result.data.reference });

    console.log(`Paystack payment initialized:`, {
      orderId,
      reference: result.data.reference,
      amount: `${order.currency} ${amount}`,
    });

    return NextResponse.json({
      success: true,
      accessCode: result.data.access_code,
      reference: result.data.reference,
      authorizationUrl: result.data.authorization_url,
      amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Payment initialize error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}
