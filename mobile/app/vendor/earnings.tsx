import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';

const EARNINGS_DATA = {
  today: { amount: 45000, currency: 'NGN', bookings: 8 },
  thisWeek: { amount: 285000, currency: 'NGN', bookings: 42 },
  thisMonth: { amount: 1120000, currency: 'NGN', bookings: 168 },
  total: { amount: 8500000, currency: 'NGN', bookings: 1247 },
};

const PAYOUT_HISTORY = [
  { id: '1', period: 'Jul 1 - Jul 7', amount: 285000, fee: 14250, net: 270750, status: 'completed' },
  { id: '2', period: 'Jun 24 - Jun 30', amount: 312000, fee: 15600, net: 296400, status: 'completed' },
  { id: '3', period: 'Jun 17 - Jun 23', amount: 268000, fee: 13400, net: 254600, status: 'completed' },
];

export default function VendorEarningsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Earnings</Text>

        {/* Earnings Overview */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, styles.overviewPrimary]}>
            <Text style={styles.overviewLabel}>Today</Text>
            <Text style={styles.overviewAmount}>₦{EARNINGS_DATA.today.amount.toLocaleString()}</Text>
            <Text style={styles.overviewBookings}>{EARNINGS_DATA.today.bookings} bookings</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>This Week</Text>
            <Text style={styles.overviewAmount}>₦{EARNINGS_DATA.thisWeek.amount.toLocaleString()}</Text>
            <Text style={styles.overviewBookings}>{EARNINGS_DATA.thisWeek.bookings} bookings</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>This Month</Text>
            <Text style={styles.overviewAmount}>₦{EARNINGS_DATA.thisMonth.amount.toLocaleString()}</Text>
            <Text style={styles.overviewBookings}>{EARNINGS_DATA.thisMonth.bookings} bookings</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>All Time</Text>
            <Text style={styles.overviewAmount}>₦{EARNINGS_DATA.total.amount.toLocaleString()}</Text>
            <Text style={styles.overviewBookings}>{EARNINGS_DATA.total.bookings} bookings</Text>
          </View>
        </View>

        {/* Payout History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          {PAYOUT_HISTORY.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <Text style={styles.payoutPeriod}>{payout.period}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{payout.status}</Text>
                </View>
              </View>
              <View style={styles.payoutRows}>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Gross</Text>
                  <Text style={styles.payoutValue}>₦{payout.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Platform Fee (5%)</Text>
                  <Text style={[styles.payoutValue, { color: colors.error }]}>-₦{payout.fee.toLocaleString()}</Text>
                </View>
                <View style={styles.payoutDivider} />
                <View style={styles.payoutRow}>
                  <Text style={[styles.payoutLabel, { fontWeight: '700', color: colors.textPrimary }]}>Net Payout</Text>
                  <Text style={[styles.payoutValue, { fontWeight: '700', color: colors.success }]}>₦{payout.net.toLocaleString()}</Text>
                </View>
              </View>
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  overviewCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  overviewPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    width: '100%',
  },
  overviewLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
    fontWeight: '500',
  },
  overviewAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '800',
    color: colors.textInverse,
  },
  overviewBookings: {
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
    opacity: 0.8,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  payoutCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  payoutPeriod: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
  payoutRows: {
    gap: spacing.sm,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payoutLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  payoutValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  payoutDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
});
