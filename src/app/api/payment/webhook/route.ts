import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { settleOrder } from "@/lib/payment";

interface PaystackEvent {
  event?: string;
  data?: {
    reference?: string;
    channel?: string;
    amount?: number;
  };
}

// Paystack signs every delivery with HMAC-SHA512 over the RAW request body,
// using the same secret key as the API. The body therefore has to be read as
// text and signed before it is parsed — parsing first and re-serialising would
// change the bytes and break the signature.
export async function POST(request: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");
  const raw = await request.text();

  if (!secret) {
    console.error("Paystack webhook: PAYSTACK_SECRET_KEY is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!signature) {
    console.warn("Paystack webhook: no x-paystack-signature header — rejecting delivery");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const expected = Buffer.from(createHmac("sha512", secret).update(raw).digest("hex"), "utf8");
  const provided = Buffer.from(signature, "utf8");
  // Equal-length guard first: timingSafeEqual throws on a length mismatch, and
  // a wrong-length guess must not surface as a 500.
  if (expected.length !== provided.length || !timingSafeEqual(provided, expected)) {
    console.warn("Paystack webhook: signature mismatch — rejecting delivery");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const type = event.event;
  if (type !== "charge.success") {
    // 200 so Paystack does not retry an event we deliberately ignore.
    return NextResponse.json({ received: true, ignored: type ?? "unknown" });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ received: true, ignored: "missing reference" });
  }

  const channel = event.data?.channel || "Paystack";
  const paidAmount = (event.data?.amount ?? 0) / 100;

  try {
    const { order, receiptSent, ownerNotified, alreadyProcessed } = await settleOrder(
      reference,
      channel,
      paidAmount
    );
    console.log(
      `Paystack webhook: ${reference} → ${
        order ? `settled order ${order.orderId}` : "no matching order"
      }`
    );
    return NextResponse.json({
      received: true,
      orderId: order?.orderId ?? null,
      receiptSent,
      ownerNotified,
      alreadyProcessed,
    });
  } catch (error) {
    console.error("Paystack webhook: settlement failed:", error);
    // Non-200 so Paystack retries. settleOrder is idempotent, so replaying it
    // can never double-decrement stock or send a duplicate receipt.
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
  }
}
