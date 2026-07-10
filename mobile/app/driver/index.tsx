import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import MapView from '../../src/components/MapView';
import Button from '../../src/components/ui/Button';

const CURRENT_TRIP = {
  id: 't1',
  customer: 'Chidi N.',
  pickup: '12 Allen Ave, Ikeja',
  dropoff: '22 Admiralty Way, Lekki',
  distance: '18.5 km',
  duration: '42 min',
  amount: 3500,
  currency: 'NGN',
};

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Driver Mode</Text>
            <Text style={styles.status}>Alex Driver</Text>
          </View>
          <TouchableOpacity
            style={[styles.onlineToggle, isOnline && styles.onlineActive]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
              {isOnline ? '● Online' : '○ Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            region={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
            markers={
              hasActiveTrip
                ? [
                    { id: 'pickup', coordinate: { latitude: 6.5244, longitude: 3.3792 }, title: 'Pickup' },
                    { id: 'dropoff', coordinate: { latitude: 6.5444, longitude: 3.4092 }, title: 'Dropoff' },
                  ]
                : []
            }
            style={styles.map}
          />
        </View>

        {/* Active Trip Card */}
        {hasActiveTrip && (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripLabel}>Active Trip</Text>
              <Text style={styles.tripAmount}>
                {CURRENT_TRIP.currency} {CURRENT_TRIP.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.tripDetails}>
              <View style={styles.tripPoint}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={styles.tripAddress} numberOfLines={1}>
                  {CURRENT_TRIP.pickup}
                </Text>
              </View>
              <View style={styles.tripLine} />
              <View style={styles.tripPoint}>
                <View style={[styles.dot, { backgroundColor: colors.error }]} />
                <Text style={styles.tripAddress} numberOfLines={1}>
                  {CURRENT_TRIP.dropoff}
                </Text>
              </View>
            </View>
            <View style={styles.tripMeta}>
              <Text style={styles.tripMetaText}>👤 {CURRENT_TRIP.customer}</Text>
              <Text style={styles.tripMetaText}>📍 {CURRENT_TRIP.distance}</Text>
              <Text style={styles.tripMetaText}>⏱ {CURRENT_TRIP.duration}</Text>
            </View>
            <View style={styles.tripActions}>
              <Button
                title="Complete Trip"
                onPress={() => setHasActiveTrip(false)}
                fullWidth
              />
            </View>
          </View>
        )}

        {/* No Trip State */}
        {!hasActiveTrip && isOnline && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingEmoji}>🔍</Text>
            <Text style={styles.waitingTitle}>Looking for trips...</Text>
            <Text style={styles.waitingSubtitle}>Stay online to receive delivery requests</Text>
            <Button
              title="Simulate Trip"
              variant="outline"
              onPress={() => setHasActiveTrip(true)}
              fullWidth
            />
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineCard}>
            <Text style={styles.offlineEmoji}>😴</Text>
            <Text style={styles.offlineTitle}>You're offline</Text>
            <Text style={styles.offlineSubtitle}>Go online to start receiving trips</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  status: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  onlineToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  onlineText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  onlineTextActive: {
    color: colors.success,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing['3xl'],
    ...shadows.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tripLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tripAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  tripDetails: {
    marginBottom: spacing.lg,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tripAddress: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  tripLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: spacing.xs,
  },
  tripMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tripMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tripActions: {},
  waitingCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.lg,
  },
  waitingEmoji: {
    fontSize: 36,
  },
  waitingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  waitingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  offlineCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.lg,
  },
  offlineEmoji: {
    fontSize: 36,
  },
  offlineTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  offlineSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
