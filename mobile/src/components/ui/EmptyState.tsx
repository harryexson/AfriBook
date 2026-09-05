import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, typography } from "../../theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

/**
 * One empty state for the whole app. Every screen previously drew its own
 * with a 48px emoji, which is the loudest "unfinished" signal in a product —
 * and each one sized and spaced it slightly differently.
 */
export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glyph}>
        <Ionicons name={icon} size={26} color={colors.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["4xl"],
    gap: spacing.sm,
  },
  glyph: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: "stretch",
  },
});
