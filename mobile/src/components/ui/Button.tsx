import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { colors, borderRadius, spacing, typography } from "../../theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "ink" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * Pill-shaped, flat, no drop shadow. Buttons previously carried a 26px-blur
 * shadow at every size, which made them read as floating stickers rather than
 * controls.
 *
 * Variants carry fixed roles — don't repurpose them:
 *  - primary: amber fill, ink label. The brand action. Dark-on-amber is
 *    deliberate; white-on-amber fails contrast at this hue (see MASTER.md),
 *    and the web Button already renders it that way.
 *  - ink: near-black fill. The single highest-emphasis action on a screen
 *    (Add to cart, Place order) where amber would compete with the amber
 *    accents already present in the content around it.
 *  - secondary / outline / ghost: quiet neutrals.
 */
export default function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style as ViewStyle,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  const spinnerColor =
    variant === "ink" || variant === "danger"
      ? colors.textInverse
      : variant === "primary"
        ? colors.ink
        : colors.textPrimary;

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles} numberOfLines={1}>
            {title}
          </Text>
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ink: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.surfaceTertiary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.error,
  },
  size_sm: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 38,
  },
  size_md: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  text_primary: {
    color: colors.ink,
  },
  text_ink: {
    color: colors.textInverse,
  },
  text_secondary: {
    color: colors.textPrimary,
  },
  text_outline: {
    color: colors.textPrimary,
  },
  text_ghost: {
    color: colors.textPrimary,
  },
  text_danger: {
    color: colors.textInverse,
  },
  textSize_sm: {
    fontSize: typography.fontSize.sm,
  },
  textSize_md: {
    fontSize: typography.fontSize.md,
  },
  textSize_lg: {
    fontSize: typography.fontSize.md,
  },
});
