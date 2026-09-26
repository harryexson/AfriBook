"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Heart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { imageFor } from "@/lib/images";
import { openingStatus } from "@/lib/opening-hours";
import { COUNTRIES } from "@/lib/localization/countries";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
  const status = openingStatus(
    business.hours,
    COUNTRIES[business.countryCode]?.timezone,
  );
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
      <Link href={linkHref} className="group block">
        <Card padding="none" interactive className="overflow-hidden rounded-[28px]">
          <div className="relative h-44 overflow-hidden bg-surface-secondary">
            <img
              src={imageFor(business.id, business.category, business.media?.coverUrl, {
                width: 440,
                ratio: 0.62,
                // The name is where the specific trade shows up — "Victory
                // Barbers" under a generic "Beauty & Wellness" category.
                subject: business.name,
              })}
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsFav(!isFav);
              }}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full transition-colors z-10 shadow-sm",
                isFav
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-text-secondary hover:text-red-500",
              )}
            >
              <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
            </button>
            {business.deliveryAvailable && (
              <Badge variant="success" className="absolute top-3 left-3 bg-emerald-500 text-white border-transparent">
                Delivery
              </Badge>
            )}
          </div>

          <div className="p-5">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              {business.category}
            </span>
            <h3 className="text-lg font-bold text-text-primary mt-0.5 group-hover:text-amber-500 transition-colors">
              {business.name}
            </h3>

            <div className="flex items-center gap-3 mt-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono tabular-nums">{business.rating.toFixed(1)}</span>
                <span className="text-text-tertiary font-mono tabular-nums">
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

            {/* The status block wraps as a whole rather than truncating: the
                zone label is the one part a cross-border viewer actually needs,
                so it must never be the thing that gets clipped off the end. */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-4">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-tertiary">
                {status.todayLabel ? (
                  <>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                        status.isOpen
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-surface-tertiary text-text-secondary',
                      )}
                    >
                      {status.isOpen ? 'Open' : 'Closed'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="h-3 w-3 shrink-0" />
                      {status.todayLabel}
                      {status.zoneLabel && <span>{status.zoneLabel}</span>}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2 py-0.5 text-xs font-semibold text-text-secondary">
                    Closed today
                  </span>
                )}
              </span>
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition-opacity group-hover:opacity-90">
                Book Now
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
