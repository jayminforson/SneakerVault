import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { getOrderByPaymentReference, getSneakerById, updateOrder, decrementStock } from "@/lib/db";
import { notifyOrderPaid } from "@/lib/email";

// Verifying the transaction is what actually settles the order. Everything that
// must happen after money moves — status flip, stock decrement, receipt — runs
// here on the server rather than being orchestrated by the browser.
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

    const order = await getOrderByPaymentReference(reference);
    if (!order) {
      console.error(`Paystack verification: ${reference} → paid ${paidAmountGHS} but matched no order`);
      return NextResponse.json({
        status: "SUCCESSFUL",
        reference,
        channel,
        orderId: null,
        warning: "Payment verified but no matching order was found",
      });
    }

    if (Math.abs(paidAmountGHS - order.totalAmount) > 0.01) {
      console.error(
        `Amount mismatch for ${order.orderId}: expected ${order.totalAmount}, paid ${paidAmountGHS}`
      );
    }

    // Idempotent: a repeated verify of a settled order must not double-decrement
    // stock or send a second receipt.
    const alreadySettled = order.status === "PAID" || order.status === "FULFILLED";
    let receiptSent = false;
    let ownerNotified = false;

    if (!alreadySettled) {
      const settled = await updateOrder(order.orderId, {
        status: "PAID",
        paymentChannel: channel,
        paymentReference: reference,
      });
      await decrementStock(order.sneakerId, order.size, order.quantity);
      const sneaker = await getSneakerById(order.sneakerId);
      ({ receiptSent, ownerNotified } = await notifyOrderPaid(
        settled ?? order,
        channel,
        sneaker?.heroImage ?? ""
      ));
    }

    console.log(`Paystack verification: ${reference} → SUCCESSFUL (${channel}) order ${order.orderId}`);

    return NextResponse.json({
      status: "SUCCESSFUL",
      reference,
      channel,
      orderId: order.orderId,
      amount: paidAmountGHS,
      receiptSent,
      ownerNotified,
      alreadyProcessed: alreadySettled,
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}
