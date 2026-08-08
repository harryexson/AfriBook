import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMarketStore } from '../../src/stores/market-store';
import { formatMoney } from '../../src/lib/money';

const STATS = [
  { label: 'Today\'s Revenue', value: 45000, change: '+12%', icon: '💰', kind: 'money' },
  { label: 'Active Bookings', value: 8, change: '+3', icon: '📋', kind: 'plain' },
  { label: 'This Week', value: 285000, change: '+8%', icon: '📈', kind: 'money' },
  { label: 'Rating', value: 4.8, change: '+0.1', icon: '⭐', kind: 'plain' },
];

const RECENT_BOOKINGS = [
  { id: '1', customer: 'Ada E.', service: 'Classic Haircut', time: '10:00 AM', amount: 5000, status: 'confirmed' },
  { id: '2', customer: 'John D.', service: 'Beard Trim', time: '11:30 AM', amount: 3000, status: 'pending' },
  { id: '3', customer: 'Chidi N.', service: 'Hot Towel Shave', time: '2:00 PM', amount: 4000, status: 'completed' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: colors.info,
  pending: colors.warning,
  completed: colors.success,
  cancelled: colors.error,
};

export default function VendorDashboard() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Vendor Dashboard</Text>
            <Text style={styles.businessName}>Lagos Barbershop</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>
                {stat.kind === 'money' ? formatMoney(stat.value as number, currencyCode) : stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statChange}>{stat.change}</Text>
            </View>
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {RECENT_BOOKINGS.map((booking) => (
            <View key={booking.id} style={styles.bookingRow}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingCustomer}>{booking.customer}</Text>
                <Text style={styles.bookingService}>{booking.service} · {booking.time}</Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>{formatMoney(booking.amount, currencyCode)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/vendor/bookings')}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Manage Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionLabel}>Add Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Manage Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  businessName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statChange: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bookingInfo: {
    flex: 1,
    gap: 2,
  },
  bookingCustomer: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingService: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bookingRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  bookingAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
