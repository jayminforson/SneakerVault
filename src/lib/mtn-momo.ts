const MOMO_API_BASE = process.env.MOMO_API_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
const MOMO_API_KEY = process.env.MOMO_API_KEY || "";
const MOMO_API_USER = process.env.MOMO_API_USER || "";
const MOMO_API_PASSWORD = process.env.MOMO_API_PASSWORD || "";
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY || "";
const MOMO_ENVIRONMENT = process.env.MOMO_ENVIRONMENT || "sandbox";

interface MomoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RequestToPayResponse {
  referenceId: string;
  status: string;
  amount: string;
  currency: string;
  payer: { partyIdType: string; partyId: string };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const auth = Buffer.from(`${MOMO_API_USER}:${MOMO_API_PASSWORD}`).toString("base64");
  const response = await fetch(`${MOMO_API_BASE}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
    },
  });
  if (!response.ok) throw new Error(`Failed to get MoMo access token: ${await response.text()}`);
  const data: MomoTokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export async function requestToPay(params: {
  amount: string; currency: string; externalId: string;
  payerPartyIdType: string; payerPartyId: string;
  payerMessage: string; payeeNote: string;
}): Promise<RequestToPayResponse> {
  const accessToken = await getAccessToken();
  const referenceId = crypto.randomUUID();
  const response = await fetch(`${MOMO_API_BASE}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": MOMO_ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount, currency: params.currency,
      externalId: params.externalId,
      payer: { partyIdType: params.payerPartyIdType, partyId: params.payerPartyId },
      payerMessage: params.payerMessage, payeeNote: params.payeeNote,
    }),
  });
  if (!response.ok && response.status !== 202) throw new Error(`MoMo Request to Pay failed: ${await response.text()}`);
  return { referenceId, status: "PENDING", amount: params.amount, currency: params.currency, payer: { partyIdType: params.payerPartyIdType, partyId: params.payerPartyId } };
}

export async function checkPaymentStatus(referenceId: string): Promise<{ status: string; financialTransactionId?: string; reason?: string }> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${MOMO_API_BASE}/collection/v1_0/requesttopay/${referenceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Target-Environment": MOMO_ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": MOMO_SUBSCRIPTION_KEY,
    },
  });
  if (!response.ok) throw new Error(`MoMo payment status check failed: ${await response.text()}`);
  const data = await response.json();
  return { status: data.status, financialTransactionId: data.financialTransactionId, reason: data.reason };
}
