import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';
import { useMarketStore } from '../../src/stores/market-store';
import { formatMoney } from '../../src/lib/money';

interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  price: number | null;
  category: string;
  imageUrl?: string;
  ticketsRemaining: number;
}

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Afrobeats Night', venue: 'Eko Convention Centre', date: 'Jul 20', time: '8:00 PM', price: 15000, category: 'Music', ticketsRemaining: 45 },
  { id: '2', title: 'Tech Meetup Lagos', venue: 'Zone Tech Park', date: 'Jul 15', time: '2:00 PM', price: null, category: 'Technology', ticketsRemaining: 120 },
  { id: '3', title: 'Food & Wine Festival', venue: 'Federal Palace Hotel', date: 'Jul 25', time: '12:00 PM', price: 25000, category: 'Food', ticketsRemaining: 80 },
  { id: '4', title: 'Comedy Night', venue: 'Terra Kulture', date: 'Jul 18', time: '7:00 PM', price: 5000, category: 'Comedy', ticketsRemaining: 30 },
];

const CATEGORIES = ['All', 'Music', 'Technology', 'Food', 'Comedy', 'Sports', 'Art'];

export default function EventScreen() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events] = useState<Event[]>(MOCK_EVENTS);

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter((e) => e.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Tickets</Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === cat && styles.categoryTextActive,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>{event.category}</Text>
              </View>
              {event.ticketsRemaining < 50 && (
                <View style={styles.urgencyBadge}>
                  <Text style={styles.urgencyText}>Almost Sold Out!</Text>
                </View>
              )}
            </View>

            <Text style={styles.eventTitle}>{event.title}</Text>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.eventDetailText}>{event.venue}</Text>
              </View>
              <View style={styles.eventDetailRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.eventDetailText}>{event.date} · {event.time}</Text>
              </View>
            </View>

            <View style={styles.eventFooter}>
              <Text style={styles.eventPrice}>
                {event.price == null ? 'Free' : formatMoney(event.price, currencyCode)}
              </Text>
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Get Tickets</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categories: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  eventBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primarySurface,
  },
  eventBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.errorLight,
  },
  urgencyText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  eventDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventDetailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buyButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
