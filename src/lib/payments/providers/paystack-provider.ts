import { createHmac } from 'crypto';
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
  PaystackRecipient,
} from '../types';
import {
  PLATFORM_FEE_PERCENT,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
} from '../types';

// ─── Paystack Provider (West Africa) ─────────────────────────
// Supports: NG, GH
// Methods: cards, bank transfer, USSD, mobile money
// Payouts via Paystack Transfers
// ──────────────────────────────────────────────────────────────

export class PaystackProvider implements PaymentProvider {
  readonly code = 'paystack';
  readonly name = 'Paystack';
  readonly supportedCountries = ['NG', 'GH'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'bank_transfer',
    'ussd',
    'mobile_money',
  ];

  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is required.');
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.request('/balance');
    } catch {
      // TODO: Log warning
    }
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();

    try {
      const initData = await this.request('/transaction/initialize', 'POST', {
        amount: Math.round(request.amount * 100),
        email: request.customer.email,
        currency: request.currency.toUpperCase(),
        reference: request.idempotencyKey ?? `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: request.customer.name,
            },
            {
              display_name: 'Country',
              variable_name: 'country',
              value: request.countryCode,
            },
          ],
          afribook_booking_id: request.bookingId ?? '',
          afribook_order_id: request.orderId ?? '',
        },
      });

      const reference = initData.reference as string;
      const accessCode = initData.access_code as string;

      const fees = this.calculateFees(request.amount, request.currency);
      const insertResult = await db
        .from('payment_transactions')
        .insert({
          booking_id: request.bookingId ?? null,
          order_id: request.orderId ?? null,
          ride_id: request.rideId ?? null,
          amount: request.amount,
          currency: request.currency,
          provider_code: this.code,
          provider_transaction_id: reference,
          method: request.method,
          status: 'pending',
          fee_platform: fees.platformFee,
          fee_processor: fees.processorFee,
          fee_tax: fees.tax,
          net_amount: fees.netToVendor,
          metadata: request.metadata,
        })
        .select('id')
        .single();

      const txRow = insertResult.data as { id: string } | null;

      return {
        success: false,
        transactionId: txRow?.id ?? reference,
        providerTransactionId: reference,
        status: 'pending',
        requiresAction: true,
        redirectUrl: initData.authorization_url as string,
        clientSecret: accessCode,
        metadata: {
          paystackReference: reference,
          accessCode,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Paystack payment failed';
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
      const refund = await this.request('/refund', 'POST', {
        transaction: providerTransactionId,
        amount: Math.round(amount * 100),
        note: reason,
      });

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
          status: 'pending',
          metadata: { paystack_refund_id: refund.id },
        });
      }

      return {
        success: true,
        refundId: String(refund.id),
        providerRefundId: String(refund.id),
        status: 'pending',
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Paystack refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts (Paystack Transfers) ────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const recipientCode = await this.getOrCreateRecipient(
        request.vendorId,
        request.destination,
        request.currency,
      );

      const transfer = await this.request('/transfer', 'POST', {
        source: 'balance',
        amount: Math.round(request.amount * 100),
        recipient: recipientCode,
        reason: `AfriBook payout for vendor ${request.vendorId}`,
        currency: request.currency.toUpperCase(),
      });

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
          provider_payout_id: String(transfer.reference),
          metadata: { paystack_transfer_reference: transfer.reference },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(transfer.reference),
        providerPayoutId: String(transfer.reference),
        status: transfer.status as string,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Paystack payout failed';
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
      const result = await this.request(
        `/transaction/verify/${providerTransactionId}`,
      );
      return this.mapPaystackStatus(result.status as string);
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    try {
      const hash = createHmac('sha512', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currency === 'NGN' ? 'NG' : 'GH';
    const processorFeePercent = 0.015;
    const processorFeeFixed = currency === 'NGN' ? 1 : 0;
    const processorFee = amount * processorFeePercent + processorFeeFixed;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.075);
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 100;
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

  // ─── Recipient Management ────────────────────────────────────

  async createRecipient(
    vendorId: string,
    destination: PayoutRequest['destination'],
    currency: string,
  ): Promise<PaystackRecipient> {
    const recipient = await this.request('/transferrecipient', 'POST', {
      type: 'nuban',
      name: destination.accountName,
      account_number: destination.accountNumber,
      bank_code: destination.bankCode,
      currency: currency.toUpperCase(),
    });

    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('id, metadata')
      .eq('vendor_id', vendorId)
      .single();
    const wallet = walletResult.data as { id: string; metadata: Record<string, unknown> } | null;

    if (wallet) {
      await db
        .from('vendor_wallets')
        .update({
          metadata: {
            ...wallet.metadata,
            paystack_recipient_code: recipient.recipient_code,
          },
        })
        .eq('id', wallet.id);
    }

    const details = (recipient.details ?? {}) as Record<string, string>;
    return {
      id: recipient.id as number,
      name: recipient.name as string,
      account_number: details.account_number ?? '',
      bank_code: details.bank_code ?? '',
      type: recipient.type as string,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async request(
    path: string,
    method: string = 'GET',
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Paystack API error ${res.status}: ${JSON.stringify(err)}`,
      );
    }

    const data = await res.json() as Record<string, unknown>;
    return (data.data as Record<string, unknown>) ?? data;
  }

  private async getOrCreateRecipient(
    vendorId: string,
    destination: PayoutRequest['destination'],
    currency: string,
  ): Promise<string> {
    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('metadata')
      .eq('vendor_id', vendorId)
      .single();
    const wallet = walletResult.data as { metadata: Record<string, unknown> } | null;

    const existing = wallet?.metadata?.paystack_recipient_code as string | undefined;
    if (existing) return existing;

    const recipient = await this.createRecipient(vendorId, destination, currency);
    return recipient.account_number ? recipient.bank_code : '';
  }

  private mapPaystackStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      success: 'succeeded',
      failed: 'failed',
      abandoned: 'failed',
      pending: 'pending',
      reversed: 'refunded',
    };
    return map[status] ?? 'pending';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
