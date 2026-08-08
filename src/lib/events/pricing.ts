import type { SubscriptionPlanId } from '@/types/subscription-plans';
import { SUBSCRIPTION_PLANS } from '@/types/subscription-plans';
import { getCurrencyForCountry } from '../money';

// ─── Types ────────────────────────────────────────────────────

export interface PlatformFeeResult {
  amount: number;
  percent: number;
  fixedPerTicket: number;
  quantity: number;
}

export interface ProcessingFeeResult {
  amount: number;
  method: string;
  percent: number;
  fixed: number;
}

export interface TaxResult {
  amount: number;
  rate: number;
  countryCode: string;
}

export interface PricingBreakdown {
  subtotal: number;
  platformFee: PlatformFeeResult;
  processingFee: ProcessingFeeResult;
  tax: TaxResult;
  discount: number;
  total: number;
  currencyCode: string;
  perTicket: {
    price: number;
    platformFee: number;
    processingFee: number;
    tax: number;
    total: number;
  };
}

export interface SubscriptionPlanInfo {
  id: SubscriptionPlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxEvents: number;
  maxTicketsPerEvent: number;
  platformFeePercent: number;
  platformFeeFixed: number;
  features: string[];
}

// ─── Country Tax Rates ────────────────────────────────────────

const TAX_RATES: Record<string, number> = {
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
  SN: 0.18,
  CM: 0.1925,
  ET: 0.15,
  RW: 0.18,
  CI: 0.18,
  MA: 0.2,
  TN: 0.19,
  DZ: 0.19,
  AO: 0.14,
  MZ: 0.17,
  ZM: 0.16,
  ZW: 0.15,
  SS: 0.15,
  BF: 0.18,
  ML: 0.18,
  NE: 0.19,
  TD: 0.18,
  GN: 0.18,
  BI: 0.18,
  CD: 0.16,
  CG: 0.18,
  GA: 0.18,
  GQ: 0.15,
  ST: 0.16,
  CV: 0.15,
  GK: 0.15,
  SC: 0.15,
  MU: 0.15,
  MG: 0.2,
  KM: 0.1,
};

// ─── Processing Fee Rates ─────────────────────────────────────

const PROCESSING_FEES: Record<string, { percent: number; fixed: number }> = {
  card: { percent: 0.029, fixed: 0.3 },
  mobile_money: { percent: 0.015, fixed: 0 },
  bank_transfer: { percent: 0.005, fixed: 0 },
  mpesa: { percent: 0.015, fixed: 0 },
  paystack: { percent: 0.015, fixed: 0 },
  flutterwave: { percent: 0.015, fixed: 0 },
  razorpay: { percent: 0.02, fixed: 0 },
  wallet: { percent: 0.01, fixed: 0 },
  cash: { percent: 0, fixed: 0 },
};

// ─── Platform Fee Calculation ─────────────────────────────────

export function calculatePlatformFee(
  subtotal: number,
  quantity: number,
  organizerPlan: SubscriptionPlanId = 'free',
): PlatformFeeResult {
  const plan = SUBSCRIPTION_PLANS[organizerPlan];
  const percentFee = subtotal * (plan.feePercent / 100);
  const fixedFee = plan.feeFixed * quantity;

  return {
    amount: Math.round((percentFee + fixedFee) * 100) / 100,
    percent: plan.feePercent,
    fixedPerTicket: plan.feeFixed,
    quantity,
  };
}

// ─── Processing Fee Calculation ───────────────────────────────

export function calculateProcessingFee(
  amount: number,
  paymentMethod: string = 'card',
): ProcessingFeeResult {
  const config = PROCESSING_FEES[paymentMethod] ?? PROCESSING_FEES.card;
  const fee = amount * config.percent + config.fixed;

  return {
    amount: Math.round(fee * 100) / 100,
    method: paymentMethod,
    percent: config.percent,
    fixed: config.fixed,
  };
}

// ─── Tax Calculation ──────────────────────────────────────────

export function calculateTax(
  subtotal: number,
  countryCode: string,
): TaxResult {
  const rate = TAX_RATES[countryCode] ?? 0;
  const amount = Math.round(subtotal * rate * 100) / 100;

  return {
    amount,
    rate,
    countryCode,
  };
}

// ─── Full Pricing Breakdown ───────────────────────────────────

export interface PromoCodeDiscount {
  discountType: 'percent' | 'fixed';
  discountValue: number;
}

export function calculateTotalPricing(
  ticketPrice: number,
  quantity: number,
  organizerPlan: SubscriptionPlanId = 'free',
  countryCode: string = 'US',
  paymentMethod: string = 'card',
  promoCode?: PromoCodeDiscount,
): PricingBreakdown {
  const subtotal = ticketPrice * quantity;
  const platformFee = calculatePlatformFee(subtotal, quantity, organizerPlan);
  const processingFee = calculateProcessingFee(subtotal, paymentMethod);

  let discount = 0;
  if (promoCode) {
    if (promoCode.discountType === 'percent') {
      discount = Math.round(subtotal * (promoCode.discountValue / 100) * 100) / 100;
    } else {
      discount = Math.min(promoCode.discountValue, subtotal);
    }
  }

  const taxableAmount = subtotal - discount;
  const tax = calculateTax(taxableAmount, countryCode);

  const total = Math.round((taxableAmount + platformFee.amount + processingFee.amount + tax.amount) * 100) / 100;

  return {
    subtotal,
    platformFee,
    processingFee,
    tax,
    discount,
    total: Math.max(total, 0),
    currencyCode: getCurrencyForCountry(countryCode),
    perTicket: {
      price: ticketPrice,
      platformFee: Math.round((platformFee.amount / quantity) * 100) / 100,
      processingFee: Math.round((processingFee.amount / quantity) * 100) / 100,
      tax: Math.round((tax.amount / quantity) * 100) / 100,
      total: Math.round((total / quantity) * 100) / 100,
    },
  };
}

// ─── Free Event Pricing ───────────────────────────────────────

export function calculateFreeEventPricing(
  quantity: number,
  countryCode: string = 'US',
): PricingBreakdown {
  return {
    subtotal: 0,
    platformFee: { amount: 0, percent: 0, fixedPerTicket: 0, quantity },
    processingFee: { amount: 0, method: 'free', percent: 0, fixed: 0 },
    tax: { amount: 0, rate: 0, countryCode: '' },
    discount: 0,
    total: 0,
    currencyCode: getCurrencyForCountry(countryCode),
    perTicket: { price: 0, platformFee: 0, processingFee: 0, tax: 0, total: 0 },
  };
}

// ─── Subscription Plans ───────────────────────────────────────

export function getSubscriptionPlans(): SubscriptionPlanInfo[] {
  return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key as SubscriptionPlanId,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    maxEvents: plan.maxEvents,
    maxTicketsPerEvent: plan.maxTicketsPerEvent,
    platformFeePercent: plan.feePercent,
    platformFeeFixed: plan.feeFixed,
    features: plan.features,
  }));
}

// ─── Subscription Savings ─────────────────────────────────────

export interface SubscriptionSavings {
  plan: SubscriptionPlanId;
  monthlySubscriptionCost: number;
  feesOnFreePlan: number;
  feesOnPlan: number;
  netSavings: number;
  breakEvenPoint: number;
}

export function calculateSubscriptionSavings(
  plan: SubscriptionPlanId,
  ticketVolume: number,
  averageTicketPrice: number = 50,
): SubscriptionSavings {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const freeConfig = SUBSCRIPTION_PLANS.free;

  const feesOnFreePlan =
    ticketVolume * averageTicketPrice * (freeConfig.feePercent / 100) +
    freeConfig.feeFixed * ticketVolume;

  const feesOnPlan =
    ticketVolume * averageTicketPrice * (planConfig.feePercent / 100) +
    planConfig.feeFixed * ticketVolume;

  const monthlySubscriptionCost = planConfig.monthlyPrice;
  const netSavings = feesOnFreePlan - feesOnPlan - monthlySubscriptionCost;

  // Break-even: tickets where plan cost equals free plan fees
  const feeDiffPerTicket =
    averageTicketPrice * ((freeConfig.feePercent - planConfig.feePercent) / 100) +
    (freeConfig.feeFixed - planConfig.feeFixed);
  const breakEvenPoint =
    feeDiffPerTicket > 0
      ? Math.ceil(monthlySubscriptionCost / feeDiffPerTicket)
      : 0;

  return {
    plan,
    monthlySubscriptionCost,
    feesOnFreePlan: Math.round(feesOnFreePlan * 100) / 100,
    feesOnPlan: Math.round(feesOnPlan * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    breakEvenPoint,
  };
}

// ─── Validate Promo Code ──────────────────────────────────────

export function validatePromoCode(
  discountType: string,
  discountValue: number,
  subtotal: number,
): { valid: boolean; discount: number; error?: string } {
  if (discountType !== 'percent' && discountType !== 'fixed') {
    return { valid: false, discount: 0, error: 'Invalid discount type' };
  }

  if (discountValue <= 0) {
    return { valid: false, discount: 0, error: 'Discount value must be positive' };
  }

  if (discountType === 'percent' && discountValue > 100) {
    return { valid: false, discount: 0, error: 'Percentage cannot exceed 100%' };
  }

  const discount = discountType === 'percent'
    ? Math.round(subtotal * (discountValue / 100) * 100) / 100
    : Math.min(discountValue, subtotal);

  return { valid: true, discount };
}
