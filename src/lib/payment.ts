import {
  decrementStock,
  getOrderByPaymentReference,
  getSneakerById,
  updateOrder,
  type Order,
} from "@/lib/db";
import { notifyOrderPaid } from "@/lib/email";

export interface SettleResult {
  order: Order | null;
  receiptSent: boolean;
  ownerNotified: boolean;
  alreadyProcessed: boolean;
}

// Everything that must happen once money has actually moved — status flip,
// stock decrement, both emails — lives here so the browser-driven verify route
// and the Paystack webhook cannot drift apart. Both are expected to fire for
// the same reference, hence the idempotency guard below.
export async function settleOrder(
  reference: string,
  channel: string,
  paidAmount: number
): Promise<SettleResult> {
  const order = await getOrderByPaymentReference(reference);

  if (!order) {
    console.error(`Payment settlement: ${reference} → paid ${paidAmount} but matched no order`);
    return { order: null, receiptSent: false, ownerNotified: false, alreadyProcessed: false };
  }

  if (Math.abs(paidAmount - order.totalAmount) > 0.01) {
    console.error(
      `Amount mismatch for ${order.orderId}: expected ${order.totalAmount}, paid ${paidAmount}`
    );
  }

  const alreadyProcessed = order.status === "PAID" || order.status === "FULFILLED";
  if (alreadyProcessed) {
    return { order, receiptSent: false, ownerNotified: false, alreadyProcessed: true };
  }

  const settled = await updateOrder(order.orderId, {
    status: "PAID",
    paymentChannel: channel,
    paymentReference: reference,
  });

  // One stock movement per line. Legacy orders carry no `items`, so their
  // single top-level triple stands in for the list.
  const lines = order.items ?? [{
    sneakerId: order.sneakerId,
    size: order.size,
    color: order.color,
    quantity: order.quantity,
  }];
  for (const line of lines) {
    await decrementStock(line.sneakerId, line.size, line.quantity);
  }

  const sneaker = await getSneakerById(order.sneakerId);
  const hero = order.items?.[0]?.image || sneaker?.heroImage || "";
  const { receiptSent, ownerNotified } = await notifyOrderPaid(
    settled ?? order,
    channel,
    hero
  );

  return { order: settled ?? order, receiptSent, ownerNotified, alreadyProcessed: false };
}
