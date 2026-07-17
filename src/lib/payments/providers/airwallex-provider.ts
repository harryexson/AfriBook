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

// ─── Airwallex Provider (Global) ─────────────────────────────
// Truly global PSP: strong in APAC, EU, UK, US, LATAM & cross-border.
// Methods: cards, Apple/Google Pay, local schemes (e.g. SEPA, FPX, UPI),
// and global payouts via Beneficiaries + Transfers.
// Docs: https://www.airwallex.com/docs/api
// ──────────────────────────────────────────────────────────────

const REGION_API: Record<string, string> = {
  '': 'https://api.airwallex.com',
  US: 'https://api.airwallex.com',
  EU: 'https://eu-api.airwallex.com',
  AP: 'https://api.airwallex.com',
};

export class AirwallexProvider implements PaymentProvider {
  readonly code = 'airwallex';
  readonly name = 'Airwallex';
  readonly supportedCountries: string[] = [];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'bank_transfer',
    'wallet',
    'sepa',
    'upi',
    'net_banking',
  ];

  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor() {
    this.clientId = process.env.AIRWALLEX_CLIENT_ID ?? '';
    this.clientSecret = process.env.AIRWALLEX_CLIENT_SECRET ?? '';
    const region = process.env.AIRWALLEX_REGION ?? '';
    this.baseUrl = REGION_API[region] ?? REGION_API[''];
  }

  async initialize(): Promise<void> {
    if (!this.clientId || !this.clientSecret) return;
    try {
      await this.authenticate();
    } catch {
      // Missing/invalid credentials are non-fatal at boot.
    }
  }

  // ─── Auth ───────────────────────────────────────────────────

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Airwallex credentials are not configured.');
    }
    const res = await fetch(`${this.baseUrl}/api/v1/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }),
    });
    if (!res.ok) {
      throw new Error(`Airwallex auth failed: ${res.status}`);
    }
    const data = (await res.json()) as { token: string; expires_in?: number };
    this.token = data.token;
    this.tokenExpiry = Date.now() + (data.expires_in ?? 3000) * 1000;
    return this.token;
  }

  private async request(
    path: string,
    method: string = 'GET',
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const token = await this.authenticate();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-client-id': this.clientId,
        'x-subject-token': token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Airwallex API error ${res.status}: ${JSON.stringify(err)}`,
      );
    }
    return (await res.json()) as Record<string, unknown>;
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const idempotencyKey =
        request.idempotencyKey ??
        `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const intent = await this.request('/api/v1/pa/payment_intents/create', 'POST', {
        request_id: idempotencyKey,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        merchant_order_id: request.orderId ?? request.bookingId ?? idempotencyKey,
        order: {
          products: [
            {
              name: request.description.slice(0, 140),
              quantity: 1,
              price: request.amount.toFixed(2),
            },
          ],
        },
        customer: {
          email: request.customer.email,
          first_name: request.customer.name.split(' ')[0] ?? request.customer.name,
          last_name: request.customer.name.split(' ').slice(1).join(' ') || '-',
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        metadata: {
          afribook_country: request.countryCode,
          afribook_customer_id: request.customer.email,
          ...request.metadata,
        },
      });

      const id = intent.id as string;
      const status = this.mapStatus(intent.status as string);

      const fees = this.calculateFees(request.amount, request.currency);
      const db = await createPaymentDb();
      await db.from('payment_transactions').insert({
        order_id: request.orderId ?? null,
        booking_id: request.bookingId ?? null,
        ride_id: request.rideId ?? null,
        amount: request.amount,
        currency: request.currency,
        provider_code: this.code,
        provider_transaction_id: id,
        method: request.method,
        status,
        fee_platform: fees.platformFee,
        fee_processor: fees.processorFee,
        fee_tax: fees.tax,
        net_amount: fees.netToVendor,
        metadata: request.metadata,
      });

      return {
        success: status === 'succeeded',
        transactionId: id,
        providerTransactionId: id,
        status,
        clientSecret: id,
        redirectUrl: (intent.payment_url as string) ?? undefined,
        requiresAction: status === 'pending',
        metadata: { airwallexStatus: intent.status },
      };
    } catch (err) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'Airwallex payment failed',
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
      const refund = await this.request('/api/v1/pa/refunds/create', 'POST', {
        refund_id: `rf_${providerTransactionId}_${Date.now()}`,
        payment_intent_id: providerTransactionId,
        amount: amount.toFixed(2),
        reason: 'customer_request',
        metadata: { reason },
      });
      return {
        success: true,
        refundId: String(refund.id),
        providerRefundId: String(refund.id),
        status: this.mapStatus(refund.status as string),
        amount,
      };
    } catch (err) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: err instanceof Error ? err.message : 'Airwallex refund failed',
      };
    }
  }

  // ─── Payouts (Beneficiary transfer) ──────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    try {
      const db = await createPaymentDb();
      const walletResult = await db
        .from('vendor_wallets')
        .select('metadata')
        .eq('vendor_id', request.vendorId)
        .eq('business_id', request.businessId)
        .single();
      const wallet = walletResult.data as { metadata?: Record<string, unknown> } | null;
      const beneficiaryId = wallet?.metadata?.airwallex_beneficiary_id as string | undefined;

      if (!beneficiaryId) {
        return {
          success: false,
          payoutId: '',
          status: 'failed',
          error:
            'Vendor has no Airwallex payout beneficiary configured. Complete payout onboarding first.',
        };
      }

      const transfer = await this.request('/api/v1/transfers/create', 'POST', {
        transfer_id: `po_${request.vendorId}_${Date.now()}`,
        beneficiary_id: beneficiaryId,
        amount: request.amount.toFixed(2),
        currency: request.currency.toUpperCase(),
        reason: `AfriBook payout for ${request.vendorId}`,
        metadata: {
          afribook_vendor_id: request.vendorId,
          afribook_business_id: request.businessId,
          ...request.metadata,
        },
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
          provider_payout_id: String(transfer.id),
          metadata: { airwallex_transfer_id: transfer.id },
        })
        .select('id')
        .single();
      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(transfer.id),
        providerPayoutId: String(transfer.id),
        status: 'processing',
      };
    } catch (err) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'Airwallex payout failed',
      };
    }
  }

  // ─── Status ──────────────────────────────────────────────────

  async getTransactionStatus(
    providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    try {
      const res = await this.request(
        `/api/v1/pa/payment_intents/${providerTransactionId}`,
      );
      return this.mapStatus(res.status as string);
    } catch {
      return 'pending';
    }
  }

  // ─── Webhook ─────────────────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
    if (!secret) return false;
    try {
      const hmac = createHmac('sha256', secret)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex');
      return hmac === signature;
    } catch {
      return false;
    }
  }

  // ─── Payout onboarding (Beneficiary) ─────────────────────────

  /**
   * Create an Airwallex beneficiary for a vendor and persist its id in the
   * vendor wallet metadata so processPayout can transfer funds to it.
   */
  async createBeneficiary(
    vendorId: string,
    destination: PayoutRequest['destination'],
  ): Promise<string> {
    const beneficiary = await this.request('/api/v1/beneficiaries/create', 'POST', {
      beneficiary_name: destination.accountName,
      beneficiary_type: 'INDIVIDUAL',
      payment_method: 'BANK_ACCOUNT',
      bank_details: {
        bank_code: destination.bankCode,
        bank_name: destination.bankName,
        account_number: destination.accountNumber,
        swift_code: destination.swiftCode,
        iban: destination.iban,
        currency: (destination as { currency?: string }).currency ?? 'USD',
      },
    });

    const beneficiaryId = String(beneficiary.id);
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
          metadata: { ...wallet.metadata, airwallex_beneficiary_id: beneficiaryId },
        })
        .eq('id', wallet.id);
    }
    return beneficiaryId;
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currencyCountry(currency);
    const processorFeePercent = 0.029;
    const processorFeeFixed = currency === 'USD' ? 0.3 : 0;
    const processorFee = amount * processorFeePercent + processorFeeFixed;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
    const floor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 0.5;
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

  private mapStatus(status?: string): OrchestratorPaymentStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'SUCCEEDED':
      case 'PAID':
        return 'succeeded';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      case 'REQUIRES_PAYMENT_METHOD':
        return 'pending';
      default:
        return 'processing';
    }
  }
}

function currencyCountry(currency: string): string {
  const map: Record<string, string> = {
    USD: 'US', GBP: 'GB', EUR: 'FR', AED: 'AE', CAD: 'CA',
    NGN: 'NG', GHS: 'GH', KES: 'KE', ZAR: 'ZA', EGP: 'EG',
    INR: 'IN', AUD: 'AU', SGD: 'SG', HKD: 'HK', JPY: 'JP',
    BRL: 'BR', MXN: 'MX', CNY: 'CN',
  };
  return map[currency.toUpperCase()] ?? 'US';
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
