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
  RazorpayContact,
} from '../types';
import {
  PLATFORM_FEE_PERCENT,
  COUNTRY_MINIMUM_FEE_FLOOR,
  COUNTRY_TAX_RATES,
} from '../types';

// ─── Razorpay Provider (India) ───────────────────────────────
// Supports: cards, UPI, wallets, net banking
// Payouts via RazorpayX
// ──────────────────────────────────────────────────────────────

export class RazorpayProvider implements PaymentProvider {
  readonly code = 'razorpay';
  readonly name = 'Razorpay';
  readonly supportedCountries = ['IN'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'card',
    'upi',
    'wallet',
    'net_banking',
  ];

  private keyId: string;
  private keySecret: string;
  private baseUrl = 'https://api.razorpay.com/v1';

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID ?? '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';

    if (!this.keyId || !this.keySecret) {
      throw new Error(
        'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required.',
      );
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.request('/payments/count');
    } catch {
      // TODO: Log warning
    }
  }

  // ─── Payment Processing ──────────────────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();

    try {
      const order = await this.request('/orders', 'POST', {
        amount: Math.round(request.amount * 100),
        currency: request.currency.toUpperCase(),
        receipt: request.bookingId ?? request.orderId ?? `txn_${Date.now()}`,
        notes: {
          afribook_customer: request.customer.email,
          afribook_country: request.countryCode,
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
          provider_transaction_id: order.id as string,
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
        transactionId: txRow?.id ?? (order.id as string),
        providerTransactionId: order.id as string,
        status: 'pending',
        requiresAction: true,
        clientSecret: order.id as string,
        metadata: {
          razorpayOrderId: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Razorpay payment failed';
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
      const refund = await this.request('/refunds', 'POST', {
        payment_id: providerTransactionId,
        amount: Math.round(amount * 100),
        notes: { reason },
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
          status: refund.status === 'processed' ? 'processed' : 'pending',
          metadata: { razorpay_refund_id: refund.id },
        });
      }

      return {
        success: refund.status === 'processed',
        refundId: refund.id as string,
        providerRefundId: refund.id as string,
        status: refund.status as string,
        amount,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Razorpay refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts (RazorpayX Fund Account) ────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const fundAccount = await this.request('/fund_accounts', 'POST', {
        contact_id: await this.getOrCreateContact(request.vendorId),
        account_type: 'bank_account',
        bank_account: {
          name: request.destination.accountName,
          ifsc: request.destination.routingNumber ?? '',
          account_number: request.destination.accountNumber,
        },
      });

      const payout = await this.request('/payouts', 'POST', {
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: fundAccount.id,
        amount: Math.round(request.amount * 100),
        currency: request.currency.toUpperCase(),
        mode: 'NEFT',
        purpose: 'payout',
        reference_id: request.vendorId,
        narration: 'AfriBook vendor payout',
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
          provider_payout_id: payout.id as string,
          metadata: { razorpay_payout_id: payout.id },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? (payout.id as string),
        providerPayoutId: payout.id as string,
        status: (payout.status as string) ?? 'processing',
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Razorpay payout failed';
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
      const payment = await this.request(
        `/payments/${providerTransactionId}`,
      );
      return this.mapRazorpayStatus(payment.status as string);
    } catch {
      return 'failed';
    }
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    try {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, _currency: string): FeeBreakdown {
    const processorFeePercent = 0.02;
    const processorFee = amount * processorFeePercent;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES['IN'] ?? 0.18);
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR['IN'] ?? 5;
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

  // ─── Contact Management ──────────────────────────────────────

  async createContact(
    vendorId: string,
    name: string,
    email: string,
    phone: string,
  ): Promise<RazorpayContact> {
    const contact = await this.request('/contacts', 'POST', {
      name,
      email,
      phone,
      type: 'vendor',
      reference_id: vendorId,
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
            razorpay_contact_id: contact.id,
          },
        })
        .eq('id', wallet.id);
    }

    return {
      id: contact.id as string,
      name: contact.name as string,
      email: contact.email as string,
      contact: contact.contact as string,
      type: contact.type as string,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async request(
    path: string,
    method: string = 'GET',
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`;
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Razorpay API error ${res.status}: ${JSON.stringify(err)}`,
      );
    }

    return res.json() as Promise<Record<string, unknown>>;
  }

  private async getOrCreateContact(vendorId: string): Promise<string> {
    const db = await createPaymentDb();
    const walletResult = await db
      .from('vendor_wallets')
      .select('metadata')
      .eq('vendor_id', vendorId)
      .single();
    const wallet = walletResult.data as { metadata: Record<string, unknown> } | null;

    const existingId = wallet?.metadata?.razorpay_contact_id as string | undefined;
    if (existingId) return existingId;

    throw new Error(
      'No Razorpay contact found. Call createContact first.',
    );
  }

  private mapRazorpayStatus(status: string): OrchestratorPaymentStatus {
    const map: Record<string, OrchestratorPaymentStatus> = {
      captured: 'succeeded',
      authorized: 'processing',
      created: 'pending',
      refunded: 'refunded',
      failed: 'failed',
    };
    return map[status] ?? 'pending';
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
