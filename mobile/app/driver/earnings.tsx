import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMarketStore } from '../../src/stores/market-store';
import { formatMoney } from '../../src/lib/money';

const EARNINGS_DATA = {
  today: { amount: 12500, trips: 5 },
  thisWeek: { amount: 78000, trips: 32 },
  thisMonth: { amount: 310000, trips: 128 },
};

const TRIPS = [
  { id: '1', date: 'Jul 10', pickup: 'Allen Ave, Ikeja', dropoff: 'Lekki Phase 1', amount: 3500, duration: '42 min' },
  { id: '2', date: 'Jul 10', pickup: 'Surulere', dropoff: 'Victoria Island', amount: 4200, duration: '55 min' },
  { id: '3', date: 'Jul 9', pickup: 'Yaba', dropoff: 'Ikoyi', amount: 2800, duration: '30 min' },
  { id: '4', date: 'Jul 9', pickup: 'Ajah', dropoff: 'Lekki Phase 1', amount: 2000, duration: '25 min' },
];

export default function DriverEarningsScreen() {
  const currencyCode = useMarketStore((s) => s.currencyCode());
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Earnings</Text>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statPrimary]}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statAmount}>{formatMoney(EARNINGS_DATA.today.amount, currencyCode)}</Text>
            <Text style={styles.statMeta}>{EARNINGS_DATA.today.trips} trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statAmount}>{formatMoney(EARNINGS_DATA.thisWeek.amount, currencyCode)}</Text>
            <Text style={styles.statMeta}>{EARNINGS_DATA.thisWeek.trips} trips</Text>
          </View>
        </View>

        <View style={styles.statCardFull}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statAmountLarge}>{formatMoney(EARNINGS_DATA.thisMonth.amount, currencyCode)}</Text>
          <Text style={styles.statMeta}>{EARNINGS_DATA.thisMonth.trips} trips completed</Text>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {TRIPS.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripDate}>{trip.date}</Text>
                <Text style={styles.tripAmount}>+{formatMoney(trip.amount, currencyCode)}</Text>
              </View>
              <View style={styles.tripRoute}>
                <Text style={styles.tripRouteText}>
                  📍 {trip.pickup} → {trip.dropoff}
                </Text>
              </View>
              <Text style={styles.tripDuration}>⏱ {trip.duration}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['5xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  statCardFull: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    fontWeight: '500',
  },
  statAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textInverse,
  },
  statAmountLarge: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
    opacity: 0.8,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tripDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tripAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.success,
  },
  tripRoute: {
    marginBottom: spacing.xs,
  },
  tripRouteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  tripDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});
