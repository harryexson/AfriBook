// AfriBook Events & Ticket Management Types

// ─── Enums ────────────────────────────────────────────────────

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventCategory =
  | 'conference' | 'concert' | 'festival' | 'workshop' | 'seminar'
  | 'wedding' | 'birthday' | 'party' | 'corporate' | 'charity'
  | 'sports' | 'networking' | 'food_drink' | 'arts' | 'technology'
  | 'music' | 'fashion' | 'health' | 'education' | 'other';

export type TicketType = 'free' | 'paid' | 'donation';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'refunded' | 'transferred';
export type TicketTier = 'general' | 'vip' | 'early_bird' | 'group' | 'student' | 'custom';

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
export type CheckInMethod = 'qr_scan' | 'manual' | 'nfc';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export type SharePlatform = 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'email' | 'sms' | 'linkedin' | 'copy_link';

export type OrganizerPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export type PhotoUploadStatus = 'pending' | 'approved' | 'rejected';
export type GuestRelationship = 'friend' | 'family' | 'colleague' | 'partner' | 'other';

// ─── Event ────────────────────────────────────────────────────

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  status: EventStatus;

  // Location
  venue: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  location: { lat: number; lng: number };
  isVirtual: boolean;
  virtualLink?: string;

  // Timing
  startDate: string;
  endDate: string;
  timezone: string;
  doorsOpenAt?: string;

  // Media
  coverImageUrl: string;
  galleryImages: string[];
  promoVideoUrl?: string;
  flyerUrl?: string;

  // Tickets
  ticketType: TicketType;
  ticketTiers: TicketTierConfig[];
  totalCapacity: number;
  ticketsSold: number;
  waitlistEnabled: boolean;

  // Pricing
  currencyCode: string;
  platformFeePercent: number;   // default 5%
  platformFeeFixed: number;     // default 1
  taxRate: number;

  // Settings
  requiresApproval: boolean;
  showGuestList: boolean;
  allowRefunds: boolean;
  refundDeadlineDays: number;
  maxGuestsPerRegistration: number;

  // SEO & Sharing
  metaTitle?: string;
  metaDescription?: string;
  shareImageUrl?: string;

  // Stats
  viewCount: number;
  shareCount: number;
  favoriteCount: number;

  createdAt: string;
  updatedAt: string;
}

// ─── Ticket Tiers ─────────────────────────────────────────────

export interface TicketTierConfig {
  id: string;
  name: string;
  tier: TicketTier;
  price: number;
  originalPrice?: number;
  description: string;
  available: number;
  sold: number;
  maxPerOrder: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  includesPerks: string[];
  isActive: boolean;
}

// ─── Registration & Tickets ───────────────────────────────────

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: RegistrationStatus;
  ticketTierId: string;
  ticketTierName: string;
  quantity: number;
  guests: GuestRegistration[];

  // Pricing
  ticketPrice: number;
  subtotal: number;
  platformFee: number;
  processingFee: number;
  tax: number;
  total: number;
  currencyCode: string;
  promoCode?: string;
  discountAmount: number;

  // Payment
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  paymentMethod?: string;

  // Check-in
  checkedInAt?: string;
  checkInMethod?: CheckInMethod;

  // Metadata
  specialRequests?: string;
  referralCode?: string;

  createdAt: string;
  updatedAt: string;
}

export interface GuestRegistration {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  phone?: string;
  relationship: GuestRelationship;
  ticketCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface Ticket {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  ticketCode: string;       // unique QR code value
  tierName: string;
  attendeeName: string;
  attendeeEmail: string;
  status: TicketStatus;
  qrCodeUrl: string;
  barcodeData: string;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInMethod?: CheckInMethod;
  transferredTo?: string;
  transferredAt?: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

// ─── Photo Gallery ────────────────────────────────────────────

export interface EventPhoto {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  status: PhotoUploadStatus;
  isCover: boolean;
  uploadedBeforeEvent: boolean;
  downloadCount: number;
  shareCount: number;
  createdAt: string;
}

export interface PhotoShareLink {
  id: string;
  photoId: string;
  shareUrl: string;
  platform: SharePlatform;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
}

// ─── Invitations & Sharing ────────────────────────────────────

export interface EventInvitation {
  id: string;
  eventId: string;
  inviterId: string;
  inviterName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  platform: SharePlatform;
  status: 'sent' | 'delivered' | 'opened' | 'registered';
  customMessage?: string;
  referralCode: string;
  referralDiscount: number;
  clickedAt?: string;
  registeredAt?: string;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  eventId: string;
  platform: SharePlatform;
  url: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  eventId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

// ─── Check-in ─────────────────────────────────────────────────

export interface CheckInRecord {
  id: string;
  eventId: string;
  ticketId: string;
  ticketCode: string;
  attendeeName: string;
  attendeeEmail: string;
  checkedInBy: string;
  checkInMethod: CheckInMethod;
  checkedInAt: string;
  location?: { lat: number; lng: number };
  notes?: string;
}

export interface CheckInStats {
  eventId: string;
  totalTickets: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  peakCheckInTime: string;
  averageWaitTime: number;
}

// ─── Subscriptions (Business Model) ───────────────────────────

export interface OrganizerSubscription {
  id: string;
  userId: string;
  businessId?: string;
  plan: OrganizerPlan;
  status: SubscriptionStatus;

  // Limits
  maxEventsPerMonth: number;
  maxTicketsPerEvent: number;
  maxEventsActive: number;

  // Pricing
  monthlyPrice: number;
  annualPrice?: number;
  isAnnual: boolean;
  commissionRate: number;     // lower than pay-as-you-go

  // Stripe
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;

  // Features
  features: SubscriptionFeature[];

  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeature {
  name: string;
  included: boolean;
  limit?: number;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan: OrganizerPlan;
  monthlyPrice: number;
  annualPrice: number;
  commissionRate: number;     // per-ticket fee percentage
  platformFeeFixed: number;  // per-ticket fixed fee
  features: SubscriptionFeature[];
  maxEventsPerMonth: number;
  maxTicketsPerEvent: number;
  maxGuestsPerRegistration: number;
  isPopular: boolean;
  description: string;
}

// ─── Analytics ────────────────────────────────────────────────

export interface EventAnalytics {
  eventId: string;
  views: number;
  uniqueViews: number;
  ticketsSold: number;
  totalRevenue: number;
  platformFees: number;
  conversionRate: number;
  referralConversions: number;
  shareCount: number;
  favoriteCount: number;
  checkInRate: number;
  averageTicketPrice: number;
  topReferrers: { name: string; code: string; conversions: number }[];
  ticketSalesByDay: { date: string; count: number; revenue: number }[];
  registrationSource: Record<string, number>;
}

// ─── Disclaimers ──────────────────────────────────────────────

export const EVENT_DISCLAIMER = `AfriBook acts as a platform for event organizers and attendees. AfriBook is not responsible for any changes, cancellations, or modifications to events listed on our platform. Event organizers are solely responsible for the accuracy of their event information, the quality of their events, and compliance with all applicable laws and regulations. By registering for an event, you agree to the event organizer's terms and conditions. AfriBook does not guarantee refunds for event cancellations — refund policies are set by individual event organizers.`;

export const TICKET_DISCLAIMER = `Tickets are non-transferable unless explicitly allowed by the event organizer. By purchasing a ticket, you acknowledge that the event organizer may change event details including date, time, venue, and program. AfriBook facilitates payment processing but is not a party to the event contract between you and the organizer.`;
