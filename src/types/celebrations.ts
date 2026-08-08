// AfriBook Celebrations & Event-Planner Types
//
// Hosted celebration pages (weddings, baby showers, bridal showers,
// birthdays, engagement parties, ...) with RSVP + menu selection, donations,
// SMS/email alerts, and custom domains. Planners bill either monthly
// (subscription) or per-event, always in their own currency.

import type { PaymentStatus } from './events';

// ─── Enums ────────────────────────────────────────────────────

export type CelebrationType =
  | 'wedding'
  | 'baby_shower'
  | 'bridal_shower'
  | 'birthday'
  | 'engagement'
  | 'housewarming'
  | 'other';

export type CelebrationBillingMode = 'subscription' | 'per_event';
export type CelebrationBillingStatus = 'unpaid' | 'paid' | 'waived';

export type CelebrationGuestStatus = 'invited' | 'confirmed' | 'declined' | 'attended';

export type DonationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type MenuItemCategory = 'starter' | 'main' | 'dessert' | 'drink' | 'snack' | 'other';

export type DomainVerificationStatus = 'none' | 'pending' | 'verified' | 'failed';

export type SmsDeliveryStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export type CelebrationSubscriptionStatus = 'active' | 'cancelled' | 'past_due';

// ─── Celebration Plan (capacity-tier catalog) ─────────────────

export interface CelebrationPlan {
  id: string;
  code: string;
  name: string;
  guestCapacity: number | null;   // null = unlimited
  priceMonthlyUsd: number;
  pricePerEventUsd: number;
  donationFeePercent: number;
  smsEnabled: boolean;
  customDomainEnabled: boolean;
  photoUploadEnabled: boolean;
  donationsEnabled: boolean;
  menuEnabled: boolean;
  guestListEnabled: boolean;
  maxRemindersPerEvent: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A plan localized to a planner's own currency (PPP-adjusted). */
export interface LocalizedCelebrationPlan {
  id: string;
  code: string;
  name: string;
  guestCapacity: number | null;
  priceMonthly: number;       // in local currency
  pricePerEvent: number;      // in local currency
  currencyCode: string;
  donationFeePercent: number;
  smsEnabled: boolean;
  customDomainEnabled: boolean;
  photoUploadEnabled: boolean;
  donationsEnabled: boolean;
  menuEnabled: boolean;
  guestListEnabled: boolean;
  maxRemindersPerEvent: number;
  isActive: boolean;
}

// ─── Celebration Subscription (planner billing) ───────────────

export interface CelebrationSubscription {
  id: string;
  userId: string;
  planCode: string;
  billingMode: CelebrationBillingMode;
  status: CelebrationSubscriptionStatus;
  currencyCode: string;
  priceMonthlyLocal: number;
  pricePerEventLocal: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Celebration (event row + celebration fields) ─────────────

export interface Celebration {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  category: string;

  celebrationType?: CelebrationType;
  celebrantAName?: string;
  celebrantBName?: string;
  dressCode?: string;
  hashtag?: string;

  startDate: string;
  endDate: string;
  timezone: string;
  rsvpDeadline?: string;
  menuDeadline?: string;

  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueCountry?: string;
  isVirtual: boolean;

  coverImageUrl?: string;
  galleryImages: string[];
  shareUrl: string;
  currencyCode: string;

  allowMenuChoice: boolean;
  allowDonations: boolean;
  donationGoal: number;
  donationFeePercent: number;
  customDomain?: string;
  customDomainStatus: DomainVerificationStatus;

  billingMode: CelebrationBillingMode;
  billingStatus: CelebrationBillingStatus;
  perEventFee: number;
  billingPaymentIntentId?: string;
  billingPaidAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Celebration Guest (event_guests + RSVP columns) ──────────

export interface CelebrationGuest {
  id: string;
  eventId: string;
  name: string;         // guest_name
  email?: string;       // guest_email
  phone?: string;       // guest_phone
  relationship?: string;
  rsvpStatus: CelebrationGuestStatus;
  rsvpResponseDate?: string;
  rsvpToken?: string;
  attendingCount: number;
  dietaryNotes?: string;
  notes?: string;
  ticketCode: string;
  createdAt: string;
}

// ─── Menu ──────────────────────────────────────────────────────

export interface CelebrationMenuItem {
  id: string;
  eventId: string;
  name: string;
  category: MenuItemCategory;
  description: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isKosher: boolean;
  allergens: string[];
  price?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CelebrationGuestChoice {
  id: string;
  guestId: string;
  menuItemId: string;
  quantity: number;
  notes?: string;
  createdAt: string;
}

// ─── Donations ─────────────────────────────────────────────────

export interface CelebrationDonation {
  id: string;
  eventId: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  currencyCode: string;
  feePercent: number;
  platformFee: number;
  netAmount: number;
  message?: string;
  isAnonymous: boolean;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CelebrationDonationTotals {
  totalAmount: number;
  donorCount: number;
}

// ─── SMS Logs ──────────────────────────────────────────────────

export interface SmsLog {
  id: string;
  eventId?: string;
  recipientName?: string;
  recipientPhone: string;
  templateKey?: string;
  body?: string;
  status: SmsDeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
}

// ─── Payments ──────────────────────────────────────────────────

export interface CelebrationPaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currencyCode: string;
  platformFee: number;
  netAmount: number;
}

// Re-export shared payment status for webhook consumers.
export type { PaymentStatus };
