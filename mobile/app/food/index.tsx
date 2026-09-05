import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import { useMarketStore } from '../../src/stores/market-store';
import { useCartStore } from '../../src/stores/cart-store';
import { api } from '../../src/lib/api';
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

interface RestaurantDetail extends RestaurantSummary {}

// Cuisine → Ionicons name, for the category row (adapted from the
// Haneul/food-app reference screenshots: a row of circular cuisine icons
// above the restaurant list). Matched by substring against the real
// cuisineType values the API returns.
const CUISINE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pizza: 'pizza', italian: 'pizza',
  asian: 'restaurant', chinese: 'restaurant', japanese: 'restaurant', korean: 'restaurant', thai: 'restaurant',
  burger: 'fast-food', fast: 'fast-food',
  cafe: 'cafe', coffee: 'cafe', breakfast: 'cafe',
  drink: 'wine',
  salad: 'nutrition', healthy: 'nutrition', vegan: 'nutrition', vegetarian: 'nutrition',
  bbq: 'flame', grill: 'flame', suya: 'flame', spicy: 'flame',
  dessert: 'ice-cream',
};

function cuisineIcon(cuisine: string): keyof typeof Ionicons.glyphMap {
  const key = Object.keys(CUISINE_ICONS).find((k) => cuisine.toLowerCase().includes(k));
  return key ? CUISINE_ICONS[key] : 'restaurant';
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

  const [selectedRestaurant, setSelectedRestaurant] = React.useState<RestaurantDetail | null>(null);
  const [menu, setMenu] = React.useState<MenuCategory[]>([]);
  const [menuLoading, setMenuLoading] = React.useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = React.useState('');

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
      result = result.filter((r) => r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.rating - a.rating);
  }, [restaurants, selectedCategory, searchQuery]);

  const openRestaurant = async (restaurant: RestaurantSummary) => {
    setSelectedRestaurant(restaurant);
    setMenuLoading(true);
    try {
      const res = await api.get<{ data: { restaurant: RestaurantDetail; menu: MenuCategory[] } }>(
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

  const addToCart = (item: MenuItem) => {
    addItem({ type: 'menu', item, quantity: 1 });
  };

  if (selectedRestaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedRestaurant(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedRestaurant.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        {menuLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView style={styles.content}>
              <View style={styles.restaurantBanner}>
                <Text style={styles.cuisineText}>{selectedRestaurant.cuisineType}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.primary} />
                  <Text style={styles.ratingText}>{selectedRestaurant.rating.toFixed(1)}</Text>
                  <Text style={styles.metaText}>· {selectedRestaurant.preparationTime}-{selectedRestaurant.preparationTime + 10} min</Text>
                </View>
              </View>

              {menu.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                  {menu.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setActiveMenuCategory(category.id)}
                      style={[styles.categoryTab, activeMenuCategory === category.id && styles.categoryTabActive]}
                    >
                      <Text style={[styles.categoryTabText, activeMenuCategory === category.id && styles.categoryTabTextActive]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {menu.length === 0 ? (
                <View style={styles.menuSection}>
                  <Text style={styles.metaText}>Menu coming soon.</Text>
                </View>
              ) : (
                menu
                  .filter((c) => !activeMenuCategory || c.id === activeMenuCategory)
                  .map((category) => (
                    <View key={category.id} style={styles.menuSection}>
                      <Text style={styles.sectionTitle}>{category.name}</Text>
                      {category.items.map((item) => (
                        <Card key={item.id} variant="outlined" padding="md" style={styles.menuItemCard}>
                          <View style={styles.menuItemRow}>
                            <View style={{ flex: 1 }}>
                              <View style={styles.menuItemNameRow}>
                                <Text style={styles.menuItemName}>{item.name}</Text>
                                {item.dietaryTags?.includes('vegetarian') && (
                                  <Badge label="Veg" variant="success" />
                                )}
                              </View>
                              {item.description ? (
                                <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                              ) : null}
                              <Text style={styles.menuItemPrice}>{formatMoney(item.price, item.currencyCode)}</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                              <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </Card>
                      ))}
                    </View>
                  ))
              )}
            </ScrollView>

            {cartCount > 0 && (
              <View style={styles.cartBar}>
                <View style={styles.cartInfo}>
                  <Text style={styles.cartCount}>{cartCount} item{cartCount !== 1 ? 's' : ''}</Text>
                  <Text style={styles.cartTotal}>{formatMoney(cartSubtotal, currencyCode)}</Text>
                </View>
                <Button title="View Cart" onPress={() => router.push('/food/cart')} />
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Delivery</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginLeft: spacing.md }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search restaurants or cuisines"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}
          renderItem={({ item: category }) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity style={styles.categoryItem} onPress={() => setSelectedCategory(category)}>
                <View style={[styles.categoryIcon, active ? styles.categoryIconActive : styles.categoryIconInactive]}>
                  <Ionicons
                    name={category === 'All' ? 'sparkles' : cuisineIcon(category)}
                    size={22}
                    color={active ? colors.textInverse : colors.textTertiary}
                  />
                </View>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]} numberOfLines={1}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={styles.metaText}>{error}</Text>
          <View style={{ height: spacing.md }} />
          <Button title="Try again" onPress={loadRestaurants} variant="outline" size="sm" />
        </View>
      ) : (
        <View style={styles.restaurantList}>
          <FlatList
            data={filteredRestaurants}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.metaText}>No restaurants found.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openRestaurant(item)}>
                <Card variant="outlined" padding="md" style={styles.restaurantCard}>
                  <View style={styles.restaurantCardRow}>
                    <View style={styles.restaurantCardImage}>
                      <Ionicons name={cuisineIcon(item.cuisineType)} size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restaurantName}>{item.name}</Text>
                      <Text style={styles.restaurantCuisine}>{item.cuisineType}</Text>
                      <View style={styles.restaurantMeta}>
                        <Ionicons name="star" size={12} color={colors.primary} />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        <Text style={styles.metaText}>· {item.preparationTime}-{item.preparationTime + 10} min</Text>
                      </View>
                    </View>
                    <Text style={styles.deliveryFeeText}>
                      {item.deliveryFee > 0 ? formatMoney(item.deliveryFee, item.currency) : 'Free'}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  categoryRow: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    width: 64,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: colors.primary,
  },
  categoryIconInactive: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  map: {
    height: 180,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  restaurantList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  restaurantCard: {
    marginBottom: spacing.sm,
  },
  restaurantCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantCardImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  restaurantName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  restaurantCuisine: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 2,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  deliveryFeeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  restaurantBanner: {
    padding: spacing.lg,
  },
  cuisineText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  categoryTabs: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: colors.textInverse,
  },
  menuSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuItemCard: {
    marginBottom: spacing.sm,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuItemDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  cartInfo: {
    flex: 1,
  },
  cartCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cartTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
