export interface CheckoutIntent {
  reference: string;
  amountMinor: bigint;
  currency: "NGN";
  recipientReference: string;
  idempotencyKey: string;
}
export interface PaymentProvider {
  initialize(intent: CheckoutIntent): Promise<{ checkoutUrl: string }>;
  verify(
    reference: string,
  ): Promise<{ status: "pending" | "confirmed" | "failed" }>;
}
export class DisabledPaymentProvider implements PaymentProvider {
  async initialize(): Promise<{ checkoutUrl: string }> {
    throw new Error("REAL_PAYMENTS_DISABLED");
  }
  async verify(): Promise<{ status: "pending" | "confirmed" | "failed" }> {
    throw new Error("REAL_PAYMENTS_DISABLED");
  }
}
