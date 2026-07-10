import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, borderRadius, spacing, typography, shadows } from '../theme';
import type { Business } from '../types';
import Badge from './ui/Badge';

interface BusinessCardProps {
  business: Business;
  index?: number;
}

export default function BusinessCard({ business, index = 0 }: BusinessCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/business/${business.id}`)}
    >
      <View style={styles.imageContainer}>
        {business.media?.coverUrl ? (
          <Image source={{ uri: business.media.coverUrl }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>
              {business.name.charAt(0)}
            </Text>
          </View>
        )}
        {business.deliveryAvailable && (
          <Badge label="Delivery" variant="success" style={styles.deliveryBadge} />
        )}
        <TouchableOpacity
          style={[styles.favButton, isFav && styles.favButtonActive]}
          onPress={() => setIsFav(!isFav)}
          activeOpacity={0.7}
        >
          <Text style={[styles.favIcon, isFav && styles.favIconActive]}>
            {isFav ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{business.category}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {business.name}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.rating}>★ {business.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({business.reviewCount})</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.location} numberOfLines={1}>
            {business.address?.city ?? 'Nearby'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hours}>
            {business.hours?.length
              ? `${business.hours[0].open} - ${business.hours[0].close}`
              : 'Open now'}
          </Text>
          <Text style={styles.bookNow}>Book Now →</Text>
        </View>
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
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageContainer: {
    height: 170,
    backgroundColor: colors.surfaceTertiary,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySurface,
  },
  imageFallbackText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.primary,
  },
  deliveryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  favButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButtonActive: {
    backgroundColor: colors.error,
  },
  favIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  favIconActive: {
    color: '#FFF',
  },
  content: {
    padding: spacing.lg,
  },
  category: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  rating: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  dot: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  hours: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  bookNow: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});
