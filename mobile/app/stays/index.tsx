import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMarketStore } from '../../src/stores/market-store';
import { formatMoneySymbol } from '../../src/lib/money';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/theme';

interface Room {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  guests: number;
  size: string;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  image?: string;
  amenities: string[];
  rooms: Room[];
}

const MOCK_HOTELS: Hotel[] = [
  {
    id: 'h1',
    name: 'Eko Atlantic Suites',
    city: 'Lagos',
    country: 'Nigeria',
    rating: 4.8,
    reviewCount: 312,
    pricePerNight: 95000,
    amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Airport shuttle'],
    rooms: [
      { id: 'r1', name: 'Standard Room', description: 'Comfortable queen bed with city view', pricePerNight: 75000, guests: 2, size: '28 m²' },
      { id: 'r2', name: 'Deluxe Room', description: 'King bed, ocean-facing balcony', pricePerNight: 95000, guests: 2, size: '36 m²' },
      { id: 'r3', name: 'Executive Suite', description: 'Separate lounge and work area', pricePerNight: 145000, guests: 3, size: '58 m²' },
    ],
  },
  {
    id: 'h2',
    name: 'Serena Palm Hotel',
    city: 'Nairobi',
    country: 'Kenya',
    rating: 4.6,
    reviewCount: 198,
    pricePerNight: 18500,
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Bar', 'Parking'],
    rooms: [
      { id: 'r1', name: 'Standard Room', description: 'Garden-view twin room', pricePerNight: 15000, guests: 2, size: '24 m²' },
      { id: 'r2', name: 'Superior Room', description: 'Queen bed, city view', pricePerNight: 18500, guests: 2, size: '30 m²' },
      { id: 'r3', name: 'Family Suite', description: 'Two bedrooms and a lounge', pricePerNight: 28000, guests: 4, size: '64 m²' },
    ],
  },
  {
    id: 'h3',
    name: 'Victoria Falls Lodge',
    city: 'Livingstone',
    country: 'Zambia',
    rating: 4.9,
    reviewCount: 265,
    pricePerNight: 4200,
    amenities: ['Free WiFi', 'Pool', 'Safari desk', 'Restaurant', 'Fireplace'],
    rooms: [
      { id: 'r1', name: 'Garden Room', description: 'Lush garden outlook', pricePerNight: 3200, guests: 2, size: '26 m²' },
      { id: 'r2', name: 'River View Room', description: 'Views over the Zambezi', pricePerNight: 4200, guests: 2, size: '32 m²' },
      { id: 'r3', name: 'Luxury Tent', description: 'Glamping suite with plunge pool', pricePerNight: 6800, guests: 2, size: '45 m²' },
    ],
  },
  {
    id: 'h4',
    name: 'Accra Pearl Hotel',
    city: 'Accra',
    country: 'Ghana',
    rating: 4.5,
    reviewCount: 141,
    pricePerNight: 1450,
    amenities: ['Free WiFi', 'Restaurant', 'Conference room', 'Parking'],
    rooms: [
      { id: 'r1', name: 'Standard Room', description: 'Modern queen room', pricePerNight: 1200, guests: 2, size: '22 m²' },
      { id: 'r2', name: 'Business Room', description: 'Desk and high-speed internet', pricePerNight: 1450, guests: 2, size: '28 m²' },
    ],
  },
  {
    id: 'h5',
    name: 'Table Bay Oasis',
    city: 'Cape Town',
    country: 'South Africa',
    rating: 4.7,
    reviewCount: 389,
    pricePerNight: 3250,
    amenities: ['Free WiFi', 'Pool', 'Beach access', 'Spa', 'Valet parking'],
    rooms: [
      { id: 'r1', name: 'Harbour Room', description: 'Views over the marina', pricePerNight: 2700, guests: 2, size: '30 m²' },
      { id: 'r2', name: 'Ocean Suite', description: 'Corner suite with sea views', pricePerNight: 3250, guests: 2, size: '44 m²' },
      { id: 'r3', name: 'Presidential Suite', description: 'Private terrace and butler service', pricePerNight: 8900, guests: 4, size: '96 m²' },
    ],
  },
];

type BookingStep = 'browse' | 'detail' | 'confirmed';

export default function StaysScreen() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());

  const [hotels] = React.useState<Hotel[]>(MOCK_HOTELS);
  const [selectedHotel, setSelectedHotel] = React.useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [guests, setGuests] = React.useState(2);
  const [step, setStep] = React.useState<BookingStep>('browse');
  const [bookingCode, setBookingCode] = React.useState('');

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    return Math.max(1, Number.isFinite(diff) ? diff : 1);
  }, [checkIn, checkOut]);

  const roomSubtotal = (selectedRoom?.pricePerNight ?? 0) * nights;
  const platformFee = Math.round(roomSubtotal * 0.1);
  const taxes = Math.round(roomSubtotal * 0.075);
  const total = roomSubtotal + platformFee + taxes;

  const openHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setSelectedRoom(null);
    setCheckIn('');
    setCheckOut('');
    setGuests(hotel.rooms[0]?.guests ?? 2);
    setStep('detail');
  };

  const confirmBooking = () => {
    if (!selectedRoom) {
      Alert.alert('Select a room', 'Choose a room type to continue.');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Select dates', 'Please choose your check-in and check-out dates.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      Alert.alert('Invalid dates', 'Check-out must be after check-in.');
      return;
    }
    const code = `ST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setBookingCode(code);
    setStep('confirmed');
  };

  if (step === 'confirmed' && selectedHotel) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.confirmedHeader}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          <Text style={styles.confirmedTitle}>Booking Confirmed</Text>
          <Text style={styles.confirmedSubtitle}>
            Your stay at {selectedHotel.name} is booked.
          </Text>
          <View style={styles.bookingCodeBox}>
            <Text style={styles.bookingCodeLabel}>Booking code</Text>
            <Text style={styles.bookingCode}>{bookingCode}</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{selectedRoom?.name}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Check-in</Text>
              <Text style={styles.summaryValue}>{checkIn}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Check-out</Text>
              <Text style={styles.summaryValue}>{checkOut}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests</Text>
              <Text style={styles.summaryValue}>{guests}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nights</Text>
              <Text style={styles.summaryValue}>{nights}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Room total</Text>
              <Text style={styles.summaryValue}>{formatMoneySymbol(roomSubtotal, currencyCode)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform fee</Text>
              <Text style={styles.summaryValue}>{formatMoneySymbol(platformFee, currencyCode)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes</Text>
              <Text style={styles.summaryValue}>{formatMoneySymbol(taxes, currencyCode)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMoneySymbol(total, currencyCode)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.cartBar}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('browse')}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'detail' && selectedHotel) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('browse')}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedHotel.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.hotelBanner}>
            <Text style={styles.hotelCity}>{selectedHotel.city}, {selectedHotel.country}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={styles.ratingText}>{selectedHotel.rating}</Text>
              <Text style={styles.metaText}>· {selectedHotel.reviewCount} reviews</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenityList}>
              {selectedHotel.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityTag}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select room</Text>
            {selectedHotel.rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, selectedRoom?.id === room.id && styles.roomCardActive]}
                onPress={() => setSelectedRoom(room)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomDesc}>{room.description}</Text>
                  <View style={styles.roomMeta}>
                    <Text style={styles.metaText}>Sleeps {room.guests} · {room.size}</Text>
                  </View>
                  <Text style={styles.roomPrice}>{formatMoneySymbol(room.pricePerNight, currencyCode)} / night</Text>
                </View>
                <View style={[styles.radio, selectedRoom?.id === room.id && styles.radioActive]}>
                  {selectedRoom?.id === room.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay details</Text>
            <View style={styles.formCard}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Check-in</Text>
                  <TouchableOpacity onPress={() => {}} style={styles.dateField}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.dateText, !checkIn && styles.datePlaceholder]}>
                      {checkIn || 'YYYY-MM-DD'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Check-out</Text>
                  <TouchableOpacity onPress={() => {}} style={styles.dateField}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.dateText, !checkOut && styles.datePlaceholder]}>
                      {checkOut || 'YYYY-MM-DD'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Guests</Text>
                  <View style={styles.guestStepper}>
                    <TouchableOpacity onPress={() => setGuests((g) => Math.max(1, g - 1))}>
                      <Ionicons name="remove-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.guestCount}>{guests}</Text>
                    <TouchableOpacity onPress={() => setGuests((g) => Math.min(8, g + 1))}>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text style={styles.dateHint}>
                Tap a date field to edit (format YYYY-MM-DD).
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>
              {selectedRoom ? formatMoneySymbol(roomSubtotal, currencyCode) : 'Select a room'}
            </Text>
            <Text style={styles.cartCount}>{nights} night{nights > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={confirmBooking}>
            <Text style={styles.primaryButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hotels & Stays</Text>
      </View>

      <FlatList
        data={hotels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.hotelList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.hotelCard}
            onPress={() => openHotel(item)}
          >
            <View style={styles.hotelCardImage}>
              <Ionicons name="bed" size={24} color={colors.textTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotelName}>{item.name}</Text>
              <Text style={styles.hotelCuisine}>{item.city}, {item.country}</Text>
              <View style={styles.restaurantMeta}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Text style={styles.metaText}>· {item.reviewCount} reviews</Text>
              </View>
            </View>
            <Text style={styles.hotelPrice}>
              {formatMoneySymbol(item.pricePerNight, currencyCode)}
              {'\n'}
              <Text style={styles.hotelPricePer}>/night</Text>
            </Text>
          </TouchableOpacity>
        )}
      />
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
    flexShrink: 1,
  },
  hotelList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing["5xl"],
  },
  hotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  hotelCardImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  hotelName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hotelCuisine: {
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
  hotelPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  hotelPricePer: {
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  hotelBanner: {
    padding: spacing.lg,
  },
  hotelCity: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  amenityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  roomCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  roomName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roomDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roomMeta: {
    marginTop: spacing.xs,
  },
  roomPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  formCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    color: colors.textTertiary,
  },
  guestStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  guestCount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
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
  confirmedHeader: {
    alignItems: 'center',
    paddingTop: spacing["4xl"],
    paddingHorizontal: spacing.xl,
  },
  confirmedTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  confirmedSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bookingCodeBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  bookingCodeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bookingCode: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 2,
  },
  summaryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});