import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';
import type { GeoPoint } from '../types';

interface MapViewProps {
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: Array<{
    id: string;
    coordinate: GeoPoint;
    title?: string;
  }>;
  style?: object;
}

export default function MapView({
  region = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  markers = [],
  style,
}: MapViewProps) {
  // Placeholder map component — replace with react-native-maps when running on device
  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🗺️</Text>
        <Text style={styles.placeholderTitle}>Map View</Text>
        <Text style={styles.placeholderSubtitle}>
          {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
        </Text>
        {markers.length > 0 && (
          <Text style={styles.markerCount}>
            {markers.length} marker{markers.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  placeholder: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholderSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  markerCount: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
});
