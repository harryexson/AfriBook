import { createHash } from 'crypto';
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

// ─── M-Pesa Provider (Kenya, Tanzania, Uganda) ───────────────
// Supports: KE, TZ, UG
// Methods: M-Pesa Express (STK Push), C2B, B2C for payouts
// Uses Safaricom Daraja API
// ──────────────────────────────────────────────────────────────

export class MpesaProvider implements PaymentProvider {
  readonly code = 'mpesa';
  readonly name = 'M-Pesa';
  readonly supportedCountries = ['KE', 'TZ', 'UG'];
  readonly supportedMethods: OrchestratorPaymentMethod[] = [
    'mpesa',
    'mobile_money',
  ];

  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private callbackUrl: string;
  private baseUrl: string;

  private static COUNTRY_CONFIG: Record<
    string,
    { baseUrl: string; shortcode: string; passkey: string }
  > = {
    KE: {
      baseUrl: 'https://sandbox.safaricom.co.ke',
      shortcode: process.env.MPESA_SHORTCODE_KE ?? '',
      passkey: process.env.MPESA_PASSKEY_KE ?? '',
    },
    TZ: {
      baseUrl: 'https://sandbox.daraja.mpesa.go.tz',
      shortcode: process.env.MPESA_SHORTCODE_TZ ?? '',
      passkey: process.env.MPESA_PASSKEY_TZ ?? '',
    },
    UG: {
      baseUrl: 'https://sandbox.daraja.mpesa.go.ug',
      shortcode: process.env.MPESA_SHORTCODE_UG ?? '',
      passkey: process.env.MPESA_PASSKEY_UG ?? '',
    },
  };

  constructor(countryCode: string = 'KE') {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY ?? '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? '';

    const config = MpesaProvider.COUNTRY_CONFIG[countryCode];
    if (!config) {
      throw new Error(`M-Pesa is not supported in ${countryCode}`);
    }

    this.baseUrl = config.baseUrl;
    this.shortcode = config.shortcode;
    this.passkey = config.passkey;
    this.callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`;

    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are required.',
      );
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.getAccessToken();
    } catch {
      // TODO: Log warning
    }
  }

  // ─── Payment Processing (STK Push) ───────────────────────────

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const db = await createPaymentDb();

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      if (!request.customer.phone) {
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          error: 'Phone number is required for M-Pesa payments.',
        };
      }

      const phone = this.formatPhoneNumber(request.customer.phone);

      const stkResponse = await fetch(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(request.amount),
            PartyA: phone,
            PartyB: this.shortcode,
            PhoneNumber: phone,
            CallBackURL: this.callbackUrl,
            AccountReference:
              request.bookingId ?? request.orderId ?? 'AFRIBOOK',
            TransactionDesc: request.description,
          }),
        },
      );

      const stkData = await stkResponse.json() as Record<string, unknown>;

      if (stkData.ResponseCode !== '0') {
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          error: (stkData.ResponseDescription as string) ?? 'STK Push failed',
        };
      }

      const checkoutRequestID = stkData.CheckoutRequestID as string;

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
          provider_transaction_id: checkoutRequestID,
          method: request.method,
          status: 'processing',
          fee_platform: fees.platformFee,
          fee_processor: fees.processorFee,
          fee_tax: fees.tax,
          net_amount: fees.netToVendor,
          metadata: {
            ...request.metadata,
            mpesa_receipt: stkData.MerchantRequestID,
            phone,
          },
        })
        .select('id')
        .single();

      const txRow = insertResult.data as { id: string } | null;

      return {
        success: false,
        transactionId: txRow?.id ?? checkoutRequestID,
        providerTransactionId: checkoutRequestID,
        status: 'processing',
        requiresAction: true,
        metadata: {
          checkoutRequestID,
          merchantRequestID: stkData.MerchantRequestID,
          message: 'Please check your phone for the M-Pesa prompt.',
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'M-Pesa payment failed';
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
      const db = await createPaymentDb();
      const txResult = await db
        .from('payment_transactions')
        .select('id, metadata')
        .eq('provider_transaction_id', providerTransactionId)
        .single();
      const tx = txResult.data as { id: string; metadata: Record<string, unknown> } | null;

      if (!tx) {
        throw new Error('Transaction not found');
      }

      const mpesaReceipt = tx.metadata?.mpesa_receipt as string;

      if (!mpesaReceipt) {
        throw new Error('M-Pesa receipt number not available for reversal');
      }

      // TODO: Implement B2C reversal via Safaricom API
      await db.from('refunds').insert({
        transaction_id: tx.id,
        amount,
        reason,
        status: 'pending',
        metadata: {
          mpesa_receipt: mpesaReceipt,
          requires_manual_processing: true,
        },
      });

      return {
        success: true,
        refundId: tx.id,
        status: 'pending',
        amount,
        error: 'M-Pesa refunds require manual processing by Safaricom.',
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'M-Pesa refund failed';
      return {
        success: false,
        refundId: '',
        status: 'failed',
        amount,
        error: message,
      };
    }
  }

  // ─── Payouts (B2C) ───────────────────────────────────────────

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    const db = await createPaymentDb();

    try {
      const accessToken = await this.getAccessToken();
      const phone = this.formatPhoneNumber(request.destination.accountNumber);

      const b2cResponse = await fetch(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            InitiatorName: process.env.MPESA_INITIATOR_NAME ?? 'afribook',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL ?? '',
            CommandID: 'BusinessPayment',
            Amount: Math.round(request.amount),
            PartyA: this.shortcode,
            PartyB: phone,
            Remarks: `AfriBook payout for ${request.vendorId}`,
            QueueTimeOutURL: `${this.callbackUrl}/timeout`,
            ResultURL: `${this.callbackUrl}/b2c-result`,
            Occasion: 'VendorPayout',
          }),
        },
      );

      const b2cData = await b2cResponse.json() as Record<string, unknown>;

      if (b2cData.ResponseCode !== '0') {
        return {
          success: false,
          payoutId: '',
          status: 'failed',
          error: (b2cData.ResponseDescription as string) ?? 'B2C payment failed',
        };
      }

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
          provider_payout_id: b2cData.ConversationID as string,
          metadata: {
            mpesa_conversation_id: b2cData.ConversationID,
            phone,
          },
        })
        .select('id')
        .single();

      const payoutRow = payoutResult.data as { id: string } | null;

      return {
        success: true,
        payoutId: payoutRow?.id ?? (b2cData.ConversationID as string),
        providerPayoutId: b2cData.ConversationID as string,
        status: 'processing',
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'M-Pesa payout failed';
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
    _providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus> {
    // M-Pesa status is checked asynchronously via callback
    return 'processing';
  }

  // ─── Webhook Verification ────────────────────────────────────

  verifyWebhook(payload: unknown, _signature: string): boolean {
    try {
      const data = payload as Record<string, unknown>;
      return !!(data.Body as Record<string, unknown>)?.stkCallback;
    } catch {
      return false;
    }
  }

  // ─── Fees ────────────────────────────────────────────────────

  calculateFees(amount: number, currency: string): FeeBreakdown {
    const countryCode = currency === 'KES' ? 'KE' : currency === 'TZS' ? 'TZ' : 'UG';
    const processorFeePercent = 0.01;
    const processorFee = amount * processorFeePercent;
    const platformFee = amount * PLATFORM_FEE_PERCENT;
    const tax = (platformFee + processorFee) * (COUNTRY_TAX_RATES[countryCode] ?? 0.16);
    const minimumFloor = COUNTRY_MINIMUM_FEE_FLOOR[countryCode] ?? 20;
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

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`,
    ).toString('base64');

    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    if (!res.ok) {
      throw new Error('Failed to get M-Pesa access token');
    }

    const data = (await res.json()) as Record<string, unknown>;
    return data.access_token as string;
  }

  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds())
    );
  }

  private generatePassword(timestamp: string): string {
    const str = `${this.shortcode}${this.passkey}${timestamp}`;
    return createHash('sha256').update(str).digest('hex');
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return digits;
    if (digits.startsWith('0')) return '254' + digits.slice(1);
    return digits;
  }
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}
