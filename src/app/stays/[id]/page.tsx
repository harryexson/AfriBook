"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Star,
  MapPin,
  BedDouble,
  Users,
  Check,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Mailbox,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { useCountry } from "@/components/shared/CountryProvider";
import { formatMoneySymbol } from "@/lib/money";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

interface StayHotel {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  countryCode: string;
  address: string;
  starRating: number;
  propertyType: string;
  checkInTime: string;
  checkOutTime: string;
  galleryImages: string[];
  currencyCode: string;
  priceFrom: number;
  platformFeePercent: number;
  taxRate: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  contact: { phone: string; email: string };
}

interface StayRoom {
  id: string;
  hotelId: string;
  roomType: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedCount: number;
  bedType: string;
  bathrooms: number;
  sizeSqm: number | null;
  pricePerNight: number;
  currencyCode: string;
  minNights: number;
  quantity: number;
  photos: string[];
  amenities: string[];
}

interface Availability {
  available: boolean;
  pricePerNight?: number;
  currencyCode?: string;
  nights?: number;
  reason?: string;
  date?: string;
  remaining?: number;
}

interface StayBookingResult {
  bookingCode: string;
  currencyCode: string;
  total: number;
  status: string;
}

function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(Math.round(diff), 0);
}

export default function StayDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { country } = useCountry();

  const [hotel, setHotel] = useState<StayHotel | null>(null);
  const [rooms, setRooms] = useState<StayRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/stays/${params.id}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load stay");
        const data = json.data;
        setHotel(data.hotel ?? null);
        setRooms(data.rooms ?? []);
        if (data.rooms?.length) setSelectedRoomId(data.rooms[0].id);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCheckIn(toLocalDateInput(today));
        setCheckOut(toLocalDateInput(tomorrow));
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

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const currencyCode = selectedRoom?.currencyCode ?? hotel?.currencyCode ?? "NGN";

  const breakdown = useMemo(() => {
    if (!selectedRoom || nights <= 0) return null;
    const subtotal = selectedRoom.pricePerNight * nights;
    const platformFee = subtotal * ((hotel?.platformFeePercent ?? 3) / 100);
    const tax = subtotal * (hotel?.taxRate ?? 0);
    return {
      subtotal,
      platformFee,
      tax,
      total: subtotal + platformFee + tax,
      platformFeePercent: hotel?.platformFeePercent ?? 3,
      taxRate: hotel?.taxRate ?? 0,
    };
  }, [selectedRoom, nights, hotel]);

  const handleCheckAvailability = async () => {
    if (!selectedRoomId || !checkIn || !checkOut) return;
    setChecking(true);
    setAvailability(null);
    try {
      const res = await fetch(`/api/stays/${params.id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selectedRoomId, checkIn, checkOut, rooms: 1 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to check availability");
      setAvailability(json.data as Availability);
    } catch (err) {
      setAvailability({ available: false, reason: (err as Error).message });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoomId || !checkIn || !checkOut) return;
    if (!guestName.trim() || !guestEmail.trim()) {
      setSubmitError("Please provide your name and email.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/stays/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: params.id,
          roomId: selectedRoomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          guests,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create booking");
      const booking = json.data as StayBookingResult;
      router.push(`/stays/bookings/${booking.bookingCode}`);
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded-2xl bg-surface-secondary" />
          <div className="mt-6 h-80 animate-pulse rounded-[2rem] bg-surface-secondary" />
          <div className="mt-8 h-64 animate-pulse rounded-[2rem] bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-surface pt-24 pb-12">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-secondary">
            <BedDouble className="h-8 w-8 text-text-tertiary" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">Stay unavailable</h1>
          <p className="mt-1 text-sm text-text-secondary">{error ?? "This stay could not be found."}</p>
          <Link
            href="/stays"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to stays
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] overflow-hidden">
        <img
          src={hotel.galleryImages[0] ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600"}
          alt={hotel.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300/80 via-dark-300/20 to-transparent" />
        <div className="absolute left-4 top-20 sm:left-6 lg:left-8">
          <Link
            href="/stays"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-sm font-medium text-dark-300 shadow hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All stays
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="flex items-center gap-1 text-amber-400">
              {"★".repeat(Math.max(1, Math.min(5, hotel.starRating || 1))).split("").map((s, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>
            <h1 className="mt-2 text-3xl font-bold font-heading text-white sm:text-4xl">{hotel.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {hotel.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                {hotel.rating.toFixed(1)} ({hotel.reviewCount} reviews)
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left: description + rooms */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-white dark:bg-dark-200 p-6">
              <h2 className="text-xl font-bold font-heading text-text-primary">About this property</h2>
              <p className="mt-3 text-text-secondary leading-relaxed">{hotel.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {hotel.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <h2 className="mt-10 text-2xl font-bold font-heading text-text-primary">Available rooms</h2>
            <div className="mt-5 space-y-4">
              {rooms.length === 0 && (
                <p className="rounded-2xl border border-border bg-surface-secondary p-6 text-text-secondary">
                  No rooms currently available for this stay.
                </p>
              )}
              {rooms.map((room) => {
                const selected = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left rounded-2xl border bg-white dark:bg-dark-200 p-5 transition-all ${
                      selected ? "border-amber-500 ring-2 ring-amber-500/30" : "border-border hover:border-amber-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img
                        src={room.photos[0] ?? hotel.galleryImages[0]}
                        alt={room.name}
                        className="h-32 w-full rounded-xl object-cover sm:w-44"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">{room.name}</h3>
                            <p className="text-xs uppercase tracking-wider text-text-tertiary">{room.roomType}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-text-primary">
                              {formatMoneySymbol(room.pricePerNight, room.currencyCode)}
                            </p>
                            <p className="text-xs text-text-secondary">/night</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary line-clamp-2">{room.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> Sleeps {room.maxOccupancy}
                          </span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-4 h-4" /> {room.bedType} bed
                          </span>
                          {room.sizeSqm ? <span>{room.sizeSqm} m²</span> : null}
                          <span>{room.bathrooms} bath</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {room.amenities.slice(0, 4).map((a) => (
                            <span key={a} className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-text-secondary">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-white dark:bg-dark-200 p-6">
              <h2 className="text-xl font-bold font-heading text-text-primary">Host contact</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:gap-6">
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {hotel.contact.phone}
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {hotel.contact.email}
                </span>
              </div>
            </div>
          </div>

          {/* Right: booking panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-white dark:bg-dark-200 shadow-lg p-6">
              <h2 className="text-lg font-bold font-heading text-text-primary">Book your stay</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {country.flag} {hotel.city}, {hotel.country}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={toLocalDateInput(new Date())}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      setAvailability(null);
                    }}
                    className="mt-1 w-full rounded-xl bg-surface-secondary border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || toLocalDateInput(new Date())}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      setAvailability(null);
                    }}
                    className="mt-1 w-full rounded-xl bg-surface-secondary border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium text-text-secondary">Guests</label>
                <div className="mt-1 flex items-center justify-between rounded-xl bg-surface-secondary border border-border px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-text-primary">
                    <Users className="w-4 h-4 text-text-tertiary" />
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-white dark:bg-dark-300 border border-border text-lg text-text-primary hover:bg-surface-tertiary transition-colors"
                      aria-label="Decrease guests"
                    >
                      −
                    </button>
                    <button
                      onClick={() => setGuests((g) => Math.min(selectedRoom?.maxOccupancy ?? 8, g + 1))}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-white dark:bg-dark-300 border border-border text-lg text-text-primary hover:bg-surface-tertiary transition-colors"
                      aria-label="Increase guests"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckAvailability}
                disabled={checking || !checkIn || !checkOut}
                className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 shadow-gold transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                {checking ? "Checking…" : "Check availability"}
              </button>

              {availability && (
                <div
                  className={`mt-3 rounded-xl px-4 py-3 text-sm ${
                    availability.available
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {availability.available
                    ? `Available for ${availability.nights ?? nights} night${availability.nights === 1 ? "" : "s"}.`
                    : availability.reason ?? "This room is unavailable for the selected dates."}
                </div>
              )}

              {breakdown && (
                <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>
                      {formatMoneySymbol(breakdown.subtotal, currencyCode)} × {nights} night{nights === 1 ? "" : "s"}
                    </span>
                    <span className="text-text-primary">{formatMoneySymbol(breakdown.subtotal, currencyCode)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Platform fee ({breakdown.platformFeePercent}%)</span>
                    <span>{formatMoneySymbol(breakdown.platformFee, currencyCode)}</span>
                  </div>
                  {breakdown.taxRate > 0 && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Taxes ({breakdown.taxRate}%)</span>
                      <span>{formatMoneySymbol(breakdown.tax, currencyCode)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-text-primary">
                    <span>Total</span>
                    <span>{formatMoneySymbol(breakdown.total, currencyCode)}</span>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl bg-surface-secondary border border-border pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <Mailbox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-xl bg-surface-secondary border border-border pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full rounded-xl bg-surface-secondary border border-border pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Special requests (optional)"
                    rows={2}
                    className="w-full rounded-xl bg-surface-secondary border border-border pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {submitError && (
                <p className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedRoom || nights <= 0}
                className="mt-4 w-full rounded-xl bg-dark-300 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-dark-400 disabled:opacity-50"
              >
                {submitting ? "Booking…" : `Reserve · ${formatMoneySymbol(breakdown?.total ?? 0, currencyCode)}`}
              </button>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-text-tertiary">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                Your booking is held securely. No charge until you confirm on the next step.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}