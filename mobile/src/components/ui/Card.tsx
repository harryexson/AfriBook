import React from "react";
import { View, StyleSheet, ViewProps, ViewStyle } from "react-native";
import { colors, borderRadius, spacing, shadows } from "../../theme";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: keyof typeof spacing;
}

export default function Card({
  variant = "default",
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
        { padding: spacing[padding] },
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
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  default: {
    backgroundColor: colors.surface,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.lg,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
});
