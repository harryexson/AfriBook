import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, typography } from "../theme";
import PressableScale from "./ui/PressableScale";

interface CategoryGridProps {
  categories: string[];
  /** Horizontal rail (home) vs wrapped grid (browse). */
  layout?: "rail" | "grid";
}

/**
 * One icon language (Ionicons outline), one accent.
 *
 * This previously rendered an emoji on a per-category coloured tile — sixteen
 * different saturated backgrounds across one screen. Emoji don't scale, don't
 * theme, render differently on every OS, and read as placeholder art; the
 * rainbow tiles meant the screen had no colour hierarchy at all. Now the tile
 * is a neutral square, the icon is a real glyph, and amber is reserved for
 * selection state so it still means something.
 */
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Home Services": "construct-outline",
  Healthcare: "medkit-outline",
  Education: "school-outline",
  Technology: "laptop-outline",
  "Food & Dining": "restaurant-outline",
  "Beauty & Wellness": "sparkles-outline",
  Automotive: "car-sport-outline",
  "Legal & Financial": "briefcase-outline",
  "Real Estate": "business-outline",
  Entertainment: "musical-notes-outline",
  "Fashion & Tailoring": "shirt-outline",
  Agriculture: "leaf-outline",
  Transportation: "bus-outline",
  Tourism: "compass-outline",
  Logistics: "cube-outline",
  Tutoring: "book-outline",
  "Event Planning": "calendar-outline",
  Fitness: "barbell-outline",
  Barber: "cut-outline",
  "Mobile Barber": "cut-outline",
  Spa: "flower-outline",
  Photographer: "camera-outline",
  Videographer: "videocam-outline",
  Cosmetician: "color-wand-outline",
  "Beauty Salon": "sparkles-outline",
  "Mobile Carwash": "water-outline",
};

export function iconForCategory(name: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[name] ?? "grid-outline";
}

export default function CategoryGrid({ categories, layout = "rail" }: CategoryGridProps) {
  const router = useRouter();

  const items = categories.map((name) => (
    <PressableScale
      key={name}
      style={[styles.item, layout === "grid" && styles.itemGrid]}
      scaleTo={0.93}
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => router.push(`/search?category=${encodeURIComponent(name)}`)}
    >
      <View style={styles.tile}>
        <Ionicons name={iconForCategory(name)} size={22} color={colors.textPrimary} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {name}
      </Text>
    </PressableScale>
  ));

  if (layout === "grid") {
    return <View style={styles.grid}>{items}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {items}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: spacing.lg,
    paddingRight: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  item: {
    alignItems: "center",
    width: 72,
    gap: spacing.sm,
  },
  itemGrid: {
    width: "21%",
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 14,
  },
});
