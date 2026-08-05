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

// ─── PayChangu Provider (Malawi + international cards in USD) ─
// Supports: MW (MWK), plus USD cards from anywhere via standard
// checkout.
// Methods: mobile money (Airtel Money, TNM Mpamba), bank transfer,
// cards.
// API base: https://api.paychangu.com
// Auth: Bearer {PAYCHANGU_SECRET_KEY}
// ──────────────────────────────────────────────────────────────

export const PAYCHANGU_OPERATORS = {
  TNM_MPAMBA: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
  AIRTEL_MONEY: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
} as const;

export class PayChanguProvider implements PaymentProvider {
  readonly code = 'paychangu';
  readonly name = 'PayChangu';
  readonly supportedCountries = ['MW'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'mobile_money',
    'airtel_money',
    'mtn_mobile_money',
    'bank_transfer',
    'card',
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
    const isMobileMoney = [
      'mobile_money',
      'airtel_money',
      'mtn_mobile_money',
    ].includes(request.method);

    // Direct charge (STK push) requires a phone number and an operator.
    // Otherwise fall back to the hosted Standard Checkout, which also
    // handles cards and bank transfer for customers worldwide (USD).
    if (isMobileMoney && request.customer.phone) {
      return this.processDirectCharge(request);
    }

    return this.processStandardCheckout(request);
  }

  private async processStandardCheckout(
    request: PaymentRequest,
  ): Promise<PaymentResult> {
    const db = await createPaymentDb();
    const txRef =
      request.idempotencyKey ??
      `afribook_mw_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const response = await this.request('/payment', 'POST', {
        amount: String(Math.round(request.amount * 100) / 100),
        currency: request.currency === 'USD' ? 'USD' : 'MWK',
        email: request.customer.email,
        first_name: this.firstName(request.customer.name),
        last_name: this.lastName(request.customer.name),
        tx_ref: txRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paychangu/callback`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        customization: {
          title: 'AfriBook Payment',
          description: request.description,
        },
        meta: {
          afribook_customer_name: request.customer.name,
          afribook_country: request.countryCode,
          afribook_booking_id: request.bookingId ?? '',
          afribook_order_id: request.orderId ?? '',
          ...request.metadata,
        },
      });

      const data = this.getData(response);
      const checkoutUrl = this.getCheckoutUrl(response);

      if (!checkoutUrl) {
        throw new Error('PayChangu did not return a checkout URL.');
      }

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
          metadata: {
            ...request.metadata,
            paychangu_mode: 'checkout',
            paychangu_tx_ref: txRef,
            checkout_url: checkoutUrl,
          },
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
        redirectUrl: checkoutUrl,
        metadata: {
          paychangu_mode: 'checkout',
          paychanguTxRef: txRef,
          checkoutUrl,
          tx_ref: (data?.tx_ref as string) ?? txRef,
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

  private async processDirectCharge(
    request: PaymentRequest,
  ): Promise<PaymentResult> {
    const db = await createPaymentDb();
    const chargeId =
      request.idempotencyKey ??
      `afribook_momo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const operatorRef = this.resolveOperatorRef(
        request.method,
        request.customer.phone ?? '',
      );

      const response = await this.request('/mobile-money/payments/initialize', 'POST', {
        mobile: this.normalizePhone(request.customer.phone ?? ''),
        mobile_money_operator_ref_id: operatorRef,
        amount: String(Math.round(request.amount * 100) / 100),
        charge_id: chargeId,
        email: request.customer.email,
        first_name: this.firstName(request.customer.name),
        last_name: this.lastName(request.customer.name),
      });

      const data = this.getData(response);

      if (response.status !== 'success') {
        throw new Error(
          (response.message as string) ?? 'PayChangu mobile money charge failed',
        );
      }

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
          provider_transaction_id: chargeId,
          method: request.method,
          status: 'processing',
          fee_platform: fees.platformFee,
          fee_processor: fees.processorFee,
          fee_tax: fees.tax,
          net_amount: fees.netToVendor,
          metadata: {
            ...request.metadata,
            paychangu_mode: 'direct',
            paychangu_charge_id: chargeId,
            paychangu_operator: (data?.mobile_money as { name?: string })?.name,
            phone: request.customer.phone,
          },
        })
        .select('id')
        .single();

      const txRow = insertResult.data as { id: string } | null;

      return {
        success: false,
        transactionId: txRow?.id ?? chargeId,
        providerTransactionId: chargeId,
        status: 'processing',
        requiresAction: true,
        metadata: {
          paychangu_mode: 'direct',
          paychanguChargeId: chargeId,
          operatorRef,
          message: 'Check your phone to approve the payment.',
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
        `/charge-card/refund/${providerTransactionId}`,
        'POST',
        { amount: String(amount), reason },
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
          metadata: { paychangu_refund_id: response?.id ?? null },
        });
      }

      return {
        success: true,
        refundId: String(response?.id ?? providerTransactionId),
        providerRefundId: String(response?.id ?? providerTransactionId),
        status: 'pending',
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'PayChangu refund failed';

      // MoMo / bank charges do not support automated refunds.
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
          metadata: {
            requires_manual_processing: true,
            error: message,
          },
        });
      }

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
    const chargeId = `afribook_payout_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const isBankPayout = !!request.destination.bankCode;

      let response: Record<string, unknown>;
      if (isBankPayout) {
        response = await this.request('/direct-charge/payouts/initialize', 'POST', {
          payout_method: 'bank_transfer',
          bank_uuid: request.destination.bankCode,
          amount: String(request.amount),
          charge_id: chargeId,
          bank_account_name: request.destination.accountName,
          bank_account_number: request.destination.accountNumber,
          email: request.metadata?.email ?? '',
          first_name: request.destination.accountName.split(' ')[0],
          last_name: request.destination.accountName.split(' ').slice(1).join(' '),
        });
      } else {
        response = await this.request('/mobile-money/payouts/initialize', 'POST', {
          mobile: this.normalizePhone(request.destination.accountNumber),
          mobile_money_operator_ref_id: PAYCHANGU_OPERATORS.AIRTEL_MONEY,
          amount: String(request.amount),
          charge_id: chargeId,
          email: request.metadata?.email ?? '',
          first_name: request.destination.accountName.split(' ')[0],
          last_name: request.destination.accountName.split(' ').slice(1).join(' '),
        });
      }

      const data = this.getData(response);
      const transaction =
        (data?.transaction as Record<string, unknown>) ?? data ?? {};
      const providerChargeId = String(
        transaction.charge_id ?? data?.charge_id ?? chargeId,
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
          provider_payout_id: providerChargeId,
          metadata: { paychangu_transfer_id: providerChargeId },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? providerChargeId,
        providerPayoutId: providerChargeId,
        status: (transaction.status as string) ?? 'processing',
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
    // Checkout transactions are verified via /verify-payment/{tx_ref}.
    // Direct MoMo charges are verified via /mobile-money/payments/{chargeId}/verify.
    try {
      const checkoutResult = await this.request(
        `/verify-payment/${providerTransactionId}`,
      );
      const checkoutData = this.getData(checkoutResult);
      if (checkoutData) {
        return this.mapPayChanguStatus(
          (checkoutData.status as string) ?? (checkoutResult.status as string),
        );
      }
    } catch {
      // fall through to direct-charge verification
    }

    try {
      const directResult = await this.request(
        `/mobile-money/payments/${providerTransactionId}/verify`,
      );
      const directData = this.getData(directResult);
      return this.mapPayChanguStatus(
        (directData?.status as string) ?? (directResult.status as string),
      );
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    try {
      // PayChangu signs the RAW body. Accept either a raw string or an
      // already-parsed object (re-serialized).
      const raw =
        typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);
      const hash = createHmac('sha256', webhookSecret).update(raw).digest('hex');
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
    const tax =
      (platformFee + processorFee) * (COUNTRY_TAX_RATES['MW'] ?? 0.165);
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
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        (err as { message?: string }).message ??
        `PayChangu API error ${res.status}`;
      throw new Error(message);
    }

    return res.json() as Promise<Record<string, unknown>>;
  }

  private getData(
    response: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const data = response.data;
    if (data && typeof data === 'object') {
      return data as Record<string, unknown>;
    }
    return null;
  }

  private getCheckoutUrl(
    response: Record<string, unknown>,
  ): string | null {
    const data = this.getData(response);
    if (data && typeof data.checkout_url === 'string') {
      return data.checkout_url;
    }
    return null;
  }

  private resolveOperatorRef(
    method: OrchestratorPaymentMethod,
    phone: string,
  ): string {
    if (method === 'mtn_mobile_money') return PAYCHANGU_OPERATORS.TNM_MPAMBA;
    if (method === 'airtel_money') return PAYCHANGU_OPERATORS.AIRTEL_MONEY;

    // Infer from the phone number when the method is generic.
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('88') || digits.startsWith('098')) {
      return PAYCHANGU_OPERATORS.TNM_MPAMBA;
    }
    return PAYCHANGU_OPERATORS.AIRTEL_MONEY;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('265')) return `+${digits}`;
    if (digits.startsWith('0')) return `+265${digits.slice(1)}`;
    return `+${digits}`;
  }

  private firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? '';
  }

  private lastName(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  private mapPayChanguStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      success: 'succeeded',
      successful: 'succeeded',
      complete: 'succeeded',
      completed: 'succeeded',
      failed: 'failed',
      pending: 'pending',
      processing: 'processing',
      cancelled: 'failed',
      canceled: 'failed',
    };
    return map[status?.toLowerCase()] ?? 'pending';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
