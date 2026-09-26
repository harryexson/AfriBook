import { createPaymentDb } from './db';
import type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
  PayoutRequest,
  PayoutResult,
  RefundResult,
  FeeBreakdown,
  OrchestratorPaymentStatus,
  CountryPaymentConfig,
} from './types';
import {
  COUNTRY_PROVIDER_MAP,
  COUNTRY_CURRENCY_MAP,
  COUNTRY_METHODS_MAP,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
  PLATFORM_FEE_PERCENT,
  getProvidersForCountry,
  getCurrencyForCountry,
  getMethodsForCountry,
} from './types';

// ─── Payment Orchestrator ─────────────────────────────────────
// Central routing engine for all payment processing across countries,
// providers, and methods. Selects the appropriate provider, handles
// retries, saves records to Supabase, and manages escrow.
// ──────────────────────────────────────────────────────────────

export class PaymentOrchestrator {
  private providers: Map<string, PaymentProvider> = new Map();
  private countryConfigs: Map<string, CountryPaymentConfig> = new Map();
  private initialized = false;

  constructor() {
    this.buildCountryConfigs();
  }

  // ─── Provider Registration ────────────────────────────────────

  registerProvider(code: string, provider: PaymentProvider): void {
    this.providers.set(code, provider);
  }

  getProvider(countryCode: string, _method?: string): PaymentProvider {
    const providerCodes = getProvidersForCountry(countryCode);
    if (!providerCodes?.length) {
      throw new Error(
        `No payment provider configured for country: ${countryCode}`,
      );
    }

    // Use the first *registered* provider for this country, falling back
    // through the ordered list so a missing API key never blocks payments.
    for (const code of providerCodes) {
      const provider = this.providers.get(code);
      if (provider) return provider;
    }

    throw new Error(
      `No registered payment provider available for country: ${countryCode}. ` +
        `Ensure at least one of [${providerCodes.join(', ')}] is configured.`,
    );
  }

  getProviderByCode(code: string): PaymentProvider {
    const provider = this.providers.get(code);
    if (!provider) {
      throw new Error(`Provider "${code}" is not registered.`);
    }
    return provider;
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // 1. Validate the request
    this.validatePaymentRequest(request);

    // 2. Walk this country's provider preference list in order, trying each
    //    one that's actually registered and supports the requested method.
    //    Previously this picked exactly one provider (the first registered)
    //    and gave up if it failed — three retries against the same rail, no
    //    fallback. That's the gap every payment-orchestration platform exists
    //    to close (dLocal, dedicated orchestrators like Gr4vy/Primer): a
    //    processor having a bad day in one country shouldn't take checkout
    //    down when the country config lists a second and third option for
    //    exactly this reason. COUNTRY_PROVIDER_MAP's ordering already
    //    encodes "best rails first" per country (e.g. NG: paystack, then
    //    flutterwave, then pawapay) — this just makes that ordering mean
    //    something beyond "which one gets picked".
    const candidates = getProvidersForCountry(request.countryCode)
      .map((code) => this.providers.get(code))
      .filter((p): p is PaymentProvider => Boolean(p) && p!.supportedMethods.includes(request.method));

    if (!candidates.length) {
      throw new Error(
        `No registered payment provider supports method "${request.method}" in ${request.countryCode}. ` +
          `Configured providers: [${getProvidersForCountry(request.countryCode).join(', ')}].`,
      );
    }

    let lastResult: PaymentResult | null = null;
    let lastError: Error | null = null;

    for (const provider of candidates) {
      try {
        const result = await this.executeWithRetry(
          () => provider.processPayment(request),
          3,
          1000,
        );

        // Save every attempt that got far enough to produce a transaction id
        // — saveTransactionRecord no-ops otherwise, so a provider that fails
        // before creating anything provider-side leaves no orphan row.
        await this.saveTransactionRecord(request, result, provider.code);

        if (result.success) return result;

        // A structured (non-throwing) failure here means the provider
        // couldn't even process the request — not that the customer's card
        // was declined, which for every provider in this codebase surfaces
        // later via webhook, long after processPayment has already
        // returned. So falling through to the next provider is safe: it
        // can't double-charge a customer whose payment method was already
        // declined, because that outcome never reaches this branch.
        lastResult = result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Move on to the next candidate provider for this country.
      }
    }

    if (lastResult) return lastResult;
    throw (
      lastError ??
      new Error(`All payment providers failed for ${request.countryCode}.`)
    );
  }

  // ─── Refunds ─────────────────────────────────────────────────

  async processRefund(
    transactionId: string,
    amount: number,
    reason: string,
  ): Promise<RefundResult> {
    const db = await createPaymentDb();

    // 1. Look up the transaction
    const txResult = await db
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    const tx = txResult.data as Record<string, unknown> | null;

    if (!tx) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: `Transaction ${transactionId} not found.`,
      };
    }

    if (tx.status === 'refunded') {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: 'Transaction has already been fully refunded.',
      };
    }

    if (amount > (tx.amount as number)) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: `Refund amount (${amount}) exceeds transaction amount (${tx.amount}).`,
      };
    }

    // 2. Get the provider
    const providerCode = tx.provider_code as string;
    if (!providerCode) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: 'No provider code found for this transaction.',
      };
    }

    const provider = this.getProviderByCode(providerCode);

    // 3. Process refund with retry
    const result = await this.executeWithRetry(
      () =>
        provider.processRefund(
          tx.provider_transaction_id as string,
          amount,
          reason,
        ),
      2,
      2000,
    );

    // 4. Update transaction status
    if (result.success) {
      const isFullRefund = amount >= (tx.amount as number);
      await db
        .from('payment_transactions')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
        })
        .eq('id', transactionId);
    }

    return result;
  }

  // ─── Payouts ─────────────────────────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    // 1. Get the vendor's country from their wallet
    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('currency')
      .eq('vendor_id', request.vendorId)
      .eq('business_id', request.businessId)
      .single();
    const wallet = walletResult.data as { currency: string } | null;

    const currency = wallet?.currency ?? request.currency;

    // 2. Determine the country from currency
    const countryCode = this.countryCodeForCurrency(currency);

    // 3. Get the provider
    const provider = this.getProvider(countryCode);

    // 4. Process with retry
    return this.executeWithRetry(
      () => provider.processPayout(request),
      3,
      2000,
    );
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(
    providerCode: string,
    payload: unknown,
    signature: string,
  ): boolean {
    const provider = this.providers.get(providerCode);
    if (!provider) return false;
    return provider.verifyWebhook(payload, signature);
  }

  // ─── Transaction Status ──────────────────────────────────────

  async getTransactionStatus(
    transactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    const db = await createPaymentDb();

    // First check our local record
    const txResult = await db
      .from('payment_transactions')
      .select('status, provider_code, provider_transaction_id')
      .eq('id', transactionId)
      .single();
    const tx = txResult.data as Record<string, unknown> | null;

    if (!tx) return 'failed';

    // If we have a provider, check with them for latest status
    if (tx.provider_code && tx.provider_transaction_id) {
      const provider = this.providers.get(tx.provider_code as string);
      if (provider) {
        try {
          const providerStatus = await provider.getTransactionStatus(
            tx.provider_transaction_id as string,
          );

          // Update local record if status changed
          if (providerStatus !== tx.status) {
            await db
              .from('payment_transactions')
              .update({ status: providerStatus })
              .eq('id', transactionId);
          }

          return providerStatus;
        } catch {
          // Fall through to local status
        }
      }
    }

    return tx.status as OrchestratorPaymentStatus;
  }

  // ─── Fee Calculation ─────────────────────────────────────────

  calculateFees(
    amount: number,
    countryCode: string,
    providerCode?: string,
  ): FeeBreakdown {
    if (providerCode) {
      const provider = this.providers.get(providerCode);
      if (provider) {
        const currency = COUNTRY_CURRENCY_MAP[countryCode] ?? 'USD';
        return provider.calculateFees(amount, currency);
      }
    }

    // Default fee calculation
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const processorFeePercent = 0.025;
    const processorFee = amount * processorFeePercent;
    const taxRate = COUNTRY_TAX_RATES[countryCode] ?? 0.16;
    const tax = (platformFee + processorFee) * taxRate;
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 0.5;
    const total = Math.max(platformFee + processorFee + tax, minimumFloor);
    const netToVendor = Math.max(amount - total, 0);

    return {
      platformFee: roundTo2(platformFee),
      processorFee: roundTo2(processorFee),
      tax: roundTo2(tax),
      total: roundTo2(total),
      netToVendor: roundTo2(netToVendor),
      minimumFeeFloor: minimumFloor,
    };
  }

  // ─── Escrow Management ───────────────────────────────────────

  async holdEscrow(
    transactionId: string,
    amount: number,
  ): Promise<boolean> {
    const db = await createPaymentDb();

    // 1. Get the transaction
    const txResult = await db
      .from('payment_transactions')
      .select('id, provider_code, provider_transaction_id, currency')
      .eq('id', transactionId)
      .single();
    const tx = txResult.data as Record<string, unknown> | null;

    if (!tx) return false;

    // 2. Create escrow hold record
    const escrowInsert = {
      transaction_id: transactionId,
      amount,
      currency: tx.currency as string,
      status: 'held',
    };

    const { error } = await db.from('escrow_holds').insert(escrowInsert);
    if (error) return false;

    // 3. Update transaction escrow status
    await db
      .from('payment_transactions')
      .update({ escrow_status: 'held' })
      .eq('id', transactionId);

    // 4. If provider supports hold, call it
    if (tx.provider_code && tx.provider_transaction_id) {
      const provider = this.providers.get(tx.provider_code as string);
      if (provider?.holdEscrow) {
        try {
          await provider.holdEscrow(tx.provider_transaction_id as string, amount);
        } catch {
          // Provider-level hold is optional; DB record is the source of truth
        }
      }
    }

    return true;
  }

  async releaseEscrow(transactionId: string): Promise<boolean> {
    const db = await createPaymentDb();

    // 1. Get the escrow hold
    const escrowResult = await db
      .from('escrow_holds')
      .select('id, transaction_id, status')
      .eq('transaction_id', transactionId)
      .eq('status', 'held')
      .single();
    const escrow = escrowResult.data as { id: string } | null;

    if (!escrow) return false;

    // 2. Update escrow status
    await db
      .from('escrow_holds')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', escrow.id);

    // 3. Update transaction escrow status
    await db
      .from('payment_transactions')
      .update({ escrow_status: 'released' })
      .eq('id', transactionId);

    // 4. Credit vendor wallet
    const txResult = await db
      .from('payment_transactions')
      .select('amount, currency')
      .eq('id', transactionId)
      .single();
    const tx = txResult.data as { amount: number } | null;

    if (tx) {
      await db.rpc('update_wallet_on_payout' as never, {
        p_vendor_id: transactionId,
        p_amount: tx.amount,
      } as never);
    }

    return true;
  }

  // ─── Initialization ──────────────────────────────────────────

  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    const initPromises = Array.from(this.providers.values()).map((p) =>
      p.initialize().catch((err) => {
        console.error(`Failed to initialize provider ${p.code}:`, err);
      }),
    );

    await Promise.allSettled(initPromises);
    this.initialized = true;
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private validatePaymentRequest(request: PaymentRequest): void {
    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (!request.currency) {
      throw new Error('Currency is required.');
    }
    if (!request.countryCode) {
      throw new Error('Country code is required.');
    }
    if (!request.method) {
      throw new Error('Payment method is required.');
    }
    if (!request.customer?.email) {
      throw new Error('Customer email is required.');
    }

    // Check minimum fee floor
    const minFloor = COUNTRY_MINIMUM_FEE_FLOOR[request.countryCode] ?? 0;
    if (minFloor > 0 && request.amount < minFloor) {
      throw new Error(
        `Minimum amount for ${request.countryCode} is ${minFloor}.`,
      );
    }
  }

  private async saveTransactionRecord(
    request: PaymentRequest,
    result: PaymentResult,
    providerCode: string,
  ): Promise<void> {
    if (!result.transactionId) return;

    const db = await createPaymentDb();

    // Upsert by provider_transaction_id to avoid duplicates
    const existingResult = await db
      .from('payment_transactions')
      .select('id')
      .eq('provider_transaction_id', result.providerTransactionId ?? result.transactionId)
      .single();
    const existing = existingResult.data as { id: string } | null;

    if (existing) {
      // Update status
      await db
        .from('payment_transactions')
        .update({ status: result.status })
        .eq('id', existing.id);
      return;
    }

    const fees = this.calculateFees(
      request.amount,
      request.countryCode,
      providerCode,
    );

    await db.from('payment_transactions').insert({
      booking_id: request.bookingId ?? null,
      order_id: request.orderId ?? null,
      ride_id: request.rideId ?? null,
      amount: request.amount,
      currency: request.currency,
      provider_code: providerCode,
      provider_transaction_id: result.providerTransactionId ?? result.transactionId,
      method: request.method,
      status: result.status,
      fee_platform: fees.platformFee,
      fee_processor: fees.processorFee,
      fee_tax: fees.tax,
      net_amount: fees.netToVendor,
      metadata: {
        ...request.metadata,
        ...result.metadata,
      },
    });
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delayMs: number,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on certain errors
        const message = lastError.message.toLowerCase();
        if (
          message.includes('already refunded') ||
          message.includes('not found') ||
          message.includes('invalid') ||
          message.includes('not supported')
        ) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          await this.sleep(delayMs * attempt); // Exponential-ish backoff
        }
      }
    }

    throw lastError ?? new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildCountryConfigs(): void {
    const allCodes = new Set<string>([
      ...Object.keys(COUNTRY_PROVIDER_MAP),
      ...Object.keys(COUNTRY_CURRENCY_MAP),
      ...Object.keys(COUNTRY_METHODS_MAP),
    ]);
    for (const code of allCodes) {
      const providerCodes = getProvidersForCountry(code);
      this.countryConfigs.set(code, {
        countryCode: code,
        providerCode: providerCodes[0],
        methods: getMethodsForCountry(code),
        currency: getCurrencyForCountry(code),
        minimumFeeFloor: COUNTRY_MINIMUM_FEE_FLOOR[code] ?? 0.5,
        taxRate: COUNTRY_TAX_RATES[code] ?? 0.16,
      });
    }
  }

  private countryCodeForCurrency(currency: string): string {
    for (const [code, cur] of Object.entries(COUNTRY_CURRENCY_MAP)) {
      if (cur === currency) return code;
    }
    // Common global currencies → sensible defaults
    const map: Record<string, string> = {
      USD: 'US', EUR: 'FR', GBP: 'GB', CAD: 'CA', AUD: 'AU',
      JPY: 'JP', CNY: 'CN', INR: 'IN', AED: 'AE', SGD: 'SG',
      HKD: 'HK', BRL: 'BR', MXN: 'MX', ARS: 'AR', ZAR: 'ZA',
      NGN: 'NG', GHS: 'GH', KES: 'KE', EGP: 'EG', SAR: 'SA',
    };
    return map[currency.toUpperCase()] ?? 'US';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
