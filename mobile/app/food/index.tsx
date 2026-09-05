import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../src/components/ui/Button';
import Chip from '../../src/components/ui/Chip';
import PressableScale from '../../src/components/ui/PressableScale';
import DishSheet from '../../src/components/food/DishSheet';
import { useMarketStore } from '../../src/stores/market-store';
import { useCartStore } from '../../src/stores/cart-store';
import { api } from '../../src/lib/api';
import { photoFor, squarePhotoFor, dishPhotoFor } from '../../src/lib/images';
import type { MenuItem } from '../../src/types';
import { formatMoney } from '../../src/lib/money';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

interface RestaurantSummary {
  id: string;
  businessId: string;
  name: string;
  description: string;
  cuisineType: string;
  rating: number;
  preparationTime: number;
  minimumOrder: number;
  deliveryFee: number;
  currency: string;
  countryCode: string;
  address: string;
}

interface MenuCategory {
  id: string;
  businessId: string;
  name: string;
  description: string;
  sortOrder: number;
  items: MenuItem[];
}

export default function FoodOrderScreen() {
  const router = useRouter();
  const countryCode = useMarketStore((s) => s.countryCode);
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const { addItem } = useCartStore();
  const cartCount = useCartStore((s) => s.itemCount());
  const cartSubtotal = useCartStore((s) => s.subtotal());

  const [restaurants, setRestaurants] = React.useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const [selectedRestaurant, setSelectedRestaurant] = React.useState<RestaurantSummary | null>(null);
  const [menu, setMenu] = React.useState<MenuCategory[]>([]);
  const [menuLoading, setMenuLoading] = React.useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = React.useState('');
  const [sheetItem, setSheetItem] = React.useState<MenuItem | null>(null);

  const loadRestaurants = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: { restaurants: RestaurantSummary[] } }>(
        `/api/restaurants?country=${countryCode}`,
      );
      setRestaurants(res.data?.restaurants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  React.useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const categories = React.useMemo(() => {
    const cuisines = new Set(restaurants.map((r) => r.cuisineType));
    return ['All', ...Array.from(cuisines).sort()];
  }, [restaurants]);

  const filteredRestaurants = React.useMemo(() => {
    let result = [...restaurants];
    if (selectedCategory !== 'All') {
      result = result.filter((r) => r.cuisineType === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.rating - a.rating);
  }, [restaurants, selectedCategory, searchQuery]);

  const openRestaurant = async (restaurant: RestaurantSummary) => {
    setSelectedRestaurant(restaurant);
    setMenuLoading(true);
    try {
      const res = await api.get<{ data: { restaurant: RestaurantSummary; menu: MenuCategory[] } }>(
        `/api/restaurants/${restaurant.id}`,
      );
      setMenu(res.data?.menu ?? []);
      if (res.data?.menu?.length) setActiveMenuCategory(res.data.menu[0].id);
      if (res.data?.restaurant) setSelectedRestaurant(res.data.restaurant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setMenuLoading(false);
    }
  };

  // ─── Restaurant detail ──────────────────────────────────────
  if (selectedRestaurant) {
    const r = selectedRestaurant;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Full-bleed hero: the image is the header, per the reference. */}
          <View style={styles.hero}>
            <Image
              source={{ uri: photoFor(r.id, r.cuisineType, null, { width: 800, ratio: 0.62 }) }}
              style={styles.heroImage}
            />
            <SafeAreaView edges={['top']} style={styles.heroBar}>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={() => setSelectedRestaurant(null)}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={20} color={colors.ink} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>

          <View style={styles.detailSheet}>
            <Text style={styles.detailName}>{r.name}</Text>
            <Text style={styles.detailAddress} numberOfLines={1}>
              {r.address}
            </Text>

            {/* Fact row — the reference's signature meta strip. */}
            <View style={styles.metaRow}>
              <Chip
                label={r.rating.toFixed(1)}
                icon={<Ionicons name="star" size={12} color={colors.primary} />}
              />
              <Chip
                label={`${r.preparationTime}-${r.preparationTime + 10} min`}
                icon={<Ionicons name="time-outline" size={12} color={colors.textSecondary} />}
              />
              <Chip
                label={r.deliveryFee > 0 ? formatMoney(r.deliveryFee, r.currency) : 'Free'}
                icon={<Ionicons name="bicycle-outline" size={12} color={colors.textSecondary} />}
              />
            </View>

            {r.description ? <Text style={styles.detailDesc}>{r.description}</Text> : null}

            {menuLoading ? (
              <ActivityIndicator color={colors.ink} style={{ marginVertical: spacing['3xl'] }} />
            ) : menu.length === 0 ? (
              <Text style={styles.empty}>Menu coming soon.</Text>
            ) : (
              <>
                {menu.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                  >
                    {menu.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.name}
                        variant="filter"
                        selected={activeMenuCategory === c.id}
                        onPress={() => setActiveMenuCategory(c.id)}
                      />
                    ))}
                  </ScrollView>
                )}

                {menu
                  .filter((c) => !activeMenuCategory || c.id === activeMenuCategory)
                  .map((category) => (
                    <View key={category.id} style={styles.menuSection}>
                      <Text style={styles.menuSectionTitle}>{category.name}</Text>
                      {category.items.map((item) => (
                        <PressableScale
                          key={item.id}
                          style={styles.dishRow}
                          scaleTo={0.985}
                          onPress={() => setSheetItem(item)}
                          accessibilityRole="button"
                          accessibilityLabel={`${item.name}, ${formatMoney(item.price, item.currencyCode)}`}
                        >
                          <Image
                            source={{ uri: dishPhotoFor(item.id, item.name, item.image, 88) }}
                            style={styles.dishImage}
                          />
                          <View style={styles.dishBody}>
                            <Text style={styles.dishName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            {item.description ? (
                              <Text style={styles.dishDesc} numberOfLines={2}>
                                {item.description}
                              </Text>
                            ) : null}
                            <Text style={styles.dishPrice}>
                              {formatMoney(item.price, item.currencyCode)}
                            </Text>
                          </View>
                          <View style={styles.addButton}>
                            <Ionicons name="add" size={19} color={colors.textInverse} />
                          </View>
                        </PressableScale>
                      ))}
                    </View>
                  ))}
              </>
            )}
          </View>
        </ScrollView>

        <DishSheet
          item={sheetItem}
          prepTime={r.preparationTime}
          onClose={() => setSheetItem(null)}
          onAdd={(item, quantity, notes) => addItem({ type: 'menu', item, quantity, notes })}
        />

        {/* Sticky value bar: amount left, single action right. */}
        {cartCount > 0 && (
          <SafeAreaView edges={['bottom']} style={styles.cartBar}>
            <View style={styles.cartBarInner}>
              <View>
                <Text style={styles.cartCount}>
                  {cartCount} item{cartCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.cartTotal}>{formatMoney(cartSubtotal, currencyCode)}</Text>
              </View>
              <Button
                title="View cart"
                variant="ink"
                onPress={() => router.push('/food/cart')}
                iconRight={<Ionicons name="arrow-forward" size={16} color={colors.textInverse} />}
              />
            </View>
          </SafeAreaView>
        )}
      </View>
    );
  }

  // ─── Browse ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.browseHeader}>
        <View>
          <Text style={styles.eyebrow}>Order in</Text>
          <Text style={styles.screenTitle}>Food delivery</Text>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/food/cart')}
          accessibilityRole="button"
          accessibilityLabel="Cart"
        >
          <Ionicons name="bag-outline" size={20} color={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartDot}>
              <Text style={styles.cartDotText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search restaurants or cuisines"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={styles.empty}>{error}</Text>
          <View style={{ height: spacing.lg }} />
          <Button title="Try again" variant="outline" size="sm" onPress={loadRestaurants} />
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.cuisineRail}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cuisineRailInner}
              >
                {categories.map((c) => {
                  const active = selectedCategory === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={styles.cuisineItem}
                      activeOpacity={0.8}
                      onPress={() => setSelectedCategory(c)}
                      accessibilityRole="button"
                    >
                      <View style={[styles.cuisineThumbWrap, active && styles.cuisineThumbActive]}>
                        {c === 'All' ? (
                          <View style={styles.cuisineAll}>
                            <Ionicons
                              name="restaurant"
                              size={20}
                              color={active ? colors.ink : colors.textSecondary}
                            />
                          </View>
                        ) : (
                          <Image
                            source={{ uri: squarePhotoFor(c, c, null, 120) }}
                            style={styles.cuisineThumb}
                          />
                        )}
                      </View>
                      <Text
                        style={[styles.cuisineLabel, active && styles.cuisineLabelActive]}
                        numberOfLines={1}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.resultCount}>
                {filteredRestaurants.length} restaurant
                {filteredRestaurants.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>No restaurants found.</Text>}
          renderItem={({ item }) => (
            <PressableScale
              style={styles.card}
              scaleTo={0.98}
              onPress={() => openRestaurant(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.cuisineType}, rated ${item.rating.toFixed(1)}`}
            >
              <View style={styles.cardImageWrap}>
                <Image
                  source={{ uri: photoFor(item.id, item.cuisineType, null, { width: 640, ratio: 0.56 }) }}
                  style={styles.cardImage}
                />
                <View style={styles.cardChip}>
                  <Text style={styles.cardChipLabel}>
                    {item.deliveryFee > 0
                      ? `${formatMoney(item.deliveryFee, item.currency)} delivery`
                      : 'Free delivery'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={13} color={colors.primary} />
                    <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.cuisineType}
                  <Text style={styles.cardMetaDim}>
                    {`  ·  ${item.preparationTime}-${item.preparationTime + 10} min`}
                  </Text>
                </Text>
              </View>
            </PressableScale>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  screenTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 1,
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDotText: { fontSize: 10, fontWeight: '700', color: colors.ink },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },

  cuisineRail: { paddingTop: spacing.xl },
  cuisineRailInner: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  cuisineItem: { alignItems: 'center', width: 66, gap: spacing.sm },
  cuisineThumbWrap: {
    width: 62,
    height: 62,
    borderRadius: borderRadius.full,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cuisineThumbActive: { borderColor: colors.primary },
  cuisineThumb: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
  },
  cuisineAll: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuisineLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cuisineLabelActive: { color: colors.textPrimary, fontWeight: '700' },
  resultCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    paddingHorizontal: spacing.xl,
    marginTop: spacing['2xl'],
  },

  list: { paddingBottom: spacing['5xl'] },
  card: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  cardImageWrap: {
    height: 168,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.surfaceTertiary,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardChip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  cardChipLabel: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  cardBody: { paddingTop: spacing.md, gap: 3 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardName: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardMeta: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  cardMetaDim: { color: colors.textTertiary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textPrimary },

  detailScroll: { paddingBottom: spacing['5xl'] },
  hero: { height: 260, backgroundColor: colors.surfaceTertiary },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  heroBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sheet overlaps the hero — the standard premium detail treatment.
  detailSheet: {
    marginTop: -28,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  detailName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  detailAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  detailDesc: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 23,
    marginTop: spacing.lg,
  },
  tabs: { gap: spacing.sm, paddingVertical: spacing['2xl'] },
  menuSection: { marginBottom: spacing.xl },
  menuSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  dishImage: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTertiary,
  },
  dishBody: { flex: 1, gap: 2 },
  dishName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.textPrimary },
  dishDesc: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 19 },
  dishPrice: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 3,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartBar: { backgroundColor: colors.surface, ...shadows.premium },
  cartBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cartCount: { fontSize: typography.fontSize.xs, color: colors.textTertiary, fontWeight: '500' },
  cartTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },

  empty: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },
});
