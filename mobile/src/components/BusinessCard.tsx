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
      activeOpacity={0.8}
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
        <View style={styles.imageOverlay} />
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
        <View style={styles.titleRow}>
          <Text style={styles.category}>{business.category}</Text>
          <Text style={styles.ratingBadge}>★ {business.rating.toFixed(1)}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {business.name}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {business.address?.formatted ?? business.address?.city ?? 'Top-rated vendor near you.'}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{business.reviewCount} reviews</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{business.address?.city ?? 'Nearby'}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hours}>
            {business.hours?.length ? `${business.hours[0].open} - ${business.hours[0].close}` : 'Open now'}
          </Text>
          <Text style={styles.bookNow}>View details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  imageContainer: {
    height: 180,
    backgroundColor: colors.surfaceTertiary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySurface,
  },
  imageFallbackText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '700',
    color: colors.primary,
  },
  deliveryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 2,
  },
  favButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  category: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.surface,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  metaDot: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  hours: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  bookNow: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
});
