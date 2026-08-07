// ─── Enums & Constants ───────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'admin' | 'driver' | 'super_admin';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'card' | 'mobile_money' | 'bank_transfer' | 'cash' | 'wallet';
export type SavedPaymentType = 'card' | 'mobile_money' | 'bank';
export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'communications'
  | 'data_sharing'
  | 'payment_authorization'
  | 'hold_harmless_waiver'
  | 'host_agreement';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';
export type DriverStatus = 'offline' | 'available' | 'on_trip' | 'busy';
export type BusinessStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';
export type NotificationType = 'booking' | 'order' | 'payment' | 'promo' | 'system' | 'reminder' | 'invitations_sent';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DomainStatus = 'pending' | 'active' | 'failed';

// ─── Geo & Address ───────────────────────────────────────────

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  formatted: string;
  geoPoint?: GeoPoint;
}

// ─── Country ─────────────────────────────────────────────────

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: Currency;
  language: Language;
  timezone: string;
  phoneFormat: string;
  paymentMethods: PaymentMethod[];
  minimumFeeFloor: number;
  taxRate: number;
  legalTerms: string;
}

// ─── Currency ────────────────────────────────────────────────

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
}

// ─── Language ────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

// ─── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  countryCode: string;
  languageCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ─── Saved Payment Methods & Consents ────────────────────────

export interface UserPaymentMethod {
  id: string;
  userId: string;
  type: SavedPaymentType;
  provider?: string;
  label?: string;
  last4?: string;
  network?: string;
  accountName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  countryCode?: string;
  currency?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  providerToken?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  consentVersion?: string;
  context?: string;
  granted: boolean;
  grantedAt: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

// ─── Business ────────────────────────────────────────────────

export interface BusinessHours {
  day: Weekday;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface BusinessContact {
  phone: string;
  email: string;
  website?: string;
  socialLinks?: Record<string, string>;
}

export interface BusinessMedia {
  logoUrl?: string;
  coverUrl?: string;
  galleryUrls: string[];
}

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  countryCode: string;
  ownerId: string;
  address: Address;
  location: GeoPoint;
  contact: BusinessContact;
  media: BusinessMedia;
  hours: BusinessHours[];
  status: BusinessStatus;
  rating: number;
  reviewCount: number;
  qrBookingUrl: string;
  tags: string[];
  deliveryAvailable: boolean;
  deliveryRadiusKm: number;
  minimumOrder: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Business Domain ─────────────────────────────────────────

export interface BusinessDomain {
  id: string;
  businessId: string;
  subdomain: string;
  rootDomain: string;
  fullDomain: string;
  status: DomainStatus;
  dnsRecords: Record<string, unknown>;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Service ─────────────────────────────────────────────────
export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currencyCode: string;
  category: string;
  image?: string;
  available: boolean;
  maxCapacityPerSlot: number;
  paddingMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ─────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  stock: number;
  images: string[];
  variants: ProductVariant[];
  category: string;
  tags: string[];
  isAvailable: boolean;
  requiresShipping: boolean;
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Menu ────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  image?: string;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  available: boolean;
  preparationTime: number;
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  items: MenuItem[];
}

// ─── Booking ─────────────────────────────────────────────────

export interface BookingReminder {
  type: 'email' | 'sms' | 'push';
  sentAt: string;
  channel: string;
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  customerId: string;
  staffId?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  amount: number;
  currencyCode: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  reminders: BookingReminder[];
  cancellationReason?: string;
  rescheduledFrom?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Order ───────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
  notes?: string;
}

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  driverId?: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  currencyCode: string;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Staff ───────────────────────────────────────────────────

export interface StaffSchedule {
  day: Weekday;
  start: string;
  end?: string;
  close?: string;
  isAvailable: boolean;
}

export interface Staff {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  schedule: StaffSchedule[];
  serviceIds: string[];
  isActive: boolean;
  bio?: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Driver ──────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  type: 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van';
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  insuranceVerified: boolean;
}

export interface Trip {
  id: string;
  driverId: string;
  type: 'delivery' | 'pickup';
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: Address;
  dropoffAddress: Address;
  pickupTime?: string;
  dropoffTime?: string;
  distanceKm: number;
  durationMin: number;
  earnings: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: Trip['status'];
  pickupAddress: Address;
  dropoffAddress: Address;
  estimatedPickupAt?: string;
  estimatedDropoffAt?: string;
  actualPickupAt?: string;
  actualDropoffAt?: string;
  signature?: string;
  photoUrl?: string;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  vehicle: Vehicle;
  status: DriverStatus;
  location: GeoPoint;
  earnings: number;
  rating: number;
  totalTrips: number;
  isVerified: boolean;
  documentsVerified: boolean;
  currentTripId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ─────────────────────────────────────────────────

export interface Payment {
  id: string;
  amount: number;
  currencyCode: string;
  status: PaymentStatus;
  method: PaymentMethod;
  provider: string;
  transactionId?: string;
  metadata: Record<string, unknown>;
  escrowStatus?: EscrowStatus;
  fee: number;
  netAmount: number;
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  vendorId: string;
  amount: number;
  currencyCode: string;
  status: PayoutStatus;
  paymentMethod: PaymentMethod;
  periodStart: string;
  periodEnd: string;
  transactionId?: string;
  fee: number;
  netAmount: number;
  notes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  payoutId?: string;
  paymentId: string;
  type: 'booking' | 'order' | 'refund' | 'adjustment';
  grossAmount: number;
  commissionAmount: number;
  processingFee: number;
  netAmount: number;
  currencyCode: string;
  status: 'pending' | 'settled';
  settledAt?: string;
  createdAt: string;
}

export interface Escrow {
  id: string;
  paymentId: string;
  amount: number;
  currencyCode: string;
  status: EscrowStatus;
  releasedAt?: string;
  releaseCondition?: string;
  disputedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Review ──────────────────────────────────────────────────

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  targetType: 'business' | 'service' | 'product' | 'driver' | 'staff';
  targetId: string;
  rating: number;
  title?: string;
  body?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  replyFromVendor?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ─── Audit Log ───────────────────────────────────────────────

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  channel: string | null;
  read: boolean;
  sent_at: string | null;
  read_at: string | null;
}

// ─── Audit Log ───────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ─── Vendor ──────────────────────────────────────────────────

export interface VendorSettings {
  businessId: string;
  autoAcceptBookings: boolean;
  maxBookingsPerSlot: number;
  leadTimeHours: number;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  cancellationFeePercent: number;
  enableReminders: boolean;
  reminderTimingMin: number[];
  enableReviews: boolean;
  enableTips: boolean;
  taxId?: string;
  bankAccount?: BankAccount;
  paymentDelayDays: number;
}

export interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  countryCode: string;
  currencyCode: string;
}

export interface VendorPayout {
  id: string;
  vendorId: string;
  businessId: string;
  amount: number;
  currencyCode: string;
  status: PayoutStatus;
  period: { start: string; end: string };
  settlements: Settlement[];
  fee: number;
  netAmount: number;
  paidAt?: string;
}

// ─── Admin ───────────────────────────────────────────────────

export type AdminRole = 'support' | 'moderator' | 'finance' | 'admin' | 'super_admin';

export interface AdminAction {
  id: string;
  adminId: string;
  adminRole: AdminRole;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Refund, Dispute, Chargeback ─────────────────────────────

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currencyCode: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approvedBy?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  paymentId: string;
  raisedBy: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chargeback {
  id: string;
  paymentId: string;
  disputeId?: string;
  amount: number;
  currencyCode: string;
  reason: string;
  status: 'received' | 'under_review' | 'won' | 'lost' | 'accepted';
  responseDueBy?: string;
  evidenceSubmitted: boolean;
  fee: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── RideLy DB row types ─────────────────────────────────────

/** Coordinate pair stored in ride/delivery pickup/destination columns. */
export interface DbGeoLocation {
  lat: number;
  lng: number;
}

export interface RideRequestRow {
  id: string;
  rider_id: string;
  driver_id: string | null;
  ride_type: string;
  status: string;
  pickup_location: DbGeoLocation;
  pickup_address: string;
  destination_location: DbGeoLocation;
  destination_address: string;
  distance_km: number;
  estimated_duration_min: number;
  estimated_fare: number;
  surge_multiplier: number;
  payment_type: string;
  route_polyline: string | null;
  matched_at: string | null;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  cancellation_fee: number | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRequestRow {
  id: string;
  customer_id: string;
  driver_id: string | null;
  delivery_type: string;
  status: string;
  pickup_location: DbGeoLocation;
  pickup_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  destination_location: DbGeoLocation;
  destination_address: string;
  destination_contact_name: string;
  destination_contact_phone: string;
  package_description: string;
  package_weight: number | null;
  package_value: number | null;
  distance_km: number;
  estimated_duration_min: number;
  estimated_fare: number;
  surge_multiplier: number;
  payment_type: string;
  signature_required: boolean;
  matched_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  cancellation_fee: number | null;
  delivered_at: string | null;
  picked_up_at: string | null;
  signature: string | null;
  photo_url: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodOrderRow {
  id: string;
  order_id: string;
  restaurant_id: string;
  customer_id: string;
  driver_id: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  restaurant_location: GeoPoint;
  destination_location: GeoPoint;
  estimated_delivery_time: string | null;
  actual_delivery_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverLocationRow {
  id: string;
  driver_id: string;
  location: GeoPoint;
  heading: number;
  speed: number;
  accuracy: number | null;
  timestamp: string;
}

export interface DriverOfferRow {
  id: string;
  ride_id: string;
  driver_id: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface SurgeZoneRow {
  id: string;
  country_code: string;
  name: string;
  center: GeoPoint;
  radius_km: number;
  multiplier: number;
  demand: number;
  supply: number;
  ratio: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverOnlineSessionRow {
  id: string;
  driver_id: string;
  started_at: string;
  ended_at: string | null;
}

// ─── Events & Tickets row types (app-facing, snake_case) ─────

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  country_code: string | null;
  language_code: string | null;
  kyc_status: string | null;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  organizer_id: string;
  organizer_name: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  status: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  location: unknown;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_country: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  is_virtual: boolean;
  virtual_link: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  doors_open_at: string | null;
  cover_image_url: string | null;
  gallery_images: unknown;
  promo_video_url: string | null;
  flyer_url: string | null;
  ticket_type: string;
  total_capacity: number;
  tickets_sold: number;
  waitlist_enabled: boolean;
  currency_code: string;
  min_price: number | null;
  max_price: number | null;
  is_free: boolean;
  platform_fee_percent: number;
  platform_fee_fixed: number;
  tax_rate: number;
  requires_approval: boolean;
  show_guest_list: boolean;
  allow_refunds: boolean;
  refund_deadline_days: number;
  max_guests_per_registration: number;
  allow_guest_registration: boolean;
  max_guests_per_ticket: number;
  meta_title: string | null;
  meta_description: string | null;
  share_image_url: string | null;
  share_url: string | null;
  tags: unknown;
  enable_referrals: boolean;
  enable_waitlist: boolean;
  referral_code: string | null;
  view_count: number;
  share_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  event_ticket_types?: EventTicketTypeRow[] | null;
}

export interface EventTicketTypeRow {
  id: string;
  event_id: string;
  name: string;
  tier: string;
  type: string;
  description: string | null;
  price: number;
  original_price: number | null;
  currency_code: string;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  min_per_order: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  includes_guest_registration: boolean;
  max_guests_per_ticket: number;
  benefits: unknown;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TicketPurchaseRow {
  id: string;
  event_id: string;
  ticket_type_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  platform_fee: number;
  processing_fee: number;
  total: number;
  currency_code: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  order_status: string;
  ticket_code: string;
  qr_code_url: string;
  promo_code: string | null;
  referral_code: string | null;
  checked_in_at: string | null;
  check_in_status: string;
  transferred_to: string | null;
  cancelled_at: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  event_ticket_types?: { name?: string | null; tier?: string | null; price?: number | null } | null;
}

export interface EventGuestRow {
  id: string;
  event_id: string;
  ticket_purchase_id: string;
  registration_id: string | null;
  host_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  relationship: string;
  ticket_code: string;
  qr_code_url: string;
  check_in_status: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  photo_url: string | null;
  photo_page_url: string | null;
  dietary_restrictions: string | null;
  special_requirements: string | null;
  created_at: string;
}

export interface EventInvitationRow {
  id: string;
  event_id: string;
  inviter_id: string;
  inviter_name: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  platform: string;
  status: string;
  custom_message: string | null;
  referral_code: string | null;
  referral_discount: number;
  event_url: string | null;
  clicked_at: string | null;
  registered_at: string | null;
  created_at: string;
}

export interface EventShareRow {
  id: string;
  event_id: string;
  user_id: string;
  platform: string;
  share_url: string | null;
  clicked: boolean;
  created_at: string;
}

export interface EventPhotoRow {
  id: string;
  event_id: string;
  user_id: string | null;
  uploaded_by: string | null;
  image_url: string;
  url: string | null;
  caption: string | null;
  status: string;
  is_cover: boolean;
  like_count: number;
  created_at: string;
}

export interface PhotoShareRow {
  id: string;
  photo_id: string;
  shared_by: string;
  platform: string;
  created_at: string;
}

export interface EventReferralRow {
  id: string;
  event_id: string;
  referrer_id: string;
  referred_email: string | null;
  code: string;
  status: string;
  created_at: string;
}

export interface PromoCodeRow {
  id: string;
  event_id: string;
  organizer_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  used_count: number;
  min_order_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventIndividualTicketRow {
  id: string;
  event_id: string;
  ticket_purchase_id: string;
  registration_id: string | null;
  ticket_type_id: string;
  user_id: string;
  ticket_code: string;
  qr_code_url: string;
  status: string;
  created_at: string;
}

export interface NotificationLogRow {
  id: string;
  notification_id: string;
  channel: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EventTicketRow {
  id: string;
  event_id: string;
  ticket_purchase_id: string;
  registration_id: string | null;
  ticket_type_id: string;
  user_id: string;
  tier_id: string | null;
  ticket_code: string;
  qr_code_url: string;
  status: string;
  transferred_to: string | null;
  created_at: string;
}

// ─── Database row types (mirrors Supabase schema) ────────────

export interface Database {
  public: {
    Tables: {
      users: { Row: Omit<User, never>; Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<User, 'id'>>; Relationships: never[] };
      user_payment_methods: {
        Row: Omit<UserPaymentMethod, never>;
        Insert: Omit<UserPaymentMethod, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<UserPaymentMethod, 'id'>>;
        Relationships: never[];
      };
      user_consents: {
        Row: Omit<UserConsent, never>;
        Insert: Omit<UserConsent, 'id' | 'grantedAt' | 'revokedAt'>;
        Update: Partial<Omit<UserConsent, 'id'>>;
        Relationships: never[];
      };
      businesses: { Row: Omit<Business, never>; Insert: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Business, 'id'>>; Relationships: never[] };
      business_domains: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      services: { Row: Omit<Service, never>; Insert: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Service, 'id'>>; Relationships: never[] };
      products: { Row: Omit<Product, never>; Insert: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Product, 'id'>>; Relationships: never[] };
      bookings: { Row: Omit<Booking, never>; Insert: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Booking, 'id'>>; Relationships: never[] };
      orders: { Row: Omit<Order, never>; Insert: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Order, 'id'>>; Relationships: never[] };
      staff: { Row: Omit<Staff, never>; Insert: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Staff, 'id'>>; Relationships: never[] };
      drivers: { Row: Omit<Driver, never>; Insert: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Driver, 'id'>>; Relationships: never[] };
      payments: { Row: Omit<Payment, never>; Insert: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Payment, 'id'>>; Relationships: never[] };
      payouts: { Row: Omit<Payout, never>; Insert: Omit<Payout, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Payout, 'id'>>; Relationships: never[] };
      reviews: { Row: Omit<Review, never>; Insert: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Review, 'id'>>; Relationships: never[] };
      notifications: { Row: Omit<NotificationRow, never>; Insert: Partial<Omit<NotificationRow, 'id' | 'sent_at'>>; Update: Partial<Omit<NotificationRow, 'id'>>; Relationships: never[] };
      audit_logs: { Row: Omit<AuditLog, never>; Insert: Omit<AuditLog, 'id' | 'createdAt'>; Update: never; Relationships: never[] };
      disputes: { Row: Omit<Dispute, never>; Insert: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Dispute, 'id'>>; Relationships: never[] };
      ride_requests: {
        Row: Omit<RideRequestRow, never>;
        Insert: Omit<RideRequestRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RideRequestRow, 'id'>>;
        Relationships: never[];
      };
      delivery_requests: {
        Row: Omit<DeliveryRequestRow, never>;
        Insert: Omit<DeliveryRequestRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DeliveryRequestRow, 'id'>>;
        Relationships: never[];
      };
      food_orders: {
        Row: Omit<FoodOrderRow, never>;
        Insert: Omit<FoodOrderRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FoodOrderRow, 'id'>>;
        Relationships: never[];
      };
      driver_locations: {
        Row: Omit<DriverLocationRow, never>;
        Insert: Omit<DriverLocationRow, 'id'>;
        Update: Partial<Omit<DriverLocationRow, 'id'>>;
        Relationships: never[];
      };
      driver_offers: {
        Row: Omit<DriverOfferRow, never>;
        Insert: Omit<DriverOfferRow, 'id' | 'created_at'>;
        Update: Partial<Omit<DriverOfferRow, 'id'>>;
        Relationships: never[];
      };
      surge_zones: {
        Row: Omit<SurgeZoneRow, never>;
        Insert: Omit<SurgeZoneRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SurgeZoneRow, 'id'>>;
        Relationships: never[];
      };
      driver_online_sessions: {
        Row: Omit<DriverOnlineSessionRow, never>;
        Insert: Omit<DriverOnlineSessionRow, 'id'>;
        Update: Partial<Omit<DriverOnlineSessionRow, 'id'>>;
        Relationships: never[];
      };
      ticket_purchases: {
        Row: Omit<TicketPurchaseRow, never>;
        Insert: Partial<Omit<TicketPurchaseRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<TicketPurchaseRow, 'id'>>;
        Relationships: never[];
      };
      event_individual_tickets: {
        Row: Omit<EventIndividualTicketRow, never>;
        Insert: Partial<Omit<EventIndividualTicketRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventIndividualTicketRow, 'id'>>;
        Relationships: never[];
      };
      event_guests: {
        Row: Omit<EventGuestRow, never>;
        Insert: Partial<Omit<EventGuestRow, 'id'>>;
        Update: Partial<Omit<EventGuestRow, 'id'>>;
        Relationships: never[];
      };
      event_photos: {
        Row: Omit<EventPhotoRow, never>;
        Insert: Partial<Omit<EventPhotoRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventPhotoRow, 'id'>>;
        Relationships: never[];
      };
      event_shares: {
        Row: Omit<EventShareRow, never>;
        Insert: Partial<Omit<EventShareRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventShareRow, 'id'>>;
        Relationships: never[];
      };
      photo_shares: {
        Row: Omit<PhotoShareRow, never>;
        Insert: Partial<Omit<PhotoShareRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<PhotoShareRow, 'id'>>;
        Relationships: never[];
      };
      event_invitations: {
        Row: Omit<EventInvitationRow, never>;
        Insert: Partial<Omit<EventInvitationRow, 'id'>>;
        Update: Partial<Omit<EventInvitationRow, 'id'>>;
        Relationships: never[];
      };
      event_referrals: {
        Row: Omit<EventReferralRow, never>;
        Insert: Partial<Omit<EventReferralRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventReferralRow, 'id'>>;
        Relationships: never[];
      };
      notification_logs: {
        Row: Omit<NotificationLogRow, never>;
        Insert: Partial<Omit<NotificationLogRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<NotificationLogRow, 'id'>>;
        Relationships: never[];
      };
      promo_codes: {
        Row: Omit<PromoCodeRow, never>;
        Insert: Partial<Omit<PromoCodeRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<PromoCodeRow, 'id'>>;
        Relationships: never[];
      };
      event_ticket_types: {
        Row: Omit<EventTicketTypeRow, never>;
        Insert: Partial<Omit<EventTicketTypeRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<EventTicketTypeRow, 'id'>>;
        Relationships: never[];
      };
      event_tickets: {
        Row: Omit<EventTicketRow, never>;
        Insert: Partial<Omit<EventTicketRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventTicketRow, 'id'>>;
        Relationships: never[];
      };
      events: {
        Row: Omit<EventRow, never>;
        Insert: Partial<Omit<EventRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<EventRow, 'id'>>;
        Relationships: never[];
      };
      profiles: {
        Row: Omit<ProfileRow, never>;
        Insert: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ProfileRow, 'id'>>;
        Relationships: never[];
      };
      stay_hotels: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      stay_rooms: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      stay_room_availability: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      stay_bookings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      compliance_violations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      compliance_scorecards: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      delivery_compliance_tracker: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      theft_prevention_log: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_check_ins: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_emergency_contacts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_safety_training: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_safety_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_safety_zones: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      driver_safety_checklist: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      pickup_orders: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
      safety_ratings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
