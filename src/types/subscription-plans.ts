export type SubscriptionPlanId = 'free' | 'starter' | 'professional' | 'enterprise';

export interface SubscriptionPlanConfig {
  name: string;
  feePercent: number;
  feeFixed: number;
  monthlyPrice: number;
  yearlyPrice: number;
  maxEvents: number;
  maxTicketsPerEvent: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  free: {
    name: 'Free',
    feePercent: 10,
    feeFixed: 1,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxEvents: 3,
    maxTicketsPerEvent: 100,
    features: [
      'Basic marketplace access',
      'Up to 3 events/month',
      'Up to 100 tickets per event',
      'Standard support',
      'Basic analytics',
    ],
  },
  starter: {
    name: 'Starter',
    feePercent: 7,
    feeFixed: 0.75,
    monthlyPrice: 29,
    yearlyPrice: 290,
    maxEvents: 10,
    maxTicketsPerEvent: 500,
    features: [
      'Unlimited bookings',
      'Priority listing',
      'Email support',
      'Basic analytics',
      'Food delivery access',
      'Up to 10 events/month',
      'Up to 500 tickets per event',
    ],
  },
  professional: {
    name: 'Professional',
    feePercent: 4,
    feeFixed: 0.5,
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxEvents: 50,
    maxTicketsPerEvent: 5000,
    features: [
      'Everything in Starter',
      'Featured listings',
      'Priority support',
      'Advanced analytics',
      'Group ordering',
      'Loyalty program access',
      'Custom branding',
      'Up to 50 events/month',
      'Up to 5,000 tickets per event',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    feePercent: 2,
    feeFixed: 0.25,
    monthlyPrice: 499,
    yearlyPrice: 4990,
    maxEvents: -1,
    maxTicketsPerEvent: -1,
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'API access',
      'White-label options',
      'Multi-location support',
      'Custom integrations',
      'SLA guarantee',
      'Unlimited events',
      'Unlimited tickets',
    ],
  },
};
