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
import DestinationSelector, { DestinationChip } from "@/components/shared/DestinationSelector";
import { useDestinationStore } from "@/stores/destination-store";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import IconTile from "@/components/ui/IconTile";
import CuisineIcon from "@/components/food/CuisineIcon";
import { imageSourceFor } from "@/lib/media/images";

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
  const { countryCode, country } = useCountry();
  const destination = useDestinationStore((s) => s.destination);

  // Country comes solely from CountryProvider — see stays/page.tsx for
  // why the destination store no longer carries its own countryCode.
  const effectiveCountryCode = countryCode;
  const effectiveCountry = country;

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
      <section className="relative overflow-hidden bg-[#f7eee3] pt-24 md:pt-28 pb-10 border-b border-border-light">
        <img src="/food/local.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7eee3_20%,#f7eee3ed_45%,#f7eee300_100%)]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <p className="text-[10px] tracking-[.2em] uppercase text-amber-800 font-semibold">Good food. Close to home.</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-[-.045em] text-[#291b13]">Your next favourite<br />is around the corner.</h1>
          <p className="mt-4 text-sm text-text-secondary max-w-sm">Local kitchens, familiar flavours and something new to try.</p>
          <div className="mt-5"><DestinationChip onOpen={() => setDestinationOpen(true)} /></div>
          <div className="mt-5 flex gap-2 max-w-xl rounded-xl border border-border-light bg-white p-2 shadow-sm">
            <div className="relative flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-text-secondary" /><input aria-label="Search restaurants or dishes" placeholder="Search restaurants or dishes" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-transparent py-3 pl-10 pr-2 text-sm outline-none" /></div>
            <button onClick={handleUseLocation} disabled={locating} aria-label="Use my location" className="rounded-lg bg-[#fff0e3] px-3 text-amber-800"><Navigation size={18} /></button>
          </div>
        </div>
      </section>

      {/* Cuisine categories */}
      <section className="border-b border-border bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-5 overflow-x-auto pb-1">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="flex shrink-0 flex-col items-center gap-2"
                >
                  <IconTile
                    size="lg"
                    className={
                      active
                        ? undefined
                        : "bg-none bg-surface-secondary text-text-tertiary border border-border"
                    }
                  >
                    {category === "All" ? (
                      <Sparkles className="w-6 h-6" />
                    ) : (
                      <CuisineIcon cuisine={category} className="w-6 h-6" />
                    )}
                  </IconTile>
                  <span
                    className={`text-xs font-medium ${active ? "text-amber-600" : "text-text-secondary"}`}
                  >
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sort */}
      <section className="sticky top-16 md:top-20 z-20 border-b border-border bg-surface/95 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end">
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
              {filteredRestaurants.map((restaurant) => {
                const photo = imageSourceFor(restaurant.id, restaurant.cuisineType, null, {
                  width: 640,
                  ratio: 0.56,
                });
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
                    <Link href={`/food/${restaurant.id}`} className="group block h-full">
                      <Card padding="none" interactive className="overflow-hidden">
                        <div className="relative h-52 overflow-hidden bg-surface-secondary">
                          <img
                            src={photo}
                            alt={restaurant.name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                          <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                            {priceRange}
                          </div>
                          <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                            {deliveryFeeText} delivery
                          </div>
                        </div>

                        <div className="space-y-5 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold text-text-primary transition group-hover:text-amber-600">
                                {restaurant.name}
                              </h3>
                              <p className="mt-1 text-sm text-text-secondary">
                                {restaurant.cuisineType}
                              </p>
                            </div>
                            <Badge variant="amber" icon={<Star className="h-3.5 w-3.5" />}>
                              {restaurant.rating.toFixed(1)}
                            </Badge>
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
                            <Badge variant="amber">{restaurant.cuisineType}</Badge>
                            <Badge variant="neutral" icon={<UtensilsCrossed className="h-3 w-3" />}>
                              Order food
                            </Badge>
                          </div>
                        </div>
                      </Card>
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

      <FeaturedRestaurants restaurants={restaurants} />
    </div>
  );
}
