import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { settleOrder } from "@/lib/payment";

// Verifying the transaction is what actually settles the order. Everything that
// must happen after money moves — status flip, stock decrement, receipt — runs
// here on the server rather than being orchestrated by the browser. The same
// settleOrder() is driven by the Paystack webhook too, so whichever arrives
// first settles the order and the other becomes a no-op.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 });
  }

  try {
    const result = await verifyTransaction(reference);
    const paid = result.data.status === "success";
    const channel = result.data.channel || "Paystack";
    const paidAmountGHS = result.data.amount / 100;

    if (!paid) {
      console.log(`Paystack verification: ${reference} → FAILED (${result.data.gateway_response})`);
      return NextResponse.json({
        status: "FAILED",
        reference,
        channel,
        message: result.data.gateway_response || "Payment was not successful",
      });
    }

    const settled = await settleOrder(reference, channel, paidAmountGHS);

    if (!settled.order) {
      return NextResponse.json({
        status: "SUCCESSFUL",
        reference,
        channel,
        orderId: null,
        warning: "Payment verified but no matching order was found",
      });
    }

    console.log(
      `Paystack verification: ${reference} → SUCCESSFUL (${channel}) order ${settled.order.orderId}`
    );

    return NextResponse.json({
      status: "SUCCESSFUL",
      reference,
      channel,
      orderId: settled.order.orderId,
      amount: paidAmountGHS,
      receiptSent: settled.receiptSent,
      ownerNotified: settled.ownerNotified,
      alreadyProcessed: settled.alreadyProcessed,
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}
