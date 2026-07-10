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

// ─── PayChangu Provider (Malawi) ─────────────────────────────
// Supports: MW
// Methods: mobile money (Airtel Money, TNM Mpamba), bank transfer
// ──────────────────────────────────────────────────────────────

export class PayChanguProvider implements PaymentProvider {
  readonly code = 'paychangu';
  readonly name = 'PayChangu';
  readonly supportedCountries = ['MW'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'mobile_money',
    'airtel_money',
    'bank_transfer',
  ];

  private secretKey: string;
  private baseUrl = 'https://api.paychangu.com';

  constructor() {
    this.secretKey = process.env.PAYCHANGU_SECRET_KEY ?? '';
    if (!this.secretKey) {
      throw new Error('PAYCHANGU_SECRET_KEY is required.');
    }
  }

  async initialize(): Promise<void> {
    // PayChangu doesn't require explicit initialization
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();
    const txRef = request.idempotencyKey ?? `afribook_mw_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const initData = await this.request('/payments', 'POST', {
        amount: request.amount,
        currency: 'MWK',
        email: request.customer.email,
        phone: request.customer.phone ?? '',
        tx_ref: txRef,
        title: 'AfriBook Payment',
        description: request.description,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paychangu/callback`,
        metadata: {
          customer_name: request.customer.name,
          afribook_country: request.countryCode,
          afribook_booking_id: request.bookingId ?? '',
          afribook_order_id: request.orderId ?? '',
          ...request.metadata,
        },
      });

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
          provider_transaction_id: txRef,
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
        transactionId: txRow?.id ?? txRef,
        providerTransactionId: txRef,
        status: 'pending',
        requiresAction: true,
        redirectUrl: initData.checkout_url as string,
        metadata: {
          paychanguTxRef: txRef,
          checkoutUrl: initData.checkout_url,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'PayChangu payment failed';
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
        `/payments/${providerTransactionId}/refund`,
        'POST',
        { amount, reason },
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
          metadata: { paychangu_refund_id: response.id },
        });
      }

      return {
        success: true,
        refundId: String(response.id ?? providerTransactionId),
        providerRefundId: String(response.id),
        status: 'pending',
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'PayChangu refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts ─────────────────────────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const response = await this.request('/transfers', 'POST', {
        amount: request.amount,
        currency: 'MWK',
        type: request.destination.routingNumber ? 'bank' : 'mobile_money',
        beneficiary: {
          bank_code: request.destination.bankCode,
          account_number: request.destination.accountNumber,
          name: request.destination.accountName,
          mobile_number: request.destination.accountNumber,
        },
        reference: `afribook_payout_mw_${Date.now()}`,
        reason: `AfriBook payout for ${request.vendorId}`,
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
          provider_payout_id: String(response.id),
          metadata: { paychangu_transfer_id: response.id },
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
        err instanceof Error ? err.message : 'PayChangu payout failed';
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
        `/payments/verify/${providerTransactionId}`,
      );
      return this.mapPayChanguStatus(result.status as string);
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    try {
      const hash = createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, _currency: string): FeeBreakdown {
    const processorFeePercent = 0.025;
    const processorFee = amount * processorFeePercent;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES['MW'] ?? 0.165);
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR['MW'] ?? 200;
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
        `PayChangu API error ${res.status}: ${JSON.stringify(err)}`,
      );
    }

    return res.json() as Promise<Record<string, unknown>>;
  }

  private mapPayChanguStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      successful: 'succeeded',
      complete: 'succeeded',
      failed: 'failed',
      pending: 'pending',
      cancelled: 'failed',
    };
    return map[status?.toLowerCase()] ?? 'pending';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
