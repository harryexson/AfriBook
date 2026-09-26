'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Clock, CheckCircle, XCircle, Car, MapPin, Loader2, Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const statuses = ['All', 'Active', 'Completed', 'Cancelled'];

interface Ride {
  id: string;
  status: string;
  pickup_address: string | null;
  destination_address: string | null;
  distance_km: number;
  duration_min: number;
  actual_fare: number | null;
  estimated_fare: number | null;
  rating: number | null;
  requested_at: string;
  driver?: { name: string | null } | null;
}

const ACTIVE_STATUSES = new Set(['requesting', 'accepted', 'arrived', 'in_progress']);

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  completed: { color: 'text-green-500 bg-green-500/10', icon: CheckCircle, label: 'Completed' },
  in_progress: { color: 'text-blue-500 bg-blue-500/10', icon: Clock, label: 'In progress' },
  arrived: { color: 'text-blue-500 bg-blue-500/10', icon: Clock, label: 'Driver arrived' },
  accepted: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Driver on the way' },
  requesting: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Finding a driver' },
  cancelled: { color: 'text-red-500 bg-red-500/10', icon: XCircle, label: 'Cancelled' },
};

function streetLevel(address: string | null): string {
  if (!address) return 'Location';
  return address.split(',')[0]?.trim() ?? address;
}

export default function TripsPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ridely/rides?limit=50')
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) {
          setError(body.error ?? 'Failed to load trips');
          return;
        }
        setRides(body.data.rides);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load trips');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => rides.filter((r) => {
    const matchesStatus =
      activeStatus === 'All' ||
      (activeStatus === 'Active' && ACTIVE_STATUSES.has(r.status)) ||
      (activeStatus === 'Completed' && r.status === 'completed') ||
      (activeStatus === 'Cancelled' && r.status === 'cancelled');
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      (r.pickup_address ?? '').toLowerCase().includes(q) ||
      (r.destination_address ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  }), [rides, activeStatus, searchQuery]);

  const totalSpent = rides
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.actual_fare ?? r.estimated_fare ?? 0), 0);

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">My Trips</h1>
        <p className="text-text-secondary">
          {rides.length > 0 ? `${rides.length} trips · ${formatCurrency(totalSpent)} spent` : 'Your ride history'}
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStatus === status
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading trips…
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 text-center py-8">{error}</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
          {filtered.map((ride) => {
            const statusInfo = STATUS_CONFIG[ride.status] ?? STATUS_CONFIG.requesting;
            const StatusIcon = statusInfo.icon;
            const fare = Number(ride.actual_fare ?? ride.estimated_fare ?? 0);
            return (
              <motion.div
                key={ride.id}
                variants={fadeIn}
                className="bg-surface-secondary rounded-xl p-4 border border-border hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      {ride.rating && (
                        <span className="text-xs text-text-tertiary flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500" /> {ride.rating}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-text-primary text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {streetLevel(ride.pickup_address)}
                      </p>
                      <p className="text-text-primary text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {streetLevel(ride.destination_address)}
                      </p>
                    </div>
                    <p className="text-text-tertiary text-xs mt-1.5">
                      {new Date(ride.requested_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}{ride.distance_km?.toFixed(1)} km
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-text-primary">{formatCurrency(fare)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center py-20 bg-surface-secondary rounded-2xl border border-border"
        >
          <MapPin className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-text-primary mb-2">No trips found</h3>
          <p className="text-text-secondary text-sm">
            {searchQuery ? 'Try a different search term' : "You haven't taken any rides yet."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
