import { NextRequest, NextResponse } from "next/server";
import { requestToPay } from "@/lib/mtn-momo";
import { setPendingPayment, getPayment } from "@/lib/payment-status";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, phone, payerMessage, payeeNote } = body;

    if (!orderId || !amount || !phone) {
      return NextResponse.json({ error: "Missing required fields: orderId, amount, phone" }, { status: 400 });
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("233")) {
      cleanPhone = cleanPhone.startsWith("0") ? "233" + cleanPhone.substring(1) : "233" + cleanPhone;
    }

    const isSandbox = process.env.MOMO_ENVIRONMENT === "sandbox";

    if (isSandbox) {
      // Sandbox: simulate a payment that completes after ~8 seconds of polling.
      const referenceId = `sandbox-${orderId}-${Date.now()}`;
      setPendingPayment(referenceId, { createdAt: Date.now(), succeedAfterMs: 8000 });
      console.log(`[SANDBOX] Simulating MoMo payment for order ${orderId} (ref ${referenceId})`);
      return NextResponse.json({
        success: true,
        status: "PENDING",
        orderId,
        referenceId,
        message: "Payment initiated (sandbox mode)",
      });
    }

    const paymentResponse = await requestToPay({
      amount,
      currency: "GHS",
      externalId: orderId,
      payerPartyIdType: "MSISDN",
      payerPartyId: cleanPhone,
      payerMessage: payerMessage || `Payment for order ${orderId}`,
      payeeNote: payeeNote || `SneakerVault Order ${orderId}`,
    });

    console.log(`MoMo payment initiated:`, {
      orderId,
      referenceId: paymentResponse.referenceId,
      amount: `GHS ${amount}`,
    });

    return NextResponse.json({
      success: true,
      status: "PENDING",
      orderId,
      referenceId: paymentResponse.referenceId,
      message: "Payment initiated — check your phone for the MoMo prompt",
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment processing failed" },
      { status: 500 }
    );
  }
}

// GET ?referenceId=... — poll payment status
export async function GET(request: NextRequest) {
  const referenceId = request.nextUrl.searchParams.get("referenceId");
  if (!referenceId) {
    return NextResponse.json({ error: "Missing referenceId" }, { status: 400 });
  }

  try {
    const isSandbox = process.env.MOMO_ENVIRONMENT === "sandbox";

    if (isSandbox) {
      const sim = getPayment(referenceId);
      if (!sim) return NextResponse.json({ error: "Unknown referenceId" }, { status: 404 });
      const elapsed = Date.now() - sim.createdAt;
      const status = elapsed >= sim.succeedAfterMs ? "SUCCESSFUL" : "PENDING";
      return NextResponse.json({ status, referenceId });
    }

    const { checkPaymentStatus } = await import("@/lib/mtn-momo");
    const result = await checkPaymentStatus(referenceId);
    return NextResponse.json({ status: result.status, referenceId, financialTransactionId: result.financialTransactionId, reason: result.reason });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}
