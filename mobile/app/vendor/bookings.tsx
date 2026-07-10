import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import Badge from '../../src/components/ui/Badge';

const BOOKINGS = [
  { id: '1', customer: 'Ada E.', service: 'Classic Haircut', date: 'Jul 10', time: '10:00 AM', amount: 5000, status: 'confirmed' as const },
  { id: '2', customer: 'John D.', service: 'Beard Trim', date: 'Jul 10', time: '11:30 AM', amount: 3000, status: 'pending' as const },
  { id: '3', customer: 'Chidi N.', service: 'Hot Towel Shave', date: 'Jul 10', time: '2:00 PM', amount: 4000, status: 'completed' as const },
  { id: '4', customer: 'Blessing O.', service: 'Hair & Beard Combo', date: 'Jul 11', time: '9:00 AM', amount: 7000, status: 'confirmed' as const },
  { id: '5', customer: 'Emeka A.', service: 'Classic Haircut', date: 'Jul 11', time: '10:30 AM', amount: 5000, status: 'pending' as const },
];

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed'];

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
};

export default function VendorBookingsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = BOOKINGS.filter(
    (b) => activeFilter === 'All' || b.status === activeFilter.toLowerCase(),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Bookings</Text>

        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.customer}>{item.customer}</Text>
                  <Text style={styles.service}>{item.service}</Text>
                </View>
                <Badge label={item.status} variant={STATUS_VARIANT[item.status]} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.datetime}>📅 {item.date} · 🕐 {item.time}</Text>
                <Text style={styles.amount}>NGN {item.amount.toLocaleString()}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['5xl'],
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  customer: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  service: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  datetime: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  amount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
});
