// ─────────────────────────────────────────────────────────────
// StaysCape — booking lookup composer.
// ─────────────────────────────────────────────────────────────

import type { StayBooking, StayBookingLookup, StayHotel, StayRoom } from './types'

export function toBookingLookup(
  booking: StayBooking,
  hotel: StayHotel | null,
  room: StayRoom | null,
): StayBookingLookup {
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    hotelId: booking.hotelId,
    roomId: booking.roomId,
    guestName: booking.guestName,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    nights: booking.nights,
    guests: booking.guests,
    pricePerNight: booking.pricePerNight,
    subtotal: booking.subtotal,
    platformFee: booking.platformFee,
    tax: booking.tax,
    total: booking.total,
    currencyCode: booking.currencyCode,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    createdAt: booking.createdAt,
    hotel: hotel
      ? {
          id: hotel.id,
          name: hotel.name,
          slug: hotel.slug,
          city: hotel.city,
          country: hotel.country,
          countryCode: hotel.countryCode,
          coverImageUrl: hotel.galleryImages[0] ?? '',
          galleryImages: hotel.galleryImages,
          rating: hotel.rating,
          reviewCount: hotel.reviewCount,
        }
      : null,
    room: room
      ? {
          id: room.id,
          name: room.name,
          roomType: room.roomType,
          maxOccupancy: room.maxOccupancy,
          photos: room.photos,
        }
      : null,
  }
}
