import type {
  PaymentRequest,
  PaymentResult,
  PayoutRequest,
  PayoutResult,
  FeeBreakdown,
} from './types';
import {
  COUNTRY_PROVIDER_MAP,
  COUNTRY_CURRENCY_MAP,
  COUNTRY_METHODS_MAP,
} from './types';

// ─── Re-export all providers ──────────────────────────────────

export { StripeProvider } from './providers/stripe-provider';
export { RazorpayProvider } from './providers/razorpay-provider';
export { PaystackProvider } from './providers/paystack-provider';
export { FlutterwaveProvider } from './providers/flutterwave-provider';
export { PayChanguProvider } from './providers/paychangu-provider';
export { MpesaProvider } from './providers/mpesa-provider';

// ─── Re-export types ──────────────────────────────────────────

export type {
  PaymentRequest,
  PaymentResult,
  PayoutRequest,
  PayoutResult,
  RefundResult,
  FeeBreakdown,
  OrchestratorPaymentMethod,
  OrchestratorPaymentStatus,
  PaymentProvider,
  WebhookEvent,
  BankAccount,
  StripeAccountLink,
  StripeAccountStatus,
  RazorpayContact,
  PaystackRecipient,
  CountryPaymentConfig,
  PaymentTransactionRow,
  PaymentTransactionInsert,
  PayoutRow,
  PayoutInsert,
  EscrowHoldRow,
  EscrowHoldInsert,
  RefundRow,
  RefundInsert,
} from './types';

export {
  COUNTRY_PROVIDER_MAP,
  COUNTRY_CURRENCY_MAP,
  COUNTRY_METHODS_MAP,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
  PLATFORM_FEE_PERCENT,
} from './types';

// ─── Singleton Orchestrator ───────────────────────────────────

import { PaymentOrchestrator } from './orchestrator';

export function getPaymentOrchestrator(): PaymentOrchestrator {
  return paymentOrchestrator.current;
}

export const paymentOrchestrator = (() => {
  let instance: PaymentOrchestrator | null = null;
  return {
    get current(): PaymentOrchestrator {
      if (!instance) instance = new PaymentOrchestrator();
      return instance;
    },
  };
})();

/**
 * Simplified payment intent creation.
 * Resolves the correct provider and processes the payment.
 */
export async function createPaymentIntent(
  params: Omit<PaymentRequest, 'currency'> & { currency?: string },
): Promise<PaymentResult> {
  const orchestrator = paymentOrchestrator.current;
  const currency =
    params.currency ??
    COUNTRY_CURRENCY_MAP[params.countryCode] ??
    'USD';

  return orchestrator.processPayment({
    ...params,
    currency,
  });
}

/**
 * Confirm a payment after frontend action (e.g., 3DS, UPI, STK Push).
 * For providers that require frontend interaction.
 */
export async function confirmPayment(
  transactionId: string,
): Promise<PaymentResult> {
  const orchestrator = paymentOrchestrator.current;
  const status = await orchestrator.getTransactionStatus(transactionId);
  return {
    success: status === 'succeeded',
    transactionId,
    status,
  };
}

/**
 * Process a vendor payout.
 */
export async function processVendorPayout(
  params: PayoutRequest,
): Promise<PayoutResult> {
  const orchestrator = paymentOrchestrator.current;
  return orchestrator.processPayout(params);
}

/**
 * Calculate fees for a given amount, country, and provider.
 */
export function calculateFees(
  amount: number,
  countryCode: string,
  providerCode?: string,
): FeeBreakdown {
  const orchestrator = paymentOrchestrator.current;
  return orchestrator.calculateFees(amount, countryCode, providerCode);
}

/**
 * Verify a payment webhook from a provider.
 */
export function verifyPaymentWebhook(
  provider: string,
  payload: unknown,
  signature: string,
): boolean {
  const orchestrator = paymentOrchestrator.current;
  return orchestrator.verifyWebhook(provider, payload, signature);
}

/**
 * Get available payment methods for a country.
 */
export function getPaymentMethodsForCountry(
  countryCode: string,
): string[] {
  return COUNTRY_METHODS_MAP[countryCode] ?? ['card'];
}

/**
 * Get the default (primary) provider for a country.
 */
export function getDefaultProviderForCountry(countryCode: string): string {
  const providers = COUNTRY_PROVIDER_MAP[countryCode];
  return providers?.[0] ?? 'stripe';
}
