import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, Image,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../../src/components/ui/PressableScale';
import { imageSourceFor } from '../../src/lib/images';
import { useMarketStore } from '../../src/stores/market-store';
import { useAuthStore } from '../../src/stores/auth-store';
import { api } from '../../src/lib/api';
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

type BookingStep = 'browse' | 'detail' | 'confirmed';

interface StayHotelResponse {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  galleryImages: string[];
  amenities: string[];
}

interface StayRoomResponse {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxOccupancy: number;
  sizeSqm: number | null;
}

function toHotel(h: StayHotelResponse): Hotel {
  return {
    id: h.id,
    name: h.name,
    city: h.city,
    country: h.country,
    rating: h.rating,
    reviewCount: h.reviewCount,
    pricePerNight: h.priceFrom,
    image: h.galleryImages?.[0],
    amenities: h.amenities ?? [],
    rooms: [],
  };
}

function toRoom(r: StayRoomResponse): Room {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    pricePerNight: r.pricePerNight,
    guests: r.maxOccupancy,
    size: r.sizeSqm ? `${r.sizeSqm} m²` : '',
  };
}

export default function StaysScreen() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const countryCode = useMarketStore((s) => s.countryCode);
  const user = useAuthStore((s) => s.user);

  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    api
      .get<{ data: StayHotelResponse[] }>(`/api/stays?countryCode=${countryCode}`)
      .then((res) => {
        if (!cancelled) setHotels((res.data ?? []).map(toHotel));
      })
      .catch((err: unknown) => {
        if (!cancelled) setListError(err instanceof Error ? err.message : 'Could not load stays');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);
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

  const openHotel = async (hotel: Hotel) => {
    setSelectedHotel({ ...hotel, rooms: [] });
    setSelectedRoom(null);
    setCheckIn('');
    setCheckOut('');
    setBookingError(null);
    setStep('detail');
    setDetailLoading(true);
    try {
      const res = await api.get<{ data: { rooms: StayRoomResponse[] } }>(`/api/stays/${hotel.id}`);
      const rooms = (res.data?.rooms ?? []).map(toRoom);
      setSelectedHotel({ ...hotel, rooms });
      setGuests(rooms[0]?.guests ?? 2);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Could not load rooms');
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedHotel || !selectedRoom) {
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
    if (!user) {
      Alert.alert('Sign in to book', 'You need an AfriBook account to reserve a stay.');
      return;
    }

    setSubmitting(true);
    setBookingError(null);
    try {
      const res = await api.post<{ persisted?: boolean; data?: { bookingCode?: string } }>(
        '/api/stays/bookings',
        {
          hotelId: selectedHotel.id,
          roomId: selectedRoom.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
          guestName: user.name,
          guestEmail: user.email,
          guestPhone: user.phone,
        },
      );
      const code = res.data?.bookingCode;
      if (!res.persisted || !code) {
        setBookingError('The booking could not be saved. Nothing was reserved; please try again.');
        return;
      }
      setBookingCode(code);
      setStep('confirmed');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Nothing was reserved.');
    } finally {
      setSubmitting(false);
    }
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
              <Text style={styles.totalLabel}>Estimated total</Text>
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
            {detailLoading && <ActivityIndicator color={colors.ink} style={{ marginVertical: spacing.xl }} />}
            {!detailLoading && selectedHotel.rooms.length === 0 && (
              <Text style={styles.metaText}>No rooms are listed for this stay yet.</Text>
            )}
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
                  <View style={styles.dateField}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <TextInput
                      value={checkIn}
                      onChangeText={setCheckIn}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                      maxLength={10}
                      accessibilityLabel="Check-in date"
                      style={styles.dateInput}
                    />
                  </View>
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Check-out</Text>
                  <View style={styles.dateField}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <TextInput
                      value={checkOut}
                      onChangeText={setCheckOut}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                      maxLength={10}
                      accessibilityLabel="Check-out date"
                      style={styles.dateInput}
                    />
                  </View>
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
                Enter dates as YYYY-MM-DD. Final pricing is confirmed when you book.
              </Text>
            </View>
          </View>
        </ScrollView>

        {bookingError && <Text style={styles.bookingErrorText}>{bookingError}</Text>}
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>
              {selectedRoom ? formatMoneySymbol(roomSubtotal, currencyCode) : 'Select a room'}
            </Text>
            <Text style={styles.cartCount}>{nights} night{nights > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, (submitting || !selectedRoom) && { opacity: 0.6 }]}
            onPress={confirmBooking}
            disabled={submitting || !selectedRoom}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Reserving…' : 'Book Now'}</Text>
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
        ListEmptyComponent={
          listLoading ? (
            <ActivityIndicator color={colors.ink} style={{ marginTop: spacing['3xl'] }} />
          ) : (
            <Text style={styles.metaText}>
              {listError ?? 'No stays are listed in this market yet.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <PressableScale
            style={styles.hotelCard}
            scaleTo={0.98}
            accessibilityRole="button"
            onPress={() => openHotel(item)}
          >
            <Image
              source={imageSourceFor(item.id, 'stays', undefined, { width: 200, ratio: 1 })}
              style={styles.hotelCardImage}
            />
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
          </PressableScale>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
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
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTertiary,
    marginRight: spacing.md,
    resizeMode: 'cover',
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
  dateInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  bookingErrorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
    backgroundColor: colors.surface,
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