import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, orderId, customerName } = body;

    if (!email || !amount || !orderId) {
      return NextResponse.json({ error: "Missing required fields: email, amount, orderId" }, { status: 400 });
    }

    const reference = `SV-${orderId}-${Date.now()}`;

    const result = await initializeTransaction({
      email,
      amount: Number(amount),
      reference,
      metadata: {
        orderId,
        customerName: customerName || "",
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId,
          },
        ],
      },
    });

    console.log(`Paystack payment initialized:`, {
      orderId,
      reference: result.data.reference,
      amount: `GHS ${amount}`,
    });

    return NextResponse.json({
      success: true,
      accessCode: result.data.access_code,
      reference: result.data.reference,
      authorizationUrl: result.data.authorization_url,
    });
  } catch (error) {
    console.error("Payment initialize error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}
