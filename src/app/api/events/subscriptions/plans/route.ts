import { NextRequest, NextResponse } from 'next/server';

const subscriptionPlans = [
  {
    id: 'plan_free',
    name: 'Free',
    plan: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'NGN',
    commissionRate: 5,
    platformFeeFixed: 1,
    maxEventsPerMonth: 3,
    maxTicketsPerEvent: 100,
    maxGuestsPerRegistration: 2,
    isPopular: false,
    description: 'Perfect for trying out AfriBook for your first events',
    features: [
      { name: 'Events per month', included: true, limit: 3, description: 'Create up to 3 events per month' },
      { name: 'Tickets per event', included: true, limit: 100, description: 'Sell up to 100 tickets per event' },
      { name: 'Guest registration', included: true, limit: 2, description: 'Up to 2 guests per ticket' },
      { name: 'Basic analytics', included: true, description: 'View basic event statistics' },
      { name: 'Photo gallery', included: true, description: 'Allow attendees to upload photos' },
      { name: 'Social sharing', included: true, description: 'Share events on social media' },
      { name: 'Promo codes', included: false, description: 'Create custom promo codes' },
      { name: 'Priority support', included: false, description: 'Get priority customer support' },
      { name: 'Custom branding', included: false, description: 'Add your own branding to events' },
      { name: 'API access', included: false, description: 'Access the AfriBook API' },
    ],
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    plan: 'starter',
    monthlyPrice: 5000,
    annualPrice: 50000,
    currency: 'NGN',
    commissionRate: 4,
    platformFeeFixed: 0.75,
    maxEventsPerMonth: 10,
    maxTicketsPerEvent: 500,
    maxGuestsPerRegistration: 5,
    isPopular: false,
    description: 'For growing organizers who host regular events',
    features: [
      { name: 'Events per month', included: true, limit: 10, description: 'Create up to 10 events per month' },
      { name: 'Tickets per event', included: true, limit: 500, description: 'Sell up to 500 tickets per event' },
      { name: 'Guest registration', included: true, limit: 5, description: 'Up to 5 guests per ticket' },
      { name: 'Advanced analytics', included: true, description: 'Detailed analytics and reports' },
      { name: 'Photo gallery', included: true, description: 'Allow attendees to upload photos' },
      { name: 'Social sharing', included: true, description: 'Share events on social media' },
      { name: 'Promo codes', included: true, description: 'Create custom promo codes' },
      { name: 'Email support', included: true, description: 'Email customer support' },
      { name: 'Custom branding', included: false, description: 'Add your own branding to events' },
      { name: 'API access', included: false, description: 'Access the AfriBook API' },
    ],
  },
  {
    id: 'plan_professional',
    name: 'Professional',
    plan: 'professional',
    monthlyPrice: 15000,
    annualPrice: 150000,
    currency: 'NGN',
    commissionRate: 3,
    platformFeeFixed: 0.5,
    maxEventsPerMonth: 50,
    maxTicketsPerEvent: 5000,
    maxGuestsPerRegistration: 10,
    isPopular: true,
    description: 'For professional event organizers and businesses',
    features: [
      { name: 'Events per month', included: true, limit: 50, description: 'Create up to 50 events per month' },
      { name: 'Tickets per event', included: true, limit: 5000, description: 'Sell up to 5,000 tickets per event' },
      { name: 'Guest registration', included: true, limit: 10, description: 'Up to 10 guests per ticket' },
      { name: 'Advanced analytics', included: true, description: 'Detailed analytics, exports, and reports' },
      { name: 'Photo gallery', included: true, description: 'Allow attendees to upload photos' },
      { name: 'Social sharing', included: true, description: 'Share events on social media' },
      { name: 'Unlimited promo codes', included: true, description: 'Create unlimited promo codes' },
      { name: 'Priority support', included: true, description: 'Priority customer support' },
      { name: 'Custom branding', included: true, description: 'Add your own branding to events' },
      { name: 'API access', included: false, description: 'Access the AfriBook API' },
    ],
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    plan: 'enterprise',
    monthlyPrice: 50000,
    annualPrice: 500000,
    currency: 'NGN',
    commissionRate: 2,
    platformFeeFixed: 0.25,
    maxEventsPerMonth: -1,
    maxTicketsPerEvent: -1,
    maxGuestsPerRegistration: 20,
    isPopular: false,
    description: 'For large organizations and event companies',
    features: [
      { name: 'Unlimited events', included: true, limit: -1, description: 'Create unlimited events' },
      { name: 'Unlimited tickets', included: true, limit: -1, description: 'Sell unlimited tickets per event' },
      { name: 'Guest registration', included: true, limit: 20, description: 'Up to 20 guests per ticket' },
      { name: 'Enterprise analytics', included: true, description: 'Full analytics suite with custom reports' },
      { name: 'Photo gallery', included: true, description: 'Allow attendees to upload photos' },
      { name: 'Social sharing', included: true, description: 'Share events on social media' },
      { name: 'Unlimited promo codes', included: true, description: 'Create unlimited promo codes' },
      { name: 'Dedicated support', included: true, description: 'Dedicated account manager' },
      { name: 'Custom branding', included: true, description: 'Full white-label branding options' },
      { name: 'API access', included: true, description: 'Full API access for integrations' },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get('plan');

    if (plan) {
      const found = subscriptionPlans.find((p) => p.plan === plan);
      if (!found) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: found,
      });
    }

    return NextResponse.json({
      success: true,
      data: subscriptionPlans,
      message: 'List of all available subscription plans',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
