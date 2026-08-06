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
} from '../types';
import {
  PLATFORM_FEE_PERCENT,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
} from '../types';

// ─── Flutterwave Provider (Pan-Africa) ───────────────────────
// Supports: NG, GH, KE, TZ, UG, ZA, EG + more
// Methods: cards, mobile money (M-Pesa, Airtel, MTN, Orange),
//          bank transfer
// Payouts via Flutterwave Transfers API
// ──────────────────────────────────────────────────────────────

export class FlutterwaveProvider implements PaymentProvider {
  readonly code = 'flutterwave';
  readonly name = 'Flutterwave';
  readonly supportedCountries = [
    'NG', 'GH', 'KE', 'TZ', 'UG', 'ZA', 'EG',
    'CM', 'CI', 'SN', 'RW', 'ET', 'ZM',
  ];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'mobile_money',
    'bank_transfer',
    'mpesa',
    'airtel_money',
    'mtn_mobile_money',
    'orange_money',
  ];

  private secretKey: string;
  private baseUrl = 'https://api.flutterwave.com/v3';

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY ?? '';
    if (!this.secretKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is required.');
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.request('/balances');
    } catch {
      // TODO: Log warning
    }
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();
    const txRef = request.idempotencyKey ?? `afribook_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const payload: Record<string, unknown> = {
        tx_ref: txRef,
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/flutterwave/callback`,
        customer: {
          email: request.customer.email,
          name: request.customer.name,
          phone_number: request.customer.phone ?? undefined,
        },
        meta: {
          afribook_country: request.countryCode,
          afribook_booking_id: request.bookingId ?? '',
          afribook_order_id: request.orderId ?? '',
        },
        customizations: {
          title: 'AfriBook Payment',
          description: request.description,
        },
      };

      if (this.isMobileMoneyMethod(request.method)) {
        payload.payment_options = 'mobilemoney';
      } else if (request.method === 'bank_transfer') {
        payload.payment_options = 'banktransfer';
      } else {
        payload.payment_options = 'card';
      }

      const response = await this.request('/payments', 'POST', payload);
      const flutterwaveRef = response.tx_ref as string;

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
          provider_transaction_id: flutterwaveRef,
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
        transactionId: txRow?.id ?? flutterwaveRef,
        providerTransactionId: flutterwaveRef,
        status: 'pending',
        requiresAction: true,
        redirectUrl: response.link as string,
        metadata: {
          flutterwaveRef,
          paymentLink: response.link,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Flutterwave payment failed';
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
      const response = await this.request(
        `/transactions/${providerTransactionId}/refund`,
        'POST',
        { amount, comment: reason },
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
          status: 'pending',
          metadata: { flutterwave_refund_id: response.id },
        });
      }

      return {
        success: true,
        refundId: String(response.id),
        providerRefundId: String(response.id),
        status: 'pending',
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Flutterwave refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts (Flutterwave Transfers) ─────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const transferPayload: Record<string, unknown> = {
        account_bank: request.destination.bankCode,
        account_number: request.destination.accountNumber,
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        beneficiary_name: request.destination.accountName,
        reference: `afribook_payout_${Date.now()}`,
        narration: `AfriBook payout for ${request.vendorId}`,
      };

      if (request.destination.branchCode) {
        transferPayload.account_bank = request.destination.branchCode;
      }

      const response = await this.request('/transfers', 'POST', transferPayload);

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
          provider_payout_id: String(response.id),
          metadata: { flutterwave_transfer_id: response.id },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(response.id),
        providerPayoutId: String(response.id),
        status: (response.status as string) ?? 'processing',
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Flutterwave payout failed';
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
        `/transactions/verify_by_reference?tx_ref=${providerTransactionId}`,
      );
      return this.mapFlutterwaveStatus(result.status as string);
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const hashSecret =
      process.env.FLUTTERWAVE_WEBHOOK_SECRET ?? process.env.FLUTTERWAVE_WEBHOOK_HASH;
    if (!hashSecret) return false;

    try {
      const hash = createHmac('sha256', hashSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = this.inferCountryCode(currency);
    const processorFeePercent = 0.014;
    const processorFee = amount * processorFeePercent;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 5;
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
        `Flutterwave API error ${res.status}: ${JSON.stringify(err)}`,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    return (data.data as Record<string, unknown>) ?? data;
  }

  private isMobileMoneyMethod(method: string): boolean {
    return [
      'mpesa', 'airtel_money', 'mtn_mobile_money',
      'orange_money', 'mobile_money',
    ].includes(method);
  }

  private inferCountryCode(currency: string): string {
    const map: Record<string, string> = {
      NGN: 'NG', GHS: 'GH', KES: 'KE', TZS: 'TZ',
      UGX: 'UG', ZAR: 'ZA', EGP: 'EG', RWF: 'RW',
      ETB: 'ET', ZMW: 'ZM',
    };
    return map[currency.toUpperCase()] ?? 'NG';
  }

  private mapFlutterwaveStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      successful: 'succeeded',
      failed: 'failed',
      pending: 'pending',
      cancelled: 'failed',
    };
    return map[status] ?? 'pending';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
