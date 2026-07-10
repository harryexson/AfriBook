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
    const providerCodes = COUNTRY_PROVIDER_MAP[countryCode];
    if (!providerCodes?.length) {
      throw new Error(
        `No payment provider configured for country: ${countryCode}`,
      );
    }

    // Use the first available provider unless a specific method is requested
    // In the future, this could route based on method availability
    const primaryCode = providerCodes[0];
    const provider = this.providers.get(primaryCode);

    if (!provider) {
      throw new Error(
        `Provider "${primaryCode}" is not registered for country: ${countryCode}`,
      );
    }

    return provider;
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

    // 2. Resolve provider
    const provider = this.getProvider(request.countryCode, request.method);

    // 3. Ensure provider supports the method
    if (!provider.supportedMethods.includes(request.method)) {
      throw new Error(
        `Provider "${provider.code}" does not support method "${request.method}". ` +
          `Supported: ${provider.supportedMethods.join(', ')}`,
      );
    }

    // 4. Process with retry logic
    const result = await this.executeWithRetry(
      () => provider.processPayment(request),
      3,
      1000,
    );

    // 5. Save transaction to DB (idempotent via provider_transaction_id)
    await this.saveTransactionRecord(request, result, provider.code);

    return result;
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
    for (const [code, providerCodes] of Object.entries(COUNTRY_PROVIDER_MAP)) {
      this.countryConfigs.set(code, {
        countryCode: code,
        providerCode: providerCodes[0],
        methods: COUNTRY_METHODS_MAP[code] ?? ['card'],
        currency: COUNTRY_CURRENCY_MAP[code] ?? 'USD',
        minimumFeeFloor: COUNTRY_MINIMUM_FEE_FLOOR[code] ?? 0.5,
        taxRate: COUNTRY_TAX_RATES[code] ?? 0.16,
      });
    }
  }

  private countryCodeForCurrency(currency: string): string {
    for (const [code, cur] of Object.entries(COUNTRY_CURRENCY_MAP)) {
      if (cur === currency) return code;
    }
    return 'US';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
