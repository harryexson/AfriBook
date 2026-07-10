import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../theme';
import type { Booking, BookingStatus } from '../types';
import Badge from './ui/Badge';

interface BookingCardProps {
  booking: Booking;
  businessName?: string;
  serviceName?: string;
  onPress?: () => void;
}

const STATUS_VARIANT: Record<BookingStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
  no_show: 'error',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function BookingCard({
  booking,
  businessName,
  serviceName,
  onPress,
}: BookingCardProps) {
  const date = new Date(booking.startTime);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.time}>{timeStr}</Text>
        </View>
        <Badge label={STATUS_LABEL[booking.status]} variant={STATUS_VARIANT[booking.status]} />
      </View>

      <View style={styles.body}>
        {businessName && (
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
        )}
        {serviceName && (
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          {booking.currencyCode} {booking.amount.toFixed(2)}
        </Text>
        {booking.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            📝 {booking.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    gap: 2,
  },
  date: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  body: {
    gap: 2,
    marginBottom: spacing.md,
  },
  businessName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  amount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  notes: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
});
