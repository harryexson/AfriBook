-- ============================================================================
-- AfriBook — RideLy & RetroBuddy Migration
-- Supabase PostgreSQL migration adding the RideLy ride-hailing / delivery
-- system and RetroBuddy restaurant food-delivery integration.
-- Uses PostGIS for all geospatial operations and Supabase Realtime for
-- live driver tracking and dispatch events.
-- ============================================================================
-- Migration: 002_ridely_retrobuddy
-- Depends:    001_initial_schema
-- ============================================================================

-- 0. EXTENSIONS =================================================================

CREATE EXTENSION IF NOT EXISTS "postgis"       SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis_raster" SCHEMA extensions;

-- Re-use the uuid-ossp extension from migration 001

-- 1. ENUM TYPES =================================================================

CREATE TYPE ride_type AS ENUM (
    'economy',
    'comfort',
    'premium',
    'xl',
    'bike'
);

CREATE TYPE ridely_ride_status AS ENUM (
    'requesting',
    'searching',
    'matched',
    'accepted',
    'en_route',
    'arrived',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE delivery_category AS ENUM (
    'package',
    'food',
    'grocery',
    'pharmacy',
    'document'
);

CREATE TYPE ridely_delivery_status AS ENUM (
    'requesting',
    'searching',
    'matched',
    'accepted',
    'en_route_to_pickup',
    'at_pickup',
    'picked_up',
    'in_transit',
    'at_dropoff',
    'delivered',
    'cancelled'
);

CREATE TYPE driver_availability AS ENUM (
    'offline',
    'available',
    'on_trip',
    'busy',
    'break'
);

CREATE TYPE ridely_payment_type AS ENUM (
    'cash',
    'card',
    'wallet',
    'mobile_money'
);

CREATE TYPE cancellation_actor AS ENUM (
    'rider',
    'driver',
    'system'
);

CREATE TYPE offer_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Driver Locations (real-time GPS tracking)
-- ---------------------------------------------------------------------------
-- Stores the latest GPS sample from each driver. Updated every 3-5 seconds
-- via the driver app. A GIST index on the geography column enables fast
-- nearest-driver queries using ST_DWithin.

CREATE TABLE driver_locations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id     UUID NOT NULL UNIQUE REFERENCES drivers(id) ON DELETE CASCADE,
    location      GEOGRAPHY(POINT, 4326) NOT NULL,
    heading       NUMERIC(5, 2) DEFAULT 0 CHECK (heading >= 0 AND heading < 360),
    speed         NUMERIC(6, 2) DEFAULT 0 CHECK (speed >= 0),
    accuracy      NUMERIC(8, 2) DEFAULT 0 CHECK (accuracy >= 0),
    last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  driver_locations IS 'Real-time GPS positions for all active drivers';
COMMENT ON COLUMN driver_locations.location IS 'PostGIS geography point (lon/lat) updated every 3-5 s';
COMMENT ON COLUMN driver_locations.heading IS 'Compass heading in degrees (0 = north, clockwise)';
COMMENT ON COLUMN driver_locations.speed IS 'Ground speed in km/h';
COMMENT ON COLUMN driver_locations.accuracy IS 'GPS accuracy radius in metres';
COMMENT ON COLUMN driver_locations.last_seen_at IS 'Timestamp of the most recent location update';

-- ---------------------------------------------------------------------------
-- 2.2 Ride Requests (ride-hailing trips)
-- ---------------------------------------------------------------------------
-- The primary ride-hailing table. Stores the full lifecycle of a trip from
-- the initial request through matching, pickup, in-progress, and completion.

CREATE TABLE ridely_rides (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    driver_id               UUID REFERENCES drivers(id) ON DELETE SET NULL,
    ride_type               ride_type NOT NULL DEFAULT 'economy',
    pickup_location         GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address          TEXT,
    destination_location    GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_address     TEXT,
    distance_km             NUMERIC(10, 2),
    estimated_duration_min  NUMERIC(8, 2),
    estimated_fare          NUMERIC(12, 2),
    surge_multiplier        NUMERIC(4, 2) DEFAULT 1.0 CHECK (surge_multiplier >= 1.0 AND surge_multiplier <= 3.0),
    payment_type            ridely_payment_type NOT NULL DEFAULT 'cash',
    status                  ridely_ride_status NOT NULL DEFAULT 'requesting',
    vehicle_type            VARCHAR(128),
    route_polyline          TEXT,
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    matched_at              TIMESTAMPTZ,
    accepted_at             TIMESTAMPTZ,
    arrived_at              TIMESTAMPTZ,
    started_at              TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,
    cancelled_by            cancellation_actor,
    actual_fare             NUMERIC(12, 2),
    tip                     NUMERIC(12, 2) DEFAULT 0,
    rating                  SMALLINT CHECK (rating BETWEEN 1 AND 5),
    review                  TEXT,
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ridely_rides IS 'Ride-hailing trip requests with full lifecycle tracking';
COMMENT ON COLUMN ridely_rides.pickup_location IS 'PostGIS geography point for rider pickup';
COMMENT ON COLUMN ridely_rides.destination_location IS 'PostGIS geography point for trip destination';
COMMENT ON COLUMN ridely_rides.surge_multiplier IS 'Dynamic pricing multiplier (1.0 = no surge, max 3.0)';
COMMENT ON COLUMN ridely_rides.route_polyline IS 'Encoded polyline of the planned route from routing engine';
COMMENT ON COLUMN ridely_rides.cancelled_by IS 'Who cancelled: rider, driver, or system (auto-cancel)';

-- ---------------------------------------------------------------------------
-- 2.3 Delivery Requests (courier / package delivery)
-- ---------------------------------------------------------------------------
-- General-purpose courier delivery table. Supports packages, documents,
-- pharmacy items, and groceries with separate contact info for pickup
-- and dropoff.

CREATE TABLE ridely_deliveries (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    driver_id                   UUID REFERENCES drivers(id) ON DELETE SET NULL,
    delivery_type               delivery_category NOT NULL DEFAULT 'package',
    pickup_location             GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address              TEXT,
    pickup_contact_name         VARCHAR(255),
    pickup_contact_phone        VARCHAR(32),
    destination_location        GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_address         TEXT,
    destination_contact_name    VARCHAR(255),
    destination_contact_phone   VARCHAR(32),
    package_description         TEXT,
    package_weight              NUMERIC(8, 3),
    package_value               NUMERIC(12, 2),
    distance_km                 NUMERIC(10, 2),
    estimated_duration_min      NUMERIC(8, 2),
    estimated_fare              NUMERIC(12, 2),
    surge_multiplier            NUMERIC(4, 2) DEFAULT 1.0 CHECK (surge_multiplier >= 1.0 AND surge_multiplier <= 3.0),
    payment_type                ridely_payment_type NOT NULL DEFAULT 'cash',
    status                      ridely_delivery_status NOT NULL DEFAULT 'requesting',
    special_instructions        TEXT,
    photo_url                   TEXT,
    signature_required          BOOLEAN DEFAULT false,
    signature                   TEXT,
    requested_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    matched_at                  TIMESTAMPTZ,
    accepted_at                 TIMESTAMPTZ,
    picked_up_at                TIMESTAMPTZ,
    delivered_at                TIMESTAMPTZ,
    cancelled_at                TIMESTAMPTZ,
    actual_fare                 NUMERIC(12, 2),
    metadata                    JSONB DEFAULT '{}'::jsonb,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ridely_deliveries IS 'Courier delivery requests for packages, documents, groceries, and pharmacy items';
COMMENT ON COLUMN ridely_deliveries.pickup_location IS 'PostGIS geography point for package collection';
COMMENT ON COLUMN ridely_deliveries.destination_location IS 'PostGIS geography point for package dropoff';
COMMENT ON COLUMN ridely_deliveries.signature_required IS 'Whether recipient must sign on delivery';
COMMENT ON COLUMN ridely_deliveries.package_value IS 'Declared value for insurance / liability';

-- ---------------------------------------------------------------------------
-- 2.4 Food Deliveries (RetroBuddy integration)
-- ---------------------------------------------------------------------------
-- Food orders originating from RetroBuddy restaurants. Includes restaurant
-- metadata, itemized menu orders, and restaurant-side timestamps (accepted,
-- ready) distinct from driver-side timestamps.

CREATE TABLE ridely_food_deliveries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    restaurant_id           UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    restaurant_name         VARCHAR(255) NOT NULL,
    restaurant_location     GEOGRAPHY(POINT, 4326) NOT NULL,
    items                   JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    delivery_fee            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax                     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total                   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    destination_location    GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_address     TEXT,
    distance_km             NUMERIC(10, 2),
    estimated_prep_time     SMALLINT DEFAULT 15,
    estimated_delivery_time SMALLINT DEFAULT 30,
    payment_type            ridely_payment_type NOT NULL DEFAULT 'cash',
    status                  ridely_delivery_status NOT NULL DEFAULT 'requesting',
    driver_id               UUID REFERENCES drivers(id) ON DELETE SET NULL,
    special_instructions    TEXT,
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    restaurant_accepted_at  TIMESTAMPTZ,
    restaurant_ready_at     TIMESTAMPTZ,
    driver_picked_up_at     TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ridely_food_deliveries IS 'Food delivery orders from RetroBuddy restaurants';
COMMENT ON COLUMN ridely_food_deliveries.items IS 'JSON array of {id, menuItemId, name, quantity, unitPrice, totalPrice, notes}';
COMMENT ON COLUMN ridely_food_deliveries.restaurant_location IS 'PostGIS geography point of the restaurant kitchen';
COMMENT ON COLUMN ridely_food_deliveries.estimated_prep_time IS 'Restaurant-estimated food preparation time in minutes';
COMMENT ON COLUMN ridely_food_deliveries.restaurant_accepted_at IS 'When the restaurant confirmed they can fulfil the order';
COMMENT ON COLUMN ridely_food_deliveries.restaurant_ready_at IS 'When the restaurant marked the order ready for pickup';

-- ---------------------------------------------------------------------------
-- 2.5 Driver Offers (dispatch queue)
-- ---------------------------------------------------------------------------
-- Each row represents an offer sent to a driver for a ride or delivery.
-- Offers auto-expire after 10-15 seconds if not accepted.

CREATE TABLE driver_offers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id                 UUID NOT NULL REFERENCES ridely_rides(id) ON DELETE CASCADE,
    driver_id               UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    pickup_location         GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address          TEXT,
    destination_location    GEOGRAPHY(POINT, 4326),
    destination_address     TEXT,
    distance_km             NUMERIC(10, 2),
    estimated_duration_min  NUMERIC(8, 2),
    estimated_earnings      NUMERIC(12, 2),
    ride_type               ride_type NOT NULL,
    expires_at              TIMESTAMPTZ NOT NULL,
    status                  offer_status NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  driver_offers IS 'Dispatch offers sent to candidate drivers with auto-expiration';
COMMENT ON COLUMN driver_offers.expires_at IS 'Deadline after which the offer is automatically declined';

-- ---------------------------------------------------------------------------
-- 2.6 Surge Zones (dynamic pricing areas)
-- ---------------------------------------------------------------------------
-- Circular surge zones defined by a centre point and radius. The multiplier
-- is recalculated periodically based on the demand-to-supply ratio.

CREATE TABLE surge_zones (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    center        GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_km     NUMERIC(6, 2) NOT NULL DEFAULT 2.0 CHECK (radius_km > 0),
    multiplier    NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (multiplier >= 1.0 AND multiplier <= 3.0),
    demand        INTEGER NOT NULL DEFAULT 0 CHECK (demand >= 0),
    supply        INTEGER NOT NULL DEFAULT 0 CHECK (supply >= 0),
    ratio         NUMERIC(8, 4) NOT NULL DEFAULT 0,
    active        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ
);

COMMENT ON TABLE  surge_zones IS 'Dynamic pricing zones with demand/supply multipliers';
COMMENT ON COLUMN surge_zones.center IS 'PostGIS geography point at the centre of the surge zone';
COMMENT ON COLUMN surge_zones.ratio IS 'Demand / supply ratio used to calculate the multiplier';

-- ---------------------------------------------------------------------------
-- 2.7 Ride Status History (audit trail)
-- ---------------------------------------------------------------------------
-- Immutable log of every status transition for a ride or delivery. Used for
-- debugging, analytics, and dispute resolution.

CREATE TABLE ride_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id         UUID NOT NULL REFERENCES ridely_rides(id) ON DELETE CASCADE,
    previous_status ridely_ride_status,
    new_status      ridely_ride_status NOT NULL,
    changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    location        GEOGRAPHY(POINT, 4326),
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ride_status_history IS 'Immutable audit trail of ride status transitions';
COMMENT ON COLUMN ride_status_history.location IS 'Driver location at the time of the status change';

-- ---------------------------------------------------------------------------
-- 2.8 Delivery Status History (audit trail)
-- ---------------------------------------------------------------------------

CREATE TABLE delivery_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id     UUID NOT NULL REFERENCES ridely_deliveries(id) ON DELETE CASCADE,
    previous_status ridely_delivery_status,
    new_status      ridely_delivery_status NOT NULL,
    changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    location        GEOGRAPHY(POINT, 4326),
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE delivery_status_history IS 'Immutable audit trail of delivery status transitions';

-- ---------------------------------------------------------------------------
-- 2.9 Driver Stats (materialised view — refresh on schedule)
-- ---------------------------------------------------------------------------
-- Pre-aggregated driver statistics refreshed every 15 minutes. Eliminates
-- expensive COUNT/SUM queries from the dispatch hot path.

CREATE MATERIALIZED VIEW mv_driver_stats AS
SELECT
    d.id AS driver_id,
    COALESCE(ride_stats.total_trips, 0)            AS total_trips,
    COALESCE(delivery_stats.total_deliveries, 0)    AS total_deliveries,
    COALESCE(earnings.total_earnings, 0)            AS total_earnings,
    COALESCE(rating_stats.avg_rating, 0)            AS average_rating,
    COALESCE(response_stats.avg_response_time, 0)   AS average_response_time,
    COALESCE(weekly.weekly_trips, 0)                AS trips_this_week,
    COALESCE(weekly.weekly_earnings, 0)             AS earnings_this_week,
    COALESCE(weekly.weekly_hours, 0)                AS online_hours_this_week
FROM drivers d
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS total_trips
    FROM ridely_rides r
    WHERE r.driver_id = d.id AND r.status = 'completed'
) ride_stats ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS total_deliveries
    FROM ridely_deliveries dl
    WHERE dl.driver_id = d.id AND dl.status = 'delivered'
) delivery_stats ON true
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(COALESCE(r.actual_fare, r.estimated_fare, 0)), 0)
        + COALESCE(SUM(dl2.actual_fare), 0)
        AS total_earnings
    FROM ridely_rides r
    FULL JOIN ridely_deliveries dl2 ON false
    WHERE r.driver_id = d.id OR dl2.driver_id = d.id
) earnings ON true
LEFT JOIN LATERAL (
    SELECT AVG(r.rating)::NUMERIC(3,2) AS avg_rating
    FROM ridely_rides r
    WHERE r.driver_id = d.id AND r.rating IS NOT NULL
) rating_stats ON true
LEFT JOIN LATERAL (
    SELECT AVG(EXTRACT(EPOCH FROM (o.accepted_at - o.created_at)))::NUMERIC(8,2) AS avg_response_time
    FROM driver_offers o
    WHERE o.driver_id = d.id AND o.accepted_at IS NOT NULL
) response_stats ON true
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::INT AS weekly_trips,
        COALESCE(SUM(r.actual_fare), 0) AS weekly_earnings,
        COALESCE(SUM(EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 3600), 0) AS weekly_hours
    FROM ridely_rides r
    WHERE r.driver_id = d.id
      AND r.status = 'completed'
      AND r.completed_at >= date_trunc('week', now())
) weekly ON true
WITH NO DATA;

COMMENT ON MATERIALIZED VIEW mv_driver_stats IS 'Pre-aggregated driver statistics — refresh every 15 minutes';

-- Unique index required for concurrent refresh
CREATE UNIQUE INDEX idx_mv_driver_stats_driver ON mv_driver_stats (driver_id);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- driver_locations
CREATE INDEX idx_driver_locations_geo      ON driver_locations USING GIST (location);
CREATE INDEX idx_driver_locations_driver   ON driver_locations (driver_id);
CREATE INDEX idx_driver_locations_seen     ON driver_locations (last_seen_at);

-- ridely_rides
CREATE INDEX idx_ridely_rides_rider        ON ridely_rides (rider_id);
CREATE INDEX idx_ridely_rides_driver       ON ridely_rides (driver_id);
CREATE INDEX idx_ridely_rides_status       ON ridely_rides (status);
CREATE INDEX idx_ridely_rides_pickup_geo   ON ridely_rides USING GIST (pickup_location);
CREATE INDEX idx_ridely_rides_dest_geo     ON ridely_rides USING GIST (destination_location);
CREATE INDEX idx_ridely_rides_requested    ON ridely_rides (requested_at);
CREATE INDEX idx_ridely_rides_rider_status ON ridely_rides (rider_id, status);
CREATE INDEX idx_ridely_rides_driver_status ON ridely_rides (driver_id, status);
CREATE INDEX idx_ridely_rides_type_status  ON ridely_rides (ride_type, status);

-- ridely_deliveries
CREATE INDEX idx_ridely_deliveries_customer    ON ridely_deliveries (customer_id);
CREATE INDEX idx_ridely_deliveries_driver      ON ridely_deliveries (driver_id);
CREATE INDEX idx_ridely_deliveries_status      ON ridely_deliveries (status);
CREATE INDEX idx_ridely_deliveries_type        ON ridely_deliveries (delivery_type);
CREATE INDEX idx_ridely_deliveries_pickup_geo  ON ridely_deliveries USING GIST (pickup_location);
CREATE INDEX idx_ridely_deliveries_dest_geo    ON ridely_deliveries USING GIST (destination_location);
CREATE INDEX idx_ridely_deliveries_requested   ON ridely_deliveries (requested_at);

-- ridely_food_deliveries
CREATE INDEX idx_ridely_food_customer       ON ridely_food_deliveries (customer_id);
CREATE INDEX idx_ridely_food_restaurant     ON ridely_food_deliveries (restaurant_id);
CREATE INDEX idx_ridely_food_driver         ON ridely_food_deliveries (driver_id);
CREATE INDEX idx_ridely_food_status         ON ridely_food_deliveries (status);
CREATE INDEX idx_ridely_food_dest_geo       ON ridely_food_deliveries USING GIST (destination_location);
CREATE INDEX idx_ridely_food_restaurant_geo ON ridely_food_deliveries USING GIST (restaurant_location);
CREATE INDEX idx_ridely_food_requested      ON ridely_food_deliveries (requested_at);

-- driver_offers
CREATE INDEX idx_driver_offers_ride        ON driver_offers (ride_id);
CREATE INDEX idx_driver_offers_driver      ON driver_offers (driver_id);
CREATE INDEX idx_driver_offers_status      ON driver_offers (status);
CREATE INDEX idx_driver_offers_expires     ON driver_offers (expires_at);
CREATE INDEX idx_driver_offers_pending     ON driver_offers (driver_id, status)
    WHERE status = 'pending';

-- surge_zones
CREATE INDEX idx_surge_zones_active     ON surge_zones (active);
CREATE INDEX idx_surge_zones_geo        ON surge_zones USING GIST (center);
CREATE INDEX idx_surge_zones_expires    ON surge_zones (expires_at);

-- ride_status_history
CREATE INDEX idx_ride_history_ride      ON ride_status_history (ride_id);
CREATE INDEX idx_ride_history_created   ON ride_status_history (created_at);
CREATE INDEX idx_ride_history_status    ON ride_status_history (new_status);

-- delivery_status_history
CREATE INDEX idx_delivery_history_delivery ON delivery_status_history (delivery_id);
CREATE INDEX idx_delivery_history_created  ON delivery_status_history (created_at);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 Find nearby available drivers
-- ---------------------------------------------------------------------------
-- Returns the N closest available drivers to a given point within a max
-- distance, ordered by straight-line distance. Used by the dispatch system.

CREATE OR REPLACE FUNCTION find_nearby_drivers(
    p_lat       DOUBLE PRECISION,
    p_lng       DOUBLE PRECISION,
    p_radius_m  DOUBLE PRECISION DEFAULT 5000,
    p_limit     INT DEFAULT 10
)
RETURNS TABLE (
    driver_id       UUID,
    profile_id      UUID,
    distance_m      DOUBLE PRECISION,
    heading         NUMERIC,
    speed           NUMERIC,
    last_seen_at    TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dl.driver_id,
        d.profile_id,
        ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::DOUBLE PRECISION AS distance_m,
        dl.heading,
        dl.speed,
        dl.last_seen_at
    FROM driver_locations dl
    JOIN drivers d ON d.id = dl.driver_id
    WHERE d.is_available = true
      AND d.status = 'online'
      AND ST_DWithin(
          dl.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_m
      )
      AND dl.last_seen_at >= now() - INTERVAL '30 seconds'
    ORDER BY dl.location <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION find_nearby_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT)
    IS 'Returns up to N available drivers within p_radius_m metres of a point, ordered by proximity';

-- ---------------------------------------------------------------------------
-- 4.2 Calculate distance and duration between two points
-- ---------------------------------------------------------------------------
-- Uses the Haversine formula for straight-line distance and a simple
-- speed model for duration estimation. For production, call a routing
-- API and store the polyline.

CREATE OR REPLACE FUNCTION calculate_distance_and_duration(
    p_pickup_lat     DOUBLE PRECISION,
    p_pickup_lng     DOUBLE PRECISION,
    p_dest_lat       DOUBLE PRECISION,
    p_dest_lng       DOUBLE PRECISION,
    p_avg_speed_kmh  DOUBLE PRECISION DEFAULT 30
)
RETURNS TABLE (
    distance_km     DOUBLE PRECISION,
    duration_min    DOUBLE PRECISION
) AS $$
DECLARE
    v_distance DOUBLE PRECISION;
BEGIN
    -- Haversine distance
    v_distance := 6371 * acos(
        cos(radians(p_pickup_lat)) * cos(radians(p_dest_lat))
        * cos(radians(p_dest_lng) - radians(p_pickup_lng))
        + sin(radians(p_pickup_lat)) * sin(radians(p_dest_lat))
    );

    distance_km  := ROUND(v_distance, 2);
    duration_min := ROUND((v_distance / p_avg_speed_kmh) * 60, 1);
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_and_duration(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION)
    IS 'Calculates straight-line distance and estimated duration between two GPS coordinates';

-- ---------------------------------------------------------------------------
-- 4.3 Calculate surge multiplier for a location
-- ---------------------------------------------------------------------------
-- Checks active surge zones covering the given point and returns the
-- highest applicable multiplier (or 1.0 if no surge applies).

CREATE OR REPLACE FUNCTION get_surge_multiplier(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS NUMERIC AS $$
DECLARE
    v_multiplier NUMERIC := 1.0;
    v_zone RECORD;
BEGIN
    FOR v_zone IN
        SELECT sz.multiplier
        FROM surge_zones sz
        WHERE sz.active = true
          AND (sz.expires_at IS NULL OR sz.expires_at > now())
          AND ST_DWithin(
              sz.center,
              ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
              sz.radius_km * 1000
          )
        ORDER BY sz.multiplier DESC
        LIMIT 1
    LOOP
        v_multiplier := v_zone.multiplier;
    END LOOP;

    RETURN v_multiplier;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_surge_multiplier(DOUBLE PRECISION, DOUBLE PRECISION)
    IS 'Returns the highest surge multiplier for active zones covering a GPS coordinate';

-- ---------------------------------------------------------------------------
-- 4.4 Update surge zone demand/supply ratio
-- ---------------------------------------------------------------------------
-- Recalculates the demand and supply counts for each active surge zone
-- and updates the multiplier based on configurable thresholds.

CREATE OR REPLACE FUNCTION update_surge_zone_ratios()
RETURNS VOID AS $$
DECLARE
    v_zone RECORD;
    v_demand INT;
    v_supply INT;
    v_new_multiplier NUMERIC;
BEGIN
    FOR v_zone IN SELECT id, center, radius_km FROM surge_zones WHERE active = true
    LOOP
        -- Count active ride/delivery requests in the zone
        SELECT COUNT(*)::INT INTO v_demand
        FROM ridely_rides r
        WHERE r.status IN ('requesting', 'searching', 'matched')
          AND ST_DWithin(
              r.pickup_location,
              v_zone.center,
              v_zone.radius_km * 1000
          );

        -- Count available drivers in the zone
        SELECT COUNT(*)::INT INTO v_supply
        FROM driver_locations dl
        JOIN drivers d ON d.id = dl.driver_id
        WHERE d.is_available = true
          AND d.status = 'online'
          AND ST_DWithin(dl.location, v_zone.center, v_zone.radius_km * 1000);

        -- Calculate multiplier based on ratio
        v_new_multiplier := CASE
            WHEN v_supply = 0 AND v_demand > 0 THEN 3.0
            WHEN v_demand::NUMERIC / GREATEST(v_supply, 1) >= 4.0 THEN 2.5
            WHEN v_demand::NUMERIC / GREATEST(v_supply, 1) >= 3.0 THEN 2.0
            WHEN v_demand::NUMERIC / GREATEST(v_supply, 1) >= 2.0 THEN 1.5
            WHEN v_demand::NUMERIC / GREATEST(v_supply, 1) >= 1.5 THEN 1.2
            ELSE 1.0
        END;

        UPDATE surge_zones
        SET demand   = v_demand,
            supply   = v_supply,
            ratio    = CASE WHEN v_supply > 0 THEN v_demand::NUMERIC / v_supply ELSE 0 END,
            multiplier = v_new_multiplier,
            active   = (v_new_multiplier > 1.0 OR v_demand > 0)
        WHERE id = v_zone.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_surge_zone_ratios()
    IS 'Recalculates demand/supply and multiplier for all active surge zones';

-- ---------------------------------------------------------------------------
-- 4.5 Auto-expire stale driver offers
-- ---------------------------------------------------------------------------
-- Declines offers that have passed their expiry timestamp. Called by a
-- scheduled Supabase Edge Function or pg_cron.

CREATE OR REPLACE FUNCTION expire_stale_offers()
RETURNS INT AS $$
DECLARE
    v_expired INT;
BEGIN
    WITH expired AS (
        UPDATE driver_offers
        SET status = 'expired'
        WHERE status = 'pending'
          AND expires_at < now()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired FROM expired;

    RETURN v_expired;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_stale_offers()
    IS 'Expires all pending driver offers past their deadline — returns count of expired offers';

-- ---------------------------------------------------------------------------
-- 4.6 Record a ride status change
-- ---------------------------------------------------------------------------
-- Inserts into ride_status_history and updates the ride's current status
-- in a single transaction.

CREATE OR REPLACE FUNCTION transition_ride_status(
    p_ride_id       UUID,
    p_new_status    ridely_ride_status,
    p_changed_by    UUID DEFAULT NULL,
    p_lat           DOUBLE PRECISION DEFAULT NULL,
    p_lng           DOUBLE PRECISION DEFAULT NULL,
    p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    v_old_status ridely_ride_status;
    v_location   GEOGRAPHY;
BEGIN
    -- Fetch current status
    SELECT status INTO v_old_status FROM ridely_rides WHERE id = p_ride_id;
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Ride % not found', p_ride_id;
    END IF;

    -- Build geography if coordinates provided
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    -- Insert history
    INSERT INTO ride_status_history (ride_id, previous_status, new_status, changed_by, location, metadata)
    VALUES (p_ride_id, v_old_status, p_new_status, p_changed_by, v_location, p_metadata);

    -- Update ride status and timestamp
    UPDATE ridely_rides
    SET status = p_new_status,
        matched_at    = CASE WHEN p_new_status = 'matched'    THEN now() ELSE matched_at    END,
        accepted_at   = CASE WHEN p_new_status = 'accepted'   THEN now() ELSE accepted_at   END,
        arrived_at    = CASE WHEN p_new_status = 'arrived'    THEN now() ELSE arrived_at    END,
        started_at    = CASE WHEN p_new_status = 'in_progress' THEN now() ELSE started_at    END,
        completed_at  = CASE WHEN p_new_status = 'completed'  THEN now() ELSE completed_at  END,
        cancelled_at  = CASE WHEN p_new_status = 'cancelled'  THEN now() ELSE cancelled_at  END,
        updated_at    = now()
    WHERE id = p_ride_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transition_ride_status(UUID, ridely_ride_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB)
    IS 'Records a ride status transition with history audit trail';

-- ---------------------------------------------------------------------------
-- 4.7 Record a delivery status change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION transition_delivery_status(
    p_delivery_id   UUID,
    p_new_status    ridely_delivery_status,
    p_changed_by    UUID DEFAULT NULL,
    p_lat           DOUBLE PRECISION DEFAULT NULL,
    p_lng           DOUBLE PRECISION DEFAULT NULL,
    p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    v_old_status ridely_delivery_status;
    v_location   GEOGRAPHY;
BEGIN
    SELECT status INTO v_old_status FROM ridely_deliveries WHERE id = p_delivery_id;
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Delivery % not found', p_delivery_id;
    END IF;

    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    INSERT INTO delivery_status_history (delivery_id, previous_status, new_status, changed_by, location, metadata)
    VALUES (p_delivery_id, v_old_status, p_new_status, p_changed_by, v_location, p_metadata);

    UPDATE ridely_deliveries
    SET status = p_new_status,
        matched_at    = CASE WHEN p_new_status = 'matched'          THEN now() ELSE matched_at    END,
        accepted_at   = CASE WHEN p_new_status = 'accepted'         THEN now() ELSE accepted_at   END,
        picked_up_at  = CASE WHEN p_new_status = 'picked_up'        THEN now() ELSE picked_up_at  END,
        delivered_at  = CASE WHEN p_new_status = 'delivered'        THEN now() ELSE delivered_at  END,
        cancelled_at  = CASE WHEN p_new_status = 'cancelled'        THEN now() ELSE cancelled_at  END,
        updated_at    = now()
    WHERE id = p_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transition_delivery_status(UUID, ridely_delivery_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB)
    IS 'Records a delivery status transition with history audit trail';

-- ---------------------------------------------------------------------------
-- 4.8 Update driver location
-- ---------------------------------------------------------------------------
-- Upserts the driver's latest GPS position. Called from the driver app on
-- every location update (~3-5 s interval).

CREATE OR REPLACE FUNCTION update_driver_location(
    p_driver_id  UUID,
    p_lat        DOUBLE PRECISION,
    p_lng        DOUBLE PRECISION,
    p_heading    NUMERIC DEFAULT 0,
    p_speed      NUMERIC DEFAULT 0,
    p_accuracy   NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO driver_locations (driver_id, location, heading, speed, accuracy, last_seen_at)
    VALUES (
        p_driver_id,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_heading,
        p_speed,
        p_accuracy,
        now()
    )
    ON CONFLICT (driver_id)
    DO UPDATE SET
        location     = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        heading      = p_heading,
        speed        = p_speed,
        accuracy     = p_accuracy,
        last_seen_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_driver_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC)
    IS 'Upserts a driver''s latest GPS position into the driver_locations table';

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- updated_at triggers for new tables
CREATE TRIGGER trg_ridely_rides_updated_at
    BEFORE UPDATE ON ridely_rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ridely_deliveries_updated_at
    BEFORE UPDATE ON ridely_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ridely_food_deliveries_updated_at
    BEFORE UPDATE ON ridely_food_deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-transition ride to 'searching' on insert
CREATE OR REPLACE FUNCTION trg_ride_auto_searching()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'requesting' THEN
        NEW.status := 'searching';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ridely_rides_auto_searching
    BEFORE INSERT ON ridely_rides
    FOR EACH ROW EXECUTE FUNCTION trg_ride_auto_searching();

-- Auto-transition delivery to 'searching' on insert
CREATE OR REPLACE FUNCTION trg_delivery_auto_searching()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'requesting' THEN
        NEW.status := 'searching';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ridely_deliveries_auto_searching
    BEFORE INSERT ON ridely_deliveries
    FOR EACH ROW EXECUTE FUNCTION trg_delivery_auto_searching();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE driver_locations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ridely_rides             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ridely_deliveries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ridely_food_deliveries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_offers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE surge_zones              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_status_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6.1 driver_locations
-- ---------------------------------------------------------------------------
-- Drivers can read/write their own location; riders and admins can read all.

CREATE POLICY driver_locations_select ON driver_locations
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_locations_insert ON driver_locations
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_locations_update ON driver_locations
    FOR UPDATE USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.2 ridely_rides
-- ---------------------------------------------------------------------------
-- Riders see their own rides; drivers see rides assigned to them; admins all.

CREATE POLICY ridely_rides_select ON ridely_rides
    FOR SELECT USING (
        rider_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY ridely_rides_insert ON ridely_rides
    FOR INSERT WITH CHECK (
        rider_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY ridely_rides_update ON ridely_rides
    FOR UPDATE USING (
        rider_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.3 ridely_deliveries
-- ---------------------------------------------------------------------------
-- Customers see their own; assigned drivers see theirs; admins all.

CREATE POLICY ridely_deliveries_select ON ridely_deliveries
    FOR SELECT USING (
        customer_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY ridely_deliveries_insert ON ridely_deliveries
    FOR INSERT WITH CHECK (
        customer_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY ridely_deliveries_update ON ridely_deliveries
    FOR UPDATE USING (
        customer_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.4 ridely_food_deliveries
-- ---------------------------------------------------------------------------
-- Customers see their own; restaurant owners see orders for their restaurant;
-- assigned drivers see theirs; admins all.

CREATE POLICY ridely_food_deliveries_select ON ridely_food_deliveries
    FOR SELECT USING (
        customer_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM restaurants r
            JOIN businesses b ON b.id = r.business_id
            WHERE r.id = ridely_food_deliveries.restaurant_id
              AND b.owner_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY ridely_food_deliveries_insert ON ridely_food_deliveries
    FOR INSERT WITH CHECK (
        customer_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY ridely_food_deliveries_update ON ridely_food_deliveries
    FOR UPDATE USING (
        customer_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM restaurants r
            JOIN businesses b ON b.id = r.business_id
            WHERE r.id = ridely_food_deliveries.restaurant_id
              AND b.owner_id = auth.uid()
        )
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.5 driver_offers
-- ---------------------------------------------------------------------------
-- Drivers see offers addressed to them; admins all.

CREATE POLICY driver_offers_select ON driver_offers
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_offers_insert ON driver_offers
    FOR INSERT WITH CHECK (
        is_admin()
        OR EXISTS (SELECT 1 FROM ridely_rides WHERE id = ride_id AND rider_id = auth.uid())
    );

CREATE POLICY driver_offers_update ON driver_offers
    FOR UPDATE USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.6 surge_zones
-- ---------------------------------------------------------------------------
-- Anyone can read (for fare estimates); only admins can write.

CREATE POLICY surge_zones_select ON surge_zones
    FOR SELECT USING (true);

CREATE POLICY surge_zones_insert ON surge_zones
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY surge_zones_update ON surge_zones
    FOR UPDATE USING (is_admin());

CREATE POLICY surge_zones_delete ON surge_zones
    FOR DELETE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.7 ride_status_history
-- ---------------------------------------------------------------------------
-- Ride participants can read; system inserts via SECURITY DEFINER function.

CREATE POLICY ride_status_history_select ON ride_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ridely_rides r
            WHERE r.id = ride_status_history.ride_id
              AND (r.rider_id = auth.uid()
                   OR r.driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()))
        )
        OR is_admin()
    );

CREATE POLICY ride_status_history_insert ON ride_status_history
    FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6.8 delivery_status_history
-- ---------------------------------------------------------------------------
-- Delivery participants can read; system inserts via SECURITY DEFINER function.

CREATE POLICY delivery_status_history_select ON delivery_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ridely_deliveries d
            WHERE d.id = delivery_status_history.delivery_id
              AND (d.customer_id = auth.uid()
                   OR d.driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()))
        )
        OR is_admin()
    );

CREATE POLICY delivery_status_history_insert ON delivery_status_history
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 7. REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable Supabase Realtime on tables that need live updates. Clients
-- subscribe to these via the Supabase JS client:
--
--   supabase.channel('driver_locations')
--     .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, callback)
--     .subscribe()

ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE ridely_rides;
ALTER PUBLICATION supabase_realtime ADD TABLE ridely_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE ridely_food_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE surge_zones;

-- ============================================================================
-- 8. SCHEDULED MAINTENANCE
-- ============================================================================

-- Refresh the materialised view every 15 minutes (requires pg_cron or
-- a Supabase Edge Function cron job).
-- If pg_cron is available:
--   SELECT cron.schedule(
--       'refresh_driver_stats',
--       '*/15 * * * *',
--       'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_driver_stats'
--   );

-- Expire stale offers every 30 seconds (pg_cron or Edge Function):
--   SELECT cron.schedule(
--       'expire_stale_offers',
--       '*/30 * * * * *',
--       'SELECT expire_stale_offers()'
--   );

-- Update surge zone ratios every 60 seconds:
--   SELECT cron.schedule(
--       'update_surge_ratios',
--       '* * * * * *',
--       'SELECT update_surge_zone_ratios()'
--   );
