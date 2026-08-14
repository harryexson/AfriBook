"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Clock,
  Truck,
  ChevronDown,
  Navigation,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import FeaturedRestaurants from "@/components/food/FeaturedRestaurants";
import PhoneMockup from "@/components/showcase/PhoneMockup";
import { FoodAppScreen } from "@/components/showcase/AppScreens";
import { formatMoneySymbol } from "@/lib/money";
import { useCountry } from "@/components/shared/CountryProvider";
import { COUNTRIES } from "@/lib/localization/countries";
import DestinationSelector, { DestinationChip } from "@/components/shared/DestinationSelector";
import { useDestinationStore } from "@/stores/destination-store";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export interface RestaurantSummary {
  id: string;
  businessId: string;
  name: string;
  description: string;
  cuisineType: string;
  rating: number;
  preparationTime: number;
  deliveryRadiusKm: number;
  minimumOrder: number;
  deliveryFee: number;
  currency: string;
  countryCode: string;
  address: string;
}

const sortOptions = ["Recommended", "Rating", "Delivery Time", "Price"] as const;
type SortOption = (typeof sortOptions)[number];

export default function FoodPage() {
  const { countryCode } = useCountry();
  const destination = useDestinationStore((s) => s.destination);

  // The destination store is the source of truth once a user picks one.
  const effectiveCountryCode = destination.countryCode || countryCode;
  const effectiveCountry = COUNTRIES[effectiveCountryCode];

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ country: effectiveCountryCode });
        if (destination.city) params.set("city", destination.city);
        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load restaurants");
        setRestaurants(json.data?.restaurants ?? []);
        setSelectedCategory("All");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [effectiveCountryCode, destination.city]);

  const categories = useMemo(() => {
    const cuisineSet = new Set<string>(restaurants.map((r) => r.cuisineType));
    return ["All", ...Array.from(cuisineSet).sort()];
  }, [restaurants]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(
          `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        );
        setLocating(false);
      },
      () => {
        setUserLocation("Location unavailable");
        setLocating(false);
      },
    );
  };

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((r) => r.cuisineType === selectedCategory);
    }

    switch (sortBy) {
      case "Rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "Delivery Time":
        result.sort((a, b) => a.preparationTime - b.preparationTime);
        break;
      case "Price":
        result.sort((a, b) => a.minimumOrder - b.minimumOrder);
        break;
      default:
        result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [restaurants, searchQuery, selectedCategory, sortBy]);

  const averageDelivery = useMemo(() => {
    if (!restaurants.length) return 0;
    const total = restaurants.reduce((sum, r) => sum + r.preparationTime, 0);
    return Math.round(total / restaurants.length);
  }, [restaurants]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_68%_12%,rgba(255,132,93,0.18),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_12%_92%,rgba(245,158,11,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,14,20,0.88),rgba(15,14,20,0.9))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.span
                variants={fadeIn}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AfriBook Food
              </motion.span>
              <motion.h1
                variants={fadeIn}
                className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl"
              >
                Discover the best restaurants,
                <span className="block bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500 bg-clip-text text-transparent">
                  delivered fast.
                </span>
              </motion.h1>
              <motion.p
                variants={fadeIn}
                className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
              >
                Browse premium local cuisine, schedule delivery, and order from
                trusted kitchens across Africa. The fastest, safest food
                delivery experience in one app.
              </motion.p>

              <motion.div variants={fadeIn} className="mt-8">
                <DestinationChip onOpen={() => setDestinationOpen(true)} />
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="mt-6 flex flex-col gap-4 sm:flex-row"
              >
                <button
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-60"
                >
                  <Navigation className="h-4 w-4" />
                  {locating
                    ? "Locating..."
                    : userLocation
                      ? "Location set"
                      : "Use my location"}
                </button>
                <div className="relative flex-1 sm:max-w-lg">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search restaurants or dishes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 py-4 pl-14 pr-4 text-white placeholder:text-white/45 shadow-[0_10px_40px_rgba(0,0,0,0.12)] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                className="mt-10 flex flex-wrap items-center gap-6"
              >
                {[
                  { label: "Restaurants", value: `${restaurants.length}+` },
                  { label: "Avg. prep", value: `${averageDelivery} min` },
                  {
                    label: "Rating",
                    value: restaurants.length
                      ? `${(
                          restaurants.reduce((s, r) => s + r.rating, 0) /
                          restaurants.length
                        ).toFixed(1)}★`
                      : "—",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl bg-white/5 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl"
                  >
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/50">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.25 }}
              className="relative flex justify-center"
            >
              <PhoneMockup glow="rose">
                <FoodAppScreen />
              </PhoneMockup>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute -left-6 top-24 hidden rounded-[2rem] border border-white/10 bg-dark-800/90 p-4 shadow-2xl backdrop-blur-xl sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-3xl bg-rose-500/15 text-rose-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {averageDelivery || 25}-{averageDelivery + 10 || 35} min
                    </p>
                    <p className="text-xs text-white/50">Fastest delivery</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-6 bottom-24 hidden rounded-[2rem] border border-white/10 bg-dark-800/90 p-4 shadow-2xl backdrop-blur-xl sm:block"
              >
                <p className="text-xs text-white/50">Kitchens online</p>
                <p className="text-sm font-semibold text-white">
                  {restaurants.length} restaurants
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
                  <Truck className="h-3 w-3" /> Delivery available
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Filters & Sort */}
      <section className="sticky top-0 z-20 border-b border-border bg-surface/95 py-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mb-1 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-amber-500 text-white shadow-[0_18px_50px_rgba(245,158,11,0.18)]"
                      : "border border-border bg-surface-secondary text-text-secondary hover:border-amber-500/40 hover:text-text-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 rounded-3xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:border-amber-500/40"
              >
                {sortBy}
                <ChevronDown className="h-4 w-4 text-text-tertiary" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        sortBy === option
                          ? "bg-amber-500/10 font-semibold text-amber-600"
                          : "text-text-secondary hover:bg-surface-secondary"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold text-text-primary">
              📍 Restaurants near{" "}
              {destination.neighborhood ||
                destination.city ||
                effectiveCountry?.name}
            </h2>
            <p className="mt-2 text-base text-text-secondary">
              {loading
                ? "Loading restaurants..."
                : error
                  ? "Could not load restaurants."
                  : `${filteredRestaurants.length} restaurant${filteredRestaurants.length !== 1 ? "s" : ""} found${selectedCategory !== "All" ? ` in ${selectedCategory}` : ""} in ${
                      destination.city
                        ? `${destination.city}, ${effectiveCountry?.name}`
                        : effectiveCountry?.name
                    }.`}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-[2rem] border border-border bg-surface-secondary"
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredRestaurants.map((restaurant, i) => {
                const gradients = [
                  "from-amber-500 to-orange-600",
                  "from-emerald-500 to-teal-600",
                  "from-yellow-500 to-amber-600",
                  "from-red-500 to-rose-600",
                  "from-cyan-500 to-blue-600",
                  "from-purple-500 to-violet-600",
                  "from-pink-500 to-rose-600",
                  "from-indigo-500 to-blue-600",
                ];
                const gradient = gradients[i % gradients.length];
                const initials = restaurant.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const priceRange =
                  restaurant.minimumOrder > 0
                    ? `Min ${formatMoneySymbol(restaurant.minimumOrder, restaurant.currency)}`
                    : "No minimum";
                const deliveryFeeText =
                  restaurant.deliveryFee > 0
                    ? formatMoneySymbol(restaurant.deliveryFee, restaurant.currency)
                    : "Free";
                return (
                  <motion.div key={restaurant.id} variants={fadeIn}>
                    <Link
                      href={`/food/${restaurant.id}`}
                      className="group block h-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
                    >
                      <div
                        className={`relative h-52 bg-gradient-to-br ${gradient} overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_35%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.15),_transparent_40%)]" />
                        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                          {priceRange}
                        </div>
                        <div className="absolute right-5 top-5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-amber-950 shadow-sm">
                          {deliveryFeeText} delivery
                        </div>
                        <div className="absolute bottom-5 left-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-lg font-bold text-white backdrop-blur-md">
                          {initials}
                        </div>
                      </div>

                      <div className="space-y-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-text-primary transition group-hover:text-amber-500">
                              {restaurant.name}
                            </h3>
                            <p className="mt-1 text-sm text-text-secondary">
                              {restaurant.cuisineType}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600">
                            <Star className="h-4 w-4" />
                            {restaurant.rating.toFixed(1)}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary">Prep time</p>
                            <p>{restaurant.preparationTime}-{restaurant.preparationTime + 10} min</p>
                          </div>
                          <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary">Location</p>
                            <p className="truncate">{restaurant.address}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                            {restaurant.cuisineType}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-text-secondary">
                            <UtensilsCrossed className="h-3 w-3" />
                            Order food
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && filteredRestaurants.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-text-secondary">
                No restaurants found{" "}
                {destination.city
                  ? `near ${destination.city}, ${effectiveCountry?.name}`
                  : `in ${effectiveCountry?.name}`}
                . Try a different destination, search, or category.
              </p>
            </div>
          )}
        </div>
      </section>

      <DestinationSelector open={destinationOpen} onClose={() => setDestinationOpen(false)} />

      <FeaturedRestaurants />
    </div>
  );
}
