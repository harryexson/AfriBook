import React from "react";
import { View, StyleSheet, ViewProps, ViewStyle } from "react-native";
import { colors, borderRadius, spacing, shadows } from "../../theme";

interface CardProps extends ViewProps {
  /**
   * `plain` is the default and draws no chrome at all — it relies on the
   * canvas/surface tone step for separation. Reach for `outlined` or
   * `elevated` only when the container is genuinely interactive or genuinely
   * floating; a card that reads the same with its border removed shouldn't
   * have had one.
   */
  variant?: "plain" | "default" | "outlined" | "elevated";
  padding?: keyof typeof spacing | "none";
}

export default function Card({
  variant = "plain",
  padding = "lg",
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: padding === "none" ? 0 : spacing[padding] },
        style as ViewStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  plain: {
    backgroundColor: colors.surface,
  },
  default: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
});
