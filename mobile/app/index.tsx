import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "../src/theme";
import { COUNTRIES } from "../src/constants/countries";
import { useAuthStore } from "../src/stores/auth-store";
import { useMarketStore } from "../src/stores/market-store";
import CategoryGrid from "../src/components/CategoryGrid";
import CountryPicker from "../src/components/CountryPicker";
import CountryNotice from "../src/components/CountryNotice";
import SectionHeader from "../src/components/ui/SectionHeader";
import PressableScale from "../src/components/ui/PressableScale";
import { photoFor, imageSourceFor } from "../src/lib/images";
import { api } from "../src/lib/api";
import { formatMoney } from "../src/lib/money";

interface RestaurantSummary {
  id: string;
  name: string;
  cuisineType: string;
  rating: number;
  preparationTime: number;
  deliveryFee: number;
  currency: string;
  address: string;
}

/**
 * The service verticals, rendered as an asymmetric photo mosaic — one lead
 * tile plus a 2x2 grid. Adapted from the Sarwisi workforce-marketplace hero,
 * which uses photo tiles with a floating label and a corner affordance rather
 * than the usual icon grid. This replaces a 2-column grid of emoji buttons.
 */
const VERTICALS = [
  { key: "food", label: "Food delivery", caption: "Order in minutes", route: "/food", photoKey: "food" },
  { key: "rides", label: "Rides", caption: "Get moving", route: "/ride", photoKey: "rides" },
  { key: "stays", label: "Stays", caption: "Book a room", route: "/stays", photoKey: "stays" },
  { key: "events", label: "Events", caption: "What's on", route: "/events", photoKey: "events" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const countryCode = useMarketStore((s) => s.countryCode);
  const setCountry = useMarketStore((s) => s.setCountry);

  const [refreshing, setRefreshing] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const country = COUNTRIES[countryCode] ?? COUNTRIES.NG;

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: { restaurants: RestaurantSummary[] } }>(
        `/api/restaurants?country=${countryCode}`,
      );
      setRestaurants((res.data?.restaurants ?? []).slice(0, 6));
    } catch {
      // A failed feed shouldn't blank the whole home screen — the verticals
      // and categories above stay usable.
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lead = VERTICALS[0];
  const rest = VERTICALS.slice(1);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Location-first header, per the reference: where you are matters more
            than a greeting on a marketplace home screen. */}
        <View style={styles.header}>
          <View style={styles.locationGroup}>
            <Text style={styles.locationLabel}>
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Delivering to"}
            </Text>
            <CountryPicker
              selectedCode={countryCode}
              onSelect={(c) => setCountry(c.code)}
            />
          </View>
          <TouchableOpacity
            style={styles.bell}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/profile/notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.search}
          activeOpacity={0.8}
          accessibilityRole="search"
          onPress={() => router.push("/(tabs)/search")}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <Text style={styles.searchText}>Search services, food, stays…</Text>
        </TouchableOpacity>

        <CountryNotice />

        {/* Vertical mosaic */}
        <View style={styles.mosaic}>
          <PressableScale
            style={styles.leadTile}
            scaleTo={0.98}
            accessibilityRole="button"
            onPress={() => router.push(lead.route)}
          >
            <Image
              source={{ uri: photoFor(lead.key, lead.photoKey, null, { width: 700, ratio: 0.52 }) }}
              style={styles.tileImage}
            />
            <View style={styles.tileScrim} />
            <View style={styles.tileTop}>
              <View style={styles.tileChip}>
                <Text style={styles.tileChipLabel}>{lead.caption}</Text>
              </View>
              <View style={styles.tileArrow}>
                <Ionicons name="arrow-forward" size={15} color={colors.ink} />
              </View>
            </View>
            <Text style={styles.leadTileLabel}>{lead.label}</Text>
          </PressableScale>

          <View style={styles.tileRow}>
            {rest.map((v) => (
              <PressableScale
                key={v.key}
                style={styles.smallTile}
                scaleTo={0.96}
                accessibilityRole="button"
                onPress={() => router.push(v.route)}
              >
                <Image
                  source={{ uri: photoFor(v.key, v.photoKey, null, { width: 320, ratio: 0.9 }) }}
                  style={styles.tileImage}
                />
                <View style={styles.tileScrim} />
                <Text style={styles.smallTileLabel}>{v.label}</Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Browse by category"
            onAction={() => router.push("/(tabs)/search")}
          />
          <CategoryGrid categories={(country?.categories ?? []).slice(0, 10)} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Popular near you"
            subtitle={`Top rated in ${country?.name ?? "your area"}`}
            onAction={() => router.push("/food")}
          />

          {loading ? (
            <ActivityIndicator color={colors.ink} style={styles.loader} />
          ) : restaurants.length === 0 ? (
            <Text style={styles.empty}>Nothing to show here yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {restaurants.map((r) => (
                <PressableScale
                  key={r.id}
                  style={styles.railCard}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  onPress={() => router.push("/food")}
                >
                  <Image
                    source={imageSourceFor(r.id, r.cuisineType, null, { width: 420, ratio: 0.66 })}
                    style={styles.railImage}
                  />
                  <View style={styles.railBody}>
                    <View style={styles.railTitleRow}>
                      <Text style={styles.railName} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <View style={styles.rating}>
                        <Ionicons name="star" size={12} color={colors.primary} />
                        <Text style={styles.ratingValue}>{r.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.railMeta} numberOfLines={1}>
                      {r.cuisineType}
                      <Text style={styles.railMetaDim}>
                        {`  ·  ${r.preparationTime}-${r.preparationTime + 10} min`}
                      </Text>
                    </Text>
                    <Text style={styles.railFee}>
                      {r.deliveryFee > 0
                        ? `${formatMoney(r.deliveryFee, r.currency)} delivery`
                        : "Free delivery"}
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  locationGroup: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 50,
  },
  searchText: {
    fontSize: typography.fontSize.md,
    color: colors.textTertiary,
  },
  mosaic: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  leadTile: {
    height: 168,
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceTertiary,
  },
  tileRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  smallTile: {
    flex: 1,
    height: 108,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceTertiary,
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  tileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.photoScrim,
  },
  tileTop: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  tileChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  tileArrow: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  leadTileLabel: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.textInverse,
    padding: spacing.lg,
    letterSpacing: -0.4,
  },
  smallTileLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: "700",
    color: colors.textInverse,
    padding: spacing.md,
  },
  section: {
    marginTop: spacing["3xl"],
    paddingHorizontal: spacing.xl,
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  railCard: {
    width: 232,
  },
  railImage: {
    width: "100%",
    height: 140,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceTertiary,
    resizeMode: "cover",
  },
  railBody: {
    paddingTop: spacing.md,
    gap: 3,
  },
  railTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  railName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  railMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  railMetaDim: {
    color: colors.textTertiary,
  },
  railFee: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    color: colors.primaryDark,
    marginTop: 2,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  empty: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    paddingVertical: spacing.lg,
  },
});
