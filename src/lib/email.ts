import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "SneakerVault <receipts@sneakervault.com>";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "";

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  sneakerName: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
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
        <img src="https://sneakervault.com/logo-light.png" alt="SneakerVault" style="width:48px;height:48px;border-radius:8px;object-fit:cover;margin:0 auto 12px;display:block;" />
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
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Item</h3>
        <div style="display:flex;gap:12px;">
          <div>
            <p style="font-size:14px;font-weight:600;margin:0;color:#111;">${order.brand} ${order.sneakerName}</p>
            <p style="font-size:13px;color:#666;margin:4px 0 0;">Size: ${order.size} · Color: ${order.color} · Qty: ${order.quantity}</p>
          </div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Payment</h3>
        <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">
          <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">GH₵ ${order.subtotal.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;">Delivery</td><td style="padding:6px 0;text-align:right;">GH₵ ${order.deliveryFee.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;">Tax (15%)</td><td style="padding:6px 0;text-align:right;">GH₵ ${order.tax.toFixed(2)}</td></tr>
          <tr style="border-top:1px solid #eee;"><td style="padding:8px 0;font-weight:700;font-size:15px;color:#111;">Total Paid</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:15px;color:#111;">GH₵ ${order.totalAmount.toFixed(2)}</td></tr>
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
        <img src="https://sneakervault.com/logo-light.png" alt="SneakerVault" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" />
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
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">👟 Product</h3>
        ${order.heroImage ? `<div style="margin-bottom:12px;"><img src="${order.heroImage}" alt="${order.sneakerName}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;background:#f5f5f5;" /></div>` : ""}
        <p style="font-size:14px;color:#333;margin:0;font-weight:600;">${order.brand} ${order.sneakerName}</p>
        <p style="font-size:13px;color:#666;margin:4px 0 0;">Size: ${order.size} · Color: ${order.color} · Qty: ${order.quantity}</p>
      </div>

      <!-- Payment -->
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:20px;">
        <h3 style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">💰 Payment</h3>
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="padding:3px 0;">Amount</td><td style="padding:3px 0;text-align:right;font-weight:700;font-size:16px;">GH₵ ${order.totalAmount.toFixed(2)}</td></tr>
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

export async function sendCustomerReceipt(order: OrderEmailData): Promise<boolean> {
  if (!order.customerEmail) {
    console.error("No customer email provided, skipping receipt");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `Order Confirmed — ${order.brand} ${order.sneakerName} (${order.orderId})`,
      html: generateCustomerReceiptHTML(order),
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

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `🛍️ New Order: ${order.brand} ${order.sneakerName} — GH₵ ${order.totalAmount.toFixed(2)}`,
      html: generateOwnerNotificationHTML(order),
    });
    console.log(`Owner notification sent for order ${order.orderId}`);
    return true;
  } catch (error) {
    console.error("Failed to send owner notification:", error);
    return false;
  }
}
