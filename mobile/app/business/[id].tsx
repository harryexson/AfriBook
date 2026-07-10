import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import ServiceCard from '../../src/components/ServiceCard';
import MapView from '../../src/components/MapView';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import type { Business, Service } from '../../src/types';

const MOCK_BUSINESS: Business = {
  id: '1',
  name: 'Lagos Barbershop',
  description: 'Premium grooming for the modern gentleman. We offer top-quality haircuts, beard trims, and grooming services in a relaxed and professional atmosphere.',
  category: 'Beauty & Wellness',
  countryCode: 'NG',
  ownerId: 'u1',
  address: { street: '12 Allen Ave', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Allen Ave, Ikeja, Lagos' },
  location: { latitude: 6.5244, longitude: 3.3792 },
  contact: { phone: '+2348012345678', email: 'info@lagosbarber.com', website: 'https://lagosbarber.com' },
  media: { galleryUrls: [] },
  hours: [
    { day: 'mon', open: '09:00', close: '18:00', isClosed: false },
    { day: 'tue', open: '09:00', close: '18:00', isClosed: false },
    { day: 'wed', open: '09:00', close: '18:00', isClosed: false },
    { day: 'thu', open: '09:00', close: '18:00', isClosed: false },
    { day: 'fri', open: '09:00', close: '18:00', isClosed: false },
    { day: 'sat', open: '10:00', close: '16:00', isClosed: false },
    { day: 'sun', open: '00:00', close: '00:00', isClosed: true },
  ],
  status: 'active',
  rating: 4.8,
  reviewCount: 124,
  qrBookingUrl: 'https://afribook.com/book/1',
  tags: ['barber', 'haircut', 'grooming'],
  deliveryAvailable: false,
  deliveryRadiusKm: 0,
  minimumOrder: 0,
  commissionRate: 0.1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const MOCK_SERVICES: Service[] = [
  { id: 's1', businessId: '1', name: 'Classic Haircut', description: 'Traditional haircut with clippers and scissors', duration: 30, price: 5000, currencyCode: 'NGN', category: 'Hair', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 's2', businessId: '1', name: 'Beard Trim & Shape', description: 'Professional beard grooming and styling', duration: 20, price: 3000, currencyCode: 'NGN', category: 'Beard', available: true, maxCapacityPerSlot: 3, paddingMinutes: 5, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 's3', businessId: '1', name: 'Hot Towel Shave', description: 'Luxurious hot towel straight razor shave', duration: 25, price: 4000, currencyCode: 'NGN', category: 'Shave', available: true, maxCapacityPerSlot: 2, paddingMinutes: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 's4', businessId: '1', name: 'Hair & Beard Combo', description: 'Complete grooming package - haircut and beard trim', duration: 45, price: 7000, currencyCode: 'NGN', category: 'Combo', available: true, maxCapacityPerSlot: 2, paddingMinutes: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'services' | 'info' | 'reviews'>('services');

  const business = MOCK_BUSINESS;
  const services = MOCK_SERVICES;

  const handleShare = async () => {
    await Share.share({
      message: `Check out ${business.name} on AfriBook! https://afribook.com/business/${business.id}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {business.media?.coverUrl ? (
            <Image source={{ uri: business.media.coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback}>
              <Text style={styles.coverFallbackText}>{business.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Business Info */}
        <View style={styles.infoSection}>
          <Badge label={business.category} />
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessDescription}>{business.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>★ {business.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{business.reviewCount} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>📍 {business.address.city}</Text>
              <Text style={styles.statLabel}>{business.address.formatted}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['services', 'info', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'services' && (
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  businessId={business.id}
                />
              ))}
            </View>
          )}

          {activeTab === 'info' && (
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Opening Hours</Text>
              <View style={styles.hoursGrid}>
                {DAYS.map((day) => {
                  const h = business.hours.find((x) => x.day === day);
                  return (
                    <View key={day} style={styles.hourRow}>
                      <Text style={styles.hourDay}>{DAY_LABELS[day]}</Text>
                      <Text style={[styles.hourTime, h?.isClosed && styles.hourClosed]}>
                        {h?.isClosed ? 'Closed' : `${h?.open} - ${h?.close}`}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.infoTitle, { marginTop: spacing.xl }]}>Location</Text>
              <MapView
                region={{
                  latitude: business.location.latitude,
                  longitude: business.location.longitude,
                }}
                markers={[{ id: business.id, coordinate: business.location, title: business.name }]}
                style={styles.map}
              />

              <Text style={[styles.infoTitle, { marginTop: spacing.xl }]}>Contact</Text>
              <View style={styles.contactList}>
                <Text style={styles.contactItem}>📞 {business.contact.phone}</Text>
                <Text style={styles.contactItem}>✉️ {business.contact.email}</Text>
                {business.contact.website && (
                  <Text style={styles.contactItem}>🌐 {business.contact.website}</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsContent}>
              <View style={styles.reviewsSummary}>
                <Text style={styles.reviewsScore}>{business.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsCount}>Based on {business.reviewCount} reviews</Text>
              </View>
              <View style={styles.reviewsPlaceholder}>
                <Text style={styles.placeholderEmoji}>⭐</Text>
                <Text style={styles.placeholderText}>Reviews coming soon</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book Now CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title="Book Now"
          onPress={() => router.push(`/book/${business.id}/${services[0].id}`)}
          fullWidth
          size="lg"
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
  coverContainer: {
    height: 220,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverFallback: {
    flex: 1,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverFallbackText: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  shareButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  infoSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  businessName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  businessDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: 100,
  },
  servicesGrid: {
    gap: spacing.lg,
  },
  infoContent: {
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hoursGrid: {
    gap: spacing.sm,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  hourDay: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  hourTime: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  hourClosed: {
    color: colors.error,
  },
  map: {
    height: 200,
  },
  contactList: {
    gap: spacing.sm,
  },
  contactItem: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  reviewsContent: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  reviewsSummary: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewsScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
  },
  reviewsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  reviewsPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing['3xl'],
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  placeholderText: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
