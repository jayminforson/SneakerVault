/**
 * In-memory sandbox payment simulation store.
 * Live-mode payments query the MoMo API directly instead of this.
 *
 * Entries expire after 30 minutes so long-running dev servers don't leak memory.
 */

interface PendingPayment {
  createdAt: number;
  succeedAfterMs: number;
}

const globalForSim = globalThis as unknown as {
  __momoSandboxPayments?: Map<string, PendingPayment>;
};

const payments: Map<string, PendingPayment> =
  globalForSim.__momoSandboxPayments ?? new Map();
globalForSim.__momoSandboxPayments = payments;

const TTL_MS = 30 * 60 * 1000;

export function setPendingPayment(referenceId: string, data: PendingPayment) {
  payments.set(referenceId, data);
  if (payments.size > 100) {
    const now = Date.now();
    for (const [key, value] of payments) {
      if (now - value.createdAt > TTL_MS) payments.delete(key);
    }
  }
}

export function getPayment(referenceId: string): PendingPayment | undefined {
  return payments.get(referenceId);
}
