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

export type CheckInStatus = 'not_checked_in' | 'checked_in' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type ShareChannel =
  | 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'email' | 'sms' | 'linkedin' | 'copy_link';

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
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueCountry?: string;
  venueLat?: number;
  venueLng?: number;
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
  ticketTypes?: EventCategory[];
  ticketTiers: TicketTierConfig[];
  totalCapacity: number;
  ticketsSold: number;
  waitlistEnabled: boolean;

  // Pricing
  currencyCode: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  platformFeePercent: number;   // default 5%
  platformFeeFixed: number;     // default 1
  taxRate: number;

  // Settings
  requiresApproval: boolean;
  showGuestList: boolean;
  allowRefunds: boolean;
  refundDeadlineDays: number;
  maxGuestsPerRegistration: number;
  allowGuestRegistration?: boolean;
  maxGuestsPerTicket?: number;

  // SEO & Sharing
  metaTitle?: string;
  metaDescription?: string;
  shareImageUrl?: string;
  shareUrl?: string;
  tags?: string[];
  referralCode?: string;
  referralDiscountPercent?: number;
  enableReferrals?: boolean;

  // Stats
  viewCount: number;
  shareCount: number;
  favoriteCount: number;
  publishedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Ticket Purchase (canonical) ──────────────────────────────

export interface TicketPurchase {
  id: string;
  eventId: string;
  ticketTypeId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  platformFee: number;
  processingFee: number;
  total: number;
  currencyCode: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentIntentId?: string;
  orderStatus: OrderStatus;
  ticketCode: string;
  qrCodeUrl: string;
  promoCode?: string;
  referralCode?: string;
  checkedInAt?: string;
  checkInStatus: CheckInStatus;
  transferredTo?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Event Guest (canonical) ──────────────────────────────────

export interface EventGuest {
  id: string;
  eventId: string;
  ticketPurchaseId: string;
  hostId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  ticketCode: string;
  qrCodeUrl: string;
  checkInStatus: CheckInStatus;
  checkedInAt?: string;
  checkedInBy?: string;
  photoUrl?: string;
  photoPageUrl?: string;
  dietaryRestrictions?: string;
  specialRequirements?: string;
  createdAt: string;
}

// ─── Ticket Tiers ─────────────────────────────────────────────

export interface TicketTierConfig {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  sold: number;
  minPerOrder: number;
  maxPerOrder: number;
  saleStartsAt: string;
  saleEndsAt: string;
  benefits: string[];
}

export interface EventTypeTicket {
  id: string;
  eventId: string;
  name: string;
  type: TicketTier;
  description: string;
  price: number;
  originalPrice?: number;
  currencyCode: string;
  quantityAvailable: number;
  quantitySold: number;
  maxPerOrder: number;
  minPerOrder: number;
  saleStartsAt: string;
  saleEndsAt: string;
  includesGuestRegistration: boolean;
  maxGuestsPerTicket: number;
  benefits: string[];
  isActive: boolean;
  sortOrder: number;
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
  uploadedBy: string;
  uploaderName: string;
  uploaderAvatar?: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  tags: string[];
  likes: number;
  isApproved: boolean;
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

// ─── Notifications (canonical) ────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationType =
  | 'registration_confirmation'
  | 'event_reminder_24h'
  | 'event_reminder_1h'
  | 'event_update'
  | 'refund_confirmation'
  | 'check_in_confirmation'
  | 'invitation_email'
  | 'invitation_sms'
  | 'host_notification';

export interface NotificationPayload {
  channel: NotificationChannel;
  type: NotificationType;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  metadata: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  eventId?: string;
  registrationId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  payload: NotificationPayload;
  createdAt: string;
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
  inviteeEmail?: string;
  inviteePhone?: string;
  channel?: ShareChannel;
  platform?: SharePlatform;
  status: 'sent' | 'delivered' | 'opened' | 'registered';
  customMessage?: string;
  personalMessage?: string;
  referralCode?: string;
  referralDiscount?: number;
  clickedAt?: string;
  registeredAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  acceptedAt?: string;
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

// ─── Subscription Plans Config ────────────────────────────────
// Re-exported from dedicated module for bundler compatibility
export type { SubscriptionPlanId, SubscriptionPlanConfig } from './subscription-plans';
export { SUBSCRIPTION_PLANS } from './subscription-plans';
