"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  MapPin,
  CalendarDays,
  Users,
  BedDouble,
  Star,
  ShieldCheck,
  Mail,
  Clock,
} from "lucide-react";
import { useCountry } from "@/components/shared/CountryProvider";
import { formatMoneySymbol } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";

interface StayBookingLookup {
  id: string;
  bookingCode: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  subtotal: number;
  platformFee: number;
  tax: number;
  total: number;
  currencyCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  hotel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    countryCode: string;
    coverImageUrl: string;
    galleryImages: string[];
    rating: number;
    reviewCount: number;
  } | null;
  room: {
    id: string;
    name: string;
    roomType: string;
    maxOccupancy: number;
    photos: string[];
  } | null;
}

export default function BookingConfirmationPage() {
  const params = useParams<{ code: string }>();
  const { country } = useCountry();

  const [booking, setBooking] = useState<StayBookingLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/stays/bookings/${params.code}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Booking not found");
        setBooking(json.data as StayBookingLookup);
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
  }, [params.code]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/stays/bookings/${params.code}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "demo" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to confirm booking");
      const updated = json.data?.booking as StayBookingLookup;
      if (updated) setBooking(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="h-40 animate-pulse rounded-[2rem] bg-surface-secondary" />
          <div className="mt-6 h-64 animate-pulse rounded-[2rem] bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface pt-24 pb-12">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-surface-secondary">
            <BedDouble className="h-8 w-8 text-text-tertiary" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">Booking not found</h1>
          <p className="mt-1 text-sm text-text-secondary">{error ?? "This booking could not be located."}</p>
          <Link
            href="/stays"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Browse stays
          </Link>
        </div>
      </div>
    );
  }

  const confirmed = booking.status === "confirmed";
  const coverImage = booking.hotel?.coverImageUrl || booking.room?.photos[0] || "";
  const currency = booking.currencyCode;

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Status banner */}
        <div
          className={cn(
            "rounded-2xl p-6 text-center",
            confirmed
              ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
          )}
        >
          {confirmed ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-amber-500" />
          )}
          <h1 className={cn("mt-4 text-2xl font-bold font-heading", confirmed ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
            {confirmed ? "Booking confirmed" : "Booking pending"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {confirmed
              ? "Your stay is booked. Check your email for details."
              : "Review your booking below and confirm to lock it in."}
          </p>
          <p className="mt-3 inline-block rounded-lg bg-white dark:bg-dark-300 px-3 py-1 font-mono text-sm font-semibold text-text-primary">
            Booking code: {booking.bookingCode}
          </p>
        </div>

        {/* Property card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white dark:bg-dark-200">
          {coverImage && (
            <img src={coverImage} alt={booking.hotel?.name ?? "Stay"} className="h-48 w-full object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-heading text-text-primary">
                  {booking.hotel?.name ?? "Your stay"}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4" />
                  {booking.hotel ? `${booking.hotel.city}, ${booking.hotel.country}` : ""}
                </p>
              </div>
              {booking.hotel && (
                <div className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1">
                  <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {booking.hotel.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {booking.room && (
              <div className="mt-4 rounded-xl bg-surface-secondary p-4">
                <div className="flex items-center gap-2 text-text-primary">
                  <BedDouble className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">{booking.room.name}</span>
                  <span className="text-xs uppercase tracking-wider text-text-tertiary">· {booking.room.roomType}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-text-secondary sm:grid-cols-4">
                  <div>
                    <p className="flex items-center gap-1 text-xs text-text-tertiary"><CalendarDays className="w-3.5 h-3.5" /> Check-in</p>
                    <p className="mt-0.5 font-medium text-text-primary">{formatDate(booking.checkInDate, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-text-tertiary"><CalendarDays className="w-3.5 h-3.5" /> Check-out</p>
                    <p className="mt-0.5 font-medium text-text-primary">{formatDate(booking.checkOutDate, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Nights</p>
                    <p className="mt-0.5 font-medium text-text-primary">{booking.nights}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-text-tertiary"><Users className="w-3.5 h-3.5" /> Guests</p>
                    <p className="mt-0.5 font-medium text-text-primary">{booking.guests}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>{formatMoneySymbol(booking.pricePerNight, currency)} × {booking.nights} night{booking.nights === 1 ? "" : "s"}</span>
                <span className="text-text-primary">{formatMoneySymbol(booking.subtotal, currency)}</span>
              </div>
              {booking.platformFee > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Platform fee</span>
                  <span>{formatMoneySymbol(booking.platformFee, currency)}</span>
                </div>
              )}
              {booking.tax > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Taxes</span>
                  <span>{formatMoneySymbol(booking.tax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-text-primary">
                <span>Total</span>
                <span>{formatMoneySymbol(booking.total, currency)}</span>
              </div>
            </div>

            {!confirmed ? (
              <div className="mt-6">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 shadow-gold transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {confirming ? "Confirming…" : `Confirm & pay ${formatMoneySymbol(booking.total, currency)}`}
                </button>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-text-tertiary">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  Demo checkout — no real charge is made on this transaction.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Payment {booking.paymentStatus} · {booking.paymentMethod ?? "confirmed"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Mail className="w-3.5 h-3.5" />
            Confirmation sent to <span className="text-text-secondary">{booking.guestName}</span>
          </p>
          <p className="text-xs text-text-tertiary">Serving {country.flag} {country.name}</p>
          <Link href="/stays" className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors">
            Back to all stays
          </Link>
        </div>
      </div>
    </div>
  );
}