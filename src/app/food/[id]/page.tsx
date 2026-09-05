"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  Flame,
  Leaf,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatMoneySymbol } from "@/lib/money";
import type { MenuItem } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface MenuCategory {
  id: string;
  businessId: string;
  name: string;
  description: string;
  sortOrder: number;
  items: MenuItem[];
}

interface RestaurantDetail {
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

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function RestaurantMenuPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useCartStore();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/restaurants/${params.id}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load restaurant");
        setRestaurant(json.data?.restaurant ?? null);
        setMenu(json.data?.menu ?? []);
        if (json.data?.menu?.length) {
          setActiveCategory(json.data.menu[0].id);
        }
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
  }, [params.id]);

  const cartIndexFor = useMemo(() => {
    const map = new Map<string, number>();
    store.items.forEach((item, i) => {
      if (item.type === "menu") map.set(item.item.id, i);
    });
    return map;
  }, [store.items]);

  const cartCount = store.itemCount();
  const cartTotal = store.total();
  const cartCurrency = useMemo(() => {
    const first = store.items.find((i) => i.type === "menu");
    return first?.type === "menu" ? first.item.currencyCode : restaurant?.currency ?? "USD";
  }, [store.items, restaurant]);

  const handleAdd = (item: MenuItem) => {
    const existingIndex = cartIndexFor.get(item.id);
    if (existingIndex !== undefined) {
      store.updateQuantity(existingIndex, store.items[existingIndex].quantity + 1);
    } else {
      store.addItem({ type: "menu", item, quantity: 1 });
    }
    setAddedId(item.id);
    window.setTimeout(() => setAddedId(null), 600);
  };

  const handleRemoveOne = (item: MenuItem) => {
    const existingIndex = cartIndexFor.get(item.id);
    if (existingIndex === undefined) return;
    const current = store.items[existingIndex].quantity;
    if (current <= 1) {
      store.removeItem(existingIndex);
    } else {
      store.updateQuantity(existingIndex, current - 1);
    }
  };

  const countFor = (itemId: string) => cartIndexFor.get(itemId) !== undefined
    ? store.items[cartIndexFor.get(itemId)!].quantity
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded-2xl bg-surface-secondary" />
          <div className="mt-6 h-64 animate-pulse rounded-[2rem] bg-surface-secondary" />
          <div className="mt-8 h-40 animate-pulse rounded-[2rem] bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-surface pt-24 pb-12">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-secondary">
            <ShoppingBag className="h-8 w-8 text-text-tertiary" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">Restaurant unavailable</h1>
          <p className="mt-1 text-sm text-text-secondary">{error ?? "This restaurant could not be found."}</p>
          <div className="mt-5 flex justify-center">
            <Button href="/food">
              <ChevronLeft className="h-4 w-4" />
              Back to restaurants
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = restaurant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <section className="relative overflow-hidden bg-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(45rem_45rem_at_75%_10%,rgba(245,158,11,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,14,20,0.9),rgba(15,14,20,0.95))]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-20 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-8 flex items-start gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl font-bold text-white shadow-gold-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {restaurant.name}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">{restaurant.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">{restaurant.rating.toFixed(1)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {restaurant.address}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Prep {restaurant.preparationTime}-{restaurant.preparationTime + 10} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  {restaurant.deliveryFee > 0
                    ? formatMoneySymbol(restaurant.deliveryFee, restaurant.currency)
                    : "Free"}{" "}
                  delivery
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      {menu.length > 1 && (
        <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {menu.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-amber-500 text-white"
                    : "border border-border bg-surface-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {menu.length === 0 && (
          <div className="rounded-[2rem] border border-border bg-surface-secondary p-10 text-center">
            <p className="text-lg text-text-secondary">Menu coming soon.</p>
          </div>
        )}

        {menu.map((category) => (
          <div
            key={category.id}
            id={category.id}
            className={`mb-10 scroll-mt-24 ${activeCategory && category.id !== activeCategory ? "hidden lg:block" : ""}`}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
                {category.name}
              </h2>
              {category.description && (
                <p className="mt-0.5 text-sm text-text-secondary">{category.description}</p>
              )}
            </div>

            <div className="space-y-3">
              {category.items.map((item) => {
                const count = countFor(item.id);
                const spicy = item.ingredients.some((i) => /chili|pepper|yaji|suya|spicy/i.test(i)) ||
                  item.description.toLowerCase().includes("spicy");
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                  >
                  <Card interactive={false} className="flex items-center justify-between gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="hidden h-20 w-20 shrink-0 rounded-2xl object-cover sm:block"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-text-primary">{item.name}</h3>
                        {spicy && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                            <Flame className="h-3 w-3" /> Spicy
                          </span>
                        )}
                        {item.dietaryTags?.includes("vegetarian") && (
                          <Badge variant="success" icon={<Leaf className="h-3 w-3" />}>
                            Veg
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                          {item.description}
                        </p>
                      )}
                      {item.allergens.length > 0 && (
                        <p className="mt-1 text-xs text-text-tertiary">
                          Allergens: {item.allergens.join(", ")}
                        </p>
                      )}
                      <p className="mt-2 text-lg font-bold text-amber-600">
                        {formatMoneySymbol(item.price, item.currencyCode)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {count === 0 ? (
                        <button
                          onClick={() => handleAdd(item)}
                          aria-label={`Add ${item.name} to cart`}
                          className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white shadow-gold transition hover:bg-amber-600 active:scale-95"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      ) : (
                        <div
                          className={`flex items-center gap-1 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-1 transition ${
                            addedId === item.id ? "ring-2 ring-amber-300" : ""
                          }`}
                        >
                          <button
                            onClick={() => handleRemoveOne(item)}
                            aria-label={`Remove one ${item.name}`}
                            className="grid h-8 w-8 place-items-center rounded-xl text-amber-600 transition hover:bg-amber-500/20"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold text-text-primary">
                            {count}
                          </span>
                          <button
                            onClick={() => handleAdd(item)}
                            aria-label={`Add one ${item.name}`}
                            className="grid h-8 w-8 place-items-center rounded-xl text-amber-600 transition hover:bg-amber-500/20"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-dark-800 px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-300">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-white/60">{formatMoneySymbol(cartTotal, cartCurrency)}</p>
              </div>
            </div>
            <Button onClick={() => router.push("/checkout")} size="lg">
              Checkout
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
