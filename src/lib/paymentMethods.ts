import type { UserPaymentMethod } from '@/types';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  mobile_money: 'Mobile Money',
  bank: 'Bank Account',
};

export const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  razorpay: 'Razorpay',
  airwallex: 'Airwallex',
  paychangu: 'PayChangu',
  pawapay: 'PawaPay',
  adyen: 'Adyen',
  dlocal: 'dLocal',
  mpesa: 'M-Pesa',
  bank: 'Bank Transfer',
};

/** Human-readable summary line for a saved payment method. */
export function paymentMethodLabel(method: UserPaymentMethod): string {
  if (method.label) return method.label;
  if (method.type === 'card') {
    const network = method.network ? `${method.network} ` : '';
    return `${network}${PAYMENT_METHOD_LABELS.card}${method.last4 ? ` ending ${method.last4}` : ''}`;
  }
  if (method.type === 'mobile_money') {
    return `${PROVIDER_LABELS[method.provider ?? ''] ?? 'Mobile Money'}${method.phoneNumber ? ` • ${method.phoneNumber}` : ''}`;
  }
  return `Bank${method.accountNumber ? ` • ${method.accountNumber}` : ''}`;
}

/** Short expiry or trailing identifier for list display. */
export function paymentMethodSubtitle(method: UserPaymentMethod): string | null {
  if (method.type === 'card' && method.expiryMonth && method.expiryYear) {
    return `${String(method.expiryMonth).padStart(2, '0')}/${String(method.expiryYear).slice(-2)}`;
  }
  if (method.type === 'bank' && method.accountName) return method.accountName;
  return null;
}