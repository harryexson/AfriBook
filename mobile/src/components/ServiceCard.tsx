import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, borderRadius, spacing, typography, shadows } from "../theme";
import type { Service } from "../types";
import Badge from "./ui/Badge";
import { useMarketStore } from "../stores/market-store";
import { formatMoney } from "../lib/money";

interface ServiceCardProps {
  service: Service;
  businessId: string;
}

export default function ServiceCard({ service, businessId }: ServiceCardProps) {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/book/${businessId}/${service.id}`)}
    >
      {service.image ? (
        <Image source={{ uri: service.image }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No image yet</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={styles.subtext} numberOfLines={1}>
              {service.description}
            </Text>
          </View>
          <Badge
            label={service.available ? "Available" : "Unavailable"}
            variant={service.available ? "success" : "default"}
            style={styles.availabilityBadge}
          />
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.duration}>
            ⏱ {formatDuration(service.duration)}
          </Text>
          <Text style={styles.price}>
            {formatMoney(service.price, currencyCode)}
          </Text>
        </View>
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
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  availabilityBadge: {
    alignSelf: "flex-start",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  duration: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  price: {
    fontSize: typography.fontSize["xl"],
    fontWeight: "800",
    color: colors.primary,
  },
});
