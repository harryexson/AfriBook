import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../src/theme';
import BookingCard from '../../src/components/BookingCard';
import type { Booking } from '../../src/types';

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    businessId: '1',
    serviceId: 's1',
    customerId: 'u1',
    startTime: '2026-07-15T10:00:00Z',
    endTime: '2026-07-15T11:00:00Z',
    status: 'confirmed',
    amount: 5000,
    currencyCode: 'NGN',
    paymentStatus: 'completed',
    notes: 'Classic haircut',
    reminders: [],
    createdAt: '2026-07-10',
    updatedAt: '2026-07-10',
  },
  {
    id: 'b2',
    businessId: '2',
    serviceId: 's2',
    customerId: 'u1',
    startTime: '2026-07-12T14:00:00Z',
    endTime: '2026-07-12T15:30:00Z',
    status: 'pending',
    amount: 8000,
    currencyCode: 'KES',
    paymentStatus: 'pending',
    reminders: [],
    createdAt: '2026-07-08',
    updatedAt: '2026-07-08',
  },
  {
    id: 'b3',
    businessId: '1',
    serviceId: 's3',
    customerId: 'u1',
    startTime: '2026-07-01T09:00:00Z',
    endTime: '2026-07-01T09:30:00Z',
    status: 'completed',
    amount: 3000,
    currencyCode: 'NGN',
    paymentStatus: 'completed',
    reminders: [],
    createdAt: '2026-06-28',
    updatedAt: '2026-07-01',
  },
];

export default function BookingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>My Bookings</Text>

        <FlatList
          data={MOCK_BOOKINGS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              businessName={item.businessId === '1' ? 'Lagos Barbershop' : 'Nairobi Wellness Spa'}
              serviceName={item.notes}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptyHint}>Book a service to get started</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingBottom: spacing.xl,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['5xl'],
    gap: spacing.lg,
  },
  separator: {
    height: 0,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
