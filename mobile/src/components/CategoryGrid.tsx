import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, borderRadius, spacing, typography } from "../theme";
import { CATEGORY_ICONS, CATEGORY_GRADIENTS } from "../constants/countries";

interface Category {
  name: string;
  icon: string;
}

interface CategoryGridProps {
  categories: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  "Beauty & Wellness": "✨",
  Healthcare: "❤️",
  Automotive: "🚗",
  "Food & Dining": "🍽️",
  "Home Services": "🏠",
  Education: "🎓",
  Technology: "💻",
  Entertainment: "🎵",
  Transportation: "🚚",
  "Fashion & Tailoring": "✂️",
  Agriculture: "🌿",
  "Legal & Financial": "⚖️",
  "Real Estate": "🏢",
  "Event Planning": "📅",
  Tutoring: "📚",
  Logistics: "📦",
  Tourism: "🗺️",
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {categories.map((name) => {
        const gradient = CATEGORY_GRADIENTS[name] || ["#F59E0B", "#D97706"];
        return (
          <TouchableOpacity
            key={name}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/search?category=${encodeURIComponent(name)}`)
            }
          >
            <View
              style={[styles.iconContainer, { backgroundColor: gradient[0] }]}
            >
              <Text style={styles.iconEmoji}>
                {CATEGORY_EMOJI[name] || "📌"}
              </Text>
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  item: {
    width: "47%",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 24,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
