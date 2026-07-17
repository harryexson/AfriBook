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

// ─── dLocal Provider (LATAM & Emerging Markets) ──────────────
// Strong in Latin America, APAC & emerging markets: cards, cash
// (Boleto, OXXO, PagoEfectivo), bank transfer, and local payouts.
// Auth: V2-HMAC-SHA256 over the body.
// Docs: https://docs.dlocal.com/
// ──────────────────────────────────────────────────────────────

const SUPPORTED: Record<string, string> = {
  AR: 'ARS', BR: 'BRL', MX: 'MXN', CL: 'CLP', CO: 'COP',
  PE: 'PEN', UY: 'UYU', PY: 'PYG', BO: 'BOB', EC: 'USD',
  CR: 'CRC', PA: 'USD', DO: 'DOP', GT: 'GTQ', HN: 'HNL',
  NI: 'NIO', SV: 'USD', BO_b: 'BOB',
};

export class DLocalProvider implements PaymentProvider {
  readonly code = 'dlocal';
  readonly name = 'dLocal';
  readonly supportedCountries = Object.keys(SUPPORTED);
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'bank_transfer',
    'cash',
    'wallet',
  ];

  private login: string;
  private transKey: string;
  private baseUrl: string;

  constructor() {
    this.login = process.env.DLOCAL_LOGIN ?? '';
    this.transKey = process.env.DLOCAL_TRANS_KEY ?? '';
    this.baseUrl =
      process.env.DLOCAL_ENV === 'production'
        ? 'https://api.dlocal.com'
        : 'https://sandbox.dlocal.com';
  }

  async initialize(): Promise<void> {
    if (!this.login || !this.transKey) return;
    try {
      await this.request('/secure_payments', 'POST', {
        amount: 0,
        currency: 'USD',
        country: 'BR',
        payment_method_id: 'CARD',
        payer: { email: 'ping@afribook.com' },
      });
    } catch {
      // Non-fatal at boot.
    }
  }

  private sign(dateIso: string, body: string): string {
    const secret = `${this.transKey}${dateIso}${body}`;
    return createHmac('sha256', this.login).update(secret).digest('hex');
  }

  private async request(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const date = new Date().toUTCString();
    const raw = body ? JSON.stringify(body) : '';
    const signature = this.sign(date, raw);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Date': date,
        'X-Login': this.login,
        'X-Trans-Key': this.transKey,
        Authorization: `V2-HMAC-SHA256, Signature: ${signature}`,
      },
      body: raw || undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`dLocal API error ${res.status}: ${JSON.stringify(err)}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  // ─── Payment ─────────────────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const currency = SUPPORTED[request.countryCode] ?? request.currency.toUpperCase();
    try {
      const orderId =
        request.idempotencyKey ?? `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const res = await this.request('/secure_payments', 'POST', {
        amount: Number(request.amount.toFixed(2)),
        currency,
        country: request.countryCode,
        payment_method_id: mapMethod(request.method),
        payment_method_flow: 'REDIRECT',
        payer: {
          email: request.customer.email,
          name: request.customer.name,
          document: request.customer.phone ?? '',
        },
        order_id: orderId,
        description: request.description.slice(0, 140),
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/dlocal/callback`,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dlocal`,
      });

      const status = mapStatus((res.status as string) ?? 'PENDING');
      const db = await createPaymentDb();
      const fees = this.calculateFees(request.amount, currency);
      await db.from('payment_transactions').insert({
        order_id: request.orderId ?? null,
        booking_id: request.bookingId ?? null,
        amount: request.amount,
        currency,
        provider_code: this.code,
        provider_transaction_id: String(res.id ?? orderId),
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
        transactionId: String(res.id ?? orderId),
        providerTransactionId: String(res.id ?? orderId),
        status,
        requiresAction: !!res.redirect_url,
        redirectUrl: (res.redirect_url as string) ?? undefined,
        metadata: { dlocalId: res.id },
      };
    } catch (err) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'dLocal payment failed',
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
      const res = await this.request('/refunds', 'POST', {
        amount: Number(amount.toFixed(2)),
        payment_id: providerTransactionId,
        reason: reason.slice(0, 100),
      });
      return {
        success: true,
        refundId: String(res.id),
        providerRefundId: String(res.id),
        status: mapStatus((res.status as string) ?? 'PENDING'),
        amount,
      };
    } catch (err) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: err instanceof Error ? err.message : 'dLocal refund failed',
      };
    }
  }

  // ─── Payouts ─────────────────────────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    try {
      const db = await createPaymentDb();
      const country = currencyCountry(request.currency) ?? 'BR';
      const res = await this.request('/payouts', 'POST', {
        amount: Number(request.amount.toFixed(2)),
        currency: request.currency.toUpperCase(),
        country,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/dlocal`,
        payer: {
          email: request.destination.accountName,
          name: request.destination.accountName,
        },
        payee: {
          name: request.destination.accountName,
          email: request.destination.accountName,
          document: request.destination.accountNumber,
        },
        payment_method_id: 'BANK_TRANSFER',
        payment_method_flow: 'PENDING',
        order_id: `po_${request.vendorId}_${Date.now()}`,
        target_bank: { code: request.destination.bankCode },
        description: `AfriBook payout ${request.vendorId}`,
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
          provider_payout_id: String(res.id),
          metadata: { dlocal_payout_id: res.id },
        })
        .select('id')
        .single();
      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(res.id),
        providerPayoutId: String(res.id),
        status: 'processing',
      };
    } catch (err) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'dLocal payout failed',
      };
    }
  }

  async getTransactionStatus(
    providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    try {
      const res = await this.request(`/secure_payments/${providerTransactionId}`, 'GET');
      return mapStatus((res.status as string) ?? 'PENDING');
    } catch {
      return 'pending';
    }
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    const secret = process.env.DLOCAL_WEBHOOK_SECRET ?? '';
    if (!secret) return false;
    try {
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const hmac = createHmac('sha256', secret).update(body).digest('hex');
      return hmac === signature;
    } catch {
      return false;
    }
  }

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currencyCountry(currency);
    const processorFee = amount * 0.039;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
    const floor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 5;
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
}

function mapMethod(method: OrchestratorPaymentMethod): string {
  switch (method) {
    case 'bank_transfer':
      return 'BANK_TRANSFER';
    case 'cash':
      return 'BOLETO';
    case 'wallet':
      return 'PIX';
    default:
      return 'CARD';
  }
}

function mapStatus(status: string): OrchestratorPaymentStatus {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'SETTLED':
      return 'succeeded';
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'failed';
    case 'REFUNDED':
      return 'refunded';
    default:
      return 'pending';
  }
}

function currencyCountry(currency: string): string {
  const map: Record<string, string> = {
    ARS: 'AR', BRL: 'BR', MXN: 'MX', CLP: 'CL', COP: 'CO',
    PEN: 'PE', UYU: 'UY', PYG: 'PY', BOB: 'BO', CRC: 'CR',
    DOP: 'DO', GTQ: 'GT', HNL: 'HN', NIO: 'NI',
  };
  return map[currency.toUpperCase()] ?? 'BR';
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
