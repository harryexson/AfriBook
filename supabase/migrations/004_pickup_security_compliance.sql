-- ============================================================================
-- AfriBook — Pickup, Security, Compliance & Safety Migration
-- Adds: pickup_order_type, security escrow with verification codes,
--       driver safety features (SOS, checkpoints, panic buttons),
--       compliance scoring, theft prevention system,
--       and African-context safety policies.
-- ============================================================================
-- Migration: 004_pickup_security_compliance
-- Depends:   001_initial_schema, 002_ridely_retrobuddy, 003_events_tickets
-- ============================================================================

-- 0. EXTENSIONS =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES =================================================================

-- Order fulfillment method
CREATE TYPE fulfillment_method AS ENUM (
    'delivery',
    'pickup'
);

-- Pickup specific statuses
CREATE TYPE pickup_status AS ENUM (
    'pending',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'cancelled'
);

-- Verification code type for secure handoffs
CREATE TYPE verification_purpose AS ENUM (
    'pickup_handoff',
    'delivery_handoff',
    'driver_identity',
    'customer_identity'
);

-- Driver safety event types
CREATE TYPE safety_event_type AS ENUM (
    'sos_triggered',
    'route_deviation',
    'prolonged_stop',
    'check_in_missed',
    'emergency_contacted',
    'panic_button',
    'accident_reported',
    'theft_reported',
    'harassment_reported',
    'night_ride_unsafe_zone'
);

-- Check-in types for driver safety compliance
CREATE TYPE check_in_type AS ENUM (
    'shift_start',
    'pre_delivery',
    'post_delivery',
    'scheduled_check',
    'geofence_entry',
    'geofence_exit',
    'shift_end'
);

-- Compliance violation types
CREATE TYPE compliance_violation_type AS ENUM (
    'late_delivery',
    'missing_item',
    'damaged_item',
    'wrong_item',
    'theft_suspected',
    'route_deviation',
    'no_show',
    'unprofessional_conduct',
    'safety_protocol_violation',
    'documentation_missing'
);

-- Driver safety training level
CREATE TYPE safety_training_level AS ENUM (
    'none',
    'basic',
    'intermediate',
    'advanced',
    'certified'
);

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Pickup Orders (extends orders table with pickup-specific fields)
-- ---------------------------------------------------------------------------

CREATE TABLE pickup_orders (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    business_id           UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status                pickup_status NOT NULL DEFAULT 'pending',
    -- Pickup location details
    pickup_location       GEOGRAPHY(POINT, 4326),
    pickup_address        TEXT,
    pickup_notes          TEXT,
    -- Verification (customer must present this to collect)
    pickup_code           VARCHAR(8) NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 8)),
    pickup_code_generated_at TIMESTAMPTZ DEFAULT now(),
    -- Time window for pickup
    estimated_ready_at    TIMESTAMPTZ,
    picked_up_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    cancel_reason         TEXT,
    -- Security: photo of customer collecting (optional, vendor captures)
    collection_photo_url  TEXT,
    -- Who picked up (customer id or authorized representative)
    collected_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    collected_by_name     VARCHAR(255),
    collected_by_phone    VARCHAR(32),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  pickup_orders IS 'Pickup orders with secure verification codes and collection tracking';
COMMENT ON COLUMN pickup_orders.pickup_code IS '6-8 character alphanumeric code customer must present to collect order';
COMMENT ON COLUMN pickup_orders.collection_photo_url IS 'Optional photo of customer collecting the order (anti-fraud)';

-- ---------------------------------------------------------------------------
-- 2.2 Security Verification Codes (for delivery handoffs & driver identity)
-- ---------------------------------------------------------------------------

CREATE TABLE verification_codes (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id          UUID NOT NULL,           -- order_id / delivery_id / driver_id
    reference_type        VARCHAR(32) NOT NULL,     -- 'order', 'delivery', 'driver', 'pickup'
    purpose               verification_purpose NOT NULL,
    code                  VARCHAR(8) NOT NULL,
    expires_at            TIMESTAMPTZ NOT NULL,
    verified_at           TIMESTAMPTZ,
    verified_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_location     GEOGRAPHY(POINT, 4326),
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE verification_codes IS 'Secure verification codes for order handoffs, driver identity checks';
COMMENT ON COLUMN verification_codes.code IS 'Short verification code (6-8 chars), hashed in RLS policies';

-- ---------------------------------------------------------------------------
-- 2.3 Driver Safety Events (SOS, panic, route deviations)
-- ---------------------------------------------------------------------------

CREATE TABLE driver_safety_events (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id             UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    event_type            safety_event_type NOT NULL,
    -- Location where event occurred
    event_location        GEOGRAPHY(POINT, 4326),
    event_address         TEXT,
    -- Ride/delivery context
    ride_id               UUID REFERENCES ridely_rides(id) ON DELETE SET NULL,
    delivery_id           UUID REFERENCES ridely_deliveries(id) ON DELETE SET NULL,
    order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
    -- Event details
    description           TEXT,
    severity              VARCHAR(16) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    -- Resolution
    resolved_at           TIMESTAMPTZ,
    resolved_by           UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    resolution_notes      TEXT,
    -- Contact with emergency services
    emergency_contacted   BOOLEAN DEFAULT false,
    emergency_service     VARCHAR(64),
    emergency_case_ref    VARCHAR(64),
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_safety_events IS 'Driver safety incidents requiring intervention (SOS, panic, theft)';

-- ---------------------------------------------------------------------------
-- 2.4 Driver Check-Ins (safety compliance)
-- ---------------------------------------------------------------------------

CREATE TABLE driver_check_ins (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id             UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    check_in_type         check_in_type NOT NULL,
    -- Location
    location              GEOGRAPHY(POINT, 4326),
    location_address      TEXT,
    -- Selfie/photo verification (optional but encouraged)
    photo_url             TEXT,
    -- Status
    status                VARCHAR(16) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'late', 'excused')),
    -- Scheduled vs actual times
    scheduled_at          TIMESTAMPTZ,
    checked_in_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Risk score at time of check-in (0-100, computed)
    risk_score            SMALLINT CHECK (risk_score BETWEEN 0 AND 100),
    notes                 TEXT,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_check_ins IS 'Driver safety check-ins for compliance monitoring';

-- ---------------------------------------------------------------------------
-- 2.5 Driver Safety Training Records
-- ---------------------------------------------------------------------------

CREATE TABLE driver_safety_training (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id             UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    training_level        safety_training_level NOT NULL DEFAULT 'none',
    -- Training modules completed
    modules_completed     TEXT[] DEFAULT '{}',
    -- Certifications
    certification_name    VARCHAR(255),
    certification_url     TEXT,
    issued_by             VARCHAR(255),
    issued_at             TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,
    -- Assessment
    assessment_score      SMALLINT CHECK (assessment_score BETWEEN 0 AND 100),
    passed                BOOLEAN DEFAULT false,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_safety_training IS 'Driver safety training records and certifications';

-- ---------------------------------------------------------------------------
-- 2.6 Compliance Scorecards (vendors & drivers)
-- ---------------------------------------------------------------------------

CREATE TABLE compliance_scorecards (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Polymorphic: applies to drivers or vendors or businesses
    subject_type          VARCHAR(16) NOT NULL CHECK (subject_type IN ('driver', 'vendor', 'business')),
    subject_id            UUID NOT NULL,
    -- Scoring period
    period_start          DATE NOT NULL,
    period_end            DATE NOT NULL,
    -- Overall score (0-100)
    overall_score         NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    -- Component scores
    timeliness_score      NUMERIC(5, 2) DEFAULT 100.00,
    accuracy_score        NUMERIC(5, 2) DEFAULT 100.00,
    safety_score          NUMERIC(5, 2) DEFAULT 100.00,
    communication_score   NUMERIC(5, 2) DEFAULT 100.00,
    customer_satisfaction_score NUMERIC(5, 2) DEFAULT 100.00,
    -- Violations this period
    violation_count       INT NOT NULL DEFAULT 0,
    -- Weight
    total_assignments     INT NOT NULL DEFAULT 0,
    completed_assignments INT NOT NULL DEFAULT 0,
    on_time_assignments   INT NOT NULL DEFAULT 0,
    -- Status
    status                VARCHAR(16) DEFAULT 'active' CHECK (status IN ('active', 'probation', 'suspended', 'excellent')),
    notes                 TEXT,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE compliance_scorecards IS 'Periodic compliance scorecards tracking timeliness, accuracy, safety';

-- ---------------------------------------------------------------------------
-- 2.7 Compliance Violations
-- ---------------------------------------------------------------------------

CREATE TABLE compliance_violations (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Polymorphic
    subject_type          VARCHAR(16) NOT NULL CHECK (subject_type IN ('driver', 'vendor', 'business')),
    subject_id            UUID NOT NULL,
    violation_type        compliance_violation_type NOT NULL,
    -- Related entities
    order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
    delivery_id           UUID REFERENCES ridely_deliveries(id) ON DELETE SET NULL,
    ride_id               UUID REFERENCES ridely_rides(id) ON DELETE SET NULL,
    -- Description & severity
    description           TEXT NOT NULL,
    severity              VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    -- Resolution
    status                VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'appealed', 'dismissed')),
    resolved_at           TIMESTAMPTZ,
    resolved_by           UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    resolution_notes      TEXT,
    -- Appeal
    appeal_reason         TEXT,
    appeal_outcome        VARCHAR(16),
    -- Points deducted from compliance score
    score_penalty         NUMERIC(5, 2) DEFAULT 0,
    evidence_urls         TEXT[] DEFAULT '{}',
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE compliance_violations IS 'Recorded compliance violations with scoring penalties';

-- ---------------------------------------------------------------------------
-- 2.8 Theft Prevention Log (discrepancy tracking)
-- ---------------------------------------------------------------------------

CREATE TABLE theft_prevention_log (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- Expected vs actual tracking
    expected_items        JSONB NOT NULL DEFAULT '[]'::jsonb,
    actual_items          JSONB,
    -- Verification chain
    vendor_confirmed      BOOLEAN DEFAULT false,
    vendor_confirmed_at   TIMESTAMPTZ,
    vendor_confirmed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    driver_confirmed      BOOLEAN DEFAULT false,
    driver_confirmed_at   TIMESTAMPTZ,
    driver_confirmed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_confirmed    BOOLEAN DEFAULT false,
    customer_confirmed_at TIMESTAMPTZ,
    customer_confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Discrepancy details
    has_discrepancy       BOOLEAN DEFAULT false,
    discrepancy_notes     TEXT,
    -- Photo evidence at each stage
    vendor_pack_photo_url   TEXT,
    driver_pickup_photo_url TEXT,
    customer_delivery_photo_url TEXT,
    -- Resolution
    status                VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'discrepancy_found', 'resolved', 'escalated')),
    resolved_at           TIMESTAMPTZ,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE theft_prevention_log IS 'Three-way verification log to prevent theft and track discrepancies';

-- ---------------------------------------------------------------------------
-- 2.9 Driver Safety Zones (high-risk areas for African context)
-- ---------------------------------------------------------------------------

CREATE TABLE driver_safety_zones (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code          VARCHAR(4) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    zone_type             VARCHAR(32) NOT NULL CHECK (zone_type IN ('high_risk', 'moderate_risk', 'safe_zone', 'curfew_zone', 'restricted')),
    boundary              GEOGRAPHY(POLYGON, 4326),
    center                GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_km             NUMERIC(8, 2) NOT NULL,
    -- Risk level & restrictions
    risk_level            VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    restrictions          JSONB DEFAULT '{}'::jsonb,
    -- Curfew (African context: certain areas dangerous at night)
    curfew_start          TIME,
    curfew_end            TIME,
    -- Requires escort / buddy system
    requires_escort       BOOLEAN DEFAULT false,
    requires_check_in     BOOLEAN DEFAULT true,
    check_in_interval_min INT DEFAULT 15,
    -- Active hours
    active                BOOLEAN DEFAULT true,
    notes                 TEXT,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_safety_zones IS 'Geographic safety zones for driver security in African markets';
COMMENT ON COLUMN driver_safety_zones.curfew_start IS 'Time after which this zone becomes higher risk';
COMMENT ON COLUMN driver_safety_zones.requires_escort IS 'Drivers in this zone require buddy system / escort';

-- ---------------------------------------------------------------------------
-- 2.10 Driver Emergency Contacts
-- ---------------------------------------------------------------------------

CREATE TABLE driver_emergency_contacts (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id             UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    relationship          VARCHAR(64),
    phone                 VARCHAR(32) NOT NULL,
    is_primary            BOOLEAN DEFAULT false,
    notify_on_sos         BOOLEAN DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_emergency_contacts IS 'Emergency contacts notified during safety incidents';

-- ---------------------------------------------------------------------------
-- 2.11 Rider/Delivery Safety Ratings (bidirectional)
-- ---------------------------------------------------------------------------

CREATE TABLE safety_ratings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Rating from customer about driver
    rated_by              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rated_driver_id       UUID REFERENCES drivers(id) ON DELETE SET NULL,
    rated_customer_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Context
    ride_id               UUID REFERENCES ridely_rides(id) ON DELETE SET NULL,
    delivery_id           UUID REFERENCES ridely_deliveries(id) ON DELETE SET NULL,
    order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
    -- Safety score (1-5)
    safety_score          SMALLINT NOT NULL CHECK (safety_score BETWEEN 1 AND 5),
    -- Specific safety dimensions
    driving_safety        SMALLINT CHECK (driving_safety BETWEEN 1 AND 5),
    respectful_behavior   SMALLINT CHECK (respectful_behavior BETWEEN 1 AND 5),
    communication         SMALLINT CHECK (communication BETWEEN 1 AND 5),
    -- Free text
    comment               TEXT,
    -- Whether driver felt safe with customer
    driver_felt_safe      BOOLEAN,
    customer_felt_safe    BOOLEAN,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE safety_ratings IS 'Bidirectional safety ratings between customers and drivers';

-- ---------------------------------------------------------------------------
-- 2.12 Order Delivery Compliance Tracker
-- ---------------------------------------------------------------------------

CREATE TABLE delivery_compliance_tracker (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    delivery_id           UUID REFERENCES ridely_deliveries(id) ON DELETE SET NULL,
    -- Timeliness
    assigned_at           TIMESTAMPTZ,
    accepted_at           TIMESTAMPTZ,
    picked_up_at          TIMESTAMPTZ,
    delivered_at          TIMESTAMPTZ,
    estimated_delivery_at TIMESTAMPTZ,
    -- Delay tracking
    delay_minutes         INT DEFAULT 0,
    delay_reason          TEXT,
    delay_waived          BOOLEAN DEFAULT false,
    -- Item integrity
    items_confirmed       BOOLEAN DEFAULT false,
    items_damaged         BOOLEAN DEFAULT false,
    damage_notes          TEXT,
    -- Photo evidence
    pickup_photo_url      TEXT,
    delivery_photo_url    TEXT,
    -- Signature
    customer_signature    TEXT,
    -- GPS breadcrumb trail (for route verification)
    route_log             JSONB DEFAULT '[]'::jsonb,
    -- Compliance score for this delivery (0-100)
    compliance_score      SMALLINT CHECK (compliance_score BETWEEN 0 AND 100),
    -- Status
    status                VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'flagged', 'investigating')),
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE delivery_compliance_tracker IS 'Per-delivery compliance tracking: timeliness, item integrity, route';
COMMENT ON COLUMN delivery_compliance_tracker.route_log IS 'GPS breadcrumb trail for route deviation detection';

-- ---------------------------------------------------------------------------
-- 2.13 Driver Onboarding Safety Checklist (African Context)
-- ---------------------------------------------------------------------------

CREATE TABLE driver_safety_checklist (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id             UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    -- Identity verification
    identity_verified     BOOLEAN DEFAULT false,
    identity_verified_at  TIMESTAMPTZ,
    -- Background check
    background_check      BOOLEAN DEFAULT false,
    background_check_at   TIMESTAMPTZ,
    background_check_ref  VARCHAR(255),
    -- Vehicle inspection
    vehicle_inspected     BOOLEAN DEFAULT false,
    vehicle_inspected_at  TIMESTAMPTZ,
    -- Safety equipment (African-specific)
    has_reflective_vest   BOOLEAN DEFAULT false,
    has_first_aid_kit     BOOLEAN DEFAULT false,
    has_fire_extinguisher BOOLEAN DEFAULT false,
    has_phone_mount       BOOLEAN DEFAULT false,
    has_power_bank        BOOLEAN DEFAULT false,
    has_helmet            BOOLEAN DEFAULT false,    -- for motorcycle/bicycle riders
    -- Training
    safety_training_completed     BOOLEAN DEFAULT false,
    safety_training_completed_at  TIMESTAMPTZ,
    defensive_driving_course      BOOLEAN DEFAULT false,
    -- Emergency procedures
    emergency_procedures_acknowledged BOOLEAN DEFAULT false,
    emergency_contacts_added      BOOLEAN DEFAULT false,
    sos_feature_trained           BOOLEAN DEFAULT false,
    -- Local knowledge (African market specific)
    local_area_knowledge_confirmed BOOLEAN DEFAULT false,
    high_risk_areas_briefed       BOOLEAN DEFAULT false,
    night_driving_policy_acknowledged BOOLEAN DEFAULT false,
    -- Country-specific
    country_code          VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    regulatory_license_verified BOOLEAN DEFAULT false,
    regulatory_license_number VARCHAR(255),
    -- Approval
    is_approved           BOOLEAN DEFAULT false,
    approved_by           UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    approved_at           TIMESTAMPTZ,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_safety_checklist IS 'Comprehensive driver safety onboarding checklist adapted for African markets';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Pickup orders
CREATE INDEX idx_pickup_orders_order ON pickup_orders(order_id);
CREATE INDEX idx_pickup_orders_business ON pickup_orders(business_id);
CREATE INDEX idx_pickup_orders_customer ON pickup_orders(customer_id);
CREATE INDEX idx_pickup_orders_status ON pickup_orders(status);
CREATE INDEX idx_pickup_orders_code ON pickup_orders(pickup_code);
CREATE INDEX idx_pickup_orders_ready ON pickup_orders(estimated_ready_at);

-- Verification codes
CREATE INDEX idx_verification_codes_reference ON verification_codes(reference_id, reference_type);
CREATE INDEX idx_verification_codes_code ON verification_codes(code) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at) WHERE verified_at IS NULL;

-- Driver safety events
CREATE INDEX idx_driver_safety_events_driver ON driver_safety_events(driver_id);
CREATE INDEX idx_driver_safety_events_type ON driver_safety_events(event_type);
CREATE INDEX idx_driver_safety_events_severity ON driver_safety_events(severity);
CREATE INDEX idx_driver_safety_events_created ON driver_safety_events(created_at);
CREATE INDEX idx_driver_safety_events_unresolved ON driver_safety_events(driver_id, event_type) WHERE resolved_at IS NULL;
CREATE INDEX idx_driver_safety_events_geo ON driver_safety_events USING GIST (event_location);

-- Driver check-ins
CREATE INDEX idx_driver_check_ins_driver ON driver_check_ins(driver_id);
CREATE INDEX idx_driver_check_ins_type ON driver_check_ins(check_in_type);
CREATE INDEX idx_driver_check_ins_status ON driver_check_ins(status);
CREATE INDEX idx_driver_check_ins_date ON driver_check_ins(checked_in_at);
CREATE INDEX idx_driver_check_ins_geo ON driver_check_ins USING GIST (location);

-- Driver safety training
CREATE INDEX idx_driver_safety_training_driver ON driver_safety_training(driver_id);
CREATE INDEX idx_driver_safety_training_level ON driver_safety_training(training_level);

-- Compliance scorecards
-- Unique (subject_type, subject_id, period_start, period_end) is required by
-- the ON CONFLICT target in calculate_compliance_score().
CREATE UNIQUE INDEX idx_compliance_scorecards_period_unique ON compliance_scorecards(subject_type, subject_id, period_start, period_end);
CREATE INDEX idx_compliance_scorecards_subject ON compliance_scorecards(subject_type, subject_id);
CREATE INDEX idx_compliance_scorecards_period ON compliance_scorecards(period_start, period_end);
CREATE INDEX idx_compliance_scorecards_score ON compliance_scorecards(overall_score);
CREATE INDEX idx_compliance_scorecards_status ON compliance_scorecards(status);

-- Compliance violations
CREATE INDEX idx_compliance_violations_subject ON compliance_violations(subject_type, subject_id);
CREATE INDEX idx_compliance_violations_type ON compliance_violations(violation_type);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity);

-- Theft prevention log
CREATE INDEX idx_theft_prevention_order ON theft_prevention_log(order_id);
CREATE INDEX idx_theft_prevention_status ON theft_prevention_log(status);
CREATE INDEX idx_theft_prevention_discrepancy ON theft_prevention_log(has_discrepancy) WHERE has_discrepancy = true;

-- Driver safety zones
CREATE INDEX idx_driver_safety_zones_country ON driver_safety_zones(country_code);
CREATE INDEX idx_driver_safety_zones_active ON driver_safety_zones(active);
CREATE INDEX idx_driver_safety_zones_geo ON driver_safety_zones USING GIST (center);
CREATE INDEX idx_driver_safety_zones_boundary ON driver_safety_zones USING GIST (boundary);
CREATE INDEX idx_driver_safety_zones_type ON driver_safety_zones(zone_type);

-- Delivery compliance tracker
CREATE INDEX idx_delivery_compliance_order ON delivery_compliance_tracker(order_id);
CREATE INDEX idx_delivery_compliance_delivery ON delivery_compliance_tracker(delivery_id);
CREATE INDEX idx_delivery_compliance_status ON delivery_compliance_tracker(status);
CREATE INDEX idx_delivery_compliance_delay ON delivery_compliance_tracker(delay_minutes) WHERE delay_minutes > 0;

-- Safety ratings
CREATE INDEX idx_safety_ratings_driver ON safety_ratings(rated_driver_id);
CREATE INDEX idx_safety_ratings_customer ON safety_ratings(rated_customer_id);
CREATE INDEX idx_safety_ratings_score ON safety_ratings(safety_score);

-- Driver safety checklist
CREATE INDEX idx_driver_safety_checklist_driver ON driver_safety_checklist(driver_id);
CREATE INDEX idx_driver_safety_checklist_approved ON driver_safety_checklist(is_approved);
CREATE INDEX idx_driver_safety_checklist_country ON driver_safety_checklist(country_code);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 Generate Secure Pickup Code
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    v_code VARCHAR(8);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 8));
        SELECT EXISTS(SELECT 1 FROM pickup_orders WHERE pickup_code = v_code AND status IN ('pending', 'preparing', 'ready_for_pickup')) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_pickup_code() IS 'Generates a unique 8-char pickup verification code';

-- ---------------------------------------------------------------------------
-- 4.2 Verify Pickup Code (validates code and marks order as collected)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION verify_pickup_code(
    p_order_id    UUID,
    p_code        VARCHAR(8),
    p_collector_id UUID DEFAULT NULL,
    p_collector_name VARCHAR(255) DEFAULT NULL,
    p_lat         DOUBLE PRECISION DEFAULT NULL,
    p_lng         DOUBLE PRECISION DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
    v_pickup RECORD;
BEGIN
    -- Find the pickup order
    SELECT * INTO v_pickup
    FROM pickup_orders
    WHERE order_id = p_order_id AND status = 'ready_for_pickup'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Pickup order not found or not ready for collection'::TEXT;
        RETURN;
    END IF;

    -- Verify code
    IF v_pickup.pickup_code != p_code THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Invalid pickup code'::TEXT;
        RETURN;
    END IF;

    -- Mark as picked up
    UPDATE pickup_orders
    SET status = 'picked_up',
        picked_up_at = now(),
        collected_by = p_collector_id,
        collected_by_name = p_collector_name,
        updated_at = now()
    WHERE id = v_pickup.id;

    -- Update main order status
    UPDATE orders
    SET status = 'delivered',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    RETURN QUERY SELECT true::BOOLEAN, 'Pickup verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_pickup_code(UUID, VARCHAR(8), UUID, VARCHAR(255), DOUBLE PRECISION, DOUBLE PRECISION)
    IS 'Verifies pickup code and completes the pickup order';

-- ---------------------------------------------------------------------------
-- 4.3 Check if Driver is in a Safety Zone
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_driver_safety_zone(
    p_lat     DOUBLE PRECISION,
    p_lng     DOUBLE PRECISION
)
RETURNS TABLE (
    zone_id         UUID,
    zone_name       VARCHAR(255),
    zone_type       VARCHAR(32),
    risk_level      VARCHAR(16),
    requires_escort BOOLEAN,
    requires_check_in BOOLEAN,
    check_in_interval_min INT,
    curfew_active   BOOLEAN,
    curfew_start    TIME,
    curfew_end      TIME
) AS $$
DECLARE
    v_current_time TIME;
BEGIN
    v_current_time := CURRENT_TIME;

    RETURN QUERY
    SELECT
        dsz.id,
        dsz.name,
        dsz.zone_type,
        dsz.risk_level,
        dsz.requires_escort,
        dsz.requires_check_in,
        dsz.check_in_interval_min,
        (dsz.curfew_start IS NOT NULL
         AND v_current_time >= dsz.curfew_start
         AND v_current_time <= dsz.curfew_end) AS curfew_active,
        dsz.curfew_start,
        dsz.curfew_end
    FROM driver_safety_zones dsz
    WHERE dsz.active = true
      AND ST_DWithin(
          dsz.center,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          dsz.radius_km * 1000
      )
    ORDER BY dsz.risk_level DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION check_driver_safety_zone(DOUBLE PRECISION, DOUBLE PRECISION)
    IS 'Checks if a GPS coordinate falls within a known safety zone';

-- ---------------------------------------------------------------------------
-- 4.4 Record Safety Event and Auto-Notify Emergency Contacts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_safety_event(
    p_driver_id    UUID,
    p_event_type   safety_event_type,
    p_lat          DOUBLE PRECISION DEFAULT NULL,
    p_lng          DOUBLE PRECISION DEFAULT NULL,
    p_description  TEXT DEFAULT NULL,
    p_severity     VARCHAR(16) DEFAULT 'medium',
    p_ride_id      UUID DEFAULT NULL,
    p_delivery_id  UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
    v_emergency_contacts RECORD;
BEGIN
    INSERT INTO driver_safety_events (
        driver_id, event_type, event_location, description, severity,
        ride_id, delivery_id
    ) VALUES (
        p_driver_id, p_event_type,
        CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
            ELSE NULL
        END,
        p_description, p_severity, p_ride_id, p_delivery_id
    )
    RETURNING id INTO v_event_id;

    -- If SOS or panic, auto-notify emergency contacts
    IF p_event_type IN ('sos_triggered', 'panic_button', 'accident_reported') THEN
        -- Insert notifications for emergency contacts
        FOR v_emergency_contacts IN
            SELECT dec.name, dec.phone
            FROM driver_emergency_contacts dec
            WHERE dec.driver_id = p_driver_id AND dec.notify_on_sos = true
        LOOP
            INSERT INTO notifications (user_id, type, title, body, data)
            VALUES (
                p_driver_id,
                'system',
                '🚨 SAFETY ALERT: ' || p_event_type,
                'Emergency contacted for ' || v_emergency_contacts.name || ' at ' || v_emergency_contacts.phone,
                jsonb_build_object(
                    'event_id', v_event_id,
                    'driver_id', p_driver_id,
                    'event_type', p_event_type,
                    'severity', p_severity,
                    'contact_name', v_emergency_contacts.name,
                    'contact_phone', v_emergency_contacts.phone
                )
            );
        END LOOP;
    END IF;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_safety_event(UUID, safety_event_type, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, VARCHAR(16), UUID, UUID)
    IS 'Records a driver safety event and auto-notifies emergency contacts for critical events';

-- ---------------------------------------------------------------------------
-- 4.5 Create Delivery Compliance Record
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_delivery_compliance_record(
    p_order_id     UUID,
    p_delivery_id  UUID,
    p_estimated_delivery_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    v_tracker_id UUID;
BEGIN
    INSERT INTO delivery_compliance_tracker (
        order_id, delivery_id, assigned_at, estimated_delivery_at, status
    ) VALUES (
        p_order_id, p_delivery_id, now(), p_estimated_delivery_at, 'pending'
    )
    RETURNING id INTO v_tracker_id;

    RETURN v_tracker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_delivery_compliance_record(UUID, UUID, TIMESTAMPTZ)
    IS 'Creates a delivery compliance tracking record with GPS breadcrumb trail';

-- ---------------------------------------------------------------------------
-- 4.6 Calculate Compliance Score (for a driver)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_compliance_score(
    p_subject_type VARCHAR(16),
    p_subject_id   UUID,
    p_period_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
    p_period_end   DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(5,2) AS $$
DECLARE
    v_total_assignments INT := 0;
    v_on_time INT := 0;
    v_violation_penalty NUMERIC(5,2) := 0;
    v_base_score NUMERIC(5,2) := 100;
    v_final_score NUMERIC(5,2);
BEGIN
    -- Count assignments (rides + deliveries + orders)
    IF p_subject_type = 'driver' THEN
        SELECT COUNT(*) INTO v_total_assignments
        FROM (
            SELECT id FROM ridely_rides WHERE driver_id = p_subject_id
            UNION ALL
            SELECT id FROM ridely_deliveries WHERE driver_id = p_subject_id
        ) AS assignments;

        SELECT COUNT(*) INTO v_on_time
        FROM ridely_rides
        WHERE driver_id = p_subject_id
          AND status = 'completed';

    END IF;

    -- Calculate violation penalty
    SELECT COALESCE(SUM(score_penalty), 0) INTO v_violation_penalty
    FROM compliance_violations
    WHERE subject_type = p_subject_type
      AND subject_id = p_subject_id
      AND status IN ('open', 'investigating', 'resolved')
      AND created_at >= p_period_start
      AND created_at <= p_period_end;

    -- Calculate final score
    v_final_score := GREATEST(0, v_base_score - v_violation_penalty);

    -- Upsert scorecard
    INSERT INTO compliance_scorecards (
        subject_type, subject_id, period_start, period_end,
        overall_score, total_assignments, completed_assignments, on_time_assignments,
        violation_count
    ) VALUES (
        p_subject_type, p_subject_id, p_period_start, p_period_end,
        v_final_score, v_total_assignments, v_total_assignments, v_on_time,
        (SELECT COUNT(*) FROM compliance_violations
         WHERE subject_type = p_subject_type
           AND subject_id = p_subject_id
           AND status IN ('open', 'investigating', 'resolved')
           AND created_at >= p_period_start
           AND created_at <= p_period_end)
    )
    ON CONFLICT (subject_type, subject_id, period_start, period_end) DO UPDATE
    SET overall_score = EXCLUDED.overall_score,
        total_assignments = EXCLUDED.total_assignments,
        completed_assignments = EXCLUDED.completed_assignments,
        on_time_assignments = EXCLUDED.on_time_assignments,
        violation_count = EXCLUDED.violation_count,
        updated_at = now();

    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_compliance_score(VARCHAR(16), UUID, DATE, DATE)
    IS 'Calculates and stores compliance score for a driver/vendor/business';

-- ---------------------------------------------------------------------------
-- 4.7 Create Theft Prevention Record
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_theft_prevention_record(
    p_order_id      UUID,
    p_expected_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO theft_prevention_log (order_id, expected_items, status)
    VALUES (p_order_id, p_expected_items, 'pending')
    RETURNING id INTO v_record_id;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_theft_prevention_record(UUID, JSONB)
    IS 'Creates a theft prevention record tracking item chain-of-custody';

-- ---------------------------------------------------------------------------
-- 4.8 Verify Item Integrity (mark vendor/driver/customer confirmation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION verify_item_integrity(
    p_order_id           UUID,
    p_verified_by        UUID,
    p_role               VARCHAR(16),  -- 'vendor', 'driver', 'customer'
    p_items_confirmed    JSONB DEFAULT NULL,
    p_has_discrepancy    BOOLEAN DEFAULT false,
    p_discrepancy_notes  TEXT DEFAULT NULL,
    p_photo_url          TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
    v_record RECORD;
    v_all_confirmed BOOLEAN;
BEGIN
    SELECT * INTO v_record FROM theft_prevention_log WHERE order_id = p_order_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, 'No theft prevention record found for this order'::TEXT;
        RETURN;
    END IF;

    -- Update based on role
    IF p_role = 'vendor' THEN
        UPDATE theft_prevention_log
        SET vendor_confirmed = true,
            vendor_confirmed_at = now(),
            vendor_confirmed_by = p_verified_by,
            vendor_pack_photo_url = COALESCE(p_photo_url, vendor_pack_photo_url),
            actual_items = COALESCE(p_items_confirmed, actual_items),
            has_discrepancy = p_has_discrepancy,
            discrepancy_notes = CASE WHEN p_has_discrepancy THEN p_discrepancy_notes ELSE discrepancy_notes END
        WHERE id = v_record.id;
    ELSIF p_role = 'driver' THEN
        UPDATE theft_prevention_log
        SET driver_confirmed = true,
            driver_confirmed_at = now(),
            driver_confirmed_by = p_verified_by,
            driver_pickup_photo_url = COALESCE(p_photo_url, driver_pickup_photo_url),
            actual_items = COALESCE(p_items_confirmed, actual_items),
            has_discrepancy = p_has_discrepancy,
            discrepancy_notes = CASE WHEN p_has_discrepancy THEN p_discrepancy_notes ELSE discrepancy_notes END
        WHERE id = v_record.id;
    ELSIF p_role = 'customer' THEN
        UPDATE theft_prevention_log
        SET customer_confirmed = true,
            customer_confirmed_at = now(),
            customer_confirmed_by = p_verified_by,
            customer_delivery_photo_url = COALESCE(p_photo_url, customer_delivery_photo_url),
            has_discrepancy = p_has_discrepancy,
            discrepancy_notes = CASE WHEN p_has_discrepancy THEN p_discrepancy_notes ELSE discrepancy_notes END
        WHERE id = v_record.id;
    ELSE
        RETURN QUERY SELECT false::BOOLEAN, 'Invalid role'::TEXT;
        RETURN;
    END IF;

    -- Check if all three have confirmed
    SELECT
        vendor_confirmed AND driver_confirmed AND customer_confirmed INTO v_all_confirmed
    FROM theft_prevention_log WHERE id = v_record.id;

    IF v_all_confirmed THEN
        UPDATE theft_prevention_log
        SET status = CASE WHEN has_discrepancy THEN 'discrepancy_found' ELSE 'verified' END
        WHERE id = v_record.id;
    END IF;

    RETURN QUERY SELECT true::BOOLEAN, 'Item integrity verified for ' || p_role::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_item_integrity(UUID, UUID, VARCHAR(16), JSONB, BOOLEAN, TEXT, TEXT)
    IS 'Records item integrity confirmation from vendor, driver, or customer';

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER trg_pickup_orders_updated_at
    BEFORE UPDATE ON pickup_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_driver_safety_training_updated_at
    BEFORE UPDATE ON driver_safety_training
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_scorecards_updated_at
    BEFORE UPDATE ON compliance_scorecards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_violations_updated_at
    BEFORE UPDATE ON compliance_violations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_theft_prevention_log_updated_at
    BEFORE UPDATE ON theft_prevention_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_driver_safety_checklist_updated_at
    BEFORE UPDATE ON driver_safety_checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_compliance_tracker_updated_at
    BEFORE UPDATE ON delivery_compliance_tracker
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_driver_safety_zones_updated_at
    BEFORE UPDATE ON driver_safety_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate pickup code on insert
CREATE OR REPLACE FUNCTION trg_pickup_auto_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_code IS NULL THEN
        NEW.pickup_code := generate_pickup_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pickup_orders_auto_code
    BEFORE INSERT ON pickup_orders
    FOR EACH ROW EXECUTE FUNCTION trg_pickup_auto_code();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pickup_orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_safety_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_check_ins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_safety_training      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scorecards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE theft_prevention_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_safety_zones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_emergency_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_ratings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_compliance_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_safety_checklist     ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6.1 Pickup Orders
-- ---------------------------------------------------------------------------

CREATE POLICY pickup_orders_select ON pickup_orders
    FOR SELECT USING (
        customer_id = auth.uid()
        OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY pickup_orders_insert ON pickup_orders
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() OR is_admin()
    );

CREATE POLICY pickup_orders_update ON pickup_orders
    FOR UPDATE USING (
        customer_id = auth.uid()
        OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.2 Driver Safety Events
-- ---------------------------------------------------------------------------

CREATE POLICY driver_safety_events_select ON driver_safety_events
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_safety_events_insert ON driver_safety_events
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_safety_events_update ON driver_safety_events
    FOR UPDATE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.3 Driver Check-Ins
-- ---------------------------------------------------------------------------

CREATE POLICY driver_check_ins_select ON driver_check_ins
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_check_ins_insert ON driver_check_ins
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.4 Compliance Scorecards (readable by subject and admins)
-- ---------------------------------------------------------------------------

CREATE POLICY compliance_scorecards_select ON compliance_scorecards
    FOR SELECT USING (
        (subject_type = 'driver' AND subject_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()))
        OR (subject_type = 'business' AND subject_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.5 Compliance Violations
-- ---------------------------------------------------------------------------

CREATE POLICY compliance_violations_select ON compliance_violations
    FOR SELECT USING (
        (subject_type = 'driver' AND subject_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()))
        OR (subject_type = 'business'
            AND subject_id IN (SELECT b.id FROM businesses b JOIN business_staff bs ON bs.business_id = b.id WHERE bs.profile_id = auth.uid()))
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.6 Theft Prevention Log
-- ---------------------------------------------------------------------------

CREATE POLICY theft_prevention_select ON theft_prevention_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders o
                 WHERE o.id = theft_prevention_log.order_id
                   AND (o.customer_id = auth.uid()
                        OR o.business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())))
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.7 Safety Zones (anyone can read, only admins write)
-- ---------------------------------------------------------------------------

CREATE POLICY driver_safety_zones_select ON driver_safety_zones
    FOR SELECT USING (true);

CREATE POLICY driver_safety_zones_insert ON driver_safety_zones
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY driver_safety_zones_update ON driver_safety_zones
    FOR UPDATE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.8 Driver Emergency Contacts
-- ---------------------------------------------------------------------------

CREATE POLICY driver_emergency_contacts_select ON driver_emergency_contacts
    FOR SELECT USING (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY driver_emergency_contacts_insert ON driver_emergency_contacts
    FOR INSERT WITH CHECK (
        driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 6.9 Safety Ratings
-- ---------------------------------------------------------------------------

CREATE POLICY safety_ratings_select ON safety_ratings
    FOR SELECT USING (
        rated_by = auth.uid()
        OR rated_driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
        OR rated_customer_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY safety_ratings_insert ON safety_ratings
    FOR INSERT WITH CHECK (
        rated_by = auth.uid()
    );

-- ============================================================================
-- 7. REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE driver_safety_events;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_compliance_tracker;
