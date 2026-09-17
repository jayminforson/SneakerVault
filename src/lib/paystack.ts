const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in GHS (will be converted to pesewas)
  reference?: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string; // "success" | "abandoned" | "failed"
    reference: string;
    amount: number; // in pesewas
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name: string | null;
      last_name: string | null;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      mobile_number?: string;
    };
  };
}

export async function initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResponse> {
  const amountInPesewas = Math.round(params.amount * 100); // GHS to pesewas

  const body: Record<string, unknown> = {
    email: params.email,
    amount: amountInPesewas,
    currency: "GHS",
  };

  if (params.reference) body.reference = params.reference;
  if (params.metadata) body.metadata = params.metadata;
  if (params.callback_url) body.callback_url = params.callback_url;

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize payment");
  }

  return data;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify payment");
  }

  return data;
}
