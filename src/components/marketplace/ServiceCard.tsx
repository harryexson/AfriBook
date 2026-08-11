"use client";

import { motion } from "framer-motion";
import { Clock, Users, ArrowRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  businessSlug?: string;
  countryCode?: string;
  staffCount?: number;
  onBook?: (service: Service) => void;
  index?: number;
}

export default function ServiceCard({
  service,
  countryCode = "NG",
  staffCount = 0,
  onBook,
  index = 0,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.04,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className="group bg-surface border border-border rounded-[26px] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-amber-400/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-text-primary group-hover:text-amber-500 transition-colors truncate">
            {service.name}
          </h4>
          {service.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {service.description}
            </p>
          )}
        </div>
        {service.image && (
          <div className="w-16 h-16 rounded-xl bg-surface-secondary shrink-0 overflow-hidden">
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" />
          {service.duration} min
        </span>
        {staffCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            {staffCount} staff
          </span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-lg font-bold text-text-primary">
          {formatCurrency(service.price, service.currencyCode ?? countryCode)}
        </span>
        <button
          onClick={() => onBook?.(service)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all",
            onBook
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
              : "text-amber-500 hover:gap-2",
          )}
        >
          Book
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
