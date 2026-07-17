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

// ─── PawaPay Provider (Africa Mobile Money) ──────────────────
// Purpose-built for African mobile money (MTN, Airtel, Vodacom,
// Orange, Moov, etc.). Supports deposits (customer → platform)
// and payouts (platform → vendor mobile wallet).
// Docs: https://docs.pawapay.io/
// ──────────────────────────────────────────────────────────────

const CORRESPONDENTS: Record<string, string> = {
  KE: 'MPESA_KE',
  UG: 'MTN_UG',
  TZ: 'VODACOM_TZ',
  GH: 'MTN_GH',
  NG: 'MTN_NG',
  ZM: 'MTN_ZM',
  ZW: 'ECOCASH_ZW',
  RW: 'MTN_RW',
  SN: 'ORANGE_SN',
  CI: 'ORANGE_CI',
  CM: 'MTN_CM',
  BJ: 'MTN_BJ',
  CD: 'VODACOM_CD',
  CG: 'MTN_CG',
  GN: 'ORANGE_GN',
  ML: 'ORANGE_ML',
  MR: 'MASTERMOBILE_MR',
  NE: 'AIRTEL_NE',
  BF: 'MOOV_BF',
};

const SUPPORTED = Object.keys(CORRESPONDENTS);

export class PawaPayProvider implements PaymentProvider {
  readonly code = 'pawapay';
  readonly name = 'PawaPay';
  readonly supportedCountries = SUPPORTED;
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'mobile_money',
    'mpesa',
    'airtel_money',
    'mtn_mobile_money',
    'orange_money',
  ];

  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.PAWAPAY_API_KEY ?? '';
    const env = process.env.PAWAPAY_ENV ?? 'sandbox';
    this.baseUrl =
      env === 'production'
        ? 'https://api.pawapay.io'
        : 'https://api.sandbox.pawapay.io';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) return;
    try {
      await fetch(`${this.baseUrl}/v1/ping`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch {
      // Non-fatal at boot.
    }
  }

  private async request(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PawaPay API error ${res.status}: ${JSON.stringify(err)}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  // ─── Payment (Deposit) ───────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const correspondent = CORRESPONDENTS[request.countryCode];
    if (!correspondent) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: `PawaPay does not support country ${request.countryCode}`,
      };
    }
    try {
      const depositId =
        request.idempotencyKey ?? `dep_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const res = await this.request('/v1/deposits', 'POST', {
        depositId,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        country: request.countryCode,
        correspondent,
        payer: {
          type: 'MSISDN',
          address: request.customer.phone ?? '',
          firstName: request.customer.name.split(' ')[0] ?? '',
          lastName: request.customer.name.split(' ').slice(1).join(' ') || '-',
          email: request.customer.email,
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: 'AfriBook',
        metadata: [
          { fieldName: 'afribook_country', fieldValue: request.countryCode },
          { fieldName: 'afribook_customer', fieldValue: request.customer.email },
        ],
      });

      const statusUrl = (res.depositUrl as string) ?? undefined;
      const db = await createPaymentDb();
      const fees = this.calculateFees(request.amount, request.currency);
      const insertResult = await db
        .from('payment_transactions')
        .insert({
          order_id: request.orderId ?? null,
          booking_id: request.bookingId ?? null,
          amount: request.amount,
          currency: request.currency,
          provider_code: this.code,
          provider_transaction_id: depositId,
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
        transactionId: txRow?.id ?? depositId,
        providerTransactionId: depositId,
        status: 'pending',
        requiresAction: true,
        redirectUrl: statusUrl,
        metadata: { pawapayDepositId: depositId },
      };
    } catch (err) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'PawaPay payment failed',
      };
    }
  }

  // ─── Refunds ─────────────────────────────────────────────────

  async processRefund(
    providerTransactionId: string,
    amount: number,
    reason: string,
  ): Promise<RefundResult> {
    // PawaPay refunds via reverse deposit (mirror payout flow).
    try {
      const res = await this.request('/v1/payouts', 'POST', {
        payoutId: `rf_${providerTransactionId}_${Date.now()}`,
        amount: amount.toFixed(2),
        currency: 'USD',
        country: 'KE',
        correspondent: 'MPESA_KE',
        recipient: { type: 'MSISDN', address: '' },
        customerTimestamp: new Date().toISOString(),
        metadata: [{ fieldName: 'reason', fieldValue: reason }],
      });
      return {
        success: true,
        refundId: String(res.payoutId),
        providerRefundId: String(res.payoutId),
        status: 'pending',
        amount,
      };
    } catch (err) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: err instanceof Error ? err.message : 'PawaPay refund failed',
      };
    }
  }

  // ─── Payouts ─────────────────────────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const country = currencyCountry(request.currency);
    const correspondent = country ? CORRESPONDENTS[country] : undefined;
    if (!correspondent) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: `PawaPay payout not supported for ${country ?? 'unknown country'}`,
      };
    }
    // Fall back to the vendor's stored MSISDN if not supplied on the request.
    let msisdn = request.destination.accountNumber;
    if (!msisdn) {
      const db = await createPaymentDb();
      const walletResult = await db
        .from('vendor_wallets')
        .select('metadata')
        .eq('vendor_id', request.vendorId)
        .eq('business_id', request.businessId)
        .single();
      const wallet = walletResult.data as { metadata?: Record<string, unknown> } | null;
      msisdn = (wallet?.metadata?.pawapay_recipient_msisdn as string) ?? '';
    }
    if (!msisdn) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: 'No PawaPay payout destination configured for this vendor.',
      };
    }
    try {
      const res = await this.request('/v1/payouts', 'POST', {
        payoutId: `po_${request.vendorId}_${Date.now()}`,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        country,
        correspondent,
        recipient: {
          type: 'MSISDN',
          address: msisdn,
        },
        customerTimestamp: new Date().toISOString(),
        metadata: [
          { fieldName: 'afribook_vendor', fieldValue: request.vendorId },
        ],
      });

      const db = await createPaymentDb();
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
          provider_payout_id: String(res.payoutId),
          metadata: { pawapay_payout_id: res.payoutId },
        })
        .select('id')
        .single();
      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(res.payoutId),
        providerPayoutId: String(res.payoutId),
        status: 'processing',
      };
    } catch (err) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'PawaPay payout failed',
      };
    }
  }

  // ─── Status ──────────────────────────────────────────────────

  async getTransactionStatus(
    providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    try {
      const res = await this.request(
        `/v1/deposits/${providerTransactionId}/status`,
        'GET',
      );
      return this.mapStatus((res.status as string) ?? '');
    } catch {
      return 'pending';
    }
  }

  // ─── Webhook ─────────────────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const secret = process.env.PAWAPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    try {
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const hash = createHmac('sha256', secret).update(body).digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }

  // ─── Payout onboarding (Mobile wallet) ───────────────────────

  /**
   * Persist a vendor's mobile-money payout destination (MSISDN) so payouts
   * can be routed to the correct correspondent for their country.
   */
  async createRecipient(
    vendorId: string,
    destination: PayoutRequest['destination'],
  ): Promise<string> {
    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('id, metadata')
      .eq('vendor_id', vendorId)
      .single();
    const wallet = walletResult.data as { id: string; metadata: Record<string, unknown> } | null;
    const msisdn = destination.accountNumber;
    if (wallet) {
      await db
        .from('vendor_wallets')
        .update({
          metadata: { ...wallet.metadata, pawapay_recipient_msisdn: msisdn },
        })
        .eq('id', wallet.id);
    }
    return msisdn;
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currencyCountry(currency);
    const processorFeePercent = 0.015;
    const processorFee = amount * processorFeePercent;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
    const floor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 20;
    const total = Math.max(platformFee + processorFee + tax, floor);
    const netToVendor = Math.max(amount - total, 0);
    return {
      platformFee: roundTo2(platformFee),
      processorFee: roundTo2(processorFee),
      tax: roundTo2(tax),
      total: roundTo2(total),
      netToVendor: roundTo2(netToVendor),
      minimumFeeFloor: floor,
    };
  }

  private mapStatus(status: string): OrchestratorPaymentStatus {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'succeeded';
      case 'FAILED':
      case 'REJECTED':
      case 'EXPIRED':
        return 'failed';
      case 'REVERSED':
        return 'refunded';
      default:
        return 'pending';
    }
  }
}

function currencyCountry(currency: string): string {
  const map: Record<string, string> = {
    KES: 'KE', UGX: 'UG', TZS: 'TZ', GHS: 'GH', NGN: 'NG',
    ZMW: 'ZM', ZWL: 'ZW', RWF: 'RW', XOF: 'SN', XAF: 'CM',
  };
  return map[currency.toUpperCase()] ?? 'KE';
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
