import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, spacing, typography } from "../../theme";

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  /**
   * `meta` is the neutral read-only pill used for facts sitting under a title
   * (rating, prep time, distance). `filter` is selectable. `overlay` sits on
   * top of photography.
   */
  variant?: "meta" | "filter" | "overlay";
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Chip({
  label,
  icon,
  variant = "meta",
  selected = false,
  onPress,
  style,
}: ChipProps) {
  const body = (
    <View
      style={[
        styles.base,
        variant === "overlay" && styles.overlay,
        variant === "filter" && styles.filter,
        selected && styles.selected,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          variant === "overlay" && styles.labelOverlay,
          selected && styles.labelSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    alignSelf: "flex-start",
  },
  filter: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlay: {
    // Sits on photography — solid white keeps the label legible over any
    // image without needing a blur layer.
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelOverlay: {
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.textInverse,
  },
});
