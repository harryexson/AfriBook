// ─── Extended Payment Types ──────────────────────────────────
// These extend the base types from @/types with orchestrator-specific types.
// The DB schema uses payment_status = 'succeeded' while the app-level
// PaymentStatus type uses 'completed'. The orchestrator maps between them.

import { getCurrencyForCountry as getCountryCurrency } from '../money';

export type OrchestratorPaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed';

export type OrchestratorPaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'mobile_money'
  | 'wallet'
  | 'upi'
  | 'ach'
  | 'sepa'
  | 'interac'
  | 'cash'
  | 'mpesa'
  | 'airtel_money'
  | 'mtn_mobile_money'
  | 'orange_money'
  | 'fawry'
  | 'paypal'
  | 'ussd'
  | 'net_banking'
  | 'konbini';

export type WebhookEvent =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payout.completed'
  | 'payout.failed'
  | 'escrow.released'
  | 'dispute.opened';

// ─── Request / Result Types ──────────────────────────────────

export interface PaymentRequest {
  amount: number;
  currency: string;
  countryCode: string;
  method: OrchestratorPaymentMethod;
  metadata: Record<string, unknown>;
  customer: { email: string; name: string; phone?: string };
  description: string;
  bookingId?: string;
  orderId?: string;
  rideId?: string;
  deliveryId?: string;
  vendorId?: string;
  businessId?: string;
  idempotencyKey?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  providerTransactionId?: string;
  status: OrchestratorPaymentStatus;
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  requiresAction?: boolean;
  actionUrl?: string;
  clientSecret?: string;
}

export interface PayoutRequest {
  amount: number;
  currency: string;
  vendorId: string;
  businessId: string;
  destination: BankAccount;
  metadata?: Record<string, unknown>;
  transactionIds?: string[];
}

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  providerPayoutId?: string;
  status: string;
  estimatedArrival?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  providerRefundId?: string;
  status: string;
  amount: number;
  error?: string;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  sortCode?: string;
  branchCode?: string;
}

export interface FeeBreakdown {
  platformFee: number;
  processorFee: number;
  tax: number;
  total: number;
  netToVendor: number;
  minimumFeeFloor: number;
}

// ─── Provider Interface ──────────────────────────────────────

export interface PaymentProvider {
  readonly code: string;
  readonly name: string;
  readonly supportedCountries: string[];
  readonly supportedMethods: OrchestratorPaymentMethod[];

  initialize(): Promise<void>;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  processRefund(
    providerTransactionId: string,
    amount: number,
    reason: string,
  ): Promise<RefundResult>;
  processPayout(request: PayoutRequest): Promise<PayoutResult>;
  getTransactionStatus(
    providerTransactionId: string,
  ): Promise<OrchestratorPaymentStatus>;
  verifyWebhook(payload: unknown, signature: string): boolean;
  calculateFees(amount: number, currency: string): FeeBreakdown;
  holdEscrow?(
    providerTransactionId: string,
    amount: number,
  ): Promise<boolean>;
  releaseEscrow?(providerTransactionId: string): Promise<boolean>;
}

// ─── Country → Provider Mapping ──────────────────────────────

export interface CountryPaymentConfig {
  countryCode: string;
  providerCode: string;
  methods: OrchestratorPaymentMethod[];
  currency: string;
  minimumFeeFloor: number;
  taxRate: number;
}

// ─── DB Row Types (mirror Supabase schema) ───────────────────
// These are inline because the Database type in @/types may not
// include all payment tables yet. They match the SQL migration.

export interface PaymentTransactionRow {
  id: string;
  booking_id: string | null;
  order_id: string | null;
  ride_id: string | null;
  amount: number;
  currency: string;
  provider_code: string | null;
  provider_transaction_id: string | null;
  method: string | null;
  status: string;
  escrow_status: string | null;
  fee_platform: number;
  fee_processor: number;
  fee_tax: number;
  net_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type PaymentTransactionInsert = Omit<
  PaymentTransactionRow,
  'id' | 'created_at' | 'updated_at'
>;

export interface PayoutRow {
  id: string;
  vendor_id: string;
  business_id: string | null;
  amount: number;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  transaction_ids: string[];
  provider_payout_id: string | null;
  fee_platform: number;
  fee_processor: number;
  net_amount: number;
  bank_account: Record<string, unknown>;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type PayoutInsert = Omit<PayoutRow, 'id' | 'created_at'>;

export interface EscrowHoldRow {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  release_at: string | null;
  released_at: string | null;
  dispute_id: string | null;
  created_at: string;
}

export type EscrowHoldInsert = Omit<EscrowHoldRow, 'id' | 'created_at'>;

export interface RefundRow {
  id: string;
  transaction_id: string;
  amount: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  processed_at: string | null;
  metadata: Record<string, unknown>;
}

export type RefundInsert = Omit<RefundRow, 'id'>;

// ─── Onboarding Types ────────────────────────────────────────

export interface StripeAccountLink {
  url: string;
  expiresAt: string;
}

export interface StripeAccountStatus {
  accountId: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
}

export interface RazorpayContact {
  id: string;
  name: string;
  email: string;
  contact: string;
  type: string;
}

export interface PaystackRecipient {
  id: number;
  name: string;
  account_number: string;
  bank_code: string;
  type: string;
}

// ─── Helpers ─────────────────────────────────────────────────

export const COUNTRY_PROVIDER_MAP: Record<string, string[]> = {
  // ── North America & Europe ──────────────────────────────────
  US: ['stripe', 'airwallex', 'adyen'],
  CA: ['stripe', 'airwallex', 'adyen'],
  GB: ['stripe', 'airwallex', 'adyen'],
  FR: ['stripe', 'airwallex', 'adyen'],
  DE: ['stripe', 'airwallex', 'adyen'],
  ES: ['stripe', 'airwallex', 'adyen'],
  IT: ['stripe', 'airwallex', 'adyen'],
  NL: ['stripe', 'airwallex', 'adyen'],
  PT: ['stripe', 'airwallex', 'adyen'],
  IE: ['stripe', 'airwallex', 'adyen'],
  SE: ['stripe', 'airwallex', 'adyen'],
  CH: ['stripe', 'airwallex', 'adyen'],
  AE: ['stripe', 'airwallex', 'adyen'],
  SA: ['airwallex', 'stripe', 'adyen'],
  // ── Asia Pacific ─────────────────────────────────────────────
  IN: ['razorpay', 'airwallex', 'stripe'],
  SG: ['airwallex', 'stripe', 'adyen'],
  HK: ['airwallex', 'stripe', 'adyen'],
  AU: ['airwallex', 'stripe', 'adyen'],
  JP: ['airwallex', 'stripe', 'adyen'],
  CN: ['airwallex', 'adyen'],
  MY: ['airwallex', 'stripe', 'adyen'],
  ID: ['airwallex', 'stripe', 'adyen'],
  PH: ['airwallex', 'stripe', 'adyen'],
  TH: ['airwallex', 'stripe', 'adyen'],
  VN: ['airwallex', 'stripe', 'adyen'],
  KR: ['airwallex', 'stripe', 'adyen'],
  // ── Latin America (dLocal / Adyen) ──────────────────────────
  BR: ['dlocal', 'adyen', 'airwallex'],
  MX: ['dlocal', 'adyen', 'airwallex'],
  AR: ['dlocal', 'adyen', 'airwallex'],
  CL: ['dlocal', 'adyen'],
  CO: ['dlocal', 'adyen'],
  PE: ['dlocal', 'adyen'],
  UY: ['dlocal', 'adyen'],
  // ── Africa ───────────────────────────────────────────────────
  NG: ['paystack', 'flutterwave', 'pawapay'],
  GH: ['paystack', 'flutterwave', 'pawapay'],
  KE: ['mpesa', 'pawapay', 'airwallex'],
  TZ: ['mpesa', 'pawapay'],
  UG: ['mpesa', 'pawapay'],
  MW: ['paychangu', 'pawapay'],
  ZA: ['flutterwave', 'airwallex', 'pawapay'],
  EG: ['paychangu', 'airwallex', 'pawapay'],
  RW: ['pawapay', 'airwallex'],
  ZM: ['pawapay', 'airwallex'],
  SN: ['pawapay', 'airwallex'],
  CI: ['pawapay', 'airwallex'],
  CM: ['pawapay', 'airwallex'],
};

// Global fallback used for any country not explicitly mapped above.
// Ensures customers can ALWAYS pay (and vendors can ALWAYS be paid)
// no matter which country/region they select.
export const GLOBAL_FALLBACK_PROVIDERS: string[] = [
  'airwallex',
  'stripe',
  'adyen',
];

export function getProvidersForCountry(countryCode: string): string[] {
  return COUNTRY_PROVIDER_MAP[countryCode] ?? GLOBAL_FALLBACK_PROVIDERS;
}

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR',
  SG: 'SGD',
  HK: 'HKD',
  AU: 'AUD',
  JP: 'JPY',
  CN: 'CNY',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
  KR: 'KRW',
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  TZ: 'TZS',
  UG: 'UGX',
  MW: 'MWK',
  ZA: 'ZAR',
  EG: 'EGP',
  RW: 'RWF',
  ZM: 'ZMW',
  SN: 'XOF',
  CI: 'XOF',
  CM: 'XAF',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  UY: 'UYU',
};

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] ?? getCountryCurrency(countryCode);
}

export const COUNTRY_METHODS_MAP: Record<
  string,
  OrchestratorPaymentMethod[]
> = {
  US: ['card', 'bank_transfer'],
  CA: ['card', 'interac'],
  GB: ['card', 'bank_transfer'],
  FR: ['card', 'sepa'],
  DE: ['card', 'sepa'],
  ES: ['card', 'sepa'],
  IT: ['card', 'sepa'],
  NL: ['card', 'sepa'],
  PT: ['card', 'sepa'],
  IE: ['card', 'sepa'],
  AE: ['card'],
  SA: ['card', 'wallet'],
  IN: ['card', 'upi', 'wallet', 'net_banking'],
  SG: ['card', 'wallet', 'bank_transfer'],
  HK: ['card', 'wallet'],
  AU: ['card', 'bank_transfer'],
  JP: ['card', 'konbini'],
  CN: ['card', 'wallet'],
  MY: ['card', 'bank_transfer', 'wallet'],
  ID: ['card', 'wallet', 'bank_transfer'],
  PH: ['card', 'wallet', 'bank_transfer'],
  TH: ['card', 'wallet', 'bank_transfer'],
  VN: ['card', 'wallet', 'bank_transfer'],
  KR: ['card', 'wallet'],
  NG: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
  GH: ['card', 'bank_transfer', 'mobile_money'],
  KE: ['mpesa', 'card'],
  TZ: ['mpesa'],
  UG: ['mpesa', 'airtel_money'],
  MW: ['mobile_money', 'airtel_money', 'mtn_mobile_money', 'bank_transfer', 'card'],
  ZA: ['card', 'bank_transfer'],
  EG: ['card', 'fawry', 'wallet'],
  RW: ['mobile_money'],
  ZM: ['mobile_money'],
  SN: ['mobile_money', 'card'],
  CI: ['mobile_money', 'card'],
  CM: ['mobile_money', 'card'],
  BR: ['card', 'bank_transfer', 'cash'],
  MX: ['card', 'bank_transfer', 'cash'],
  AR: ['card', 'bank_transfer', 'cash'],
  CL: ['card', 'bank_transfer', 'cash'],
  CO: ['card', 'bank_transfer', 'cash'],
  PE: ['card', 'bank_transfer', 'cash'],
  UY: ['card', 'bank_transfer'],
};

// Default methods when a country is not explicitly mapped.
export const GLOBAL_FALLBACK_METHODS: OrchestratorPaymentMethod[] = [
  'card',
  'bank_transfer',
  'wallet',
];

export function getMethodsForCountry(countryCode: string): OrchestratorPaymentMethod[] {
  return COUNTRY_METHODS_MAP[countryCode] ?? GLOBAL_FALLBACK_METHODS;
}

export const COUNTRY_MINIMUM_FEE_FLOOR: Record<string, number> = {
  US: 0.5,
  CA: 0.5,
  GB: 0.3,
  FR: 0.5,
  DE: 0.5,
  AE: 1,
  IN: 5,
  NG: 100,
  GH: 5,
  KE: 20,
  TZ: 500,
  UG: 500,
  MW: 200,
  ZA: 5,
  EG: 5,
};

export const COUNTRY_TAX_RATES: Record<string, number> = {
  US: 0.08,
  CA: 0.13,
  GB: 0.2,
  FR: 0.2,
  DE: 0.19,
  AE: 0.05,
  IN: 0.18,
  NG: 0.075,
  GH: 0.15,
  KE: 0.16,
  TZ: 0.18,
  UG: 0.18,
  MW: 0.165,
  ZA: 0.15,
  EG: 0.14,
};

export const PLATFORM_FEE_PERCENT = 0.05;
