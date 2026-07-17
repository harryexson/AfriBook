// ─── Events & Ticketing Service Types ─────────────────────────
// Re-exports canonical types from @/types/events and adds
// service-specific parameter/result types used across the module.
// ───────────────────────────────────────────────────────────────

export * from '@/types/events';
import type {
  EventCategory,
  EventTypeTicket,
  EventGuest,
  EventStatus,
} from '@/types/events';

// ─── Event Management ─────────────────────────────────────────

export interface CreateEventParams {
  organizerId: string;
  title: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  timezone: string;
  isVirtual: boolean;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueCountry?: string;
  venueLat?: number;
  venueLng?: number;
  virtualLink?: string;
  ticketTypes: Omit<EventTypeTicket, 'id' | 'eventId' | 'quantitySold'>[];
  totalCapacity: number;
  isFree: boolean;
  tags: string[];
  enableReferrals: boolean;
  referralDiscountPercent: number;
  allowGuestRegistration: boolean;
  maxGuestsPerTicket: number;
  currencyCode: string;
}

// ─── Ticket Purchase ──────────────────────────────────────────

export interface PurchaseTicketParams {
  eventId: string;
  ticketTypeId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  quantity: number;
  guests?: Omit<
    EventGuest,
    | 'id'
    | 'eventId'
    | 'ticketPurchaseId'
    | 'hostId'
    | 'ticketCode'
    | 'qrCodeUrl'
    | 'checkInStatus'
    | 'createdAt'
  >[];
  promoCode?: string;
  paymentMethod?: string;
}

// ─── Filtering & Search ───────────────────────────────────────

export interface EventFilters {
  category?: EventCategory;
  city?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  isFree?: boolean;
  search?: string;
  status?: EventStatus;
}

// ─── Analytics ────────────────────────────────────────────────

export interface EventAnalytics {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendees: number;
  averageAttendanceRate: number;
  topEvents: { id: string; title: string; ticketsSold: number; revenue: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  ticketTypeBreakdown: { type: string; sold: number; revenue: number }[];
  sharingStats: { channel: string; shares: number; conversions: number }[];
}

// ─── Fee Calculation ──────────────────────────────────────────

export interface FeeBreakdown {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  total: number;
  currencyCode: string;
}

// ─── QR Code ──────────────────────────────────────────────────

export interface QRCodePayload {
  type: 'ticket';
  ticketCode: string;
  eventId: string;
  buyerId: string;
  guestId?: string;
}

// ─── Check-in ─────────────────────────────────────────────────

export interface CheckInResult {
  success: boolean;
  ticketCode: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType: string;
  checkedInAt: string;
  isGuest: boolean;
  error?: string;
}

export interface CheckInStats {
  totalExpected: number;
  totalCheckedIn: number;
  noShows: number;
  checkInRate: number;
  timeline: { hour: string; count: number }[];
}

// ─── Photo Gallery ────────────────────────────────────────────

export interface PhotoUploadResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface PhotoPageResult {
  id: string;
  shareUrl: string;
  title: string;
  coverPhoto: string;
  photoCount: number;
}
