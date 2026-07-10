import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: colors.surfaceTertiary, text: colors.textSecondary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
  info: { bg: colors.infoLight, text: colors.info },
};

export default function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  const colors_ = VARIANT_COLORS[variant];

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors_.bg },
        size === 'md' && styles.md,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors_.text },
          size === 'md' && styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  textMd: {
    fontSize: typography.fontSize.sm,
  },
});
