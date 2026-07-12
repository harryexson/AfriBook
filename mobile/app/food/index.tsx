import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AfriBookMapView from '../../src/components/MapView';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  distance: string;
  imageUrl?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

const MOCK_RESTAURANTS: Restaurant[] = [
  { id: '1', name: 'Mama Ashanti', cuisine: 'Ghanaian', rating: 4.8, deliveryTime: '25-35 min', deliveryFee: '₦500', distance: '1.2 km' },
  { id: '2', name: 'Buka Kitchen', cuisine: 'Nigerian', rating: 4.6, deliveryTime: '20-30 min', deliveryFee: '₦300', distance: '0.8 km' },
  { id: '3', name: 'Spice Garden', cuisine: 'Indian', rating: 4.5, deliveryTime: '30-40 min', deliveryFee: '₦600', distance: '2.1 km' },
  { id: '4', name: 'Pizza Palace', cuisine: 'Italian', rating: 4.3, deliveryTime: '25-35 min', deliveryFee: '₦400', distance: '1.5 km' },
];

export default function FoodOrderScreen() {
  const router = useRouter();
  const { location } = useLocation();

  const [restaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<MenuItem[]>([]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => [...prev, item]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  if (selectedRestaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedRestaurant(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedRestaurant.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.restaurantBanner}>
            <Text style={styles.cuisineText}>{selectedRestaurant.cuisine}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={styles.ratingText}>{selectedRestaurant.rating}</Text>
              <Text style={styles.metaText}>· {selectedRestaurant.deliveryTime}</Text>
            </View>
          </View>

          {/* Menu items */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            {[
              { id: 'm1', name: 'Jollof Rice Special', description: 'Smoky jollof with grilled chicken', price: 2500 },
              { id: 'm2', name: 'Fried Plantains', description: 'Crispy golden plantains', price: 800 },
              { id: 'm3', name: 'Chin Chin', description: 'Sweet fried dough snack', price: 500 },
              { id: 'm4', name: 'Chapman', description: 'Nigerian cocktail drink', price: 600 },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => addToCart(item as MenuItem)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                  <Text style={styles.menuItemPrice}>₦{item.price.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item as MenuItem)}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Cart bar */}
        {cart.length > 0 && (
          <View style={styles.cartBar}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartCount}>{cart.length} items</Text>
              <Text style={styles.cartTotal}>₦{cartTotal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Delivery</Text>
      </View>

      {location && (
        <AfriBookMapView
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          markers={restaurants.map((r, i) => ({
            id: r.id,
            coordinate: {
              latitude: location.latitude + (i * 0.003) - 0.005,
              longitude: location.longitude + (i * 0.002) - 0.004,
            },
            title: r.name,
            subtitle: r.cuisine,
          }))}
          style={styles.map}
        />
      )}

      <View style={styles.restaurantList}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() => setSelectedRestaurant(item)}
            >
              <View style={styles.restaurantCardImage}>
                <Ionicons name="restaurant" size={24} color={colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
                <View style={styles.restaurantMeta}>
                  <Ionicons name="star" size={12} color={colors.primary} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                  <Text style={styles.metaText}>· {item.deliveryTime} · {item.distance}</Text>
                </View>
              </View>
              <Text style={styles.deliveryFeeText}>{item.deliveryFee}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
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
  map: {
    height: 180,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  restaurantList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  restaurantCardImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceTertiary,
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
  menuSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
