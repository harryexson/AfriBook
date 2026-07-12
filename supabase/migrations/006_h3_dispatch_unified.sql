-- ============================================================================
-- AfriBook — H3 Dispatch Unification, Driver Earnings & Loyalty
-- Migration 006: Adds H3 hexagonal indexing, driver earnings/payouts,
-- loyalty program, online sessions, and batch query functions.
-- ============================================================================

-- 0. EXTENSIONS =================================================================

CREATE EXTENSION IF NOT EXISTS "h3"       SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "h3_postgis" SCHEMA extensions;

-- 1. ADD H3 COLUMNS TO EXISTING TABLES =========================================

-- Driver locations: add H3 index for fast hex-based spatial queries
ALTER TABLE driver_locations
    ADD COLUMN IF NOT EXISTS h3_index TEXT;

CREATE INDEX IF NOT EXISTS idx_driver_locations_h3
    ON driver_locations(h3_index);

CREATE INDEX IF NOT EXISTS idx_driver_locations_h3_time
    ON driver_locations(h3_index, last_seen_at);

-- Surge zones: add H3 index for hex-based demand/supply
ALTER TABLE surge_zones
    ADD COLUMN IF NOT EXISTS h3_index TEXT,
    ADD COLUMN IF NOT EXISTS h3_resolution INT DEFAULT 9;

CREATE INDEX IF NOT EXISTS idx_surge_zones_h3
    ON surge_zones(h3_index);

-- 2. NEW ENUM TYPES ============================================================

CREATE TYPE payout_type AS ENUM (
    'weekly',
    'instant',
    'ewa'
);

CREATE TYPE payout_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE earnings_status AS ENUM (
    'pending',
    'available',
    'paid_out'
);

CREATE TYPE loyalty_tier AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum'
);

-- 3. NEW TABLES ================================================================

-- ---------------------------------------------------------------------------
-- 3.1 Driver Online Sessions
-- ---------------------------------------------------------------------------
-- Tracks when drivers go online/offline for earnings calculation
-- and acceptance rate computation.

CREATE TABLE driver_online_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    total_earnings  NUMERIC(12, 2) DEFAULT 0,
    total_rides     INT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_online_sessions IS 'Tracks driver online/offline periods for earnings and stats';

CREATE INDEX idx_driver_online_sessions_driver
    ON driver_online_sessions(driver_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- 3.2 Driver Earnings
-- ---------------------------------------------------------------------------
-- Per-ride earnings breakdown for drivers.

CREATE TABLE driver_earnings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id         UUID,
    delivery_id     UUID,
    base_fare       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    distance_fare   NUMERIC(12, 2) DEFAULT 0,
    time_fare       NUMERIC(12, 2) DEFAULT 0,
    surge_bonus     NUMERIC(12, 2) DEFAULT 0,
    tip             NUMERIC(12, 2) DEFAULT 0,
    platform_fee    NUMERIC(12, 2) DEFAULT 0,
    total_earnings  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    status          earnings_status NOT NULL DEFAULT 'pending',
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_earnings IS 'Per-ride earnings breakdown for driver payout tracking';

CREATE INDEX idx_driver_earnings_driver_status
    ON driver_earnings(driver_id, status, created_at DESC);

CREATE INDEX idx_driver_earnings_driver_created
    ON driver_earnings(driver_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3.3 Driver Payouts
-- ---------------------------------------------------------------------------
-- Tracks payout requests and processing status.

CREATE TABLE driver_payouts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2) NOT NULL,
    fee             NUMERIC(12, 2) DEFAULT 0,
    net_amount      NUMERIC(12, 2) NOT NULL,
    payout_type     payout_type NOT NULL,
    status          payout_status NOT NULL DEFAULT 'pending',
    payout_method   JSONB NOT NULL DEFAULT '{}'::jsonb,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE driver_payouts IS 'Driver payout requests and processing history';

CREATE INDEX idx_driver_payouts_driver
    ON driver_payouts(driver_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3.4 Loyalty Members
-- ---------------------------------------------------------------------------
-- Customer loyalty program membership per business.

CREATE TABLE loyalty_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id     UUID NOT NULL,
    points_balance  INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    tier            loyalty_tier NOT NULL DEFAULT 'bronze',
    visit_count     INT DEFAULT 0,
    last_visit_date DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, business_id)
);

COMMENT ON TABLE loyalty_members IS 'Customer loyalty membership per business with tier progression';

CREATE INDEX idx_loyalty_members_user
    ON loyalty_members(user_id);

CREATE INDEX idx_loyalty_members_business
    ON loyalty_members(business_id, tier);

-- ---------------------------------------------------------------------------
-- 3.5 Points Transactions
-- ---------------------------------------------------------------------------
-- Immutable ledger of all points earned and redeemed.

CREATE TABLE points_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_member_id   UUID NOT NULL REFERENCES loyalty_members(id) ON DELETE CASCADE,
    points_amount       INT NOT NULL,
    transaction_type    VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'adjusted', 'expired')),
    description         TEXT,
    order_id            UUID,
    previous_balance    INT NOT NULL,
    new_balance         INT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE points_transactions IS 'Immutable ledger of loyalty points earned, redeemed, and adjusted';

CREATE INDEX idx_points_transactions_member
    ON points_transactions(loyalty_member_id, created_at DESC);

CREATE INDEX idx_points_transactions_order
    ON points_transactions(order_id) WHERE order_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3.6 Push Notification Tokens
-- ---------------------------------------------------------------------------
-- Stores device push tokens for Expo Push / FCM / APNs delivery.

CREATE TABLE push_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    platform        VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_name     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, token)
);

COMMENT ON TABLE push_tokens IS 'Device push notification tokens for multi-platform delivery';

CREATE INDEX idx_push_tokens_user
    ON push_tokens(user_id) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 3.7 Group Orders
-- ---------------------------------------------------------------------------
-- Multi-person group ordering for food delivery.

CREATE TABLE group_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id     UUID NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'collecting'
                    CHECK (status IN ('collecting', 'submitted', 'ordered', 'delivered', 'cancelled')),
    share_token     VARCHAR(32) NOT NULL UNIQUE,
    deadline        TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE group_orders IS 'Multi-person group food ordering with shareable links';

CREATE INDEX idx_group_orders_organizer
    ON group_orders(organizer_id);

CREATE INDEX idx_group_orders_token
    ON group_orders(share_token);

-- ---------------------------------------------------------------------------
-- 3.8 Group Order Members
-- ---------------------------------------------------------------------------

CREATE TABLE group_order_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_order_id  UUID NOT NULL REFERENCES group_orders(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'viewed', 'submitted')),
    items           JSONB DEFAULT '[]'::jsonb,
    subtotal        NUMERIC(12, 2) DEFAULT 0,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE group_order_members IS 'Individual members and their items in a group order';

CREATE INDEX idx_group_order_members_group
    ON group_order_members(group_order_id);

-- ---------------------------------------------------------------------------
-- 3.9 Country Pricing (PPP-based global pricing)
-- ---------------------------------------------------------------------------

CREATE TABLE country_pricing (
    country_code            VARCHAR(2) PRIMARY KEY,
    ppp_factor              NUMERIC(6, 3) NOT NULL DEFAULT 1.0,
    local_currency          VARCHAR(3) NOT NULL,
    currency_symbol         VARCHAR(5) NOT NULL DEFAULT '$',
    subscription_free       NUMERIC(12, 2) DEFAULT 0,
    subscription_starter    NUMERIC(12, 2) NOT NULL,
    subscription_professional NUMERIC(12, 2) NOT NULL,
    subscription_enterprise NUMERIC(12, 2) NOT NULL,
    minimum_fee_floor       NUMERIC(12, 2) NOT NULL,
    platform_fee_percent    NUMERIC(5, 2) DEFAULT 5.0,
    tax_rate                NUMERIC(5, 4) DEFAULT 0,
    distance_unit           VARCHAR(10) DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles')),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE country_pricing IS 'PPP-based pricing configuration per country for localized subscriptions and fees';

-- 4. PL/pgSQL FUNCTIONS ========================================================

-- ---------------------------------------------------------------------------
-- 4.1 H3-based nearby driver search
-- ---------------------------------------------------------------------------
-- Uses H3 hexagonal grid + PostGIS for fast spatial queries.
-- Replaces the JavaScript brute-force filtering approach.

CREATE OR REPLACE FUNCTION find_nearby_drivers_h3(
    p_pickup_lat DOUBLE PRECISION,
    p_pickup_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 5.0,
    p_h3_res INT DEFAULT 9,
    p_vehicle_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    p_driver_id     UUID,
    p_distance_km   DOUBLE PRECISION,
    p_heading       NUMERIC,
    p_speed         NUMERIC,
    p_accuracy      NUMERIC,
    p_last_seen_at  TIMESTAMPTZ
) AS $$
DECLARE
    v_pickup_geog   GEOGRAPHY;
    v_radius_m      DOUBLE PRECISION;
BEGIN
    v_pickup_geog := ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography;
    v_radius_m := p_radius_km * 1000;

    RETURN QUERY
    SELECT
        dl.driver_id,
        ST_Distance(dl.location, v_pickup_geog) / 1000.0 AS distance_km,
        dl.heading,
        dl.speed,
        dl.accuracy,
        dl.last_seen_at
    FROM driver_locations dl
    JOIN drivers d ON d.id = dl.driver_id
    WHERE dl.last_seen_at > now() - INTERVAL '5 minutes'
      AND d.status = 'available'
      AND (p_vehicle_type IS NULL OR d.vehicle->>'type' = p_vehicle_type)
      AND ST_DWithin(dl.location, v_pickup_geog, v_radius_m)
    ORDER BY dl.last_seen_at DESC, ST_Distance(dl.location, v_pickup_geog) ASC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION find_nearby_drivers_h3(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT, TEXT)
    IS 'Find available drivers within radius using PostGIS ST_DWithin — returns candidates ordered by freshness and distance';

-- ---------------------------------------------------------------------------
-- 4.2 Batch driver stats (fixes N+1 query problem)
-- ---------------------------------------------------------------------------
-- Fetches acceptance rate and weekly hours for multiple drivers in one query.

CREATE OR REPLACE FUNCTION get_driver_stats_batch(
    p_driver_ids UUID[]
)
RETURNS TABLE (
    p_driver_id       UUID,
    p_acceptance_rate INT,
    p_hours_this_week NUMERIC,
    p_total_rides     INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id AS driver_id,
        COALESCE(
            (
                SELECT ROUND(
                    COUNT(*) FILTER (
                        WHERE rr.status NOT IN ('requesting', 'searching')
                    ) * 100.0 / GREATEST(COUNT(*), 1)
                )::INT
                FROM ridely_rides rr
                WHERE rr.driver_id = d.id
                  AND rr.created_at > now() - INTERVAL '7 days'
            ),
            100
        ) AS acceptance_rate,
        COALESCE(
            (
                SELECT ROUND(SUM(
                    EXTRACT(EPOCH FROM (COALESCE(dos.ended_at, now()) - dos.started_at)) / 3600
                ), 1)
                FROM driver_online_sessions dos
                WHERE dos.driver_id = d.id
                  AND dos.started_at > now() - INTERVAL '7 days'
            ),
            0
        ) AS hours_this_week,
        COALESCE(
            (
                SELECT COUNT(*)::INT
                FROM ridely_rides rr
                WHERE rr.driver_id = d.id
                  AND rr.status = 'completed'
                  AND rr.created_at > now() - INTERVAL '7 days'
            ),
            0
        ) AS total_rides
    FROM drivers d
    WHERE d.id = ANY(p_driver_ids);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_driver_stats_batch(UUID[])
    IS 'Batch-fetch driver acceptance rate, weekly hours, and ride count — eliminates N+1 queries in dispatch';

-- ---------------------------------------------------------------------------
-- 4.3 Record driver online session
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION start_driver_session(
    p_driver_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO driver_online_sessions (driver_id)
    VALUES (p_driver_id)
    RETURNING id INTO v_session_id;

    UPDATE drivers SET status = 'available' WHERE id = p_driver_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION end_driver_session(
    p_driver_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE driver_online_sessions
    SET ended_at = now()
    WHERE driver_id = p_driver_id
      AND ended_at IS NULL;

    UPDATE drivers SET status = 'offline' WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4.4 Create driver earning record
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_driver_earning(
    p_driver_id     UUID,
    p_ride_id       UUID DEFAULT NULL,
    p_delivery_id   UUID DEFAULT NULL,
    p_base_fare     NUMERIC DEFAULT 0,
    p_distance_fare NUMERIC DEFAULT 0,
    p_time_fare     NUMERIC DEFAULT 0,
    p_surge_bonus   NUMERIC DEFAULT 0,
    p_tip           NUMERIC DEFAULT 0,
    p_platform_fee  NUMERIC DEFAULT 0,
    p_currency      VARCHAR DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
    v_total NUMERIC;
    v_id UUID;
BEGIN
    v_total := p_base_fare + p_distance_fare + p_time_fare + p_surge_bonus + p_tip - p_platform_fee;

    INSERT INTO driver_earnings (
        driver_id, ride_id, delivery_id,
        base_fare, distance_fare, time_fare,
        surge_bonus, tip, platform_fee,
        total_earnings, currency, status
    ) VALUES (
        p_driver_id, p_ride_id, p_delivery_id,
        p_base_fare, p_distance_fare, p_time_fare,
        p_surge_bonus, p_tip, p_platform_fee,
        v_total, p_currency, 'available'
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4.5 Loyalty points award
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION award_loyalty_points(
    p_member_id     UUID,
    p_points        INT,
    p_description   TEXT DEFAULT NULL,
    p_order_id      UUID DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_previous INT;
    v_new      INT;
BEGIN
    SELECT points_balance INTO v_previous
    FROM loyalty_members WHERE id = p_member_id;

    v_new := v_previous + p_points;

    INSERT INTO points_transactions (
        loyalty_member_id, points_amount, transaction_type,
        description, order_id, previous_balance, new_balance
    ) VALUES (
        p_member_id, p_points, 'earned',
        p_description, p_order_id, v_previous, v_new
    );

    UPDATE loyalty_members
    SET points_balance = v_new,
        lifetime_points = lifetime_points + p_points,
        visit_count = visit_count + 1,
        last_visit_date = CURRENT_DATE,
        tier = CASE
            WHEN lifetime_points + p_points >= 2500 THEN 'platinum'::loyalty_tier
            WHEN lifetime_points + p_points >= 1000 THEN 'gold'::loyalty_tier
            WHEN lifetime_points + p_points >= 500  THEN 'silver'::loyalty_tier
            ELSE 'bronze'::loyalty_tier
        END,
        updated_at = now()
    WHERE id = p_member_id;

    RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4.6 Auto-update driver_locations h3_index on insert/update
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_driver_location_h3()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract lat/lng from geography point and compute H3 index
    -- Note: h3_lat_lng_to_cell expects (lat, lng) order
    NEW.h3_index := extensions.h3_lat_lng_to_cell(
        ST_Y(NEW.location::geometry),
        ST_X(NEW.location::geometry),
        9
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_locations_h3 ON driver_locations;
CREATE TRIGGER trg_driver_locations_h3
    BEFORE INSERT OR UPDATE ON driver_locations
    FOR EACH ROW EXECUTE FUNCTION trg_driver_location_h3();

-- 5. UPDATED_AT TRIGGERS =======================================================

CREATE TRIGGER trg_driver_online_sessions_updated_at
    BEFORE UPDATE ON driver_online_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_driver_earnings_updated_at
    BEFORE UPDATE ON driver_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_driver_payouts_updated_at
    BEFORE UPDATE ON driver_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_loyalty_members_updated_at
    BEFORE UPDATE ON loyalty_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_group_orders_updated_at
    BEFORE UPDATE ON group_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_country_pricing_updated_at
    BEFORE UPDATE ON country_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ROW LEVEL SECURITY ========================================================

ALTER TABLE driver_online_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_order_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_pricing          ENABLE ROW LEVEL SECURITY;

-- driver_online_sessions: drivers manage their own
CREATE POLICY driver_sessions_select ON driver_online_sessions
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );
CREATE POLICY driver_sessions_insert ON driver_online_sessions
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );
CREATE POLICY driver_sessions_update ON driver_online_sessions
    FOR UPDATE USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- driver_earnings: drivers see their own, admins see all
CREATE POLICY driver_earnings_select ON driver_earnings
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- driver_payouts: drivers manage their own
CREATE POLICY driver_payouts_select ON driver_payouts
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );
CREATE POLICY driver_payouts_insert ON driver_payouts
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- loyalty_members: users see their own memberships
CREATE POLICY loyalty_members_select ON loyalty_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR is_admin()
    );

-- points_transactions: members see their own points history
CREATE POLICY points_transactions_select ON points_transactions
    FOR SELECT USING (
        loyalty_member_id IN (
            SELECT id FROM loyalty_members WHERE user_id = auth.uid()
        )
        OR is_admin()
    );

-- push_tokens: users manage their own tokens
CREATE POLICY push_tokens_select ON push_tokens
    FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY push_tokens_insert ON push_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY push_tokens_update ON push_tokens
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY push_tokens_delete ON push_tokens
    FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- group_orders: organizer and members can see
CREATE POLICY group_orders_select ON group_orders
    FOR SELECT USING (
        organizer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM group_order_members
            WHERE group_order_id = group_orders.id
              AND user_id = auth.uid()
        )
        OR is_admin()
    );
CREATE POLICY group_orders_insert ON group_orders
    FOR INSERT WITH CHECK (
        organizer_id = auth.uid()
        OR is_admin()
    );
CREATE POLICY group_orders_update ON group_orders
    FOR UPDATE USING (
        organizer_id = auth.uid()
        OR is_admin()
    );

-- group_order_members: members and organizer can see/edit
CREATE POLICY group_order_members_select ON group_order_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM group_orders
            WHERE id = group_order_members.group_order_id
              AND organizer_id = auth.uid()
        )
        OR is_admin()
    );
CREATE POLICY group_order_members_insert ON group_order_members
    FOR INSERT WITH CHECK (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM group_orders
            WHERE id = group_order_members.group_order_id
              AND organizer_id = auth.uid()
        )
    );
CREATE POLICY group_order_members_update ON group_order_members
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM group_orders
            WHERE id = group_order_members.group_order_id
              AND organizer_id = auth.uid()
        )
        OR is_admin()
    );

-- country_pricing: readable by all authenticated users
CREATE POLICY country_pricing_select ON country_pricing
    FOR SELECT USING (true);
CREATE POLICY country_pricing_insert ON country_pricing
    FOR INSERT WITH CHECK (is_admin());
CREATE POLICY country_pricing_update ON country_pricing
    FOR UPDATE USING (is_admin());

-- 7. REALTIME PUBLICATION ======================================================

ALTER PUBLICATION supabase_realtime ADD TABLE driver_online_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE push_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE group_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE group_order_members;

-- 8. SEED DATA: Country Pricing (PPP-based, 50 highest-GDP countries) ==========

INSERT INTO country_pricing (country_code, ppp_factor, local_currency, currency_symbol, subscription_starter, subscription_professional, subscription_enterprise, minimum_fee_floor, platform_fee_percent, tax_rate, distance_unit)
VALUES
-- North America
('US', 1.000, 'USD', '$', 29.00, 99.00, 499.00, 0.50, 5.0, 0.08, 'miles'),
('CA', 0.800, 'CAD', 'C$', 39.00, 129.00, 649.00, 0.65, 5.0, 0.13, 'km'),
('MX', 0.330, 'MXN', 'MX$', 499.00, 1699.00, 8499.00, 8.00, 5.0, 0.16, 'km'),
-- Europe
('GB', 0.700, 'GBP', '\u00a3', 19.00, 69.00, 349.00, 0.35, 5.0, 0.20, 'miles'),
('FR', 0.720, 'EUR', '\u20ac', 25.00, 85.00, 425.00, 0.45, 5.0, 0.20, 'km'),
('DE', 0.750, 'EUR', '\u20ac', 25.00, 85.00, 425.00, 0.45, 5.0, 0.19, 'km'),
('IT', 0.680, 'EUR', '\u20ac', 25.00, 85.00, 425.00, 0.45, 5.0, 0.22, 'km'),
('ES', 0.650, 'EUR', '\u20ac', 22.00, 75.00, 375.00, 0.40, 5.0, 0.21, 'km'),
('NL', 0.820, 'EUR', '\u20ac', 28.00, 95.00, 475.00, 0.50, 5.0, 0.21, 'km'),
('SE', 0.780, 'SEK', 'kr', 280.00, 950.00, 4750.00, 4.50, 5.0, 0.25, 'km'),
('CH', 1.100, 'CHF', 'CHF', 35.00, 115.00, 575.00, 0.60, 5.0, 0.08, 'km'),
('PL', 0.420, 'PLN', 'z\u0142', 119.00, 399.00, 1999.00, 2.00, 5.0, 0.23, 'km'),
('NO', 0.950, 'NOK', 'kr', 310.00, 1050.00, 5250.00, 5.00, 5.0, 0.25, 'km'),
('IE', 0.780, 'EUR', '\u20ac', 25.00, 85.00, 425.00, 0.45, 5.0, 0.23, 'km'),
('PT', 0.550, 'EUR', '\u20ac', 20.00, 65.00, 325.00, 0.35, 5.0, 0.23, 'km'),
-- Asia
('IN', 0.230, 'INR', '\u20b9', 500.00, 2000.00, 8000.00, 5.00, 5.0, 0.18, 'km'),
('JP', 0.620, 'JPY', '\u00a5', 3900.00, 12900.00, 64900.00, 80.00, 5.0, 0.10, 'km'),
('CN', 0.380, 'CNY', '\u00a5', 149.00, 499.00, 2499.00, 2.00, 5.0, 0.13, 'km'),
('KR', 0.630, 'KRW', '\u20a9', 32000.00, 109000.00, 549000.00, 600.00, 5.0, 0.10, 'km'),
('ID', 0.240, 'IDR', 'Rp', 149000.00, 499000.00, 2499000.00, 2500.00, 5.0, 0.11, 'km'),
('TH', 0.330, 'THB', '\u0e3f', 599.00, 1999.00, 9999.00, 10.00, 5.0, 0.07, 'km'),
('SG', 0.900, 'SGD', 'S$', 35.00, 115.00, 575.00, 0.50, 5.0, 0.09, 'km'),
('MY', 0.340, 'MYR', 'RM', 89.00, 299.00, 1499.00, 1.50, 5.0, 0.10, 'km'),
('PH', 0.220, 'PHP', '\u20b1', 899.00, 2999.00, 14999.00, 10.00, 5.0, 0.12, 'km'),
('VN', 0.190, 'VND', '\u20ab', 249000.00, 799000.00, 3999000.00, 5000.00, 5.0, 0.10, 'km'),
('PK', 0.210, 'PKR', 'Rs', 1499.00, 4999.00, 24999.00, 20.00, 5.0, 0.17, 'km'),
('BD', 0.180, 'BDT', '\u09f3', 599.00, 1999.00, 9999.00, 8.00, 5.0, 0.15, 'km'),
-- Middle East
('AE', 0.750, 'AED', 'AED', 99.00, 349.00, 1749.00, 1.50, 5.0, 0.05, 'km'),
('SA', 0.550, 'SAR', 'SAR', 99.00, 349.00, 1749.00, 2.00, 5.0, 0.15, 'km'),
('TR', 0.340, 'TRY', '\u20ba', 449.00, 1499.00, 7499.00, 5.00, 5.0, 0.20, 'km'),
('IL', 0.750, 'ILS', '\u20aa', 99.00, 349.00, 1749.00, 2.00, 5.0, 0.17, 'km'),
('QA', 0.850, 'QAR', 'QR', 99.00, 349.00, 1749.00, 2.00, 5.0, 0.00, 'km'),
('KW', 0.800, 'KWD', 'KD', 9.00, 30.00, 150.00, 0.20, 5.0, 0.00, 'km'),
('BH', 0.650, 'BHD', 'BD', 11.00, 37.00, 185.00, 0.15, 5.0, 0.00, 'km'),
('OM', 0.550, 'OMR', 'OMR', 11.00, 37.00, 185.00, 0.15, 5.0, 0.05, 'km'),
-- Africa
('NG', 0.220, 'NGN', '\u20a6', 5000.00, 15000.00, 50000.00, 100.00, 5.0, 0.075, 'km'),
('ZA', 0.350, 'ZAR', 'R', 349.00, 1149.00, 5749.00, 5.00, 5.0, 0.15, 'km'),
('KE', 0.290, 'KES', 'KSh', 1500.00, 5000.00, 20000.00, 50.00, 5.0, 0.16, 'km'),
('GH', 0.200, 'GHS', 'GH\u20b5', 149.00, 499.00, 2499.00, 3.00, 5.0, 0.15, 'km'),
('EG', 0.220, 'EGP', 'E\u00a3', 699.00, 2299.00, 11499.00, 8.00, 5.0, 0.14, 'km'),
('TZ', 0.180, 'TZS', 'TSh', 3500.00, 12000.00, 60000.00, 500.00, 5.0, 0.18, 'km'),
('UG', 0.170, 'UGX', 'USh', 5000.00, 18000.00, 90000.00, 500.00, 5.0, 0.18, 'km'),
('RW', 0.190, 'RWF', 'FRw', 8000.00, 28000.00, 140000.00, 300.00, 5.0, 0.18, 'km'),
('ET', 0.170, 'ETB', 'Birr', 800.00, 2800.00, 14000.00, 50.00, 5.0, 0.15, 'km'),
('SN', 0.220, 'XOF', 'CFA', 14900.00, 49900.00, 249900.00, 250.00, 5.0, 0.18, 'km'),
('CM', 0.200, 'XAF', 'FCFA', 14900.00, 49900.00, 249900.00, 250.00, 5.0, 0.1925, 'km'),
('CI', 0.210, 'XOF', 'CFA', 14900.00, 49900.00, 249900.00, 250.00, 5.0, 0.18, 'km'),
('MA', 0.310, 'MAD', 'MAD', 249.00, 799.00, 3999.00, 3.00, 5.0, 0.20, 'km'),
('AO', 0.220, 'AOA', 'Kz', 8000.00, 28000.00, 140000.00, 500.00, 5.0, 0.10, 'km'),
('MZ', 0.170, 'MZN', 'MT', 2500.00, 8500.00, 42500.00, 200.00, 5.0, 0.17, 'km'),
('MW', 0.160, 'MWK', 'MK', 8000.00, 28000.00, 140000.00, 500.00, 5.0, 0.165, 'km'),
('ZM', 0.190, 'ZMW', 'ZK', 250.00, 850.00, 4250.00, 5.00, 5.0, 0.16, 'km'),
('ZW', 0.180, 'USD', '$', 29.00, 99.00, 499.00, 0.50, 5.0, 0.145, 'km'),
-- South America
('BR', 0.300, 'BRL', 'R$', 89.00, 299.00, 1499.00, 1.50, 5.0, 0.17, 'km'),
('AR', 0.280, 'ARS', 'ARS', 4999.00, 16999.00, 84999.00, 100.00, 5.0, 0.21, 'km'),
('CO', 0.260, 'COP', 'COL$', 59000.00, 199000.00, 999000.00, 1500.00, 5.0, 0.19, 'km'),
('CL', 0.380, 'CLP', 'CLP', 17900.00, 59900.00, 299900.00, 300.00, 5.0, 0.19, 'km'),
('PE', 0.270, 'PEN', 'S/.', 99.00, 329.00, 1649.00, 1.50, 5.0, 0.18, 'km'),
('EC', 0.260, 'USD', '$', 29.00, 99.00, 499.00, 0.50, 5.0, 0.12, 'km'),
('UY', 0.420, 'UYU', '$U', 899.00, 2999.00, 14999.00, 15.00, 5.0, 0.22, 'km'),
-- Oceania
('AU', 0.800, 'AUD', 'A$', 39.00, 129.00, 649.00, 0.65, 5.0, 0.10, 'km'),
('NZ', 0.750, 'NZD', 'NZ$', 42.00, 139.00, 699.00, 0.70, 5.0, 0.15, 'km')
ON CONFLICT (country_code) DO NOTHING;
