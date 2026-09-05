import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, typography } from "../theme";
import { photoFor } from "../lib/images";
import type { Business } from "../types";

interface BusinessCardProps {
  business: Business;
  index?: number;
}

/**
 * Photography carries this card. Previously it laid a flat 24% black scrim
 * over every image (muddying the one piece of colour on screen), stacked a
 * gold category pill against a gold rating pill, and wrapped the whole thing
 * in both a border and a 42px shadow. Now: clean image, one floating category
 * chip, rating as inline type, and separation via whitespace.
 */
export default function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);

  const image = photoFor(
    business.id,
    business.category,
    business.media?.coverUrl ?? business.media?.galleryUrls?.[0],
    { width: 400, ratio: 0.62 },
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      accessibilityRole="button"
      onPress={() => router.push(`/business/${business.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: image }} style={styles.image} />

        <View style={styles.chip}>
          <Text style={styles.chipLabel} numberOfLines={1}>
            {business.category}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.favButton}
          onPress={() => setIsFav(!isFav)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isFav ? "Remove from saved" : "Save"}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={17}
            color={isFav ? colors.error : colors.textPrimary}
          />
        </TouchableOpacity>

        {business.deliveryAvailable ? (
          <View style={styles.deliveryChip}>
            <Ionicons name="bicycle" size={12} color={colors.textInverse} />
            <Text style={styles.deliveryLabel}>Delivery</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={13} color={colors.primary} />
            <Text style={styles.ratingValue}>{business.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {business.address?.city ?? "Nearby"}
          <Text style={styles.metaDim}>{`  ·  ${business.reviewCount} reviews`}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius["2xl"],
  },
  imageWrap: {
    height: 172,
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  chip: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    maxWidth: "62%",
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  favButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryChip: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  deliveryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textInverse,
  },
  body: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  name: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  metaDim: {
    color: colors.textTertiary,
  },
});
