declare module "@paystack/inline-js" {
  interface PaystackPopSuccess {
    reference: string;
    trans: string;
    status: string;
    message: string;
    channel: string;
    domain: string;
    amount: number;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    created_at: string;
    fees: number;
  }

  interface PaystackPopOptions {
    key?: string;
    email?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    callback?: (response: PaystackPopSuccess) => void;
    onClose?: () => void;
    onSuccess?: (response: PaystackPopSuccess) => void;
  }

  export default class PaystackPop {
    constructor();
    resumeTransaction(
      accessCode: string,
      options?: {
        onSuccess?: (response: PaystackPopSuccess) => void;
        onClose?: () => void;
      }
    ): void;
    newIframe(mode: string, options: PaystackPopOptions): void;
  }
}
