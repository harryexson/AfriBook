import type {
  PaymentRequest,
  PaymentResult,
  PayoutRequest,
  PayoutResult,
  FeeBreakdown,
  PaymentProvider,
} from './types';
import {
  COUNTRY_PROVIDER_MAP,
  COUNTRY_CURRENCY_MAP,
  COUNTRY_METHODS_MAP,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
  PLATFORM_FEE_PERCENT,
  GLOBAL_FALLBACK_PROVIDERS,
  GLOBAL_FALLBACK_METHODS,
  getProvidersForCountry,
  getMethodsForCountry,
} from './types';
import { StripeProvider } from './providers/stripe-provider';
import { RazorpayProvider } from './providers/razorpay-provider';
import { PaystackProvider } from './providers/paystack-provider';
import { FlutterwaveProvider } from './providers/flutterwave-provider';
import { PayChanguProvider } from './providers/paychangu-provider';
import { MpesaProvider } from './providers/mpesa-provider';
import { AirwallexProvider } from './providers/airwallex-provider';
import { PawaPayProvider } from './providers/pawapay-provider';
import { AdyenProvider } from './providers/adyen-provider';
import { DLocalProvider } from './providers/dlocal-provider';

// ─── Re-export all providers ──────────────────────────────────

export {
  StripeProvider,
  RazorpayProvider,
  PaystackProvider,
  FlutterwaveProvider,
  PayChanguProvider,
  MpesaProvider,
  AirwallexProvider,
  PawaPayProvider,
  AdyenProvider,
  DLocalProvider,
};

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
  GLOBAL_FALLBACK_PROVIDERS,
  GLOBAL_FALLBACK_METHODS,
  getProvidersForCountry,
  getMethodsForCountry,
};

// ─── Singleton Orchestrator ───────────────────────────────────

import { PaymentOrchestrator } from './orchestrator';

export function getPaymentOrchestrator(): PaymentOrchestrator {
  return paymentOrchestrator.current;
}

/**
 * Register every available provider into the orchestrator. Each provider is
 * constructed lazily inside a try/catch so that a missing API key for one
 * provider never prevents the others (or the app) from working. The
 * orchestrator then routes per-country to the first *registered* provider.
 */
function registerDefaultProviders(orchestrator: PaymentOrchestrator): void {
  const providers: Array<[string, () => PaymentProvider]> = [
    ['stripe', () => new StripeProvider()],
    ['razorpay', () => new RazorpayProvider()],
    ['paystack', () => new PaystackProvider()],
    ['flutterwave', () => new FlutterwaveProvider()],
    ['paychangu', () => new PayChanguProvider()],
    ['mpesa', () => new MpesaProvider()],
    ['airwallex', () => new AirwallexProvider()],
    ['pawapay', () => new PawaPayProvider()],
    ['adyen', () => new AdyenProvider()],
    ['dlocal', () => new DLocalProvider()],
  ];

  for (const [code, factory] of providers) {
    try {
      orchestrator.registerProvider(code, factory());
    } catch (err) {
      // Provider not configured (missing credentials) — skip gracefully.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[payments] Provider "${code}" not registered: ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
        );
      }
    }
  }
}

export const paymentOrchestrator = (() => {
  let instance: PaymentOrchestrator | null = null;
  return {
    get current(): PaymentOrchestrator {
      if (!instance) {
        instance = new PaymentOrchestrator();
        registerDefaultProviders(instance);
      }
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
  return getMethodsForCountry(countryCode);
}

/**
 * Get the default (primary) provider for a country.
 */
export function getDefaultProviderForCountry(countryCode: string): string {
  const providers = getProvidersForCountry(countryCode);
  return providers?.[0] ?? 'airwallex';
}
