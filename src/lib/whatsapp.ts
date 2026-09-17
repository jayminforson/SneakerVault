const WA_PROVIDER = process.env.WHATSAPP_PROVIDER || "meta";
const WA_API_VERSION = "v18.0";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

export interface OrderData {
  orderId: string; customerName: string; customerPhone: string;
  sneakerName: string; brand: string; size: string; color: string;
  quantity: number; totalAmount: number; paymentMethod: string;
  paymentStatus: string; date: string;
  subtotal: number; deliveryFee: number; tax: number;
}

export interface ReceiptData extends OrderData {}

function formatPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("233")) cleaned = "+" + cleaned;
    else if (cleaned.startsWith("0")) cleaned = "+233" + cleaned.substring(1);
    else cleaned = "+233" + cleaned;
  }
  return cleaned;
}

async function sendViaMeta(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: message } }),
    });
    if (!response.ok) { console.error("WhatsApp Meta API error:", await response.text()); return false; }
    return true;
  } catch (error) { console.error("WhatsApp Meta API error:", error); return false; }
}

async function sendViaTwilio(phone: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const to = phone.startsWith("+") ? `whatsapp:${phone}` : `whatsapp:+${phone}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: TWILIO_WHATSAPP_FROM, To: to, Body: message }),
    });
    if (!response.ok) { console.error("WhatsApp Twilio API error:", await response.text()); return false; }
    return true;
  } catch (error) { console.error("WhatsApp Twilio API error:", error); return false; }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const formattedPhone = formatPhoneForWA(phone);
  if (WA_PROVIDER === "twilio") return sendViaTwilio(formattedPhone, message);
  return sendViaMeta(formattedPhone, message);
}

export function generateOwnerNotification(order: OrderData): string {
  return `\u{1F6D2} *NEW ORDER - SneakerVault* \u{1F6D2}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4CB} *Order ID:* ${order.orderId}\n\u{1F4C5} *Date:* ${order.date}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u{1F464} *BUYER DETAILS*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Name: ${order.customerName}\n\u2022 Phone: ${order.customerPhone}\n\n\u{1F45F} *PRODUCT DETAILS*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Sneaker: ${order.brand} ${order.sneakerName}\n\u2022 Size: ${order.size}\n\u2022 Color: ${order.color}\n\u2022 Quantity: ${order.quantity}\n\n\u{1F4B0} *PAYMENT*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u2022 Amount: GH\u20B5 ${order.totalAmount.toFixed(2)}\n\u2022 Method: ${order.paymentMethod}\n\u2022 Status: ${order.paymentStatus}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4A1} Reply to this message to contact the buyer.`;
}

export function generateCustomerReceipt(order: ReceiptData): string {
  return `\u2705 *SneakerVault - Order Confirmed!* \u2705\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nThanks for shopping with us, ${order.customerName}!\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n\u{1F4CB} *Order Summary*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nOrder ID: ${order.orderId}\nDate: ${order.date}\n\n\u{1F45F} *Item:* ${order.brand} ${order.sneakerName}\n\u{1F4CF} *Size:* ${order.size}\n\u{1F3A8} *Color:* ${order.color}\n\u{1F4E6} *Qty:* ${order.quantity}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4B5} *Payment Breakdown*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nSubtotal:    GH\u20B5 ${order.subtotal.toFixed(2)}\nDelivery:    GH\u20B5 ${order.deliveryFee.toFixed(2)}\nTax:         GH\u20B5 ${order.tax.toFixed(2)}\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n*TOTAL PAID: GH\u20B5 ${order.totalAmount.toFixed(2)}*\n\n\u{1F4B3} Payment via: ${order.paymentMethod}\n\u2705 Payment Status: ${order.paymentStatus}\n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u{1F4E6} Your order will be processed within 24 hours.\n\u{1F4DE} Questions? Reply to this message.\n\nThank you for choosing *SneakerVault*! \u{1F64C}`;
}

export async function notifyOwner(order: OrderData): Promise<boolean> {
  const ownerPhone = process.env.OWNER_WHATSAPP_PHONE || "";
  if (!ownerPhone) { console.error("OWNER_WHATSAPP_PHONE not configured"); return false; }
  return sendWhatsAppMessage(ownerPhone, generateOwnerNotification(order));
}

export async function sendReceipt(order: ReceiptData): Promise<boolean> {
  return sendWhatsAppMessage(order.customerPhone, generateCustomerReceipt(order));
}
