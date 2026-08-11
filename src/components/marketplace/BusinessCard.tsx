"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Heart, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Business } from "@/types";

interface BusinessCardProps {
  business: Business;
  countryCode?: string;
  href?: string;
  index?: number;
}

export default function BusinessCard({
  business,
  countryCode = "NG",
  href,
  index = 0,
}: BusinessCardProps) {
  const [isFav, setIsFav] = useState(false);

  const linkHref = href ?? `/${countryCode}/business/${business.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
    >
      <Link
        href={linkHref}
        className="group block rounded-[34px] overflow-hidden border border-border bg-surface/95 shadow-[0_24px_70px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_100px_rgba(15,23,42,0.18)] hover:border-amber-400/30"
      >
        <div className="relative h-44 overflow-hidden bg-surface-secondary">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/10 via-transparent to-transparent" />
          {business.media?.coverUrl ? (
            <img
              src={business.media.coverUrl}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-500">
                {business.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFav(!isFav);
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-xl backdrop-blur-sm transition-all z-10 shadow-sm",
              isFav
                ? "bg-red-500 text-white"
                : "bg-white/90 text-text-secondary hover:text-red-500",
            )}
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
          </button>
          {business.deliveryAvailable && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-emerald-500/90 text-white text-xs font-semibold backdrop-blur-sm">
              Delivery
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                {business.category}
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-0.5 group-hover:text-amber-500 transition-colors">
                {business.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {business.rating.toFixed(1)}
              <span className="text-text-tertiary">
                ({business.reviewCount})
              </span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {business.address?.city ?? "Nearby"}
            </span>
          </div>

          {business.address?.formatted && (
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">
              {business.address.formatted}
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1 text-sm text-text-tertiary">
              <Clock className="w-3 h-3" />
              {business.hours?.length
                ? `${business.hours[0].open} - ${business.hours[0].close}`
                : "Open now"}
            </span>
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-all group-hover:bg-amber-100">
              Book Now
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
