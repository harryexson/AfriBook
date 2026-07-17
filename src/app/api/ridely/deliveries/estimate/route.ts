import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES } from '@/lib/localization/countries';

type PackageType = 'document' | 'small' | 'medium' | 'large';
type DeliverySpeed = 'express' | 'standard' | 'next_day' | 'cross_border';
type DeliveryZone = 'same_city' | 'same_country' | 'cross_border' | 'pan_african';

interface EstimateRequest {
  pickupAddress: string;
  dropoffAddress: string;
  packageType: PackageType;
  weightKg: number;
  isFragile: boolean;
  deliverySpeed: DeliverySpeed;
  countryCode: string;
}

const BASE_FARE: Record<PackageType, number> = {
  document: 2,
  small: 3,
  medium: 5,
  large: 8,
};

const SPEED_MULTIPLIER: Record<DeliverySpeed, number> = {
  express: 2.0,
  standard: 1.0,
  next_day: 1.5,
  cross_border: 3.0,
};

const WEIGHT_FREE_KG = 5;
const WEIGHT_SURCHARGE_PER_KG = 0.5;
const FRAGILE_HANDLING_FEE = 2;
const INSURANCE_RATE = 0.05;
const DISTANCE_FEE_BASE = 3;
const DISTANCE_FEE_PER_KM = 0.75;

const VALID_PACKAGE_TYPES = Object.keys(BASE_FARE) as PackageType[];
const VALID_SPEEDS = Object.keys(SPEED_MULTIPLIER) as DeliverySpeed[];

const PAN_AFRICAN_COUNTRIES = new Set([
  'NG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'RW', 'SN', 'CI', 'CM',
  'ET', 'DZ', 'MA', 'EG', 'TN', 'ZM', 'ZW', 'MW', 'MZ', 'BW',
  'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'DJ', 'SO', 'ER', 'SS',
  'BF', 'ML', 'NE', 'TD', 'CF', 'CG', 'CD', 'GA', 'GQ', 'ST',
  'AO', 'BJ', 'TG', 'LR', 'SL', 'GM', 'GN', 'GW', 'CV', 'MR',
]);

function estimateDistanceFee(pickupAddress: string, dropoffAddress: string): { distanceKm: number; fee: number } {
  const normalised = (s: string) => s.toLowerCase().trim();
  const pickup = normalised(pickupAddress);
  const dropoff = normalised(dropoffAddress);

  if (pickup === dropoff) {
    return { distanceKm: 0, fee: DISTANCE_FEE_BASE };
  }

  const pickupWords = new Set(pickup.split(/[\s,]+/).filter(Boolean));
  const dropoffWords = new Set(dropoff.split(/[\s,]+/).filter(Boolean));
  let commonWords = 0;
  for (const w of pickupWords) {
    if (dropoffWords.has(w)) commonWords++;
  }

  let distanceKm: number;
  if (commonWords >= 3) {
    distanceKm = 2 + Math.random() * 3;
  } else if (commonWords >= 1) {
    distanceKm = 8 + Math.random() * 15;
  } else {
    distanceKm = 20 + Math.random() * 40;
  }

  const fee = Math.round((DISTANCE_FEE_BASE + distanceKm * DISTANCE_FEE_PER_KM) * 100) / 100;
  return { distanceKm: Math.round(distanceKm * 10) / 10, fee };
}

function determineDeliveryZone(countryCode: string, deliverySpeed: DeliverySpeed): DeliveryZone {
  if (deliverySpeed === 'cross_border') return 'cross_border';
  if (PAN_AFRICAN_COUNTRIES.has(countryCode.toUpperCase())) {
    return deliverySpeed === 'next_day' ? 'same_country' : 'same_city';
  }
  return 'same_city';
}

function estimateDeliveryTime(speed: DeliverySpeed, zone: DeliveryZone): string {
  switch (speed) {
    case 'express':
      return zone === 'same_city' ? '30-60 minutes' : '1-2 hours';
    case 'standard':
      return zone === 'same_city' ? '1-3 hours' : '3-6 hours';
    case 'next_day':
      return 'Next business day';
    case 'cross_border':
      return zone === 'pan_african' ? '3-5 business days' : '2-3 business days';
    default:
      return '1-3 hours';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pickupAddress,
      dropoffAddress,
      packageType,
      weightKg,
      isFragile,
      deliverySpeed,
      countryCode,
    }: EstimateRequest = body;

    if (!pickupAddress || !dropoffAddress) {
      return NextResponse.json(
        { success: false, error: 'pickupAddress and dropoffAddress are required' },
        { status: 400 },
      );
    }

    if (!VALID_PACKAGE_TYPES.includes(packageType)) {
      return NextResponse.json(
        { success: false, error: `Invalid packageType: ${packageType}. Must be one of: ${VALID_PACKAGE_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (typeof weightKg !== 'number' || weightKg <= 0) {
      return NextResponse.json(
        { success: false, error: 'weightKg must be a positive number' },
        { status: 400 },
      );
    }

    if (typeof isFragile !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isFragile must be a boolean' },
        { status: 400 },
      );
    }

    if (!VALID_SPEEDS.includes(deliverySpeed)) {
      return NextResponse.json(
        { success: false, error: `Invalid deliverySpeed: ${deliverySpeed}. Must be one of: ${VALID_SPEEDS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!countryCode || typeof countryCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'countryCode is required' },
        { status: 400 },
      );
    }

    const countryConfig = COUNTRIES[countryCode.toUpperCase()];
    if (!countryConfig) {
      return NextResponse.json(
        { success: false, error: `Unknown countryCode: ${countryCode}` },
        { status: 400 },
      );
    }

    const baseFare = BASE_FARE[packageType];

    const { distanceKm, fee: distanceFee } = estimateDistanceFee(pickupAddress, dropoffAddress);

    const weightSurcharge =
      weightKg > WEIGHT_FREE_KG
        ? Math.round((weightKg - WEIGHT_FREE_KG) * WEIGHT_SURCHARGE_PER_KG * 100) / 100
        : 0;

    const fragileHandling = isFragile ? FRAGILE_HANDLING_FEE : 0;

    const speedMultiplier = SPEED_MULTIPLIER[deliverySpeed];

    const zone = determineDeliveryZone(countryCode, deliverySpeed);

    const subtotal =
      Math.round((baseFare + distanceFee + weightSurcharge + fragileHandling) * speedMultiplier * 100) / 100;

    const taxRate = countryConfig.taxRate;
    const tax = Math.round(subtotal * taxRate * 100) / 100;

    const insurance = Math.round(subtotal * INSURANCE_RATE * 100) / 100;

    const total = Math.round((subtotal + tax + insurance) * 100) / 100;

    const estimatedDeliveryTime = estimateDeliveryTime(deliverySpeed, zone);

    const estimateId = `est_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return NextResponse.json({
      success: true,
      data: {
        estimateId,
        baseFare,
        distanceFee,
        distanceKm,
        weightSurcharge,
        fragileHandling,
        speedMultiplier,
        subtotal,
        tax,
        taxRate,
        taxName: countryConfig.taxName,
        insurance,
        total,
        currency: countryConfig.currency.code,
        estimatedDeliveryTime,
        deliveryZone: zone,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
