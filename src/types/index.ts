// ─── Enums & Constants ───────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'admin' | 'driver' | 'super_admin';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'card' | 'mobile_money' | 'bank_transfer' | 'cash' | 'wallet';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';
export type DriverStatus = 'offline' | 'available' | 'on_trip' | 'busy';
export type BusinessStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';
export type NotificationType = 'booking' | 'order' | 'payment' | 'promo' | 'system' | 'reminder';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

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
  end: string;
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

// ─── Database row types (mirrors Supabase schema) ────────────

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<User, 'id'>> };
      businesses: { Row: Business; Insert: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Business, 'id'>> };
      services: { Row: Service; Insert: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Service, 'id'>> };
      products: { Row: Product; Insert: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Product, 'id'>> };
      bookings: { Row: Booking; Insert: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Booking, 'id'>> };
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Order, 'id'>> };
      staff: { Row: Staff; Insert: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Staff, 'id'>> };
      drivers: { Row: Driver; Insert: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Driver, 'id'>> };
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Payment, 'id'>> };
      payouts: { Row: Payout; Insert: Omit<Payout, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Payout, 'id'>> };
      reviews: { Row: Review; Insert: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Review, 'id'>> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'createdAt'>; Update: Partial<Omit<Notification, 'id'>> };
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'createdAt'>; Update: never };
      disputes: { Row: Dispute; Insert: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>; Update: Partial<Omit<Dispute, 'id'>> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
