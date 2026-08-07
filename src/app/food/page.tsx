"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  ChevronDown,
  Navigation,
  Sparkles,
} from "lucide-react";
import FeaturedRestaurants from "@/components/food/FeaturedRestaurants";
import PhoneMockup from "@/components/showcase/PhoneMockup";
import { FoodAppScreen } from "@/components/showcase/AppScreens";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const categories = [
  "All",
  "Fast Food",
  "Nigerian",
  "Ethiopian",
  "Moroccan",
  "Seafood",
  "Vegetarian",
  "Chinese",
];

const sortOptions = [
  "Recommended",
  "Rating",
  "Delivery Time",
  "Price",
] as const;
type SortOption = (typeof sortOptions)[number];

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string[];
  rating: number;
  deliveryTime: string;
  deliveryTimeMinutes: number;
  deliveryFee: string;
  priceRange: string;
  location: string;
  initials: string;
  featured: boolean;
  gradient: string;
}

const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Mama Nkechi's Kitchen",
    cuisine: "Nigerian",
    category: ["Nigerian"],
    rating: 4.9,
    deliveryTime: "25-35 min",
    deliveryTimeMinutes: 30,
    deliveryFee: "$1.50",
    priceRange: "$$",
    location: "Lekki, Lagos",
    initials: "MN",
    featured: true,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "2",
    name: "Carnivore Nairobi",
    cuisine: "Kenyan / BBQ",
    category: ["Seafood"],
    rating: 4.8,
    deliveryTime: "30-40 min",
    deliveryTimeMinutes: 35,
    deliveryFee: "$2.00",
    priceRange: "$$$",
    location: "Westlands, Nairobi",
    initials: "CN",
    featured: true,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "3",
    name: "Addis in Cape",
    cuisine: "Ethiopian",
    category: ["Ethiopian"],
    rating: 4.7,
    deliveryTime: "30-45 min",
    deliveryTimeMinutes: 37,
    deliveryFee: "$1.80",
    priceRange: "$$",
    location: "Woodstock, Cape Town",
    initials: "AC",
    featured: false,
    gradient: "from-yellow-500 to-amber-600",
  },
  {
    id: "4",
    name: "Medina Grill",
    cuisine: "Moroccan",
    category: ["Moroccan"],
    rating: 4.6,
    deliveryTime: "35-50 min",
    deliveryTimeMinutes: 42,
    deliveryFee: "$2.20",
    priceRange: "$$",
    location: "Guéliz, Marrakech",
    initials: "MG",
    featured: false,
    gradient: "from-red-500 to-rose-600",
  },
  {
    id: "5",
    name: "Lagos Street Bites",
    cuisine: "Fast Food / Nigerian",
    category: ["Fast Food", "Nigerian"],
    rating: 4.5,
    deliveryTime: "15-25 min",
    deliveryTimeMinutes: 20,
    deliveryFee: "$0.99",
    priceRange: "$",
    location: "Victoria Island, Lagos",
    initials: "LB",
    featured: false,
    gradient: "from-orange-500 to-red-600",
  },
  {
    id: "6",
    name: "Zanzibar Spice House",
    cuisine: "Seafood / Tanzanian",
    category: ["Seafood"],
    rating: 4.8,
    deliveryTime: "30-40 min",
    deliveryTimeMinutes: 35,
    deliveryFee: "$1.70",
    priceRange: "$$",
    location: "Stone Town, Zanzibar",
    initials: "ZS",
    featured: true,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "7",
    name: "Green Leaf Vegan",
    cuisine: "Vegetarian / Pan-African",
    category: ["Vegetarian"],
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryTimeMinutes: 30,
    deliveryFee: "$1.40",
    priceRange: "$$",
    location: "Kigali, Rwanda",
    initials: "GL",
    featured: false,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "8",
    name: "Dragon Wok Accra",
    cuisine: "Chinese / West African Fusion",
    category: ["Chinese"],
    rating: 4.3,
    deliveryTime: "20-30 min",
    deliveryTimeMinutes: 25,
    deliveryFee: "$1.30",
    priceRange: "$",
    location: "Osu, Accra",
    initials: "DW",
    featured: false,
    gradient: "from-purple-500 to-violet-600",
  },
  {
    id: "9",
    name: "Buka Hut",
    cuisine: "Ghanaian",
    category: ["Nigerian", "Fast Food"],
    rating: 4.6,
    deliveryTime: "20-30 min",
    deliveryTimeMinutes: 25,
    deliveryFee: "$1.20",
    priceRange: "$",
    location: "East Legon, Accra",
    initials: "BH",
    featured: false,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "10",
    name: "Spice Route Kigali",
    cuisine: "Pan-African",
    category: ["Moroccan", "Ethiopian"],
    rating: 4.8,
    deliveryTime: "35-45 min",
    deliveryTimeMinutes: 40,
    deliveryFee: "$2.50",
    priceRange: "$$$",
    location: "Kigali, Rwanda",
    initials: "SR",
    featured: true,
    gradient: "from-indigo-500 to-blue-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "fill-amber-500 text-amber-500"
              : "text-text-tertiary"
          }`}
        />
      ))}
    </div>
  );
}

export default function FoodPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

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
          r.cuisine.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((r) => r.category.includes(selectedCategory));
    }

    switch (sortBy) {
      case "Rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "Delivery Time":
        result.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes);
        break;
      case "Price":
        result.sort((a, b) => a.priceRange.length - b.priceRange.length);
        break;
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_68%_12%,rgba(255,132,93,0.18),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_12%_92%,rgba(245,158,11,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,14,20,0.88),rgba(15,14,20,0.9))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
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

              <motion.div
                variants={fadeIn}
                className="mt-10 flex flex-col gap-4 sm:flex-row"
              >
                <button
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-amber-950 shadow-gold-lg transition-colors hover:bg-amber-400 disabled:opacity-60"
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
                  { label: "Restaurants", value: "5,000+" },
                  { label: "Avg. delivery", value: "28 min" },
                  { label: "Rating", value: "4.8★" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl bg-white/5 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl"
                  >
                    <p className="text-2xl font-semibold text-white">
                      {stat.value}
                    </p>
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
                      25-35 min
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
                <p className="text-xs text-white/50">Order total</p>
                <p className="text-sm font-semibold text-white">
                  3 items · $24.50
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
                  <Truck className="h-3 w-3" /> Free delivery
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
              Discover restaurants near you
            </h2>
            <p className="mt-2 text-base text-text-secondary">
              {filteredRestaurants.length} restaurant
              {filteredRestaurants.length !== 1 ? "s" : ""} found
              {selectedCategory !== "All" && ` in ${selectedCategory}`}.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                variants={fadeIn}
                className="group overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
              >
                <div
                  className={`relative h-52 bg-gradient-to-br ${restaurant.gradient} overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_35%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.15),_transparent_40%)]" />
                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                    {restaurant.priceRange}
                  </div>
                  <div className="absolute right-5 top-5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-amber-950 shadow-sm">
                    {restaurant.deliveryFee}
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary transition group-hover:text-amber-500">
                        {restaurant.name}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {restaurant.cuisine}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600">
                      <Star className="h-4 w-4" />
                      {restaurant.rating}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                      <p className="font-semibold text-text-primary">
                        Delivery
                      </p>
                      <p>{restaurant.deliveryTime}</p>
                    </div>
                    <div className="rounded-3xl bg-surface-secondary px-4 py-3 text-sm text-text-secondary">
                      <p className="font-semibold text-text-primary">
                        Location
                      </p>
                      <p>{restaurant.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {restaurant.category.slice(0, 2).map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filteredRestaurants.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-text-secondary">
                No restaurants found. Try a different search or category.
              </p>
            </div>
          )}
        </div>
      </section>

      <FeaturedRestaurants />
    </div>
  );
}
