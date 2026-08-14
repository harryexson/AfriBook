-- ============================================================================
-- AfriBook StaysCape Hotels — first-class hotel marketplace vertical
-- Extends migration 008/018. Adds:
--   • Hotel review/favorite/promotion/staff/rate tables
--   • Inventory-safe booking RPCs (advisory-lock held, transactional)
--   • Server-side refund / cancellation logic
--   • Wallet integration (reuses vendor_wallets from migration 010)
--   • Hotel operator roles and admin approval workflow
--   • Fixes check_stay_room_availability base-inventory fallback
-- ============================================================================

-- 0. ENUM EXTENSIONS ===========================================================

-- Extend stay_status with admin review lifecycle states.
-- 'approved' maps to the existing 'published'; we add review states.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'stay_status' AND e.enumlabel = 'pending_review') THEN
        ALTER TYPE stay_status ADD VALUE IF NOT EXISTS 'pending_review';
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'stay_status' AND e.enumlabel = 'rejected') THEN
        ALTER TYPE stay_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE stay_review_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE stay_cancellation_status AS ENUM (
    'None', 'FreeCancellation', 'PartialRefund', 'NonRefundable'
);

-- 1. COLUMN EXTENSIONS =========================================================

-- Hotels: full market context (never default to US/USD).
ALTER TABLE stay_hotels
    ALTER COLUMN currency_code SET DEFAULT 'MWK',
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) DEFAULT '',
    ADD COLUMN IF NOT EXISTS operating_market VARCHAR(128) DEFAULT '',
    ADD COLUMN IF NOT EXISTS service_area VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS region VARCHAR(128) DEFAULT '',
    ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS host_phone VARCHAR(32) DEFAULT '',
    ADD COLUMN IF NOT EXISTS host_email VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS check_in_from TIME DEFAULT '14:00',
    ADD COLUMN IF NOT EXISTS check_out_until TIME DEFAULT '11:00',
    ADD COLUMN IF NOT EXISTS nearest_landmark VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS nearby_attractions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

COMMENT ON COLUMN stay_hotels.timezone IS 'IANA timezone of the property, e.g. Africa/Blantyre';
COMMENT ON COLUMN stay_hotels.operating_market IS 'Market context selected at onboarding (e.g. MW)';
COMMENT ON COLUMN stay_hotels.is_demo IS 'Flag for deterministic demo/seeded records';

-- Bookings: financial lifecycle columns for cancellations/refunds/modifications.
ALTER TABLE stay_bookings
    ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refund_status VARCHAR(32) DEFAULT '',
    ADD COLUMN IF NOT EXISTS cancellation_policy_key VARCHAR(32) DEFAULT 'free_cancellation',
    ADD COLUMN IF NOT EXISTS modification_request JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'web';

COMMENT ON COLUMN stay_bookings.refund_amount IS 'Amount refunded to the guest on cancellation (server-computed)';
COMMENT ON COLUMN stay_bookings.cancellation_fee IS 'Fee withheld by the hotel/policy on cancellation';

-- Enforce the checkout-after-checkin invariant regardless of route.
CREATE OR REPLACE FUNCTION check_stay_booking_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_date <= NEW.check_in_date THEN
        RAISE EXCEPTION 'check_out must be after check_in';
    END IF;
    IF NEW.nights < 1 THEN
        RAISE EXCEPTION 'nights must be >= 1';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sb_validate_dates ON stay_bookings;
CREATE TRIGGER trg_sb_validate_dates
    BEFORE INSERT OR UPDATE ON stay_bookings
    FOR EACH ROW EXECUTE FUNCTION check_stay_booking_dates();

-- 2. NEW TABLES =================================================================

-- ---------------------------------------------------------------------------
-- STAY HOTEL REVIEWS — verified guest reviews of completed stays
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stay_hotel_reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id            UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    booking_id          UUID REFERENCES stay_bookings(id) ON DELETE SET NULL,
    guest_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_name          VARCHAR(255) NOT NULL DEFAULT '',
    overall_rating      NUMERIC(3, 2) NOT NULL DEFAULT 5,
    cleanliness         NUMERIC(3, 2) NOT NULL DEFAULT 5,
    location_rating     NUMERIC(3, 2) NOT NULL DEFAULT 5,
    service             NUMERIC(3, 2) NOT NULL DEFAULT 5,
    value               NUMERIC(3, 2) NOT NULL DEFAULT 5,
    amenities_rating    NUMERIC(3, 2) NOT NULL DEFAULT 5,
    title               VARCHAR(255) DEFAULT '',
    body                TEXT DEFAULT '',
    images              JSONB DEFAULT '[]'::jsonb,
    is_verified         BOOLEAN NOT NULL DEFAULT false,
    review_status       stay_review_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_review_overall CHECK (overall_rating >= 0 AND overall_rating <= 5),
    CONSTRAINT chk_review_sub CHECK (
        cleanliness BETWEEN 0 AND 5 AND location_rating BETWEEN 0 AND 5 AND
        service BETWEEN 0 AND 5 AND value BETWEEN 0 AND 5 AND amenities_rating BETWEEN 0 AND 5
    ),
    CONSTRAINT uq_review_booking UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_srh_hotel ON stay_hotel_reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_srh_guest ON stay_hotel_reviews(guest_id);
CREATE INDEX IF NOT EXISTS idx_srh_status ON stay_hotel_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_srh_created ON stay_hotel_reviews(created_at DESC);

-- ---------------------------------------------------------------------------
-- STAY HOTEL FAVORITES — saved hotels (persist across web/mobile)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stay_hotel_favorites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hotel_id    UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_favorite_user_hotel UNIQUE (user_id, hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_shf_user ON stay_hotel_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_shf_hotel ON stay_hotel_favorites(hotel_id);

-- ---------------------------------------------------------------------------
-- STAY PROMOTIONS — configurable promo pricing (percent/fixed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stay_promotions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    code            VARCHAR(64) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT DEFAULT '',
    discount_type   VARCHAR(16) NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
    discount_value  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_nights      INT DEFAULT 1,
    max_discount    NUMERIC(12, 2),
    applies_to      VARCHAR(32) NOT NULL DEFAULT 'hotel' CHECK (applies_to IN ('hotel', 'room_type')),
    room_type       stay_room_type,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_promo_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_promo_value CHECK (discount_value >= 0),
    CONSTRAINT uq_stay_promo_code UNIQUE (hotel_id, code)
);

CREATE INDEX IF NOT EXISTS idx_sp_hotel_active ON stay_promotions(hotel_id, active);

-- ---------------------------------------------------------------------------
-- STAY HOTEL STAFF — role-based operator access (owner, manager, front desk)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stay_hotel_staff (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id    UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role        VARCHAR(32) NOT NULL DEFAULT 'staff'
                CHECK (role IN ('owner', 'manager', 'front_desk', 'housekeeping', 'staff')),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_staff_hotel_user UNIQUE (hotel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shs_hotel ON stay_hotel_staff(hotel_id);
CREATE INDEX IF NOT EXISTS idx_shs_user ON stay_hotel_staff(user_id);

-- ---------------------------------------------------------------------------
-- STAY ROOM RATES — dated / seasonal / weekend rate plans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stay_room_rates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL REFERENCES stay_rooms(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES stay_hotels(id) ON DELETE CASCADE,
    applies         VARCHAR(32) NOT NULL DEFAULT 'specific'
                    CHECK (applies IN ('specific', 'weekend', 'seasonal', 'holiday')),
    date_from       DATE NOT NULL,
    date_to         DATE NOT NULL,
    price_per_night NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'MWK',
    min_nights      INT NOT NULL DEFAULT 1,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_rate_price CHECK (price_per_night >= 0),
    CONSTRAINT chk_rate_dates CHECK (date_to >= date_from)
);

CREATE INDEX IF NOT EXISTS idx_srr_room_dates ON stay_room_rates(room_id, date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_srr_hotel ON stay_room_rates(hotel_id);

-- 3. FIX AVAILABILITY FALLBACK =================================================

-- When no inventory row exists for a date the base inventory is `quantity`
-- (nothing has been booked yet), NOT `quantity - available`.
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

    IF p_check_out - p_check_in < room_record.min_nights THEN
        RETURN jsonb_build_object('available', false, 'reason', 'min_nights');
    END IF;

    v_date := p_check_in;
    WHILE v_date < p_check_out LOOP
        SELECT COALESCE(SUM(total - booked), 0),
               COUNT(*) FILTER (WHERE is_blocked)
        INTO v_available, v_blocked
        FROM stay_room_availability
        WHERE room_id = p_room_id AND stay_date = v_date;

        IF NOT EXISTS (
            SELECT 1 FROM stay_room_availability
            WHERE room_id = p_room_id AND stay_date = v_date
        ) THEN
            v_available := room_record.quantity;
            v_blocked := 0;
        END IF;

        IF v_blocked > 0 THEN
            RETURN jsonb_build_object(
                'available', false, 'reason', 'date_blocked', 'date', v_date
            );
        END IF;

        IF v_available < p_rooms THEN
            RETURN jsonb_build_object(
                'available', false, 'reason', 'insufficient_rooms',
                'date', v_date, 'remaining', GREATEST(v_available, 0)
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

-- 4. INVENTORY-SAFE BOOKING RPCs ==============================================

-- Drop the old availability trigger: inventory is now held transactionally by
-- the RPCs below (create/confirm/cancel), which prevents double bookings.
DROP TRIGGER IF EXISTS trg_sb_adjust_availability ON stay_bookings;
DROP FUNCTION IF EXISTS trg_adjust_availability_on_booking();

-- ---------------------------------------------------------------------------
-- create_stay_booking — ATOMIC booking creation. Performs the authoritative
-- availability check under a per-room transaction advisory lock, immediately
-- holds inventory for every night, and inserts the booking. Two concurrent
-- requests for the last room cannot both succeed: the loser re-checks inside
-- the lock and gets insufficient_rooms.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_stay_booking(
    p_hotel_id UUID,
    p_room_id UUID,
    p_guest_id UUID,
    p_guest_name VARCHAR,
    p_guest_email VARCHAR,
    p_guest_phone VARCHAR,
    p_check_in DATE,
    p_check_out DATE,
    p_guests INT,
    p_price_per_night NUMERIC,
    p_subtotal NUMERIC,
    p_platform_fee NUMERIC,
    p_tax NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_currency_code VARCHAR,
    p_special_requests TEXT,
    p_guest_message TEXT,
    p_cancellation_policy_key VARCHAR,
    p_guest_metadata JSONB,
    p_created_by TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_avail JSONB;
    v_booking_id UUID;
    v_date DATE;
    v_booked withdrawals INT := 0;
BEGIN
    -- Serialize all bookings for this room type through a transaction lock.
    PERFORM pg_advisory_xact_lock(hashtext('stay_room:' || p_room_id::text));

    -- Re-run the authoritative availability check inside the lock.
    v_avail := check_stay_room_availability(p_room_id, p_check_in, p_check_out, 1);
    IF NOT (v_avail->>'available')::boolean THEN
        RETURN jsonb_build_object('error', COALESCE(v_avail->>'reason', 'unavailable'),
                                  'details', v_avail);
    END IF;

    -- Hold inventory: increment booked on every night (creating rows lazily).
    v_date := p_check_in;
    WHILE v_date < p_check_out LOOP
        INSERT INTO stay_room_availability (room_id, hotel_id, stay_date, total, booked)
        VALUES (p_room_id, p_hotel_id, v_date, GREATEST((SELECT quantity FROM stay_rooms WHERE id = p_room_id), 1), 1)
        ON CONFLICT (room_id, stay_date)
        DO UPDATE SET booked = stay_room_availability.booked + 1;
        v_date := v_date + 1;
    END LOOP;

    INSERT INTO stay_bookings (
        hotel_id, room_id, guest_id, guest_name, guest_email, guest_phone,
        check_in_date, check_out_date, nights, guests,
        price_per_night, subtotal, platform_fee, tax, discount, total, currency_code,
        status, payment_status, special_requests, guest_message,
        cancellation_policy_key, guest_metadata, created_by
    ) VALUES (
        p_hotel_id, p_room_id, p_guest_id, p_guest_name, p_guest_email, p_guest_phone,
        p_check_in, p_check_out, (p_check_out - p_check_in), p_guests,
        p_price_per_night, p_subtotal, p_platform_fee, p_tax, p_discount, p_total, p_currency_code,
        'pending', 'pending', p_special_requests, p_guest_message,
        p_cancellation_policy_key, COALESCE(p_guest_metadata, '{}'::jsonb), p_created_by
    )
    RETURNING id INTO v_booking_id;

    RETURN (
        SELECT jsonb_build_object('id', b.id, 'booking_code', b.booking_code, 'status', b.status)
        FROM stay_bookings b WHERE b.id = v_booking_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- confirm_stay_booking — idempotent pending → confirmed transition.
-- Inventory is already held, so this only changes status.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_stay_booking(p_booking_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_row RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('stay_booking:' || upper(p_booking_code)));
    SELECT * INTO v_row FROM stay_bookings WHERE booking_code = upper(p_booking_code);
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'booking_not_found');
    END IF;
    IF v_row.status = 'cancelled' THEN
        RETURN jsonb_build_object('error', 'booking_cancelled');
    END IF;
    IF v_row.payment_status <> 'completed' THEN
        RETURN jsonb_build_object('error', 'payment_not_confirmed');
    END IF;

    UPDATE stay_bookings
       SET status = 'confirmed', updated_at = now()
     WHERE booking_code = upper(p_booking_code)
       AND status = 'pending';

    RETURN jsonb_build_object('booking_code', upper(p_booking_code), 'status', 'confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- cancel_stay_booking — releases held inventory, applies refund, settles
-- hotel wallet refund (debits the host available balance).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_stay_booking(
    p_booking_code TEXT,
    p_reason TEXT,
    p_refund_amount NUMERIC DEFAULT 0,
    p_cancellation_fee NUMERIC DEFAULT 0,
    p_refund_status VARCHAR DEFAULT 'None'
)
RETURNS JSONB AS $$
DECLARE
    v_row RECORD;
    v_date DATE;
    v_hotel host_id UUID;
    v_wallet UUID;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('stay_booking:' || upper(p_booking_code)));
    SELECT * INTO v_row FROM stay_bookings WHERE booking_code = upper(p_booking_code);
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'booking_not_found');
    END IF;
    IF v_row.status IN ('cancelled', 'completed', 'no_show') THEN
        RETURN jsonb_build_object('error', 'booking_not_cancellable', 'status', v_row.status);
    END IF;

    -- Release inventory for every night that was held.
    v_date := v_row.check_in_date;
    WHILE v_date < v_row.check_out_date LOOP
        UPDATE stay_room_availability
           SET booked = GREATEST(booked - 1, 0)
         WHERE room_id = v_row.room_id AND stay_date = v_date;
        v_date := v_date + 1;
    END LOOP;

    UPDATE stay_bookings
       SET status = 'cancelled',
           payment_status = CASE WHEN p_refund_amount > 0 THEN 'refunded' ELSE payment_status END,
           cancellation_reason = p_reason,
           cancellation_policy_key = v_row.cancellation_policy_key,
           refund_amount = p_refund_amount,
           cancellation_fee = p_cancellation_fee,
           refund_status = CASE WHEN p_refund_amount > 0 THEN p_refund_status ELSE 'None' END,
           cancelled_at = now(),
           updated_at = now()
     WHERE booking_code = upper(p_booking_code)
     RETURNING hotel_id INTO v_hotel;

    -- Debit the host wallet for the refunded portion (if it had been credited).
    IF p_refund_amount > 0 AND v_hotel IS NOT NULL THEN
        SELECT id INTO v_wallet
        FROM vendor_wallets
        WHERE vendor_id = (SELECT host_id FROM stay_hotels WHERE id = v_hotel)
          AND business_id IS NULL;
        IF v_wallet IS NOT NULL THEN
            UPDATE vendor_wallets
               SET balance = GREATEST(balance - (v_row.subtotal - v_row.platform_fee), 0),
                   available_balance = GREATEST(available_balance - (v_row.subtotal - v_row.platform_fee), 0),
                   updated_at = now()
             WHERE id = v_wallet;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'booking_code', upper(p_booking_code), 'status', 'cancelled',
        'refund_amount', p_refund_amount, 'cancellation_fee', p_cancellation_fee
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- handle_stay_payment_succeeded — confirm a stay booking + credit the hotel
-- host wallet (reuses vendor_wallets from migration 010; business_id IS NULL
-- mirrors the events vertical). Net to host = subtotal - platform_fee.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_stay_payment_succeeded(p_booking_code TEXT)
RETURNS VOID AS $$
DECLARE
    v_row RECORD;
    v_hotel RECORD;
    v_wallet UUID;
    v_net NUMERIC;
BEGIN
    SELECT * INTO v_row
    FROM stay_bookings WHERE booking_code = upper(p_booking_code);
    IF NOT FOUND THEN
        RETURN;
    END IF;
    IF v_row.payment_status = 'completed' THEN
        RETURN;
    END IF;

    -- Confirm the booking only when funds are actually secured.
    UPDATE stay_bookings
       SET payment_status = 'completed',
           status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
           updated_at = now()
     WHERE id = v_row.id;

    SELECT * INTO v_hotel FROM stay_hotels WHERE id = v_row.hotel_id;
    IF v_hotel IS NULL OR v_hotel.host_id IS NULL THEN
        RETURN;
    END IF;

    v_net := GREATEST(v_row.subtotal - v_row.platform_fee, 0);

    SELECT id INTO v_wallet
    FROM vendor_wallets
    WHERE vendor_id = v_hotel.host_id AND business_id IS NULL;

    IF v_wallet IS NULL THEN
        INSERT INTO vendor_wallets (vendor_id, business_id, balance, currency, available_balance)
        VALUES (v_hotel.host_id, NULL, v_net, v_row.currency_code, v_net)
        RETURNING id INTO v_wallet;
    ELSE
        UPDATE vendor_wallets
           SET balance = balance + v_net,
               available_balance = available_balance + v_net,
               currency = v_row.currency_code,
               updated_at = now()
         WHERE id = v_wallet;
    END IF;

    -- In-app guest notification.
    INSERT INTO notifications (user_id, type, title, body, read)
    VALUES (
        v_row.guest_id, 'booking', 'Booking confirmed',
        'The host has received your stay at ' || v_hotel.name || ' (reference ' || v_row.booking_code || ').',
        false
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. HOTEL STATS ===============================================================

CREATE OR REPLACE FUNCTION get_stay_hotel_stats(p_hotel_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_bookings INT;
    v_completed INT;
    v_total_revenue NUMERIC;
    v_occupancy NUMERIC;
    v_active_rooms INT;
    v_avg_value NUMERIC;
    v_avg_stay NUMERIC;
    v_cancel_rate NUMERIC;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('confirmed', 'checked_in', 'completed'))
    INTO v_total_bookings, v_completed
    FROM stay_bookings WHERE hotel_id = p_hotel_id AND status != 'cancelled';

    SELECT COALESCE(SUM(total) FILTER (WHERE payment_status = 'completed'), 0)
    INTO v_total_revenue
    FROM stay_bookings WHERE hotel_id = p_hotel_id AND status != 'cancelled';

    SELECT COUNT(*) INTO v_active_rooms FROM stay_rooms WHERE hotel_id = p_hotel_id AND is_active = true;

    SELECT CASE WHEN COUNT(*) > 0 THEN ROUND((SUM(booked)::NUMERIC / NULLIF(SUM(total), 0)) * 100, 1) ELSE 0 END
    INTO v_occupancy
    FROM stay_room_availability WHERE hotel_id = p_hotel_id AND stay_date >= CURRENT_DATE;

    SELECT ROUND(AVG(total), 2) INTO v_avg_value
    FROM stay_bookings WHERE hotel_id = p_hotel_id AND payment_status = 'completed';

    SELECT ROUND(AVG(nights), 2) INTO v_avg_stay
    FROM stay_bookings WHERE hotel_id = p_hotel_id AND status IN ('confirmed', 'checked_in', 'completed');

    SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'cancelled'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1
    ) INTO v_cancel_rate
    FROM stay_bookings WHERE hotel_id = p_hotel_id;

    RETURN jsonb_build_object(
        'hotel_id', p_hotel_id,
        'total_bookings', v_total_bookings,
        'completed_bookings', v_completed,
        'total_revenue', v_total_revenue,
        'occupancy_rate', v_occupancy,
        'active_rooms', v_active_rooms,
        'average_booking_value', v_avg_value,
        'average_stay_nights', v_avg_stay,
        'cancellation_rate', v_cancel_rate
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. RLS =======================================================================

-- Expose staff membership for RLS checks.
CREATE OR REPLACE FUNCTION is_stay_host(p_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM stay_hotels WHERE id = p_hotel_id AND host_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM stay_hotel_staff WHERE hotel_id = p_hotel_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Reviews
ALTER TABLE stay_hotel_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_reviews_read_public ON stay_hotel_reviews
    FOR SELECT USING (review_status = 'approved' OR guest_id = auth.uid() OR is_admin());
CREATE POLICY stay_reviews_insert_guest ON stay_hotel_reviews
    FOR INSERT WITH CHECK (guest_id = auth.uid() OR is_admin());
CREATE POLICY stay_reviews_update ON stay_hotel_reviews
    FOR UPDATE USING (guest_id = auth.uid() OR is_stay_host(hotel_id) OR is_admin());

-- Favorites
ALTER TABLE stay_hotel_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_favorites_read_own ON stay_hotel_favorites
    FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY stay_favorites_insert_own ON stay_hotel_favorites
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY stay_favorites_delete_own ON stay_hotel_favorites
    FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Promotions
ALTER TABLE stay_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_promos_read_public ON stay_promotions
    FOR SELECT USING (active = true OR is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_promos_write_host ON stay_promotions
    FOR INSERT WITH CHECK (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_promos_update_host ON stay_promotions
    FOR UPDATE USING (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_promos_delete_host ON stay_promotions
    FOR DELETE USING (is_stay_host(hotel_id) OR is_admin());

-- Hotel staff (operators can add their own team)
ALTER TABLE stay_hotel_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_staff_read ON stay_hotel_staff
    FOR SELECT USING (user_id = auth.uid() OR is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_staff_write_host ON stay_hotel_staff
    FOR INSERT WITH CHECK (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_staff_update_host ON stay_hotel_staff
    FOR UPDATE USING (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_staff_delete_host ON stay_hotel_staff
    FOR DELETE USING (is_stay_host(hotel_id) OR is_admin());

-- Room rates
ALTER TABLE stay_room_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY stay_rates_read_public ON stay_room_rates
    FOR SELECT USING (active = true OR is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_rates_write_host ON stay_room_rates
    FOR INSERT WITH CHECK (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_rates_update_host ON stay_room_rates
    FOR UPDATE USING (is_stay_host(hotel_id) OR is_admin());
CREATE POLICY stay_rates_delete_host ON stay_room_rates
    FOR DELETE USING (is_stay_host(hotel_id) OR is_admin());

-- 7. REALTIME ==================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE stay_hotel_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE stay_hotel_favorites;