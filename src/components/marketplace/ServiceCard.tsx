"use client";

import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
    >
      <Card interactive={false} padding="md" className="group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-text-primary transition-colors truncate">
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
            <span className="font-mono tabular-nums">{service.duration} min</span>
          </span>
          {staffCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="font-mono tabular-nums">{staffCount}</span> staff
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-lg font-bold font-mono tabular-nums text-text-primary">
            {formatCurrency(service.price, service.currencyCode ?? countryCode)}
          </span>
          <Button size="sm" onClick={() => onBook?.(service)}>
            Book
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
