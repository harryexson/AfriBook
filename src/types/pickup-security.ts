// ─── Pickup, Security & Compliance Types ──────────────────────
// Types for the pickup order system, driver safety, compliance
// scoring, theft prevention, and the African-context safety zones.
// ──────────────────────────────────────────────────────────────

import type { GeoLocation } from './ridely';

// ─── Pickup Orders ────────────────────────────────────────────

export type FulfillmentMethod = 'delivery' | 'pickup';

export type PickupStatus =
  | 'pending'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled';

export interface PickupOrder {
  id: string;
  orderId: string;
  businessId: string;
  customerId: string;
  status: PickupStatus;
  pickupLocation?: GeoLocation;
  pickupAddress?: string;
  pickupNotes?: string;
  pickupCode: string;
  pickupCodeGeneratedAt: string;
  estimatedReadyAt?: string;
  pickedUpAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  collectionPhotoUrl?: string;
  collectedBy?: string;
  collectedByName?: string;
  collectedByPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupOrderInsert {
  orderId: string;
  businessId: string;
  customerId: string;
  pickupLocation?: GeoLocation;
  pickupAddress?: string;
  pickupNotes?: string;
  estimatedReadyAt?: string;
}

// ─── Verification Codes ───────────────────────────────────────

export type VerificationPurpose =
  | 'pickup_handoff'
  | 'delivery_handoff'
  | 'driver_identity'
  | 'customer_identity';

export interface VerificationCode {
  id: string;
  referenceId: string;
  referenceType: string;
  purpose: VerificationPurpose;
  code: string;
  expiresAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedLocation?: GeoLocation;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Driver Safety ─────────────────────────────────────────────

export type SafetyEventType =
  | 'sos_triggered'
  | 'route_deviation'
  | 'prolonged_stop'
  | 'check_in_missed'
  | 'emergency_contacted'
  | 'panic_button'
  | 'accident_reported'
  | 'theft_reported'
  | 'harassment_reported'
  | 'night_ride_unsafe_zone';

export type CheckInType =
  | 'shift_start'
  | 'pre_delivery'
  | 'post_delivery'
  | 'scheduled_check'
  | 'geofence_entry'
  | 'geofence_exit'
  | 'shift_end';

export type SafetyTrainingLevel =
  | 'none'
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | 'certified';

export interface DriverSafetyEvent {
  id: string;
  driverId: string;
  eventType: SafetyEventType;
  eventLocation?: GeoLocation;
  eventAddress?: string;
  rideId?: string;
  deliveryId?: string;
  orderId?: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  emergencyContacted: boolean;
  emergencyService?: string;
  emergencyCaseRef?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DriverCheckIn {
  id: string;
  driverId: string;
  checkInType: CheckInType;
  location?: GeoLocation;
  locationAddress?: string;
  photoUrl?: string;
  status: 'completed' | 'missed' | 'late' | 'excused';
  scheduledAt?: string;
  checkedInAt: string;
  riskScore?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DriverSafetyTraining {
  id: string;
  driverId: string;
  trainingLevel: SafetyTrainingLevel;
  modulesCompleted: string[];
  certificationName?: string;
  certificationUrl?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  assessmentScore?: number;
  passed: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Compliance ────────────────────────────────────────────────

export type ComplianceViolationType =
  | 'late_delivery'
  | 'missing_item'
  | 'damaged_item'
  | 'wrong_item'
  | 'theft_suspected'
  | 'route_deviation'
  | 'no_show'
  | 'unprofessional_conduct'
  | 'safety_protocol_violation'
  | 'documentation_missing';

export type ScorecardStatus = 'active' | 'probation' | 'suspended' | 'excellent';

export interface ComplianceScorecard {
  id: string;
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  timelinessScore: number;
  accuracyScore: number;
  safetyScore: number;
  communicationScore: number;
  customerSatisfactionScore: number;
  violationCount: number;
  totalAssignments: number;
  completedAssignments: number;
  onTimeAssignments: number;
  status: ScorecardStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceViolation {
  id: string;
  subjectType: 'driver' | 'vendor' | 'business';
  subjectId: string;
  violationType: ComplianceViolationType;
  orderId?: string;
  deliveryId?: string;
  rideId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'appealed' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  appealReason?: string;
  appealOutcome?: string;
  scorePenalty: number;
  evidenceUrls: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Theft Prevention ──────────────────────────────────────────

export interface TheftPreventionLog {
  id: string;
  orderId: string;
  expectedItems: unknown[];
  actualItems?: unknown[];
  vendorConfirmed: boolean;
  vendorConfirmedAt?: string;
  vendorConfirmedBy?: string;
  driverConfirmed: boolean;
  driverConfirmedAt?: string;
  driverConfirmedBy?: string;
  customerConfirmed: boolean;
  customerConfirmedAt?: string;
  customerConfirmedBy?: string;
  hasDiscrepancy: boolean;
  discrepancyNotes?: string;
  vendorPackPhotoUrl?: string;
  driverPickupPhotoUrl?: string;
  customerDeliveryPhotoUrl?: string;
  status: 'pending' | 'verified' | 'discrepancy_found' | 'resolved' | 'escalated';
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Safety Zones (African Context) ────────────────────────────

export type SafetyZoneType = 'high_risk' | 'moderate_risk' | 'safe_zone' | 'curfew_zone' | 'restricted';

export interface DriverSafetyZone {
  id: string;
  countryCode: string;
  name: string;
  zoneType: SafetyZoneType;
  center: GeoLocation;
  radiusKm: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  restrictions?: Record<string, unknown>;
  curfewStart?: string;
  curfewEnd?: string;
  requiresEscort: boolean;
  requiresCheckIn: boolean;
  checkInIntervalMin: number;
  active: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Emergency Contacts ────────────────────────────────────────

export interface DriverEmergencyContact {
  id: string;
  driverId: string;
  name: string;
  relationship?: string;
  phone: string;
  isPrimary: boolean;
  notifyOnSos: boolean;
  createdAt: string;
}

// ─── Safety Ratings ────────────────────────────────────────────

export interface SafetyRating {
  id: string;
  ratedBy: string;
  ratedDriverId?: string;
  ratedCustomerId?: string;
  rideId?: string;
  deliveryId?: string;
  orderId?: string;
  safetyScore: number;
  drivingSafety?: number;
  respectfulBehavior?: number;
  communication?: number;
  comment?: string;
  driverFeltSafe?: boolean;
  customerFeltSafe?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Delivery Compliance Tracker ───────────────────────────────

export interface DeliveryComplianceTracker {
  id: string;
  orderId: string;
  deliveryId?: string;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  delayMinutes: number;
  delayReason?: string;
  delayWaived: boolean;
  itemsConfirmed: boolean;
  itemsDamaged: boolean;
  damageNotes?: string;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
  customerSignature?: string;
  routeLog: unknown[];
  complianceScore?: number;
  status: 'pending' | 'in_transit' | 'completed' | 'flagged' | 'investigating';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Driver Safety Checklist ────────────────────────────────────

export interface DriverSafetyChecklist {
  id: string;
  driverId: string;
  identityVerified: boolean;
  identityVerifiedAt?: string;
  backgroundCheck: boolean;
  backgroundCheckAt?: string;
  backgroundCheckRef?: string;
  vehicleInspected: boolean;
  vehicleInspectedAt?: string;
  hasReflectiveVest: boolean;
  hasFirstAidKit: boolean;
  hasFireExtinguisher: boolean;
  hasPhoneMount: boolean;
  hasPowerBank: boolean;
  hasHelmet: boolean;
  safetyTrainingCompleted: boolean;
  safetyTrainingCompletedAt?: string;
  defensiveDrivingCourse: boolean;
  emergencyProceduresAcknowledged: boolean;
  emergencyContactsAdded: boolean;
  sosFeatureTrained: boolean;
  localAreaKnowledgeConfirmed: boolean;
  highRiskAreasBriefed: boolean;
  nightDrivingPolicyAcknowledged: boolean;
  countryCode?: string;
  regulatoryLicenseVerified: boolean;
  regulatoryLicenseNumber?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Policy Documents (African Context) ────────────────────────

export interface SafetyPolicy {
  id: string;
  countryCode: string;
  title: string;
  content: string;
  category: 'driver_safety' | 'rider_safety' | 'vendor_safety' | 'night_riding' | 'emergency_procedures' | 'theft_prevention' | 'compliance';
  isRequired: boolean;
  acknowledgedBy?: string[];
  version: string;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Safety Policies by Country (African Context) ──────────────

export const AFRICAN_SAFETY_POLICIES: Record<string, SafetyPolicy[]> = {
  NG: [
    {
      id: 'ng-night-ride',
      countryCode: 'NG',
      title: 'Night Ride Safety Protocol (Nigeria)',
      content: 'Between 10PM and 5AM, extra verification is required. Drivers must share trip status with emergency contact. Avoid known high-risk areas. Share live location with dispatcher.',
      category: 'night_riding',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ng-theft-prevention',
      countryCode: 'NG',
      title: 'Theft Prevention & Chain of Custody',
      content: 'All deliveries require 3-way verification (vendor confirms pack, driver confirms pickup, customer confirms receipt). Photo evidence required at each stage for items valued above ₦10,000.',
      category: 'theft_prevention',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  KE: [
    {
      id: 'ke-safety',
      countryCode: 'KE',
      title: 'Driver Safety Guidelines (Kenya)',
      content: 'Matatu routes and CBD zones require extra caution during peak hours. Night deliveries outside Nairobi CBD require check-in every 15 minutes. Emergency contacts must be notified for any ride entering known hot spots.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  ZA: [
    {
      id: 'za-safety',
      countryCode: 'ZA',
      title: 'Load Shedding & Delivery Protocol (South Africa)',
      content: 'During load shedding hours, drivers must carry power banks for phone GPS. Delivery to high-risk townships requires buddy system. Cash payments discouraged during nighttime deliveries.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  GH: [
    {
      id: 'gh-safety',
      countryCode: 'GH',
      title: 'Driver Safety (Ghana)',
      content: 'Night deliveries limited to 9PM in Accra CBD, 8PM in other areas. Trotro stations and market areas require extra caution during peak trading hours. Emergency contacts must be verified before first delivery.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  TZ: [
    {
      id: 'tz-safety',
      countryCode: 'TZ',
      title: 'Driver Safety (Tanzania)',
      content: 'Zanzibar deliveries require special permits. Dar es Salaam CBD night operations restricted after 10PM. Rural deliveries require pre-approved route plan and scheduled check-ins.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  UG: [
    {
      id: 'ug-safety',
      countryCode: 'UG',
      title: 'Driver Safety (Uganda)',
      content: 'Boda boda riders must wear helmets and reflective vests at all times. Night operations in Kampala require buddy system after 9PM. Boda stage areas are designated safe zones for rest stops.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  MW: [
    {
      id: 'mw-safety',
      countryCode: 'MW',
      title: 'Driver Safety (Malawi)',
      content: 'Limited road lighting requires mandatory reflective gear after dusk. Emergency contacts must be verified. Rural route planning required for any delivery outside city limits.',
      category: 'driver_safety',
      isRequired: true,
      version: '1.0',
      effectiveFrom: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

export const DEFAULT_SAFETY_POLICIES: SafetyPolicy[] = [
  {
    id: 'default-driver-safety',
    countryCode: '**',
    title: 'General Driver Safety Policy',
    content: 'All drivers must complete safety training before active status. SOS button must be accessible at all times. Check-in required every 2 hours during active shifts. Emergency contacts must be registered.',
    category: 'driver_safety',
    isRequired: true,
    version: '1.0',
    effectiveFrom: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'default-theft-prevention',
    countryCode: '**',
    title: 'Theft Prevention Policy',
    content: 'Three-way verification chain for all deliveries. Photo evidence at pickup and dropoff. GPS breadcrumb trail for route verification. Discrepancy reporting within 1 hour of delivery.',
    category: 'theft_prevention',
    isRequired: true,
    version: '1.0',
    effectiveFrom: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'default-compliance',
    countryCode: '**',
    title: 'Delivery Compliance Standards',
    content: 'On-time delivery rate must be > 90%. Missing item rate must be < 1%. Customer satisfaction must be > 4.0/5.0. Violations result in score penalties. Scores below 70 trigger probation.',
    category: 'compliance',
    isRequired: true,
    version: '1.0',
    effectiveFrom: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];
