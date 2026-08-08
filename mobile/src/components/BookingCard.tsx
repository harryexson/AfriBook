import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, borderRadius, spacing, typography, shadows } from "../theme";
import type { Booking, BookingStatus } from "../types";
import Badge from "./ui/Badge";
import { useMarketStore } from "../stores/market-store";
import { formatMoney } from "../lib/money";

interface BookingCardProps {
  booking: Booking;
  businessName?: string;
  serviceName?: string;
  onPress?: () => void;
}

const STATUS_VARIANT: Record<
  BookingStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  pending: "warning",
  confirmed: "info",
  in_progress: "info",
  completed: "success",
  cancelled: "error",
  no_show: "error",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export default function BookingCard({
  booking,
  businessName,
  serviceName,
  onPress,
}: BookingCardProps) {
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const date = new Date(booking.startTime);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.datePill}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.time}>{timeStr}</Text>
        </View>
        <Badge
          label={STATUS_LABEL[booking.status]}
          variant={STATUS_VARIANT[booking.status]}
        />
      </View>

      <View style={styles.body}>
        {businessName && (
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
        )}
        {serviceName && (
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.amount}>
            {formatMoney(booking.amount, currencyCode)}
          </Text>
          {booking.notes && (
            <Text style={styles.notes} numberOfLines={1}>
              📝 {booking.notes}
            </Text>
          )}
        </View>
        <Text style={styles.statusHelp}>Tap to manage</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    ...shadows.lg,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  datePill: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  date: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  body: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  businessName: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "800",
    color: colors.textPrimary,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  amount: {
    fontSize: typography.fontSize.xl,
    fontWeight: "800",
    color: colors.primary,
  },
  notes: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  statusHelp: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
