import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import Input from '../../src/components/ui/Input';
import BusinessCard from '../../src/components/BusinessCard';
import type { Business } from '../../src/types';

const FILTERS = ['All', 'Beauty', 'Health', 'Food', 'Home', 'Auto', 'Education'];

const CATEGORY_TO_FILTER: Record<string, string> = {
  'Beauty & Wellness': 'Beauty',
  Healthcare: 'Health',
  'Food & Dining': 'Food',
  'Home Services': 'Home',
  Automotive: 'Auto',
  Education: 'Education',
};

const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'Lagos Barbershop',
    description: 'Premium grooming for the modern gentleman',
    category: 'Beauty & Wellness',
    countryCode: 'NG',
    ownerId: 'u1',
    address: { street: '12 Allen Ave', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Allen Ave, Lagos' },
    location: { latitude: 6.5244, longitude: 3.3792 },
    contact: { phone: '+2348012345678', email: 'info@lagosbarber.com' },
    media: { galleryUrls: [] },
    hours: [{ day: 'mon', open: '09:00', close: '18:00', isClosed: false }, { day: 'tue', open: '09:00', close: '18:00', isClosed: false }, { day: 'wed', open: '09:00', close: '18:00', isClosed: false }, { day: 'thu', open: '09:00', close: '18:00', isClosed: false }, { day: 'fri', open: '09:00', close: '18:00', isClosed: false }, { day: 'sat', open: '10:00', close: '16:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }],
    status: 'active',
    rating: 4.8,
    reviewCount: 124,
    qrBookingUrl: '',
    tags: ['barber'],
    deliveryAvailable: false,
    deliveryRadiusKm: 0,
    minimumOrder: 0,
    commissionRate: 0.1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Nairobi Wellness Spa',
    description: 'Relax and rejuvenate at Nairobi\'s finest spa',
    category: 'Healthcare',
    countryCode: 'KE',
    ownerId: 'u2',
    address: { street: '5 Kenyatta Ave', city: 'Nairobi', state: 'Nairobi', postalCode: '00100', countryCode: 'KE', formatted: '5 Kenyatta Ave, Nairobi' },
    location: { latitude: -1.2921, longitude: 36.8219 },
    contact: { phone: '+254712345678', email: 'info@nairobiwellness.com' },
    media: { galleryUrls: [] },
    hours: [{ day: 'mon', open: '08:00', close: '20:00', isClosed: false }, { day: 'tue', open: '08:00', close: '20:00', isClosed: false }, { day: 'wed', open: '08:00', close: '20:00', isClosed: false }, { day: 'thu', open: '08:00', close: '20:00', isClosed: false }, { day: 'fri', open: '08:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }],
    status: 'active',
    rating: 4.6,
    reviewCount: 89,
    qrBookingUrl: '',
    tags: ['spa'],
    deliveryAvailable: false,
    deliveryRadiusKm: 0,
    minimumOrder: 0,
    commissionRate: 0.1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryParam =
    typeof params.category === 'string' ? params.category : '';
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(
    categoryParam ? (CATEGORY_TO_FILTER[categoryParam] ?? 'All') : 'All',
  );

  useEffect(() => {
    if (categoryParam) {
      setActiveFilter(CATEGORY_TO_FILTER[categoryParam] ?? 'All');
    }
  }, [categoryParam]);

  const filtered = MOCK_BUSINESSES.filter((b) => {
    const matchesQuery = !query || b.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = activeFilter === 'All' || b.category.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesQuery && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Search</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <BusinessCard business={item} />
            </View>
          )}
          contentContainerStyle={styles.results}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptyHint}>Try a different search or filter</Text>
            </View>
          }
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
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  filters: {
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
  results: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['5xl'],
    gap: spacing.lg,
  },
  resultItem: {},
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
