// @paystack/inline-js v2 does not ship its own type declarations, so this
// mirrors the documented API (see node_modules/@paystack/inline-js/README.md).
// Keep it in sync when the package is upgraded.

declare module "@paystack/inline-js" {
  export interface PaystackSuccessResponse {
    id: number;
    reference: string;
    message: string;
  }

  export interface PaystackErrorResponse {
    message: string;
  }

  export interface PaystackLoadResponse {
    id: number;
    customer: Record<string, unknown>;
    accessCode: string;
  }

  export interface ResumeTransactionOptions {
    onSuccess?: (response: PaystackSuccessResponse) => void;
    onCancel?: () => void;
    onError?: (error: PaystackErrorResponse) => void;
    onLoad?: (response: PaystackLoadResponse) => void;
  }

  export default class PaystackPop {
    constructor();
    isLoaded(): boolean;
    resumeTransaction(accessCode: string, options?: ResumeTransactionOptions): void;
    cancelTransaction(id: number | { id: number }): void;
  }
}
