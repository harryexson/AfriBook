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

// ─── Adyen Provider (Global) ─────────────────────────────────
// Global acquirer covering 150+ countries, all card networks, local
// payment methods (iDEAL, Bancontact, Boleto, etc.), and payouts via
// the Balance Platform / Transfers API.
// Docs: https://docs.adyen.com/
// ──────────────────────────────────────────────────────────────

export class AdyenProvider implements PaymentProvider {
  readonly code = 'adyen';
  readonly name = 'Adyen';
  readonly supportedCountries: string[] = [];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'bank_transfer',
    'sepa',
    'wallet',
    'upi',
    'net_banking',
    'interac',
  ];

  private apiKey: string;
  private merchantAccount: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ADYEN_API_KEY ?? '';
    this.merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT ?? '';
    const prefix = process.env.ADYEN_ENV === 'production' ? '' : 'checkout-test.adyen.com';
    this.baseUrl = `https://${prefix}/checkout/v71`;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) return;
    try {
      await fetch(`${this.baseUrl}/paymentMethods`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ merchantAccount: this.merchantAccount }),
      });
    } catch {
      // Non-fatal at boot.
    }
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-API-key': this.apiKey,
    };
  }

  private async request(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Adyen API error ${res.status}: ${JSON.stringify(err)}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  // ─── Payment ─────────────────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const reference =
        request.idempotencyKey ?? `adyen_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const res = await this.request('/payments', 'POST', {
        amount: { currency: request.currency.toUpperCase(), value: Math.round(request.amount * 100) },
        reference,
        merchantAccount: this.merchantAccount,
        paymentMethod: { type: mapMethod(request.method) },
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        shopperEmail: request.customer.email,
        shopperName: { firstName: request.customer.name.split(' ')[0] ?? '', lastName: request.customer.name.split(' ').slice(1).join(' ') || '-' },
        shopperReference: request.customer.email,
        countryCode: request.countryCode,
        metadata: { afribook_country: request.countryCode, ...request.metadata },
      });

      const resultCode = (res.resultCode as string) ?? 'Unknown';
      const status = mapResultCode(resultCode);
      const psp = (res.pspReference as string) ?? reference;

      const fees = this.calculateFees(request.amount, request.currency);
      const db = await createPaymentDb();
      await db.from('payment_transactions').insert({
        order_id: request.orderId ?? null,
        booking_id: request.bookingId ?? null,
        ride_id: request.rideId ?? null,
        amount: request.amount,
        currency: request.currency,
        provider_code: this.code,
        provider_transaction_id: psp,
        method: request.method,
        status,
        fee_platform: fees.platformFee,
        fee_processor: fees.processorFee,
        fee_tax: fees.tax,
        net_amount: fees.netToVendor,
        metadata: request.metadata,
      });

      const action = res.action as Record<string, unknown> | undefined;
      return {
        success: status === 'succeeded',
        transactionId: psp,
        providerTransactionId: psp,
        status,
        clientSecret: psp,
        requiresAction: !!action || status === 'processing',
        redirectUrl: (action?.url as string) ?? undefined,
        metadata: { adyenResultCode: resultCode },
      };
    } catch (err) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'Adyen payment failed',
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
      const reference = `rf_${providerTransactionId}_${Date.now()}`;
      const res = await fetch(
        `${this.baseUrl}/payments/${providerTransactionId}/refunds`,
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            amount: { currency: 'USD', value: Math.round(amount * 100) },
            reference,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
      }
      void reason;
      return {
        success: true,
        refundId: reference,
        providerRefundId: reference,
        status: 'pending',
        amount,
      };
    } catch (err) {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: err instanceof Error ? err.message : 'Adyen refund failed',
      };
    }
  }

  // ─── Payouts (Balance Platform transfer) ─────────────────────

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
      const balanceAccount = wallet?.metadata?.adyen_balance_account_id as string | undefined;

      if (!balanceAccount) {
        return {
          success: false,
          payoutId: '',
          status: 'failed',
          error: 'Vendor has no Adyen balance account. Complete payout onboarding first.',
        };
      }

      // Transfer from platform balance to vendor balance account.
      const transferRes = await fetch(
        'https://balanceplatform-api-test.adyen.com/btl/v3/transfers',
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            amount: { currency: request.currency.toUpperCase(), value: Math.round(request.amount * 100) },
            counterparty: { balanceAccountId: balanceAccount },
            reference: `po_${request.vendorId}_${Date.now()}`,
            category: 'internal',
          }),
        },
      ).then((r) => r.json() as Promise<Record<string, unknown>>);

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
          provider_payout_id: String(transferRes.id),
          metadata: { adyen_transfer_id: transferRes.id },
        })
        .select('id')
        .single();
      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? String(transferRes.id),
        providerPayoutId: String(transferRes.id),
        status: 'processing',
      };
    } catch (err) {
      return {
        success: false,
        payoutId: '',
        status: 'failed',
        error: err instanceof Error ? err.message : 'Adyen payout failed',
      };
    }
  }

  async getTransactionStatus(
    _providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    // Adyen status is webhook-driven; default to pending until a webhook lands.
    return 'pending';
  }

  verifyWebhook(payload: unknown, signature: string): boolean {
    const secret = process.env.ADYEN_WEBHOOK_HMAC ?? '';
    if (!secret) return false;
    try {
      const body = JSON.stringify(payload);
      const hmac = createHmac('sha256', secret).update(body).digest('base64');
      return hmac === signature;
    } catch {
      return false;
    }
  }

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currencyCountry(currency);
    const processorFee = amount * 0.029 + (currency === 'USD' ? 0.3 : 0);
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
}

function mapMethod(method: OrchestratorPaymentMethod): string {
  const map: Partial<Record<OrchestratorPaymentMethod, string>> = {
    card: 'scheme',
    sepa: 'sepadirectdebit',
    bank_transfer: 'bankTransfer_IBAN',
    wallet: 'paypal',
  };
  return map[method] ?? 'scheme';
}

function mapResultCode(code: string): OrchestratorPaymentStatus {
  switch (code.toUpperCase()) {
    case 'AUTHORISED':
      return 'succeeded';
    case 'REFUSED':
    case 'CANCELLED':
    case 'ERROR':
      return 'failed';
    case 'REDIRECTSHOPPER':
    case 'IDENTIFYSHOPPER':
    case 'CHALLENGESHOPPER':
      return 'processing';
    default:
      return 'pending';
  }
}

function currencyCountry(currency: string): string {
  const map: Record<string, string> = {
    USD: 'US', GBP: 'GB', EUR: 'FR', AED: 'AE', CAD: 'CA',
    NGN: 'NG', GHS: 'GH', KES: 'KE', ZAR: 'ZA', EGP: 'EG',
    BRL: 'BR', MXN: 'MX', INR: 'IN', AUD: 'AU', JPY: 'JP',
  };
  return map[currency.toUpperCase()] ?? 'US';
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
