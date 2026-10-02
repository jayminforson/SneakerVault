import { Resend } from "resend";
import type { Order } from "@/lib/db";
import { CURRENCY_SYMBOL, TAX_RATE } from "@/lib/config";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "SneakerVault <receipts@sneakervault.live>";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "";

/** One line as it appears in either email. */
export interface EmailLine {
  name: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  sneakerName: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  /** Always populated — legacy single-item orders are wrapped into one line. */
  items: EmailLine[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  date: string;
  heroImage?: string;
}

const lineMeta = (l: EmailLine) =>
  `Size: ${l.size} · Color: ${l.color || "—"} · Qty: ${l.quantity}`;

function receiptSubject(order: OrderEmailData): string {
  const detail =
    order.items.length === 1
      ? `${order.brand} ${order.sneakerName}`
      : `${order.items.length} items`;
  return `Order Confirmed — ${detail} (${order.orderId})`;
}

function generateCustomerReceiptHTML(order: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <img src="https://www.sneakervault.live/logo-light.png" alt="SneakerVault" style="width:48px;height:48px;border-radius:8px;object-fit:cover;margin:0 auto 12px;display:block;" />
        <h1 style="font-size:24px;font-weight:700;margin:0;color:#111;">SneakerVault</h1>
        <div style="width:40px;height:2px;background:#111;margin:12px auto;"></div>
      </div>

      <!-- Success Badge -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:48px;height:48px;background:#22c55e;border-radius:50%;margin:0 auto 12px;line-height:48px;font-size:24px;">✓</div>
        <h2 style="font-size:20px;font-weight:600;margin:0;color:#111;">Order Confirmed!</h2>
        <p style="font-size:14px;color:#666;margin:8px 0 0;">Thanks for shopping with us, ${order.customerName}.</p>
      </div>

      <!-- Order Info -->
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <table style="width:100%;font-size:13px;color:#444;">
          <tr><td style="padding:4px 0;color:#888;">Order ID</td><td style="padding:4px 0;text-align:right;font-weight:600;">${order.orderId}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Date</td><td style="padding:4px 0;text-align:right;">${order.date}</td></tr>
        </table>
      </div>

      <!-- Product -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">${order.items.length === 1 ? "Item" : "Items"}</h3>
        ${order.items.map((line) => `
        <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f0f0f0;">
          ${line.image ? `<img src="${line.image}" alt="" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:6px;background:#f5f5f5;flex-shrink:0;" />` : ""}
          <div style="flex:1;min-width:0;">
            <p style="font-size:14px;font-weight:600;margin:0;color:#111;">${line.brand} ${line.name}</p>
            <p style="font-size:13px;color:#666;margin:4px 0 0;">${lineMeta(line)}</p>
          </div>
          <p style="font-size:14px;font-weight:600;margin:0;color:#111;text-align:right;white-space:nowrap;">${CURRENCY_SYMBOL} ${line.lineTotal.toFixed(2)}</p>
        </div>`).join("")}
      </div>

      <!-- Payment Breakdown -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Payment</h3>
        <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">
          <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">${CURRENCY_SYMBOL} ${order.subtotal.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;">Delivery</td><td style="padding:6px 0;text-align:right;">${CURRENCY_SYMBOL} ${order.deliveryFee.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;">Tax (${Math.round(TAX_RATE * 100)}%)</td><td style="padding:6px 0;text-align:right;">${CURRENCY_SYMBOL} ${order.tax.toFixed(2)}</td></tr>
          <tr style="border-top:1px solid #eee;"><td style="padding:8px 0;font-weight:700;font-size:15px;color:#111;">Total Paid</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:15px;color:#111;">${CURRENCY_SYMBOL} ${order.totalAmount.toFixed(2)}</td></tr>
        </table>
        <p style="font-size:12px;color:#888;margin:8px 0 0;">Payment via ${order.paymentMethod} · ${order.paymentStatus}</p>
      </div>

      <!-- Delivery -->
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Delivery Address</h3>
        <p style="font-size:13px;color:#444;margin:0;">${order.deliveryAddress}</p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">
        <p style="font-size:13px;color:#888;margin:0;">Your order will be processed within 24 hours.</p>
        <p style="font-size:13px;color:#888;margin:8px 0 0;">Questions? Reply to this email.</p>
        <p style="font-size:12px;color:#aaa;margin:16px 0 0;">Thank you for choosing <strong>SneakerVault</strong> 🙌</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Plain-text alternative. Sending HTML alone is a standard spam signal, and it
// is also what a client shows when it refuses to render the markup.
function generateCustomerReceiptText(order: OrderEmailData): string {
  return `SneakerVault
============

Order Confirmed!

Thanks for shopping with us, ${order.customerName}.

Order ID: ${order.orderId}
Date: ${order.date}

ITEM${order.items.length === 1 ? "" : "S"}
${order.items.map((line) => `- ${line.brand} ${line.name}
  ${lineMeta(line)}
  ${CURRENCY_SYMBOL} ${line.lineTotal.toFixed(2)}`).join("\n")}

PAYMENT
Subtotal: ${CURRENCY_SYMBOL} ${order.subtotal.toFixed(2)}
Delivery: ${CURRENCY_SYMBOL} ${order.deliveryFee.toFixed(2)}
Tax (${Math.round(TAX_RATE * 100)}%): ${CURRENCY_SYMBOL} ${order.tax.toFixed(2)}
Total Paid: ${CURRENCY_SYMBOL} ${order.totalAmount.toFixed(2)}

Payment via ${order.paymentMethod} - ${order.paymentStatus}

DELIVERY ADDRESS
${order.deliveryAddress}

Your order will be processed within 24 hours.
Questions? Reply to this email.

Thank you for choosing SneakerVault.
`;
}

function generateOwnerNotificationHTML(order: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="margin-bottom:24px;display:flex;align-items:center;gap:10px;">
        <img src="https://www.sneakervault.live/logo-light.png" alt="SneakerVault" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />
        <h1 style="font-size:20px;font-weight:700;margin:0;color:#111;">New Order — SneakerVault</h1>
      </div>

      <!-- Order Info -->
      <div style="background:#f0f7ff;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="padding:4px 0;color:#666;">Order ID</td><td style="padding:4px 0;text-align:right;font-weight:600;">${order.orderId}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Date</td><td style="padding:4px 0;text-align:right;">${order.date}</td></tr>
        </table>
      </div>

      <!-- Buyer -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">👤 Buyer</h3>
        <p style="font-size:14px;color:#333;margin:0;">${order.customerName}</p>
        <p style="font-size:13px;color:#666;margin:4px 0 0;">${order.customerEmail}</p>
        <p style="font-size:13px;color:#666;margin:4px 0 0;">📍 ${order.deliveryAddress}</p>
      </div>

      <!-- Product -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">👟 Product${order.items.length === 1 ? "" : "s"}</h3>
        ${order.items.map((line) => `
        <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          ${line.image ? `<div style="margin-bottom:8px;"><img src="${line.image}" alt="${line.name}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;background:#f5f5f5;" /></div>` : ""}
          <p style="font-size:14px;color:#333;margin:0;font-weight:600;">${line.brand} ${line.name}</p>
          <p style="font-size:13px;color:#666;margin:4px 0 0;">${lineMeta(line)}</p>
          <p style="font-size:13px;color:#333;margin:4px 0 0;font-weight:600;">${CURRENCY_SYMBOL} ${line.lineTotal.toFixed(2)}</p>
        </div>`).join("")}
      </div>

      <!-- Payment -->
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:20px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">💰 Payment</h3>
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="padding:3px 0;">Amount</td><td style="padding:3px 0;text-align:right;font-weight:700;font-size:16px;">${CURRENCY_SYMBOL} ${order.totalAmount.toFixed(2)}</td></tr>
          <tr><td style="padding:3px 0;">Method</td><td style="padding:3px 0;text-align:right;">${order.paymentMethod}</td></tr>
          <tr><td style="padding:3px 0;">Status</td><td style="padding:3px 0;text-align:right;color:#22c55e;font-weight:600;">${order.paymentStatus}</td></tr>
        </table>
      </div>

      <!-- Action -->
      <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">
        <p style="font-size:13px;color:#888;margin:0;">Log in to your admin dashboard to manage this order.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateOwnerNotificationText(order: OrderEmailData): string {
  return `New Order - SneakerVault

Order ID: ${order.orderId}
Date: ${order.date}

BUYER
${order.customerName}
${order.customerEmail}
${order.deliveryAddress}

PRODUCT${order.items.length === 1 ? "" : "S"}
${order.items.map((line) => `- ${line.brand} ${line.name}
  ${lineMeta(line)}
  ${CURRENCY_SYMBOL} ${line.lineTotal.toFixed(2)}`).join("\n")}

PAYMENT
Amount: ${CURRENCY_SYMBOL} ${order.totalAmount.toFixed(2)}
Method: ${order.paymentMethod}
Status: ${order.paymentStatus}

Log in to your admin dashboard to manage this order.
`;
}

export async function sendCustomerReceipt(order: OrderEmailData): Promise<boolean> {
  if (!order.customerEmail) {
    console.error("No customer email provided, skipping receipt");
    return false;
  }

  const resend = getResend();
  if (!resend) {
    console.error("RESEND_API_KEY not configured, skipping receipt");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customerEmail,
      // Replies must reach a monitored mailbox: the root domain has no MX, so
      // anything addressed back to receipts@sneakervault.live would bounce.
      replyTo: OWNER_EMAIL || undefined,
      subject: receiptSubject(order),
      html: generateCustomerReceiptHTML(order),
      text: generateCustomerReceiptText(order),
    });
    console.log(`Receipt sent to ${order.customerEmail} for order ${order.orderId}`);
    return true;
  } catch (error) {
    console.error("Failed to send customer receipt:", error);
    return false;
  }
}

export async function sendOwnerNotification(order: OrderEmailData): Promise<boolean> {
  if (!OWNER_EMAIL) {
    console.error("OWNER_EMAIL not configured, skipping notification");
    return false;
  }

  const resend = getResend();
  if (!resend) {
    console.error("RESEND_API_KEY not configured, skipping owner notification");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      replyTo: OWNER_EMAIL || undefined,
      subject: `🛍️ New Order: ${order.items.length === 1 ? `${order.brand} ${order.sneakerName}` : `${order.items.length} items`} — ${CURRENCY_SYMBOL} ${order.totalAmount.toFixed(2)}`,
      html: generateOwnerNotificationHTML(order),
      text: generateOwnerNotificationText(order),
    });
    console.log(`Owner notification sent for order ${order.orderId}`);
    return true;
  } catch (error) {
    console.error("Failed to send owner notification:", error);
    return false;
  }
}

export function orderToEmailData(order: Order, paymentMethod: string, heroImage = ""): OrderEmailData {
  // Pre-multi-item rows have no `items`, so their top-level fields become a
  // single line and every renderer below stays branch-free.
  const items: EmailLine[] = (order.items ?? [
    {
      sneakerId: order.sneakerId,
      name: order.sneakerName,
      brand: order.brand,
      size: order.size,
      color: order.color,
      quantity: order.quantity,
      unitPrice: order.quantity > 0 ? order.subtotal / order.quantity : 0,
      image: "",
    },
  ]).map((line) => ({
    name: line.name,
    brand: line.brand,
    size: line.size,
    color: line.color,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: Math.round(line.unitPrice * line.quantity * 100) / 100,
    image: line.image || undefined,
  }));

  const first = items[0];

  return {
    orderId: order.orderId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    sneakerName: first.name,
    brand: first.brand,
    size: first.size,
    color: first.color,
    quantity: order.quantity,
    items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    totalAmount: order.totalAmount,
    paymentMethod,
    paymentStatus: "SUCCESSFUL",
    deliveryAddress: order.deliveryAddress,
    date: order.date,
    heroImage,
  };
}

// Called from the payment-verification route so the customer always gets a
// receipt for money that was actually taken. Failures here must never be
// reported to the customer as a failed payment.
export async function notifyOrderPaid(
  order: Order,
  paymentMethod: string,
  heroImage = ""
): Promise<{ receiptSent: boolean; ownerNotified: boolean }> {
  const data = orderToEmailData(order, paymentMethod, heroImage);
  const [receipt, owner] = await Promise.allSettled([
    sendCustomerReceipt(data),
    sendOwnerNotification(data),
  ]);
  return {
    receiptSent: receipt.status === "fulfilled" && receipt.value,
    ownerNotified: owner.status === "fulfilled" && owner.value,
  };
}
