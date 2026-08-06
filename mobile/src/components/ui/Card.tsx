import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: keyof typeof spacing;
}

export default function Card({
  variant = 'default',
  padding = 'lg',
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
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.surface,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.7)',
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
