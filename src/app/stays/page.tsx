"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  ChevronDown,
  Sparkles,
  BedDouble,
  Wifi,
  Snowflake,
  Dumbbell,
  Coffee,
  Waves,
  Briefcase,
  ParkingCircle,
} from "lucide-react";
import { useCountry } from "@/components/shared/CountryProvider";
import { formatMoneySymbol } from "@/lib/money";
import { COUNTRIES } from "@/lib/localization/countries";
import DestinationSelector, { DestinationChip } from "@/components/shared/DestinationSelector";
import RecommendationBadge from "@/components/recommendations/RecommendationBadge";
import {
  scoreCollection,
  partitionCollection,
  recommendedFallback,
} from "@/lib/recommendations/engine";
import type { ListingSignals, RecommendationContext, RecommendationReason } from "@/lib/recommendations/types";
import { useDestinationStore } from "@/stores/destination-store";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

interface StayHotelSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  city: string;
  country: string;
  countryCode: string;
  starRating: number;
  propertyType: string;
  galleryImages: string[];
  currencyCode: string;
  priceFrom: number;
  priceTo: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isSponsored: boolean;
}

interface StaysResponse {
  success: boolean;
  data: StayHotelSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const sortOptions = ["Recommended", "Price: Low to High", "Price: High to Low", "Rating", "Most Reviewed"] as const;
type SortOption = (typeof sortOptions)[number];

const amenityIcons: Record<string, typeof Wifi | undefined> = {
  wifi: Wifi,
  "free wifi": Wifi,
  "air conditioning": Snowflake,
  ac: Snowflake,
  pool: Waves,
  "swimming pool": Waves,
  gym: Dumbbell,
  fitness: Dumbbell,
  "free breakfast": Coffee,
  breakfast: Coffee,
  restaurant: Coffee,
  "business center": Briefcase,
  parking: ParkingCircle,
  "free parking": ParkingCircle,
};

const amenityIconsFor = (amenities: string[]): Array<{ label: string; icon: typeof Wifi }> => {
  const seen = new Set<string>();
  const out: Array<{ label: string; icon: typeof Wifi }> = [];
  for (const a of amenities) {
    const icon = amenityIcons[a.toLowerCase()];
    if (icon && !seen.has(a.toLowerCase())) {
      seen.add(a.toLowerCase());
      out.push({ label: a, icon });
    }
  }
  return out.slice(0, 3);
};

export default function StaysPage() {
  const { countryCode, country } = useCountry();
  const destination = useDestinationStore((s) => s.destination);

  // The destination store is the source of truth once a user picks one;
  // CountryProvider won't re-render without a redirect, so derive the
  // effective market here (zustand subscribers do re-render).
  const effectiveCountryCode = destination.countryCode || countryCode;
  const effectiveCountry = COUNTRIES[effectiveCountryCode] ?? country;

  const [hotels, setHotels] = useState<StayHotelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [cities, setCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);

  const cityFilter =
    destination.city || (selectedCity !== "All" ? selectedCity : "");

  const loadHotels = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ countryCode: effectiveCountryCode });
      if (searchQuery) params.set("q", searchQuery);
      if (cityFilter) params.set("city", cityFilter);
      if (sortBy === "Price: Low to High") params.set("sort", "price-asc");
      else if (sortBy === "Price: High to Low") params.set("sort", "price-desc");
      else if (sortBy === "Rating") params.set("sort", "rating");
      else if (sortBy === "Most Reviewed") params.set("sort", "reviews");
      const res = await fetch(`/api/stays?${params.toString()}`, { signal });
      const json = (await res.json()) as StaysResponse;
      if (!res.ok) throw new Error((json as unknown as { error?: string }).error ?? "Failed to load stays");
      setHotels(json.data ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadHotels(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCountryCode, cityFilter, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCities() {
      try {
        const res = await fetch(`/api/stays/cities?countryCode=${effectiveCountryCode}`, { signal: controller.signal });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setCities(json.data.map((c: { name: string }) => c.name));
        }
      } catch {
        // ignore — city filter is optional
      }
    }
    loadCities();
    return () => controller.abort();
  }, [effectiveCountryCode]);

  // Recommendation engine — turn hotels into explainable, grouped lists.
  const ctx: RecommendationContext = {
    countryCode: effectiveCountryCode,
    city: destination.city || undefined,
    userId: undefined,
    previouslyBookedCities: [],
    previouslyBookedCategories: [],
  };

  const ranked = useMemo(() => {
    const signals: ListingSignals[] = hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      countryCode: h.countryCode,
      rating: h.rating,
      reviewCount: h.reviewCount,
      price: h.priceFrom,
      isFeatured: h.isFeatured,
      isSponsored: h.isSponsored,
      category: "hotel",
    }));
    return scoreCollection(signals, ctx);
  }, [hotels, destination.city, effectiveCountryCode]);

  const groups = useMemo(() => partitionCollection(ranked), [ranked]);
  const recommended = useMemo(
    () => recommendedFallback(ranked, ctx, 3),
    [ranked, destination.city],
  );
  const featured = groups.featured;
  const sponsored = groups.sponsored;
  const gridHotels = useMemo(() => {
    if (featured.length >= 2) return hotels.filter((h) => !h.isFeatured);
    return hotels;
  }, [hotels, featured]);

  const effectiveCity = destination.neighborhood || cityFilter;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-300">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600"
            alt="Luxury accommodation"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-300/70 via-dark-300/40 to-dark-300" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p variants={fadeIn} className="flex items-center gap-2 text-amber-400 text-sm font-semibold uppercase tracking-widest">
              <BedDouble className="w-4 h-4" />
              Stays · {effectiveCountry.flag} {effectiveCountry.name}
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="mt-3 max-w-3xl text-4xl font-bold font-heading tracking-tight text-white sm:text-5xl"
            >
              Book hotels across {effectiveCountry.name} and beyond.
            </motion.h1>
            <motion.p variants={fadeIn} className="mt-4 max-w-2xl text-lg text-white/70">
              From city hotels to beachfront escapes — 3% platform fee, no markup. Guests save, hosts keep more.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-6">
              <DestinationChip onOpen={() => setDestinationOpen(true)} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <DestinationSelector open={destinationOpen} onClose={() => setDestinationOpen(false)} />

      {/* Controls */}
      <section className="sticky top-16 md:top-20 z-40 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  loadHotels();
                }
              }}
              placeholder={`Search hotels in ${effectiveCountry.name}...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-xl bg-surface-secondary border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          >
            <option value="All">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 rounded-xl bg-surface-secondary border border-border px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors"
            >
              {sortBy}
              <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-dark-200 border border-border shadow-xl overflow-hidden z-50">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-secondary ${
                      sortBy === opt ? "text-amber-600 font-semibold" : "text-text-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-surface-secondary animate-pulse">
                <div className="h-52" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded-lg" />
                  <div className="h-3 w-1/2 rounded-lg" />
                  <div className="h-3 w-1/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md text-center py-16">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-secondary">
              <BedDouble className="h-8 w-8 text-text-tertiary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text-primary">Couldn&apos;t load stays</h2>
            <p className="mt-1 text-sm text-text-secondary">{error}</p>
            <button
              onClick={() => loadHotels()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : hotels.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-16">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-secondary">
              <Search className="h-8 w-8 text-text-tertiary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text-primary">No hotels found</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Try a different search or city in {effectiveCountry.name}.
            </p>
          </div>
        ) : (
          <>
            {sponsored.length > 0 && (
              <div className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-heading text-text-primary">
                      Sponsored stays
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Paid placements — always clearly labelled.
                    </p>
                  </div>
                </div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {sponsored.slice(0, 3).map((item) => (
                    <HotelCard key={item.listing.id} hotel={hotels.find((h) => h.id === item.listing.id)!} reason={item.reason} />
                  ))}
                </motion.div>
              </div>
            )}

            {featured.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-2"
              >
                {featured.map((item) => (
                  <HotelCard key={item.listing.id} hotel={hotels.find((h) => h.id === item.listing.id)!} reason={item.reason} large />
                ))}
              </motion.div>
            )}

            {recommended.length > 0 && (
              <div className="mb-12">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-heading text-text-primary">
                      Recommended for you
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Top-rated options in {effectiveCity || effectiveCountry.name}.
                    </p>
                  </div>
                </div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {recommended.map((item) => (
                    <HotelCard key={item.listing.id} hotel={hotels.find((h) => h.id === item.listing.id)!} reason={item.reason} />
                  ))}
                </motion.div>
              </div>
            )}

            {gridHotels.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold font-heading text-text-primary">
                  {effectiveCity ? `Hotels near ${effectiveCity}` : `Hotels in ${effectiveCountry.name}`}
                </h2>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {gridHotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} reason={ranked.find((r) => r.listing.id === hotel.id)?.reason ?? null} />
                  ))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function HotelCard({ hotel, large = false, reason = null }: { hotel: StayHotelSummary; large?: boolean; reason?: RecommendationReason | null }) {
  const icons = amenityIconsFor(hotel.amenities);
  return (
    <motion.div variants={fadeIn}>
      <Link
        href={`/stays/${hotel.id}`}
        className={`group block overflow-hidden rounded-2xl bg-white dark:bg-dark-200 border border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
          large ? "lg:flex" : ""
        }`}
      >
        <div className={`relative overflow-hidden ${large ? "lg:w-1/2" : ""}`}>
          <img
            src={hotel.galleryImages[0] ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
            alt={hotel.name}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${large ? "h-64 lg:h-full" : "h-52"}`}
          />
          {reason && (
            <span className="absolute left-3 top-3">
              <RecommendationBadge reason={reason} />
            </span>
          )}
          {!reason && hotel.isFeatured && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>
        <div className={`flex flex-1 flex-col p-5 ${large ? "lg:p-7" : ""}`}>
          <div className="flex items-center gap-1 text-amber-500">
            {"★".repeat(Math.max(1, Math.min(5, hotel.starRating || 1))).split("").map((s, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500" />
            ))}
          </div>
          <h3 className={`mt-2 font-semibold text-text-primary group-hover:text-amber-600 transition-colors ${large ? "text-2xl" : "text-lg"}`}>
            {hotel.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <MapPin className="w-4 h-4 shrink-0" />
            {hotel.city}, {hotel.country}
          </p>
          {large && (
            <p className="mt-3 text-sm text-text-secondary line-clamp-2">{hotel.shortDescription}</p>
          )}
          {icons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {icons.map((item) => (
                <span key={item.label} className="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-text-secondary">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xl font-bold font-mono tabular-nums text-text-primary">
                {formatMoneySymbol(hotel.priceFrom, hotel.currencyCode)}
              </span>
              <span className="text-sm text-text-secondary"> /night</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1">
              <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {hotel.rating.toFixed(1)}
              </span>
              <span className="text-xs text-text-tertiary">({hotel.reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}