-- ============================================================================
-- AfriBook StaysCape — Hotel & Accommodation Booking System — Migration 008
-- Comprehensive Supabase PostgreSQL migration covering:
--   • Enum types for hotel/room/booking domains
--   • Core tables: stay_hotels, stay_rooms, stay_room_availability, stay_bookings
--   • Indexes (GIST for location, btree for status/dates, unique on booking_code)
--   • Row Level Security policies
--   • Realtime publications
--   • Functions: booking code generation, room availability check, hotel stats
--   • Triggers: auto-set booking code, availability adjustment on booking changes
-- ============================================================================

-- 0. EXTENSIONS =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES =================================================================

CREATE TYPE stay_status AS ENUM (
    'draft',
    'published',
    'suspended',
    'archived'
);

CREATE TYPE stay_room_type AS ENUM (
    'standard',
    'deluxe',
    'superior',
    'suite',
    'executive',
    'family',
    'studio',
    'apartment',
    'villa',
    'hostel',
    'shared'
);

CREATE TYPE stay_booking_status AS ENUM (
    'pending',
    'confirmed',
    'checked_in',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE stay_payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);

-- 2. CORE TABLES ================================================================

-- ---------------------------------------------------------------------------
-- STAY HOTELS — accommodation listings hosted on StaysCape
-- ---------------------------------------------------------------------------
CREATE TABLE stay_hotels (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id                     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    host_name                   VARCHAR(255) NOT NULL DEFAULT '',
    name                        VARCHAR(255) NOT NULL,
    slug                        VARCHAR(300) NOT NULL,
    description                 TEXT NOT NULL DEFAULT '',
    short_description           VARCHAR(500) NOT NULL DEFAULT '',
    status                      stay_status NOT NULL DEFAULT 'draft',

    -- Location
    country_code                VARCHAR(4) NOT NULL DEFAULT '',
    country                     VARCHAR(128) NOT NULL DEFAULT '',
    city                        VARCHAR(128) NOT NULL DEFAULT '',
    address                     TEXT DEFAULT '',
    location                    GEOGRAPHY(POINT, 4326),
    latitude                    NUMERIC(9, 6),
    longitude                   NUMERIC(9, 6),

    -- Property
    star_rating                 SMALLINT NOT NULL DEFAULT 0,
    property_type               VARCHAR(64) NOT NULL DEFAULT 'hotel',
    check_in_time               TIME NOT NULL DEFAULT '14:00',
    check_out_time              TIME NOT NULL DEFAULT '11:00',
    year_built                  SMALLINT,
    rooms_count                 INT NOT NULL DEFAULT 0,

    -- Media
    cover_image_url             TEXT DEFAULT '',
    gallery_images              JSONB DEFAULT '[]'::jsonb,

    -- Pricing
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',
    price_from                  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_to                    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    platform_fee_percent        NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
    tax_rate                    NUMERIC(5, 2) NOT NULL DEFAULT 0,

    -- Amenities
    amenities                   JSONB DEFAULT '[]'::jsonb,
    policies                    JSONB DEFAULT '{}'::jsonb,

    -- Stats
    rating                      NUMERIC(3, 2) NOT NULL DEFAULT 0,
    review_count                INT NOT NULL DEFAULT 0,
    view_count                  BIGINT DEFAULT 0,
    favorite_count              BIGINT DEFAULT 0,
    is_featured                 BOOLEAN NOT NULL DEFAULT false,

    -- SEO & Sharing
    meta_title                  VARCHAR(255),
    meta_description            VARCHAR(500),
    share_url                   TEXT DEFAULT '',

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_hotel_rating CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT chk_hotel_review_count CHECK (review_count >= 0),
    CONSTRAINT chk_hotel_stars CHECK (star_rating >= 0 AND star_rating <= 5),
    CONSTRAINT chk_hotel_rooms_count CHECK (rooms_count >= 0),
    CONSTRAINT chk_hotel_price_from CHECK (price_from >= 0),
    CONSTRAINT chk_hotel_price_to CHECK (price_to >= 0)
);

COMMENT ON TABLE stay_hotels IS 'Hotel and accommodation listings hosted on the AfriBook StaysCape platform';
COMMENT ON COLUMN stay_hotels.slug IS 'URL-friendly slug auto-generated from name';
COMMENT ON COLUMN stay_hotels.location IS 'PostGIS geography point (lng, lat) for spatial queries';
COMMENT ON COLUMN stay_hotels.gallery_images IS 'JSON array of gallery image URLs';
COMMENT ON COLUMN stay_hotels.amenities IS 'JSON array of amenity strings (wifi, pool, parking, etc.)';
COMMENT ON COLUMN stay_hotels.policies IS 'JSON object of property policies (pets, smoking, cancellation)';

CREATE UNIQUE INDEX idx_stay_hotels_slug ON stay_hotels(slug);
CREATE INDEX idx_stay_hotels_host ON stay_hotels(host_id);
CREATE INDEX idx_stay_hotels_status ON stay_hotels(status);
CREATE INDEX idx_stay_hotels_country ON stay_hotels(country_code);
CREATE INDEX idx_stay_hotels_city ON stay_hotels(city);
CREATE INDEX idx_stay_hotels_country_city ON stay_hotels(country_code, city);
CREATE INDEX idx_stay_hotels_location ON stay_hotels USING GIST(location);
CREATE INDEX idx_stay_hotels_price_from ON stay_hotels(price_from);
CREATE INDEX idx_stay_hotels_rating ON stay_hotels(rating);
CREATE INDEX idx_stay_hotels_featured ON stay_hotels(is_featured);
CREATE INDEX idx_stay_hotels_created ON stay_hotels(created_at);

-- ---------------------------------------------------------------------------
-- STAY ROOMS — bookable room types within a hotel
-- ---------------------------------------------------------------------------
CREATE TABLE stay_rooms (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id                    UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    room_type                   stay_room_type NOT NULL DEFAULT 'standard',
    name                        VARCHAR(255) NOT NULL,
    description                 TEXT NOT NULL DEFAULT '',

    -- Capacity
    max_occupancy               INT NOT NULL DEFAULT 2,
    bed_count                   INT NOT NULL DEFAULT 1,
    bed_type                    VARCHAR(64) NOT NULL DEFAULT 'double',
    bathrooms                   SMALLINT NOT NULL DEFAULT 1,
    size_sqm                    NUMERIC(6, 1),

    -- Pricing
    price_per_night             NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',
    min_nights                  INT NOT NULL DEFAULT 1,
    max_occupancy_adults        INT NOT NULL DEFAULT 2,
    max_occupancy_children      INT NOT NULL DEFAULT 0,

    -- Inventory
    quantity                    INT NOT NULL DEFAULT 1,
    available                   INT NOT NULL DEFAULT 1,

    -- Media
    photos                      JSONB DEFAULT '[]'::jsonb,

    -- Amenities
    amenities                   JSONB DEFAULT '[]'::jsonb,

    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_room_price CHECK (price_per_night >= 0),
    CONSTRAINT chk_room_occupancy CHECK (max_occupancy > 0),
    CONSTRAINT chk_room_quantity CHECK (quantity > 0),
    CONSTRAINT chk_room_available CHECK (available >= 0 AND available <= quantity),
    CONSTRAINT chk_room_min_nights CHECK (min_nights >= 1)
);

COMMENT ON TABLE stay_rooms IS 'Bookable room types within a StaysCape hotel';
COMMENT ON COLUMN stay_rooms.quantity IS 'Number of identical rooms of this type in the hotel';
COMMENT ON COLUMN stay_rooms.available IS 'Currently available count of this room type (surplus)';
COMMENT ON COLUMN stay_rooms.photos IS 'JSON array of room photo URLs';
COMMENT ON COLUMN stay_rooms.amenities IS 'JSON array of in-room amenity strings';

CREATE INDEX idx_stay_rooms_hotel ON stay_rooms(hotel_id);
CREATE INDEX idx_stay_rooms_type ON stay_rooms(room_type);
CREATE INDEX idx_stay_rooms_active ON stay_rooms(is_active);
CREATE INDEX idx_stay_rooms_hotel_active ON stay_rooms(hotel_id, is_active);
CREATE INDEX idx_stay_rooms_price ON stay_rooms(price_per_night);

-- ---------------------------------------------------------------------------
-- STAY ROOM AVAILABILITY — per-date inventory for each room type
-- ---------------------------------------------------------------------------
CREATE TABLE stay_room_availability (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id                     UUID NOT NULL REFERENCES stay_rooms(id) ON DELETE CASCADE,
    hotel_id                    UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    stay_date                   DATE NOT NULL,
    total                       INT NOT NULL DEFAULT 1,
    booked                      INT NOT NULL DEFAULT 0,
    is_blocked                  BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_avail_total CHECK (total > 0),
    CONSTRAINT chk_avail_booked CHECK (booked >= 0 AND booked <= total),
    CONSTRAINT uq_avail_room_date UNIQUE (room_id, stay_date)
);

COMMENT ON TABLE stay_room_availability IS 'Per-date availability snapshot for each bookable room type';
COMMENT ON COLUMN stay_room_availability.total IS 'Total inventory for this room type on this date';
COMMENT ON COLUMN stay_room_availability.booked IS 'Rooms already booked for this date';
COMMENT ON COLUMN stay_room_availability.is_blocked IS 'Manually blocked dates (maintenance, private)';

CREATE INDEX idx_sra_room_date ON stay_room_availability(room_id, stay_date);
CREATE INDEX idx_sra_hotel_date ON stay_room_availability(hotel_id, stay_date);
CREATE INDEX idx_sra_date ON stay_room_availability(stay_date);
CREATE INDEX idx_sra_blocked ON stay_room_availability(is_blocked);

-- ---------------------------------------------------------------------------
-- STAY BOOKINGS — guest reservations
-- ---------------------------------------------------------------------------
CREATE TABLE stay_bookings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code                VARCHAR(16) NOT NULL,
    hotel_id                    UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    room_id                     UUID NOT NULL REFERENCES stay_rooms(id) ON DELETE RESTRICT,
    guest_id                    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_name                  VARCHAR(255) NOT NULL,
    guest_email                 VARCHAR(255) NOT NULL,
    guest_phone                 VARCHAR(32) DEFAULT '',

    -- Dates
    check_in_date               DATE NOT NULL,
    check_out_date              DATE NOT NULL,
    nights                      INT NOT NULL DEFAULT 1,
    guests                      INT NOT NULL DEFAULT 1,

    -- Pricing
    price_per_night             NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal                    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    platform_fee                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax                         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total                       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Status
    status                      stay_booking_status NOT NULL DEFAULT 'pending',
    payment_status              stay_payment_status NOT NULL DEFAULT 'pending',
    payment_intent_id           VARCHAR(255),
    payment_method              VARCHAR(64),

    -- Metadata
    special_requests            TEXT,
    guest_message               TEXT,
    cancellation_reason         TEXT,
    cancelled_at                TIMESTAMPTZ,
    checked_in_at               TIMESTAMPTZ,
    checked_out_at              TIMESTAMPTZ,
    referral_code               VARCHAR(32),

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT chk_booking_nights CHECK (nights >= 1),
    CONSTRAINT chk_booking_guests CHECK (guests >= 1),
    CONSTRAINT chk_booking_amounts CHECK (subtotal >= 0 AND platform_fee >= 0 AND tax >= 0 AND total >= 0)
);

COMMENT ON TABLE stay_bookings IS 'Guest reservations for StaysCape accommodations with full pricing breakdown';
COMMENT ON COLUMN stay_bookings.booking_code IS 'Unique human-readable booking reference (e.g. ST-XXXX-XXXX)';
COMMENT ON COLUMN stay_bookings.platform_fee IS 'AfriBook platform fee for this booking';
COMMENT ON COLUMN stay_bookings.tax IS 'Tax applied to this booking';

CREATE UNIQUE INDEX idx_sb_booking_code ON stay_bookings(booking_code);
CREATE INDEX idx_sb_hotel ON stay_bookings(hotel_id);
CREATE INDEX idx_sb_room ON stay_bookings(room_id);
CREATE INDEX idx_sb_guest ON stay_bookings(guest_id);
CREATE INDEX idx_sb_guest_email ON stay_bookings(guest_email);
CREATE INDEX idx_sb_status ON stay_bookings(status);
CREATE INDEX idx_sb_payment_status ON stay_bookings(payment_status);
CREATE INDEX idx_sb_dates ON stay_bookings(check_in_date, check_out_date);
CREATE INDEX idx_sb_hotel_status ON stay_bookings(hotel_id, status);
CREATE INDEX idx_sb_created ON stay_bookings(created_at);

-- 3. FUNCTIONS ==================================================================

-- ---------------------------------------------------------------------------
-- generate_stay_booking_code — unique human-readable booking reference
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_stay_booking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    i INT;
BEGIN
    LOOP
        code := 'ST-';
        FOR i IN 1..4 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        code := code || '-';
        FOR i IN 1..4 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM stay_bookings WHERE booking_code = code
        );
    END LOOP;

    RETURN code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_stay_booking_code() IS 'Generates a unique booking reference in the format ST-XXXX-XXXX';

-- ---------------------------------------------------------------------------
-- check_stay_room_availability — verify a room is bookable for a date range
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_stay_room_availability(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_rooms INT DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    room_record RECORD;
    v_date DATE;
    v_available INT;
    v_blocked INT;
BEGIN
    SELECT * INTO room_record
    FROM stay_rooms
    WHERE id = p_room_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('available', false, 'reason', 'room_not_found');
    END IF;

    IF NOT room_record.is_active THEN
        RETURN jsonb_build_object('available', false, 'reason', 'room_inactive');
    END IF;

    IF p_check_in < CURRENT_DATE THEN
        RETURN jsonb_build_object('available', false, 'reason', 'check_in_in_past');
    END IF;

    IF p_check_out <= p_check_in THEN
        RETURN jsonb_build_object('available', false, 'reason', 'invalid_date_range');
    END IF;

    -- Walk each night and check inventory
    v_date := p_check_in;
    WHILE v_date < p_check_out LOOP
        SELECT COALESCE(SUM(total - booked), 0),
               COUNT(*) FILTER (WHERE is_blocked)
        INTO v_available, v_blocked
        FROM stay_room_availability
        WHERE room_id = p_room_id AND stay_date = v_date;

        -- No availability row yet: fall back to room base inventory
        IF v_blocked = 0 AND NOT EXISTS (
            SELECT 1 FROM stay_room_availability
            WHERE room_id = p_room_id AND stay_date = v_date
        ) THEN
            v_available := room_record.quantity - room_record.available;
            v_available := GREATEST(v_available, 0);
        END IF;

        IF v_blocked > 0 THEN
            RETURN jsonb_build_object(
                'available', false,
                'reason', 'date_blocked',
                'date', v_date
            );
        END IF;

        IF v_available < p_rooms THEN
            RETURN jsonb_build_object(
                'available', false,
                'reason', 'insufficient_rooms',
                'date', v_date,
                'remaining', GREATEST(v_available, 0)
            );
        END IF;

        v_date := v_date + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'available', true,
        'price_per_night', room_record.price_per_night,
        'currency_code', room_record.currency_code,
        'nights', (p_check_out - p_check_in)
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_stay_room_availability(UUID, DATE, DATE, INT) IS 'Validates that a room type has inventory for every night in a stay range';

-- ---------------------------------------------------------------------------
-- get_stay_hotel_stats — aggregate booking and revenue statistics for a hotel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_stay_hotel_stats(p_hotel_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_bookings INT;
    v_completed INT;
    v_total_revenue NUMERIC;
    v_occupancy NUMERIC;
    v_active_rooms INT;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('confirmed', 'checked_in', 'completed'))
    INTO v_total_bookings, v_completed
    FROM stay_bookings
    WHERE hotel_id = p_hotel_id AND status != 'cancelled';

    SELECT COALESCE(SUM(total) FILTER (WHERE payment_status = 'completed'), 0)
    INTO v_total_revenue
    FROM stay_bookings
    WHERE hotel_id = p_hotel_id AND status != 'cancelled';

    SELECT COUNT(*) INTO v_active_rooms
    FROM stay_rooms
    WHERE hotel_id = p_hotel_id AND is_active = true;

    SELECT
        CASE WHEN COUNT(*) > 0
            THEN ROUND((SUM(booked)::NUMERIC / NULLIF(SUM(total), 0)) * 100, 1)
            ELSE 0 END
    INTO v_occupancy
    FROM stay_room_availability
    WHERE hotel_id = p_hotel_id AND stay_date >= CURRENT_DATE;

    RETURN jsonb_build_object(
        'hotel_id', p_hotel_id,
        'total_bookings', v_total_bookings,
        'completed_bookings', v_completed,
        'total_revenue', v_total_revenue,
        'occupancy_rate', v_occupancy,
        'active_rooms', v_active_rooms
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_stay_hotel_stats(UUID) IS 'Returns aggregated booking and revenue statistics for a hotel';

-- 4. TRIGGERS ===================================================================

CREATE TRIGGER trg_stay_hotels_updated_at
    BEFORE UPDATE ON stay_hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_stay_rooms_updated_at
    BEFORE UPDATE ON stay_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_stay_bookings_updated_at
    BEFORE UPDATE ON stay_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Auto-generate booking_code on stay_bookings INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_stay_booking_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
        NEW.booking_code := generate_stay_booking_code();
    END IF;
    IF NEW.nights IS NULL OR NEW.nights = 0 THEN
        NEW.nights := GREATEST(NEW.check_out_date - NEW.check_in_date, 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sb_set_booking_code
    BEFORE INSERT ON stay_bookings
    FOR EACH ROW EXECUTE FUNCTION trg_set_stay_booking_code();

-- ---------------------------------------------------------------------------
-- Auto-adjust availability when a booking becomes confirmed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_adjust_availability_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        -- Increment booked count for each night in the stay range
        v_date := NEW.check_in_date;
        WHILE v_date < NEW.check_out_date LOOP
            INSERT INTO stay_room_availability (room_id, hotel_id, stay_date, total, booked)
            VALUES (NEW.room_id, NEW.hotel_id, v_date, 1, 1)
            ON CONFLICT (room_id, stay_date)
            DO UPDATE SET booked = stay_room_availability.booked + 1;
            v_date := v_date + 1;
        END LOOP;
    END IF;

    -- A cancelled/no-show booking releases inventory
    IF OLD.status IN ('confirmed', 'checked_in')
       AND NEW.status IN ('cancelled', 'no_show') THEN
        v_date := OLD.check_in_date;
        WHILE v_date < OLD.check_out_date LOOP
            UPDATE stay_room_availability
            SET booked = GREATEST(booked - 1, 0)
            WHERE room_id = OLD.room_id AND stay_date = v_date;
            v_date := v_date + 1;
        END LOOP;
    END IF;

    IF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sb_adjust_availability
    AFTER UPDATE OF status ON stay_bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trg_adjust_availability_on_booking();

-- 5. ROW LEVEL SECURITY =========================================================

ALTER TABLE stay_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_bookings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_stay_host(p_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM stay_hotels
        WHERE id = p_hotel_id AND host_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_stay_host(UUID) IS 'Returns true if the current user is the host of the specified hotel';

-- ---------------------------------------------------------------------------
-- STAY HOTELS
-- ---------------------------------------------------------------------------
CREATE POLICY stay_hotels_read_public ON stay_hotels
    FOR SELECT
    USING (
        status = 'published'
        OR host_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY stay_hotels_insert_own ON stay_hotels
    FOR INSERT
    WITH CHECK (host_id = auth.uid() OR is_admin());

CREATE POLICY stay_hotels_update_own ON stay_hotels
    FOR UPDATE
    USING (host_id = auth.uid() OR is_admin());

CREATE POLICY stay_hotels_delete_own ON stay_hotels
    FOR DELETE
    USING (host_id = auth.uid() OR is_admin());

-- ---------------------------------------------------------------------------
-- STAY ROOMS
-- ---------------------------------------------------------------------------
CREATE POLICY stay_rooms_read_public ON stay_rooms
    FOR SELECT
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM stay_hotels
            WHERE stay_hotels.id = stay_rooms.hotel_id
              AND stay_hotels.status = 'published'
        ))
        OR is_stay_host(hotel_id)
        OR is_admin()
    );

CREATE POLICY stay_rooms_insert_own ON stay_rooms
    FOR INSERT
    WITH CHECK (is_stay_host(hotel_id) OR is_admin());

CREATE POLICY stay_rooms_update_own ON stay_rooms
    FOR UPDATE
    USING (is_stay_host(hotel_id) OR is_admin());

CREATE POLICY stay_rooms_delete_own ON stay_rooms
    FOR DELETE
    USING (is_stay_host(hotel_id) OR is_admin());

-- ---------------------------------------------------------------------------
-- STAY ROOM AVAILABILITY
-- ---------------------------------------------------------------------------
CREATE POLICY stay_room_availability_read ON stay_room_availability
    FOR SELECT
    USING (is_stay_host(hotel_id) OR is_admin());

CREATE POLICY stay_room_availability_insert ON stay_room_availability
    FOR INSERT
    WITH CHECK (is_stay_host(hotel_id) OR is_admin());

CREATE POLICY stay_room_availability_update ON stay_room_availability
    FOR UPDATE
    USING (is_stay_host(hotel_id) OR is_admin());

CREATE POLICY stay_room_availability_delete ON stay_room_availability
    FOR DELETE
    USING (is_stay_host(hotel_id) OR is_admin());

-- ---------------------------------------------------------------------------
-- STAY BOOKINGS
-- ---------------------------------------------------------------------------
CREATE POLICY stay_bookings_read ON stay_bookings
    FOR SELECT
    USING (
        guest_id = auth.uid()
        OR guest_email = auth.email()
        OR is_stay_host(hotel_id)
        OR is_admin()
    );

CREATE POLICY stay_bookings_insert ON stay_bookings
    FOR INSERT
    WITH CHECK (
        guest_id = auth.uid()
        OR guest_email = auth.email()
        OR is_admin()
    );

CREATE POLICY stay_bookings_update ON stay_bookings
    FOR UPDATE
    USING (
        guest_id = auth.uid()
        OR guest_email = auth.email()
        OR is_stay_host(hotel_id)
        OR is_admin()
    );

-- 6. REALTIME ===================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE stay_hotels;
ALTER PUBLICATION supabase_realtime ADD TABLE stay_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE stay_room_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE stay_bookings;
