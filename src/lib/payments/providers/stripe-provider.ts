import Stripe from 'stripe';
import { createPaymentDb } from '../db';
import type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
  PayoutRequest,
  PayoutResult,
  RefundResult,
  FeeBreakdown,
  OrchestratorPaymentMethod,
  OrchestratorPaymentStatus,
  StripeAccountLink,
  StripeAccountStatus,
} from '../types';
import {
  PLATFORM_FEE_PERCENT,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
} from '../types';

// ─── Stripe Connect Provider ─────────────────────────────────
// Supports: US, CA, GB, FR, DE, AE
// Methods: cards, Apple Pay, Google Pay, SEPA, Interac
// Payouts via Stripe Connect transfers
// ──────────────────────────────────────────────────────────────

export class StripeProvider implements PaymentProvider {
  readonly code = 'stripe';
  readonly name = 'Stripe';
  readonly supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AE'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'sepa',
    'interac',
    'bank_transfer',
  ];

  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is required. Add it to your environment variables.',
      );
    }
    this.stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.stripe.balance.retrieve();
    } catch {
      // TODO: In production, log this error. The key may be invalid.
    }
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();
    const idempotencyKey =
      request.idempotencyKey ?? `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      // Resolve the vendor's connected Stripe account (if any) so we can use
      // Connect destination charges: customer pays the platform, the platform
      // takes its fee, and the net is transferred to the vendor's account.
      const destinationAccount = await this.resolveDestinationAccount(request);
      const fees = this.calculateFees(request.amount, request.currency);

      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        description: request.description,
        receipt_email: request.customer.email,
        metadata: {
          afribook_customer_email: request.customer.email,
          afribook_customer_name: request.customer.name,
          afribook_country: request.countryCode,
          afribook_booking_id: request.bookingId ?? '',
          afribook_order_id: request.orderId ?? '',
          afribook_ride_id: request.rideId ?? '',
          afribook_delivery_id: request.deliveryId ?? '',
          afribook_vendor_id: request.vendorId ?? '',
          ...request.metadata,
        },
      };

      if (destinationAccount) {
        intentParams.transfer_data = {
          destination: destinationAccount,
        };
        intentParams.on_behalf_of = destinationAccount;
        intentParams.application_fee_amount = Math.round(
          (fees.platformFee + fees.tax) * 100,
        );
      }

      const intent = await this.stripe.paymentIntents.create(
        intentParams,
        { idempotencyKey },
      );

      const insertResult = await db
        .from('payment_transactions')
        .insert({
          booking_id: request.bookingId ?? null,
          order_id: request.orderId ?? null,
          ridely_ride_id: request.rideId ?? null,
          delivery_id: request.deliveryId ?? null,
          amount: request.amount,
          currency: request.currency,
          provider_code: this.code,
          provider_transaction_id: intent.id,
          method: request.method,
          status: 'pending',
          fee_platform: fees.platformFee,
          fee_processor: fees.processorFee,
          fee_tax: fees.tax,
          net_amount: fees.netToVendor,
          metadata: {
            ...request.metadata,
            destination_account: destinationAccount ?? null,
            application_fee_amount: destinationAccount
              ? Math.round((fees.platformFee + fees.tax) * 100)
              : null,
          },
        })
        .select('id')
        .single();

      const txRow = insertResult.data as { id: string } | null;

      const requiresAction =
        intent.status === 'requires_action' ||
        intent.status === 'requires_confirmation';

      return {
        success: intent.status === 'succeeded',
        transactionId: txRow?.id ?? intent.id,
        providerTransactionId: intent.id,
        status: this.mapStripeStatus(intent.status),
        clientSecret: intent.client_secret ?? undefined,
        requiresAction,
        metadata: { stripeStatus: intent.status },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Stripe payment failed';
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: message,
      };
    }
  }

  // ─── Refunds ─────────────────────────────────────────────────

  async processRefund(
    providerTransactionId: string,
    amount: number,
    reason: string,
  ): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: providerTransactionId,
          amount: Math.round(amount * 100),
          reason: this.mapRefundReason(reason),
          metadata: { reason },
        },
        { idempotencyKey: `ref_${providerTransactionId}_${Date.now()}` },
      );

      const db = await createPaymentDb();
      const txResult = await db
        .from('payment_transactions')
        .select('id')
        .eq('provider_transaction_id', providerTransactionId)
        .single();
      const tx = txResult.data as { id: string } | null;

      if (tx) {
        await db.from('refunds').insert({
          transaction_id: tx.id,
          amount,
          reason,
          status: refund.status === 'succeeded' ? 'processed' : 'pending',
          metadata: { stripe_refund_id: refund.id },
        });
      }

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        providerRefundId: refund.id,
        status: refund.status ?? 'pending',
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Stripe refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts (Stripe Connect Transfers) ──────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const walletResult = await db
        .from('vendor_wallets')
        .select('metadata')
        .eq('vendor_id', request.vendorId)
        .eq('business_id', request.businessId)
        .single();
      const wallet = walletResult.data as { metadata: Record<string, unknown> } | null;

      const stripeAccountId =
        wallet?.metadata?.stripe_account_id as string | undefined;

      if (!stripeAccountId) {
        return {
          success: false,
          payoutId: '',
          status: 'failed',
          error:
            'Vendor does not have a connected Stripe account. Complete onboarding first.',
        };
      }

      const transfer = await this.stripe.transfers.create(
        {
          amount: Math.round(request.amount * 100),
          currency: request.currency.toLowerCase(),
          destination: stripeAccountId,
          description: `AfriBook payout for ${request.vendorId}`,
          metadata: {
            afribook_vendor_id: request.vendorId,
            afribook_business_id: request.businessId,
            ...request.metadata,
          },
        },
        { idempotencyKey: `payout_${request.vendorId}_${Date.now()}` },
      );

      const payoutResult = await db
        .from('payouts')
        .insert({
          vendor_id: request.vendorId,
          business_id: request.businessId,
          amount: request.amount,
          currency: request.currency,
          status: 'processing',
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          transaction_ids: request.transactionIds ?? [],
          fee_platform: 0,
          fee_processor: 0,
          net_amount: request.amount,
          bank_account: request.destination,
          metadata: { stripe_transfer_id: transfer.id },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? transfer.id,
        providerPayoutId: transfer.id,
        status: 'processing',
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Stripe payout failed';
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: message,
      };
    }
  }

  // ─── Status Check ────────────────────────────────────────────

  async getTransactionStatus(
    providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    try {
      const intent =
        await this.stripe.paymentIntents.retrieve(providerTransactionId);
      return this.mapStripeStatus(intent.status);
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    try {
      this.stripe.webhooks.constructEvent(
        payload as string | Buffer,
        signature,
        webhookSecret,
      );
      return true;
    } catch {
      return false;
    }
  }

  // ─── Escrow via Connect ──────────────────────────────────────

  async holdEscrow(
    providerTransactionId: string,
    _amount: number,
  ): Promise<boolean> {
    try {
      const intent =
        await this.stripe.paymentIntents.retrieve(providerTransactionId);
      return intent.status === 'succeeded';
    } catch {
      return false;
    }
  }

  async releaseEscrow(
    providerTransactionId: string,
  ): Promise<boolean> {
    try {
      await this.stripe.paymentIntents.retrieve(providerTransactionId);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = countryCodeForCurrency(currency);
    const processorFeePercent = 0.029;
    const processorFeeFixed = 0.3;
    const processorFee = amount * processorFeePercent + processorFeeFixed;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
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

  // ─── Stripe Account Links (for onboarding) ───────────────────

  async createAccountLink(
    vendorId: string,
    accountId: string,
  ): Promise<StripeAccountLink> {
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payments/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payments/onboarding/complete`,
      type: 'account_onboarding',
    });

    return {
      url: link.url,
      expiresAt: new Date(link.expires_at * 1000).toISOString(),
    };
  }

  async createConnectedAccount(
    vendorId: string,
    email: string,
  ): Promise<string> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      metadata: { afribook_vendor_id: vendorId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('id, metadata')
      .eq('vendor_id', vendorId)
      .single();
    const existing = walletResult.data as { id: string; metadata: Record<string, unknown> } | null;

    if (existing) {
      await db
        .from('vendor_wallets')
        .update({
          metadata: {
            ...existing.metadata,
            stripe_account_id: account.id,
          },
        })
        .eq('id', existing.id);
    }

    return account.id;
  }

  async getAccountStatus(accountId: string): Promise<StripeAccountStatus> {
    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      currentlyDue: account.requirements?.currently_due ?? [],
      eventuallyDue: account.requirements?.eventually_due ?? [],
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  /**
   * Resolve the vendor's connected Stripe account (destination account for
   * Connect transfers). Resolution order:
   *   1. Explicit vendorId + businessId on the request
   *   2. The business linked to the transaction's order/booking
   * Returns null when no connected account exists yet (non-Connect flow).
   */
  private async resolveDestinationAccount(
    request: PaymentRequest,
  ): Promise<string | null> {
    const db = await createPaymentDb();

    let vendorId = request.vendorId;
    let businessId = request.businessId;

    if (!vendorId || !businessId) {
      let businessIdFromRef: string | null = null;
      let vendorIdFromRef: string | null = null;

      if (request.orderId) {
        const { data } = await db
          .from('orders')
          .select('business_id')
          .eq('id', request.orderId)
          .single() as unknown as { data: { business_id: string } | null };
        businessIdFromRef = data?.business_id ?? null;
      } else if (request.bookingId) {
        const { data } = await db
          .from('bookings')
          .select('business_id')
          .eq('id', request.bookingId)
          .single() as unknown as { data: { business_id: string } | null };
        businessIdFromRef = data?.business_id ?? null;
      }

      if (businessIdFromRef) {
        const { data: biz } = await db
          .from('businesses')
          .select('owner_id')
          .eq('id', businessIdFromRef)
          .single() as unknown as { data: { owner_id: string } | null };
        businessId = businessIdFromRef;
        vendorId = biz?.owner_id ?? vendorId;
      }
    }

    if (!vendorId || !businessId) return null;

    const walletResult = await db
      .from('vendor_wallets')
      .select('metadata')
      .eq('vendor_id', vendorId)
      .eq('business_id', businessId)
      .maybeSingle() as unknown as {
      data: { metadata: Record<string, unknown> } | null;
    };

    const stripeAccountId =
      walletResult.data?.metadata?.stripe_account_id as string | undefined;
    return stripeAccountId ?? null;
  }

  private mapStripeStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      succeeded: 'succeeded',
      requires_payment_method: 'pending',
      requires_confirmation: 'processing',
      requires_action: 'processing',
      processing: 'processing',
      requires_capture: 'processing',
      canceled: 'failed',
    };
    return map[status] ?? 'pending';
  }

  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const lower = reason.toLowerCase();
    if (lower.includes('duplicate')) return 'duplicate';
    if (lower.includes('fraud')) return 'fraudulent';
    return 'requested_by_customer';
  }
}

function countryCodeForCurrency(currency: string): string {
  const map: Record<string, string> = {
    USD: 'US',
    CAD: 'CA',
    GBP: 'GB',
    EUR: 'FR',
    AED: 'AE',
  };
  return map[currency.toUpperCase()] ?? 'US';
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
