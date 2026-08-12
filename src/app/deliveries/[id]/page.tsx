'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MapEmbed from '@/components/shared/MapEmbed';
import { useCountry } from '@/components/shared/CountryProvider';
import { formatMoneySymbol, getCurrencyForCountry } from '@/lib/money';
import {
  Clock,
  Truck,
  Phone,
  MessageCircle,
  Package,
  CheckCircle,
  ArrowLeft,
  Star,
  Camera,
  PenTool,
} from 'lucide-react';

// ── Animations ─────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

// ── Types ──────────────────────────────────────────────────────

type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';

interface StatusUpdate {
  id: string;
  status: DeliveryStatus;
  label: string;
  timestamp: string;
  description: string;
}

interface MockDelivery {
  id: string;
  trackingNumber: string;
  status: DeliveryStatus;
  packageType: string;
  packageWeight: number;
  packageDescription: string;
  fragile: boolean;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  baseFare: number;
  distanceFee: number;
  weightSurcharge: number;
  total: number;
  driver: {
    name: string;
    rating: number;
    vehicle: string;
    licensePlate: string;
    phone: string;
  };
  etaMinutes: number;
  createdAt: string;
  statusUpdates: StatusUpdate[];
  proofOfDelivery: {
    photoUrl: string | null;
    signatureUrl: string | null;
    deliveredAt: string | null;
  };
}

// ── Status Steps Config ────────────────────────────────────────

const STATUS_STEPS: { id: DeliveryStatus; label: string; number: number }[] = [
  { id: 'pending', label: 'Pending', number: 1 },
  { id: 'picked_up', label: 'Picked Up', number: 2 },
  { id: 'in_transit', label: 'In Transit', number: 3 },
  { id: 'out_for_delivery', label: 'Out for Delivery', number: 4 },
  { id: 'delivered', label: 'Delivered', number: 5 },
];

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_DELIVERY: MockDelivery = {
  id: 'AFR-2026-001234',
  trackingNumber: 'AFR-2026-001234',
  status: 'in_transit',
  packageType: 'Medium Package',
  packageWeight: 8,
  packageDescription: 'Electronics — Samsung Galaxy S24 Ultra',
  fragile: true,
  pickupAddress: '14A Adeola Odeku Street, Victoria Island, Lagos',
  pickupLat: 6.4281,
  pickupLng: 3.4219,
  dropoffAddress: '27 Opebi Road, Ikeja, Lagos',
  dropoffLat: 6.6002,
  dropoffLng: 3.3471,
  baseFare: 2500,
  distanceFee: 1800,
  weightSurcharge: 1200,
  total: 5500,
  driver: {
    name: 'Chukwuemeka N.',
    rating: 4.8,
    vehicle: 'Toyota Camry',
    licensePlate: 'LAG-234-KJA',
    phone: '+234 803 456 7890',
  },
  etaMinutes: 34,
  createdAt: '2026-07-12T14:23:00Z',
  statusUpdates: [
    {
      id: 'su-1',
      status: 'pending',
      label: 'Delivery Created',
      timestamp: '2026-07-12T14:23:00Z',
      description: 'Your delivery request has been confirmed',
    },
    {
      id: 'su-2',
      status: 'pending',
      label: 'Driver Assigned',
      timestamp: '2026-07-12T14:28:00Z',
      description: 'Chukwuemeka N. accepted your delivery',
    },
    {
      id: 'su-3',
      status: 'picked_up',
      label: 'Picked Up',
      timestamp: '2026-07-12T14:52:00Z',
      description: 'Package collected from Victoria Island',
    },
    {
      id: 'su-4',
      status: 'in_transit',
      label: 'In Transit',
      timestamp: '2026-07-12T15:03:00Z',
      description: 'Your package is on its way to Ikeja',
    },
  ],
  proofOfDelivery: {
    photoUrl: null,
    signatureUrl: null,
    deliveredAt: null,
  },
};

// ── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function getStatusIndex(status: DeliveryStatus): number {
  return STATUS_STEPS.findIndex((s) => s.id === status);
}

function formatCurrency(amount: number, currencyCode: string): string {
  return formatMoneySymbol(amount, currencyCode);
}

// ── Page ───────────────────────────────────────────────────────

export default function DeliveryTrackingPage() {
  const router = useRouter();
  const { countryCode } = useCountry();
  const delivery = MOCK_DELIVERY;
  const currencyCode = getCurrencyForCountry(countryCode);

  const [etaSeconds, setEtaSeconds] = useState(delivery.etaMinutes * 60);

  useEffect(() => {
    if (etaSeconds <= 0) return;
    const timer = setInterval(() => {
      setEtaSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [etaSeconds]);

  const etaDisplay = useMemo(() => {
    const h = Math.floor(etaSeconds / 3600);
    const m = Math.floor((etaSeconds % 3600) / 60);
    const s = etaSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }, [etaSeconds]);

  const currentStepIndex = getStatusIndex(delivery.status);
  const isDelivered = delivery.status === 'delivered';

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-text-primary font-heading truncate">Track Delivery</h1>
            <p className="text-[10px] text-text-secondary font-mono">{delivery.trackingNumber}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-amber-600 uppercase">Live</span>
          </div>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto space-y-4 px-4 py-5"
      >
        {/* ── Status Stepper ─────────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ' +
                        (isCompleted
                          ? 'bg-amber-500 text-white'
                          : isActive
                            ? 'bg-amber-500/10 text-amber-600 ring-2 ring-amber-500'
                            : 'bg-surface-secondary border border-border text-text-tertiary')
                      }
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.number}
                    </div>
                    <span
                      className={
                        'text-[9px] mt-1.5 font-medium hidden sm:block ' +
                        (isActive ? 'text-amber-600' : isCompleted ? 'text-text-primary' : 'text-text-tertiary')
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="flex-1 mx-1.5">
                      <div
                        className={
                          'h-0.5 rounded-full transition-colors ' +
                          (isCompleted ? 'bg-amber-500' : 'bg-border')
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Map Section ────────────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl overflow-hidden border border-border">
          <div className="relative bg-surface-secondary aspect-[16/9]">
            <MapEmbed
              bare
              center={{ latitude: delivery.pickupLat, longitude: delivery.pickupLng }}
              marker={{ latitude: delivery.pickupLat, longitude: delivery.pickupLng }}
              bbox={{
                minLat: Math.min(delivery.pickupLat, delivery.dropoffLat) - 0.03,
                minLng: Math.min(delivery.pickupLng, delivery.dropoffLng) - 0.05,
                maxLat: Math.max(delivery.pickupLat, delivery.dropoffLat) + 0.03,
                maxLng: Math.max(delivery.pickupLng, delivery.dropoffLng) + 0.05,
              }}
              title="Delivery Route Map"
            />
            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-medium text-text-primary shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pickup
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-medium text-text-primary shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Dropoff
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ETA Section ────────────────────────────────────── */}
        {!isDelivered && (
          <motion.div variants={scaleIn} className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100 font-medium">Estimated Arrival</p>
                <p className="font-heading text-3xl font-bold mt-1">{etaDisplay}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Driver Info Card ───────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Your Driver</h2>
          <div className="flex items-center gap-3 mb-4">
            {/* Driver photo placeholder */}
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <span className="font-heading text-lg font-bold text-amber-600">
                {delivery.driver.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary">{delivery.driver.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-xs font-medium text-text-primary">{delivery.driver.rating}</span>
                <span className="text-text-tertiary text-xs">·</span>
                <Truck className="w-3 h-3 text-text-tertiary" />
                <span className="text-xs text-text-secondary">{delivery.driver.vehicle}</span>
              </div>
              <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{delivery.driver.licensePlate}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${delivery.driver.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm font-medium hover:border-amber-500/50 transition-colors"
            >
              <Phone className="w-4 h-4 text-amber-500" />
              Call
            </a>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm font-medium hover:border-amber-500/50 transition-colors">
              <MessageCircle className="w-4 h-4 text-amber-500" />
              Message
            </button>
          </div>
        </motion.div>

        {/* ── Package Details ────────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Package Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{delivery.packageType}</p>
                <p className="text-xs text-text-secondary truncate">{delivery.packageDescription}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-surface-secondary">
                <p className="text-[10px] text-text-tertiary mb-0.5">Weight</p>
                <p className="text-sm font-bold text-text-primary">{delivery.packageWeight} kg</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-surface-secondary">
                <p className="text-[10px] text-text-tertiary mb-0.5">Type</p>
                <p className="text-sm font-bold text-text-primary">Box</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-surface-secondary">
                <p className="text-[10px] text-text-tertiary mb-0.5">Handling</p>
                {delivery.fragile ? (
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Fragile</span>
                ) : (
                  <span className="text-sm font-bold text-text-primary">Normal</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Delivery Addresses ─────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Addresses</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Pickup</p>
                <p className="text-sm text-text-primary mt-0.5">{delivery.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Dropoff</p>
                <p className="text-sm text-text-primary mt-0.5">{delivery.dropoffAddress}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Price Breakdown ────────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Price Breakdown</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Base fare</span>
              <span className="text-sm text-text-primary">{formatCurrency(delivery.baseFare, currencyCode)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Distance fee</span>
              <span className="text-sm text-text-primary">{formatCurrency(delivery.distanceFee, currencyCode)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Weight surcharge ({delivery.packageWeight} kg)</span>
              <span className="text-sm text-text-primary">{formatCurrency(delivery.weightSurcharge, currencyCode)}</span>
            </div>
            <div className="border-t border-border pt-2.5 flex justify-between items-center">
              <span className="text-sm font-bold text-text-primary">Total</span>
              <span className="font-heading text-lg font-bold text-amber-500">{formatCurrency(delivery.total, currencyCode)}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Proof of Delivery (shown after delivery) ─────── */}
        {isDelivered && delivery.proofOfDelivery.deliveredAt && (
          <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Proof of Delivery</h2>
            <p className="text-[10px] text-text-tertiary mb-3">
              Delivered at {formatDate(delivery.proofOfDelivery.deliveredAt)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Photo */}
              <div className="aspect-square rounded-xl bg-surface-secondary border border-border flex flex-col items-center justify-center">
                {delivery.proofOfDelivery.photoUrl ? (
                  <img
                    src={delivery.proofOfDelivery.photoUrl}
                    alt="Delivery proof"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-text-tertiary mb-2" />
                    <p className="text-xs text-text-tertiary">Delivery Photo</p>
                  </>
                )}
              </div>
              {/* Signature */}
              <div className="aspect-square rounded-xl bg-surface-secondary border border-border flex flex-col items-center justify-center">
                {delivery.proofOfDelivery.signatureUrl ? (
                  <img
                    src={delivery.proofOfDelivery.signatureUrl}
                    alt="Signature"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <>
                    <PenTool className="w-8 h-8 text-text-tertiary mb-2" />
                    <p className="text-xs text-text-tertiary">Digital Signature</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Status Timeline ────────────────────────────────── */}
        <motion.div variants={fadeIn} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Status Timeline</h2>
          <div className="space-y-0">
            {[...delivery.statusUpdates].reverse().map((update, i) => {
              const isFirst = i === 0;
              return (
                <div key={update.id} className="flex gap-3">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        'w-3 h-3 rounded-full shrink-0 mt-1 ' +
                        (isFirst ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-border')
                      }
                    />
                    {i < delivery.statusUpdates.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={'pb-4 ' + (i === delivery.statusUpdates.length - 1 ? 'pb-0' : '')}>
                    <p className={'text-sm font-semibold ' + (isFirst ? 'text-text-primary' : 'text-text-secondary')}>
                      {update.label}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{update.description}</p>
                    <p className="text-[10px] text-text-tertiary mt-1 font-mono">{formatDate(update.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom spacing for safe area */}
        <div className="h-6" />
      </motion.div>
    </div>
  );
}
