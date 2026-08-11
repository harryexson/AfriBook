// ─── RideLy Types ────────────────────────────────────────────────────────────
// Uber-style ride-hailing and delivery system for the AfriBook marketplace.
// Covers ride requests, deliveries, food delivery (RetroBuddy integration),
// driver dispatch, surge pricing, real-time events, and route data.
// ──────────────────────────────────────────────────────────────────────────────

import type { GeoPoint, Vehicle } from "@/types";
// Re-export DB row types so consumers can import from either location
export type { RideRequestRow, DeliveryRequestRow } from "@/types";

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Vehicle class requested by the rider. */
export type RideType =
  "economy" | "comfort" | "premium" | "xl" | "motorcycle" | "bicycle";

/** Full lifecycle status of a ride request. */
export type RideStatus =
  | "requesting"
  | "searching"
  | "matched"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Category of delivery request. */
export type DeliveryType =
  "package" | "food" | "grocery" | "pharmacy" | "document";

/** Full lifecycle status of a delivery request. */
export type DeliveryStatus =
  | "requesting"
  | "searching"
  | "matched"
  | "accepted"
  | "en_route_to_pickup"
  | "at_pickup"
  | "picked_up"
  | "in_transit"
  | "at_dropoff"
  | "delivered"
  | "cancelled";

/** Real-time availability state of a driver. */
export type DriverAvailability =
  "offline" | "available" | "on_trip" | "busy" | "break";

/** Accepted payment methods for a trip or delivery. */
export type PaymentType = "cash" | "card" | "wallet" | "mobile_money";

/** Allowed surge pricing multipliers. */
export type SurgeMultiplier = 1.0 | 1.2 | 1.5 | 2.0 | 2.5 | 3.0;

/** Who initiated a cancellation. */
export type CancellationActor = "rider" | "driver" | "system";

/** Status of a driver dispatch offer. */
export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

/** Traffic conditions affecting route duration. */
export type TrafficLevel = "light" | "moderate" | "heavy" | "unknown";

/** Dispatch job type. */
export type DispatchType = "ride" | "delivery" | "food_delivery";

/** Food delivery lifecycle (mirrors DeliveryStatus for food orders). */
export type FoodDeliveryStatus =
  | "requesting"
  | "searching"
  | "matched"
  | "accepted"
  | "en_route_to_pickup"
  | "at_pickup"
  | "picked_up"
  | "in_transit"
  | "at_dropoff"
  | "delivered"
  | "cancelled";

/** Package size category for delivery pricing. */
export type PackageSize = "small" | "medium" | "large" | "extra_large";

// ─── Geospatial ───────────────────────────────────────────────────────────────

/** A geographic coordinate pair (WGS-84). */
export interface GeoLocation {
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
}

/**
 * Ride-specific location alias.
 * @deprecated Use {@link GeoLocation} instead.
 */
export type RideLocation = GeoLocation;

/** Bounding box defined by two opposing corners. */
export interface GeoBounds {
  /** North-east corner of the bounding box. */
  northEast: GeoLocation;
  /** South-west corner of the bounding box. */
  southWest: GeoLocation;
}

/** Uber H3 hierarchical spatial index reference. */
export interface H3Index {
  /** H3 resolution level (0-15). */
  resolution: number;
  /** The H3 index string. */
  index: string;
}

// ─── Driver Location & Status ─────────────────────────────────────────────────

/** Real-time GPS location report from a driver's device. */
export interface DriverLocation {
  /** UUID of the driver. */
  driverId: string;
  /** Current GPS coordinates. */
  location: GeoLocation;
  /** Compass heading in degrees (0 = north, clockwise). */
  heading: number;
  /** Ground speed in km/h. */
  speed: number;
  /** GPS accuracy radius in meters. */
  accuracy: number;
  /** ISO-8601 timestamp of the location sample. */
  timestamp: string;
}

/** A nearby driver candidate returned by geospatial search. */
export interface DriverCandidate {
  /** UUID of the driver. */
  driverId: string;
  /** UUID of the driver's profile/user. */
  userId: string;
  /** Driver display name. */
  name: string;
  /** Current GPS coordinates. */
  location: GeoPoint;
  /** Compass heading in degrees. */
  heading: number;
  /** Ground speed in km/h. */
  speed: number;
  /** Driver's vehicle details. */
  vehicle: Vehicle;
  /** Weighted driver rating (0-5). */
  rating: number;
  /** Total completed trips. */
  totalTrips: number;
  /** Historical ride acceptance rate (0-100). */
  acceptanceRate: number;
  /** Hours the driver has been active this calendar week. */
  hoursThisWeek: number;
  /** Current availability status. */
  status: "available" | "on_trip" | "busy";
  /** ISO-8601 timestamp of the last GPS update. */
  lastLocationUpdate: string;
}

/** Nearby driver returned by geospatial search (compact view). */
export interface NearbyDriver {
  /** UUID of the driver. */
  driverId: string;
  /** UUID of the driver's profile/user. */
  userId: string;
  /** Driver display name. */
  name: string;
  /** URL of the driver's avatar image. */
  avatarUrl?: string;
  /** Vehicle type category. */
  vehicleType: string;
  /** Vehicle manufacturer. */
  vehicleMake: string;
  /** Vehicle model name. */
  vehicleModel: string;
  /** Vehicle colour. */
  vehicleColor: string;
  /** Driver rating (0-5). */
  rating: number;
  /** Total completed trips. */
  totalTrips: number;
  /** Current latitude. */
  lat: number;
  /** Current longitude. */
  lng: number;
  /** Straight-line distance to the request origin in km. */
  distanceKm: number;
  /** Estimated time of arrival to the request origin in minutes. */
  etaMinutes: number;
}

/** Composite scoring breakdown used by the dispatch algorithm. */
export interface DriverScore {
  /** UUID of the driver. */
  driverId: string;
  /** 0-100 score based on straight-line distance to pickup. */
  distanceScore: number;
  /** 0-100 score based on ETA to pickup (road distance / traffic). */
  etaScore: number;
  /** 0-100 historical ride acceptance rate. */
  acceptanceScore: number;
  /** 0-100 composite rating from riders. */
  ratingScore: number;
  /** 0-100 bonus for hours active this week. */
  activeTimeScore: number;
  /** 0-100 bonus for being inside an active surge zone. */
  surgeScore: number;
  /** 0-100 match between requested ride type and driver's vehicle. */
  vehicleMatchScore: number;
  /** Weighted total score (0-100) used for driver ranking. */
  totalScore: number;
  /** Road distance from driver to pickup in km. */
  distanceKm: number;
  /** Estimated time of arrival to pickup in minutes. */
  etaMinutes: number;
}

/** A dispatch offer sent to a candidate driver. */
export interface DriverOffer {
  /** UUID of the ride this offer belongs to. */
  rideId: string;
  /** UUID of the driver being offered. */
  driverId: string;
  /** Pickup coordinates. */
  pickup: GeoLocation;
  /** Human-readable pickup address. */
  pickupAddress: string;
  /** Destination coordinates (may be null for ride-to-pickup). */
  destination?: GeoLocation;
  /** Human-readable destination address. */
  destinationAddress?: string;
  /** Road distance in kilometres. */
  distanceKm: number;
  /** Estimated travel duration in minutes. */
  estimatedDurationMin: number;
  /** Projected driver earnings for this trip. */
  estimatedEarnings: number;
  /** Requested ride type. */
  rideType: RideType;
  /** ISO-8601 deadline after which the offer auto-expires. */
  expiresAt: string;
  /** Current status of the offer. */
  status: OfferStatus;
}

// ─── Ride Request & Lifecycle ─────────────────────────────────────────────────

/**
 * A rider's request for a trip from point A to point B.
 *
 * Tracks the full lifecycle from initial request through driver matching,
 * trip execution, and post-trip rating.
 */
export interface RideRequest {
  /** Unique identifier for this ride. */
  id: string;
  /** UUID of the rider who requested the ride. */
  riderId: string;
  /** UUID of the assigned driver (set after match). */
  driverId?: string;
  /** Vehicle class requested. */
  rideType: RideType;
  /** Current status of the ride. */
  status: RideStatus;
  /** GPS coordinates of the pickup point. */
  pickup: GeoLocation;
  /** Human-readable pickup address. */
  pickupAddress: string;
  /** GPS coordinates of the destination. */
  destination: GeoLocation;
  /** Human-readable destination address. */
  destinationAddress: string;
  /** Estimated road distance in kilometres. */
  distanceKm: number;
  /** Estimated trip duration in minutes. */
  durationMin: number;
  /** Fare estimate and pricing breakdown. */
  pricing: RidePricing;
  /** Selected payment method. */
  paymentType: PaymentType;
  /** Encoded polyline of the planned route. */
  routePolyline?: string;
  /** Who cancelled the ride. */
  cancelledBy?: CancellationActor;
  /** Reason provided for cancellation. */
  cancelReason?: string;
  /** Optional tip added by the rider. */
  tip?: number;
  /** Rider's 1-5 star rating of the trip. */
  rating?: number;
  /** Free-text review left by the rider. */
  review?: string;
  /** Additional metadata (e.g. scheduled time, country code). */
  metadata?: Record<string, unknown>;
  /** ISO-8601 timestamp when the ride was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update. */
  updatedAt: string;
}

/** Insert payload for creating a new ride request (server-side). */
export type RideRequestInsert = Omit<
  RideRequest,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Fare estimate and pricing breakdown shown to the rider before confirming.
 */
export interface RidePricing {
  /** Flat fee charged per trip. */
  baseFare: number;
  /** Variable component based on distance ($/km). */
  perKmRate: number;
  /** Variable component based on time in traffic ($/min). */
  perMinRate: number;
  /** Minimum fare floor. */
  minimumFare: number;
  /** Active surge multiplier. */
  surgeMultiplier: number;
  /** Total estimated fare including all components. */
  estimatedFare: number;
  /** ISO-4217 currency code (e.g. "KES", "USD"). */
  currencyCode: string;
}

/** Configuration for cancellation fees by ride lifecycle phase. */
export interface CancellationFeeConfig {
  /** Fee charged before a driver is assigned (typically 0). */
  beforeAssignment: number;
  /** Fee charged within 2 minutes of driver assignment. */
  withinTwoMinutes: number;
  /** Fee charged after the driver has started en_route. */
  afterEnRoute: number;
  /** Fee charged after the driver has arrived at pickup. */
  afterArrived: number;
}

// ─── Delivery Request ─────────────────────────────────────────────────────────

/**
 * A request to move a package from a pickup to a dropoff via a courier.
 *
 * Supports package, document, pharmacy, grocery, and food delivery types.
 * Separate contact information is stored for pickup and dropoff locations.
 */
export interface DeliveryRequest {
  /** Unique identifier for this delivery. */
  id: string;
  /** UUID of the customer who requested the delivery. */
  customerId: string;
  /** UUID of the assigned courier (set after match). */
  driverId?: string;
  /** Category of item being delivered. */
  deliveryType: DeliveryType;
  /** Current status of the delivery. */
  status: DeliveryStatus;
  /** GPS coordinates of the pickup point. */
  pickup: GeoLocation;
  /** Human-readable pickup address. */
  pickupAddress: string;
  /** GPS coordinates of the dropoff point. */
  destination: GeoLocation;
  /** Human-readable dropoff address. */
  destinationAddress: string;
  /** Package details (description, weight, fragility). */
  packageDetails: PackageDetails;
  /** Estimated road distance in kilometres. */
  distanceKm: number;
  /** Estimated delivery duration in minutes. */
  durationMin: number;
  /** Fare estimate and pricing breakdown. */
  pricing: RidePricing;
  /** Selected payment method. */
  paymentType: PaymentType;
  /** Who cancelled the delivery. */
  cancelledBy?: CancellationActor;
  /** Reason provided for cancellation. */
  cancelReason?: string;
  /** Cancellation fee assessed. */
  cancellationFee?: number;
  /** Proof of delivery data. */
  proofOfDelivery?: ProofOfDelivery;
  /** Additional metadata (e.g. country code, special instructions). */
  metadata?: Record<string, unknown>;
  /** ISO-8601 timestamp when the delivery was requested. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update. */
  updatedAt: string;
}

/** Insert payload for creating a new delivery request (server-side). */
export type DeliveryRequestInsert = Omit<
  DeliveryRequest,
  "id" | "createdAt" | "updatedAt"
>;

/** Physical characteristics of the package being delivered. */
export interface PackageDetails {
  /** Short description of the package contents. */
  description: string;
  /** Package weight in kilograms. */
  weight?: number;
  /** Package dimensions as a string (e.g. "30x20x10 cm"). */
  dimensions?: string;
  /** Whether the package is fragile. */
  fragile: boolean;
  /** Handling instructions. */
  specialInstructions?: string;
}

/** Proof-of-delivery artifacts captured at dropoff. */
export interface ProofOfDelivery {
  /** Recipient signature (base64 or URL). */
  signature?: string;
  /** URL of a photo taken at the dropoff location. */
  photoUrl?: string;
}

// ─── Food Delivery (RetroBuddy Integration) ──────────────────────────────────

/**
 * A food delivery order originating from a RetroBuddy restaurant.
 *
 * Extends the base delivery model with restaurant-specific fields such as
 * preparation time, menu items, and restaurant acceptance timestamps.
 */
export interface FoodDeliveryRequest {
  /** Unique identifier for this food order. */
  id: string;
  /** UUID of the customer who placed the order. */
  customerId: string;
  /** UUID of the assigned delivery driver. */
  driverId?: string;
  /** UUID of the RetroBuddy restaurant fulfilling the order. */
  restaurantId: string;
  /** Current status of the food delivery. */
  status: FoodDeliveryStatus;
  /** Ordered menu items with quantities and modifiers. */
  items: FoodDeliveryItem[];
  /** GPS coordinates of the pickup (restaurant) location. */
  pickup: GeoLocation;
  /** Human-readable restaurant address. */
  pickupAddress: string;
  /** GPS coordinates of the delivery destination. */
  destination: GeoLocation;
  /** Human-readable destination address. */
  destinationAddress: string;
  /** Estimated road distance in kilometres. */
  distanceKm: number;
  /** Estimated delivery duration in minutes. */
  durationMin: number;
  /** Restaurant's estimated food preparation time in minutes. */
  estimatedPrepTime: number;
  /** Fare estimate and pricing breakdown. */
  pricing: RidePricing;
  /** Selected payment method. */
  paymentType: PaymentType;
  /** Special handling instructions (e.g. "no onions"). */
  specialInstructions?: string;
  /** Who cancelled the order. */
  cancelledBy?: CancellationActor;
  /** Reason provided for cancellation. */
  cancelReason?: string;
  /** Additional metadata (e.g. restaurant name, country code). */
  metadata?: Record<string, unknown>;
  /** ISO-8601 timestamp when the order was placed. */
  createdAt: string;
  /** ISO-8601 timestamp of the last update. */
  updatedAt: string;
}

/** A single line item in a food order. */
export interface FoodDeliveryItem {
  /** Display name of the menu item. */
  name: string;
  /** Quantity ordered. */
  quantity: number;
  /** Price per unit at time of order. */
  price: number;
  /** Item-specific notes (e.g. "extra spicy"). */
  specialInstructions?: string;
}

/**
 * A food order passed to the dispatch engine.
 *
 * Combines restaurant location, customer destination, and order totals
 * into a single payload for driver matching.
 */
export interface FoodOrder {
  /** UUID of the food order. */
  id: string;
  /** UUID of the RetroBuddy restaurant. */
  restaurantId: string;
  /** GPS coordinates of the restaurant. */
  restaurantLocation: GeoPoint;
  /** ISO-3166-1 alpha-2 country code for surge/pricing lookups. */
  countryCode: string;
  /** Ordered menu items. */
  items: FoodDeliveryItem[];
  /** Sum of all item prices before fees and tax. */
  subtotal: number;
  /** Delivery fee charged to the customer. */
  deliveryFee: number;
  /** Applicable tax amount. */
  tax: number;
  /** Grand total charged to the customer. */
  total: number;
  /** Human-readable destination address. */
  destinationAddress: string;
  /** GPS coordinates of the delivery destination. */
  destinationLocation: GeoPoint;
  /** Selected payment method. */
  paymentType: PaymentType;
  /** Special handling instructions. */
  specialInstructions?: string;
  /** UUID of the customer who placed the order. */
  customerId: string;
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

/** Result returned by the dispatch engine after searching for drivers. */
export interface DispatchResult {
  /** Whether a driver was successfully assigned. */
  success: boolean;
  /** UUID of the assigned driver (if success = true). */
  driverId?: string;
  /** Name of the assigned driver. */
  driverName?: string;
  /** Rating of the assigned driver. */
  driverRating?: number;
  /** Vehicle description string (e.g. "2022 White Toyota Corolla"). */
  vehicleInfo?: string;
  /** ETA of the assigned driver to pickup in minutes. */
  etaMinutes?: number;
  /** Final search radius in km before giving up or finding a driver. */
  searchRadiusKm: number;
  /** Total number of candidate drivers evaluated. */
  candidatesConsidered: number;
  /** Error message if no driver was found. */
  error?: string;
}

// ─── Surge Pricing ────────────────────────────────────────────────────────────

/**
 * A dynamic pricing zone where demand exceeds supply.
 *
 * Surge zones are circular areas defined by a centre point and radius.
 * The multiplier is recalculated on a configurable interval based on
 * the demand-to-supply ratio within the zone.
 */
export interface SurgeZone {
  /** Unique identifier for this surge zone. */
  id: string;
  /** ISO-3166-1 alpha-2 country code. */
  countryCode: string;
  /** Human-readable name (e.g. "CBD Lunch Rush"). */
  name: string;
  /** Centre of the surge zone. */
  center: GeoPoint;
  /** Radius of the zone in kilometres. */
  radiusKm: number;
  /** Current price multiplier (1.0 = no surge). */
  multiplier: number;
  /** Whether the surge zone is currently active. */
  active: boolean;
  /** ISO-8601 timestamp when the surge zone was created. */
  createdAt: string;
  /** ISO-8601 timestamp when the surge zone was last updated. */
  updatedAt: string;
}

/** Insert payload for creating a new surge zone (server-side). */
export interface SurgeZoneInsert {
  /** ISO-3166-1 alpha-2 country code. */
  countryCode: string;
  /** Human-readable name. */
  name: string;
  /** Centre coordinates. */
  center: GeoPoint;
  /** Radius in kilometres. */
  radiusKm: number;
  /** Price multiplier. */
  multiplier: number;
  /** Whether the zone should be active on creation. */
  active: boolean;
}

/** Surge pricing summary displayed to a rider at request time. */
export interface SurgePricingInfo {
  /** Whether surge pricing is currently active at the pickup location. */
  active: boolean;
  /** The surge multiplier (1.0 if not active). */
  multiplier: number;
  /** Human-readable reason (e.g. "High demand in your area"). */
  reason: string;
  /** Number of active ride requests in the surge zone. */
  demand: number;
  /** Number of available drivers in the surge zone. */
  supply: number;
}

/** Itemised fare breakdown shown to the rider before confirming. */
export interface PricingEstimate {
  /** Vehicle class this estimate applies to. */
  rideType: RideType;
  /** Flat fee charged per trip. */
  baseFare: number;
  /** Variable component based on distance. */
  distanceFare: number;
  /** Variable component based on time in traffic. */
  timeFare: number;
  /** Active surge multiplier. */
  surgeMultiplier: number;
  /** Absolute surge surcharge amount. */
  surgeAmount: number;
  /** Total estimated fare including all components. */
  estimatedTotal: number;
  /** ISO-4217 currency code (e.g. "KES", "USD"). */
  currencyCode: string;
  /** Estimated trip duration in minutes. */
  estimatedDurationMin: number;
  /** Estimated trip distance in kilometres. */
  estimatedDistanceKm: number;
}

// ─── Real-time Events ─────────────────────────────────────────────────────────

/**
 * A GPS location update broadcast over Supabase Realtime.
 *
 * Published on the `driver_locations` channel every 3-5 seconds while
 * a driver is online or on an active trip.
 */
export interface LocationUpdateEvent {
  /** UUID of the driver whose location changed. */
  driverId: string;
  /** Latest GPS coordinates. */
  location: GeoLocation;
  /** Compass heading in degrees. */
  heading: number;
  /** Ground speed in km/h. */
  speed: number;
  /** GPS accuracy in meters. */
  accuracy: number;
  /** ISO-8601 timestamp of this location sample. */
  timestamp: string;
}

/**
 * A ride status transition event broadcast over Supabase Realtime.
 *
 * Published on the `ride_events` channel whenever a ride changes state.
 */
export interface RideStatusEvent {
  /** UUID of the ride. */
  rideId: string;
  /** The new status the ride has transitioned to. */
  status: RideStatus;
  /** UUID of the driver involved (if applicable). */
  driverId?: string;
  /** Driver's current location at the time of the event. */
  location?: GeoLocation;
  /** ISO-8601 timestamp of the status change. */
  timestamp: string;
  /** Arbitrary payload (e.g. ETA, fare update). */
  metadata?: Record<string, unknown>;
}

/**
 * A dispatch system event broadcast over Supabase Realtime.
 *
 * Published on the `dispatch_events` channel for driver offer lifecycle.
 */
export interface DispatchEvent {
  /** Type of dispatch event. */
  type:
    | "offer_sent"
    | "offer_accepted"
    | "offer_declined"
    | "offer_expired"
    | "driver_assigned"
    | "driver_changed";
  /** UUID of the ride. */
  rideId: string;
  /** UUID of the driver involved. */
  driverId: string;
  /** ISO-8601 timestamp of the event. */
  timestamp: string;
  /** Arbitrary event-specific payload. */
  data?: Record<string, unknown>;
}

// ─── Driver Stats ─────────────────────────────────────────────────────────────

/** Aggregated lifetime and weekly statistics for a driver. */
export interface DriverStats {
  /** UUID of the driver. */
  driverId: string;
  /** Total completed ride trips. */
  totalTrips: number;
  /** Total completed deliveries. */
  totalDeliveries: number;
  /** Lifetime earnings across all trips and deliveries. */
  totalEarnings: number;
  /** Weighted average rating (0-5). */
  averageRating: number;
  /** Percentage of ride offers accepted (0-100). */
  acceptanceRate: number;
  /** Percentage of accepted trips completed without cancellation (0-100). */
  completionRate: number;
  /** Average time in seconds to respond to a dispatch offer. */
  averageResponseTime: number;
  /** Hours the driver has been online this calendar week. */
  onlineHoursThisWeek: number;
  /** Number of trips completed this calendar week. */
  tripsThisWeek: number;
  /** Earnings accumulated this calendar week. */
  earningsThisWeek: number;
}

// ─── Route ────────────────────────────────────────────────────────────────────

/** Detailed route information from a routing engine (e.g. OSRM, Google). */
export interface RouteResult {
  /** Total road distance in kilometres. */
  distanceKm: number;
  /** Total travel duration in minutes (including traffic). */
  durationMin: number;
  /** Encoded polyline for map rendering. */
  polyline: string;
  /** Ordered list of turn-by-turn directions. */
  steps: RouteStep[];
  /** Current traffic level along the route. */
  trafficLevel: TrafficLevel;
}

/** A single step in a turn-by-turn route. */
export interface RouteStep {
  /** Human-readable driving instruction. */
  instruction: string;
  /** Distance for this step in kilometres. */
  distanceKm: number;
  /** Duration for this step in minutes. */
  durationMin: number;
  /** GPS coordinates where this step begins. */
  startLocation: GeoPoint;
  /** GPS coordinates where this step ends. */
  endLocation: GeoPoint;
  /** Maneuver type (e.g. "turn-left", "roundabout", "straight"). */
  maneuver: string;
}

// ─── Ride Status Update ──────────────────────────────────────────────────────

/** Payload for updating a ride status (client-side). */
export interface RideStatusUpdate {
  /** The new status to transition to. */
  status: RideStatus;
  /** Optional metadata to attach to the transition. */
  metadata?: Record<string, unknown>;
}

// ─── Pricing Tiers ──────────────────────────────────────────────────────────

/** Configuration for each ride type's pricing structure. */
export const RIDE_TYPE_CONFIG: Record<
  RideType,
  {
    baseFare: number;
    perKmRate: number;
    perMinRate: number;
    minimumFare: number;
    capacity: number;
  }
> = {
  economy: {
    baseFare: 500,
    perKmRate: 150,
    perMinRate: 50,
    minimumFare: 1000,
    capacity: 4,
  },
  comfort: {
    baseFare: 800,
    perKmRate: 250,
    perMinRate: 80,
    minimumFare: 1500,
    capacity: 4,
  },
  premium: {
    baseFare: 1500,
    perKmRate: 400,
    perMinRate: 120,
    minimumFare: 3000,
    capacity: 4,
  },
  xl: {
    baseFare: 1200,
    perKmRate: 350,
    perMinRate: 100,
    minimumFare: 2500,
    capacity: 6,
  },
  motorcycle: {
    baseFare: 300,
    perKmRate: 100,
    perMinRate: 30,
    minimumFare: 500,
    capacity: 1,
  },
  bicycle: {
    baseFare: 200,
    perKmRate: 80,
    perMinRate: 20,
    minimumFare: 300,
    capacity: 1,
  },
};

/** Configuration for each delivery type's pricing structure. */
export const DELIVERY_TYPE_CONFIG: Record<
  DeliveryType,
  {
    baseFare: number;
    perKmRate: number;
    perMinRate: number;
    minimumFare: number;
  }
> = {
  package: {
    baseFare: 1000,
    perKmRate: 200,
    perMinRate: 60,
    minimumFare: 1500,
  },
  document: { baseFare: 500, perKmRate: 150, perMinRate: 50, minimumFare: 800 },
  grocery: {
    baseFare: 1200,
    perKmRate: 250,
    perMinRate: 70,
    minimumFare: 2000,
  },
  pharmacy: {
    baseFare: 800,
    perKmRate: 180,
    perMinRate: 55,
    minimumFare: 1200,
  },
  food: { baseFare: 800, perKmRate: 180, perMinRate: 55, minimumFare: 1200 },
};

/** Price multiplier by package size for delivery pricing. */
export const PACKAGE_SIZE_MULTIPLIER: Record<PackageSize, number> = {
  small: 1.0,
  medium: 1.2,
  large: 1.5,
  extra_large: 2.0,
};

// ─── Status Transitions ──────────────────────────────────────────────────────

/** Allowed ride status transitions (source -> valid targets). */
export const RIDE_STATUS_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requesting: ["searching", "cancelled"],
  searching: ["matched", "cancelled", "requesting"],
  matched: ["accepted", "cancelled"],
  accepted: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

/** Allowed delivery status transitions (source -> valid targets). */
export const DELIVERY_STATUS_TRANSITIONS: Record<
  DeliveryStatus,
  DeliveryStatus[]
> = {
  requesting: ["searching", "cancelled"],
  searching: ["matched", "cancelled", "requesting"],
  matched: ["accepted", "cancelled"],
  accepted: ["en_route_to_pickup", "cancelled"],
  en_route_to_pickup: ["at_pickup", "cancelled"],
  at_pickup: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["at_dropoff", "cancelled"],
  at_dropoff: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/** Allowed food delivery status transitions (source -> valid targets). */
export const FOOD_DELIVERY_STATUS_TRANSITIONS: Record<
  FoodDeliveryStatus,
  FoodDeliveryStatus[]
> = {
  requesting: ["searching", "cancelled"],
  searching: ["matched", "cancelled", "requesting"],
  matched: ["accepted", "cancelled"],
  accepted: ["en_route_to_pickup", "cancelled"],
  en_route_to_pickup: ["at_pickup", "cancelled"],
  at_pickup: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["at_dropoff", "cancelled"],
  at_dropoff: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// ─── Database Row Helpers ─────────────────────────────────────────────────────

/** Row type for the `driver_locations` Supabase table. */
export interface DriverLocationRow {
  id: string;
  driver_id: string;
  location: unknown; // PostGIS geography point
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: string;
  created_at: string;
}

/** Row type for the `ridely_food_deliveries` Supabase table. */
export interface FoodDeliveryRequestRow {
  id: string;
  customer_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_location: unknown;
  items: FoodDeliveryItem[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  destination_location: unknown;
  destination_address: string;
  distance_km: number;
  estimated_prep_time: number;
  estimated_delivery_time: number;
  payment_type: PaymentType;
  status: FoodDeliveryStatus;
  driver_id: string | null;
  special_instructions: string | null;
  requested_at: string;
  restaurant_accepted_at: string | null;
  restaurant_ready_at: string | null;
  driver_picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Row type for the `driver_offers` Supabase table. */
export interface DriverOfferRow {
  id: string;
  ride_id: string;
  driver_id: string;
  pickup_location: unknown;
  pickup_address: string;
  destination_location: unknown | null;
  destination_address: string | null;
  distance_km: number;
  estimated_duration_min: number;
  estimated_earnings: number;
  ride_type: RideType;
  expires_at: string;
  status: OfferStatus;
  created_at: string;
}

/** Row type for the `surge_zones` Supabase table. */
export interface SurgeZoneRow {
  id: string;
  name: string;
  center: unknown;
  radius_km: number;
  multiplier: number;
  demand: number;
  supply: number;
  ratio: number;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

/** Row type for the `ride_status_history` Supabase table. */
export interface RideStatusHistoryRow {
  id: string;
  ride_id: string;
  previous_status: RideStatus | null;
  new_status: RideStatus;
  changed_by: string | null;
  location: unknown | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
