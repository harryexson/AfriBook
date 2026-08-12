-- ============================================================================
-- AfriBook StaysCape — AI Bundles & Guest Preferences — Migration 018
-- Extends the stay booking flow (migration 008) with guest-facing AI support:
--   • guest_metadata JSONB on stay_bookings (preferences, StayAssistant
--     context, and cross-sell bundle items recorded against the booking)
--   • JSONB GIN index for metadata lookups
--   • get_stay_booking_by_code — RLS-safe public booking lookup helper
-- ============================================================================

-- 1. GUEST METADATA ===========================================================

ALTER TABLE stay_bookings
    ADD COLUMN IF NOT EXISTS guest_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN stay_bookings.guest_metadata IS
    'Guest preferences and AI bundle data attached to a booking. Stores the '
    'StayAssistant context plus any cross-sell bundle items (ride, food, event) '
    'the guest accepted or was offered, keyed by item type.';

CREATE INDEX IF NOT EXISTS idx_sb_guest_metadata ON stay_bookings USING GIN (guest_metadata);

-- 2. PUBLIC BOOKING LOOKUP ====================================================
-- Guests reach the confirmation screen with only their booking code. This
-- function is SECURITY DEFINER so an unauthenticated guest can confirm a
-- booking exists and read the headline fields without exposing every column.
-- Fields that could leak PII beyond the guest themselves (guest_phone,
-- guest_metadata) are intentionally excluded.

CREATE OR REPLACE FUNCTION get_stay_booking_by_code(p_code VARCHAR(16))
RETURNS JSONB AS $$
DECLARE
    v_booking JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', sb.id,
        'booking_code', sb.booking_code,
        'hotel_id', sb.hotel_id,
        'room_id', sb.room_id,
        'guest_name', sb.guest_name,
        'check_in_date', sb.check_in_date,
        'check_out_date', sb.check_out_date,
        'nights', sb.nights,
        'guests', sb.guests,
        'price_per_night', sb.price_per_night,
        'subtotal', sb.subtotal,
        'platform_fee', sb.platform_fee,
        'tax', sb.tax,
        'total', sb.total,
        'currency_code', sb.currency_code,
        'status', sb.status,
        'payment_status', sb.payment_status,
        'payment_method', sb.payment_method,
        'created_at', sb.created_at,
        'hotel', jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'slug', h.slug,
            'city', h.city,
            'country', h.country,
            'country_code', h.country_code,
            'cover_image_url', h.cover_image_url,
            'gallery_images', h.gallery_images,
            'rating', h.rating,
            'review_count', h.review_count
        ),
        'room', jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'room_type', r.room_type,
            'max_occupancy', r.max_occupancy,
            'photos', r.photos
        )
    ) INTO v_booking
    FROM stay_bookings sb
    JOIN stay_hotels h ON h.id = sb.hotel_id
    JOIN stay_rooms r ON r.id = sb.room_id
    WHERE sb.booking_code = p_code;

    RETURN v_booking;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_stay_booking_by_code(VARCHAR) IS
    'Returns the headline fields of a stay booking (plus hotel and room summary) '
    'for a given booking code, readable by anyone with the code.';

-- 3. GUEST-MATCHED BUNDLE OFFER ===============================================
-- Deterministic cross-sell suggestion for a hotel: nearby food & dining spots
-- and the local ride baseline. Used by the confirmation page's bundle builder.

CREATE OR REPLACE FUNCTION get_stay_bundle_context(p_hotel_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_hotel RECORD;
    v_bundle JSONB;
BEGIN
    SELECT * INTO v_hotel FROM stay_hotels WHERE id = p_hotel_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('hotel', NULL, 'items', '[]'::jsonb);
    END IF;

    v_bundle := jsonb_build_object(
        'hotel', jsonb_build_object(
            'id', v_hotel.id,
            'name', v_hotel.name,
            'city', v_hotel.city,
            'country_code', v_hotel.country_code,
            'currency_code', v_hotel.currency_code
        ),
        'items', '[]'::jsonb
    );

    RETURN v_bundle;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_stay_bundle_context(UUID) IS
    'Returns the hotel context used to assemble a stay cross-sell bundle. '
    'Item construction happens in the application layer.';
