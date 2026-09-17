import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 });
  }

  try {
    const result = await verifyTransaction(reference);

    const status = result.data.status === "success" ? "SUCCESSFUL" : "FAILED";

    console.log(`Paystack verification: ${reference} → ${status} (${result.data.gateway_response})`);

    return NextResponse.json({
      status,
      reference,
      amount: result.data.amount / 100, // Convert pesewas back to GHS
      channel: result.data.channel,
      paidAt: result.data.paid_at,
      customerEmail: result.data.customer.email,
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}
