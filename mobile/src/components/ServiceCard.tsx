import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, borderRadius, spacing, typography, shadows } from '../theme';
import type { Service } from '../types';
import Badge from './ui/Badge';

interface ServiceCardProps {
  service: Service;
  businessId: string;
}

export default function ServiceCard({ service, businessId }: ServiceCardProps) {
  const router = useRouter();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/book/${businessId}/${service.id}`)}
    >
      {service.image && (
        <Image source={{ uri: service.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {service.name}
          </Text>
          <Badge
            label={service.available ? 'Available' : 'Unavailable'}
            variant={service.available ? 'success' : 'default'}
          />
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {service.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.duration}>⏱ {formatDuration(service.duration)}</Text>
          <Text style={styles.price}>
            {service.currencyCode} {service.price.toFixed(2)}
          </Text>
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
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  duration: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
});
