import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../src/theme";
import { COUNTRIES } from "../src/constants/countries";
import { useAuthStore } from "../src/stores/auth-store";
import { useMarketStore } from "../src/stores/market-store";
import CategoryGrid from "../src/components/CategoryGrid";
import BusinessCard from "../src/components/BusinessCard";
import CountryPicker from "../src/components/CountryPicker";
import type { Business } from "../src/types";

const FEATURED_BUSINESSES: Business[] = [
  {
    id: "1",
    name: "Lagos Barbershop",
    description: "Premium grooming for the modern gentleman",
    category: "Beauty & Wellness",
    countryCode: "NG",
    ownerId: "u1",
    address: {
      street: "12 Allen Ave",
      city: "Lagos",
      state: "Lagos",
      postalCode: "100001",
      countryCode: "NG",
      formatted: "12 Allen Ave, Lagos",
    },
    location: { latitude: 6.5244, longitude: 3.3792 },
    contact: { phone: "+2348012345678", email: "info@lagosbarber.com" },
    media: { galleryUrls: [] },
    hours: [
      { day: "mon", open: "09:00", close: "18:00", isClosed: false },
      { day: "tue", open: "09:00", close: "18:00", isClosed: false },
      { day: "wed", open: "09:00", close: "18:00", isClosed: false },
      { day: "thu", open: "09:00", close: "18:00", isClosed: false },
      { day: "fri", open: "09:00", close: "18:00", isClosed: false },
      { day: "sat", open: "10:00", close: "16:00", isClosed: false },
      { day: "sun", open: "00:00", close: "00:00", isClosed: true },
    ],
    status: "active",
    rating: 4.8,
    reviewCount: 124,
    qrBookingUrl: "",
    tags: ["barber", "haircut", "grooming"],
    deliveryAvailable: false,
    deliveryRadiusKm: 0,
    minimumOrder: 0,
    commissionRate: 0.1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Nairobi Wellness Spa",
    description: "Relax and rejuvenate at Nairobi's finest spa",
    category: "Healthcare",
    countryCode: "KE",
    ownerId: "u2",
    address: {
      street: "5 Kenyatta Ave",
      city: "Nairobi",
      state: "Nairobi",
      postalCode: "00100",
      countryCode: "KE",
      formatted: "5 Kenyatta Ave, Nairobi",
    },
    location: { latitude: -1.2921, longitude: 36.8219 },
    contact: { phone: "+254712345678", email: "info@nairobiwellness.com" },
    media: { galleryUrls: [] },
    hours: [
      { day: "mon", open: "08:00", close: "20:00", isClosed: false },
      { day: "tue", open: "08:00", close: "20:00", isClosed: false },
      { day: "wed", open: "08:00", close: "20:00", isClosed: false },
      { day: "thu", open: "08:00", close: "20:00", isClosed: false },
      { day: "fri", open: "08:00", close: "20:00", isClosed: false },
      { day: "sat", open: "09:00", close: "18:00", isClosed: false },
      { day: "sun", open: "00:00", close: "00:00", isClosed: true },
    ],
    status: "active",
    rating: 4.6,
    reviewCount: 89,
    qrBookingUrl: "",
    tags: ["spa", "wellness", "massage"],
    deliveryAvailable: false,
    deliveryRadiusKm: 0,
    minimumOrder: 0,
    commissionRate: 0.1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "3",
    name: "Joburg Eats",
    description: "Authentic South African cuisine delivered to your door",
    category: "Food & Dining",
    countryCode: "ZA",
    ownerId: "u3",
    address: {
      street: "22 Commissioner St",
      city: "Johannesburg",
      state: "Gauteng",
      postalCode: "2001",
      countryCode: "ZA",
      formatted: "22 Commissioner St, Johannesburg",
    },
    location: { latitude: -26.2041, longitude: 28.0473 },
    contact: { phone: "+27123456789", email: "info@joburgeats.com" },
    media: { galleryUrls: [] },
    hours: [
      { day: "mon", open: "10:00", close: "22:00", isClosed: false },
      { day: "tue", open: "10:00", close: "22:00", isClosed: false },
      { day: "wed", open: "10:00", close: "22:00", isClosed: false },
      { day: "thu", open: "10:00", close: "22:00", isClosed: false },
      { day: "fri", open: "10:00", close: "23:00", isClosed: false },
      { day: "sat", open: "10:00", close: "23:00", isClosed: false },
      { day: "sun", open: "11:00", close: "21:00", isClosed: false },
    ],
    status: "active",
    rating: 4.7,
    reviewCount: 256,
    qrBookingUrl: "",
    tags: ["food", "delivery", "african"],
    deliveryAvailable: true,
    deliveryRadiusKm: 15,
    minimumOrder: 200,
    commissionRate: 0.15,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const countryCode = useMarketStore((s) => s.countryCode);
  const setCountry = useMarketStore((s) => s.setCountry);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Hello!"}
            </Text>
            <Text style={styles.subtitle}>What do you need today?</Text>
          </View>
          <CountryPicker
            selectedCode={countryCode}
            onSelect={(country) => setCountry(country.code)}
          />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            Premium local services in one place
          </Text>
          <Text style={styles.heroText}>
            Discover trusted vendors, book instantly, and experience a curated
            marketplace designed for modern urban life.
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/search")}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            Search businesses, services...
          </Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore by category</Text>
          <CategoryGrid
            categories={(
              COUNTRIES[countryCode]?.categories ?? COUNTRIES.NG.categories
            ).slice(0, 9)}
          />
        </View>

        {/* Featured Businesses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured businesses</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.businessList}>
            {FEATURED_BUSINESSES.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(tabs)/bookings")}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>My Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/vendor")}
            >
              <Text style={styles.actionIcon}>🏪</Text>
              <Text style={styles.actionLabel}>Vendor Hub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/driver")}
            >
              <Text style={styles.actionIcon}>🚗</Text>
              <Text style={styles.actionLabel}>Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push(user ? "/(tabs)/profile" : "/(auth)/login")
              }
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius["2xl"],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  businessList: {
    gap: spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius["2xl"],
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius["3xl"],
    padding: spacing.xl,
    marginBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.goldLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 5,
  },
  heroTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});
