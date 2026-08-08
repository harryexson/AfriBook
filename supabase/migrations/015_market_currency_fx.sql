-- ============================================================================
-- AfriBook — Market, FX & Payment Capability Matrix
-- Supabase PostgreSQL migration adding the data layer required for
-- production multi-market operations:
--   1. fx_quotes                    — charge-time FX rate snapshots
--   2. payment_provider_capabilities — provider x country x method x currency
--   3. service_areas                 — market-level service coverage
--   4. ridely_find_nearby_drivers     — gains country scoping (p_country_code)
-- ============================================================================
-- Migration: 015_market_currency_fx
-- Depends:   001_initial_schema, 002_ridely_retrobuddy, 012_security_hardening
-- ============================================================================

-- 1. FX QUOTES ===============================================================

-- Immutable snapshot of a currency conversion used at charge/settlement time.
-- One row per (quote_ref, base, quote) so a single checkout can lock a rate.
CREATE TABLE fx_quotes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_ref         VARCHAR(64) NOT NULL,        -- e.g. checkout id / order id
    base_currency     VARCHAR(10) NOT NULL,        -- source currency
    quote_currency    VARCHAR(10) NOT NULL,        -- target currency
    rate              NUMERIC(18, 8) NOT NULL CHECK (rate > 0),
    inverse_rate      NUMERIC(18, 8),              -- quote -> base
    source            VARCHAR(32) DEFAULT 'config', -- 'config' | 'provider' | 'manual'
    provider_ref      VARCHAR(255),                -- upstream quote/trade id
    valid_until       TIMESTAMPTZ,
    created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (quote_ref, base_currency, quote_currency)
);

COMMENT ON TABLE fx_quotes IS 'Charge-time foreign-exchange quote snapshots for cross-currency settlement';
COMMENT ON COLUMN fx_quotes.quote_ref IS 'Business reference locking this quote (order, checkout, invoice id)';
COMMENT ON COLUMN fx_quotes.rate IS 'Units of quote_currency per 1 base_currency';

CREATE INDEX idx_fx_quotes_quote_ref ON fx_quotes(quote_ref);
CREATE INDEX idx_fx_quotes_pair ON fx_quotes(base_currency, quote_currency);
CREATE INDEX idx_fx_quotes_created_at ON fx_quotes(created_at);

-- 2. PAYMENT PROVIDER CAPABILITIES ===========================================

-- Declarative capability matrix: which provider can take which method in
-- which country, denominated in which currencies, at which fees.
-- Mirrors the static COUNTRY_PROVIDER_MAP / COUNTRY_METHODS_MAP but is
-- editable at runtime and is the source of truth for routing + display.
CREATE TABLE payment_provider_capabilities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_code       VARCHAR(64) NOT NULL REFERENCES payment_providers(code) ON DELETE CASCADE,
    country_code        VARCHAR(4) REFERENCES countries(code) ON DELETE CASCADE,
    method              VARCHAR(64) NOT NULL,     -- 'card' | 'mobile_money' | 'bank_transfer' | ...
    currency_codes      VARCHAR(10)[] NOT NULL DEFAULT '{}',
    processor_fee_percent NUMERIC(6, 4) DEFAULT 0,
    processor_fee_fixed NUMERIC(14, 4) DEFAULT 0,
    min_amount          NUMERIC(14, 2) DEFAULT 0,
    max_amount          NUMERIC(14, 2),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE (provider_code, country_code, method)
);

COMMENT ON TABLE payment_provider_capabilities IS 'Runtime capability matrix for payment routing and fee display';
COMMENT ON COLUMN payment_provider_capabilities.country_code IS 'NULL means the capability applies to every country';
COMMENT ON COLUMN payment_provider_capabilities.currency_codes IS 'ISO 4217 codes this provider/method accepts for the market';

CREATE INDEX idx_ppc_country ON payment_provider_capabilities(country_code);
CREATE INDEX idx_ppc_provider ON payment_provider_capabilities(provider_code);
CREATE INDEX idx_ppc_method ON payment_provider_capabilities(method);

CREATE TRIGGER trg_payment_provider_capabilities_updated_at
    BEFORE UPDATE ON payment_provider_capabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. SERVICE AREAS ===========================================================

-- A market-level service area. One row per city/region per country, listing
-- which verticals are enabled and which currencies the market accepts.
CREATE TABLE service_areas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code    VARCHAR(4) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,         -- city / region name, e.g. 'Lagos', 'Douala'
    region          VARCHAR(255),                  -- state / province / county
    -- GeoJSON polygon (or centroid point with radius) covering the area.
    boundary        JSONB NOT NULL,
    center_lat      DOUBLE PRECISION,
    center_lng      DOUBLE PRECISION,
    radius_km       DOUBLE PRECISION,
    currencies      VARCHAR(10)[] NOT NULL DEFAULT '{}',
    languages       VARCHAR(10)[] NOT NULL DEFAULT '{}',
    timezone        VARCHAR(64) NOT NULL,
    services        TEXT[] NOT NULL DEFAULT '{}',  -- enabled verticals, e.g. {'rides','delivery','events','marketplace'}
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE service_areas IS 'Geographic service areas with enabled verticals, currencies and timezone';
COMMENT ON COLUMN service_areas.boundary IS 'GeoJSON polygon of the service boundary (or GeoJSON point + radius_km)';

CREATE INDEX idx_service_areas_country ON service_areas(country_code);
CREATE INDEX idx_service_areas_active ON service_areas(country_code) WHERE is_active = true;
CREATE INDEX idx_service_areas_center ON service_areas(center_lat, center_lng);

CREATE TRIGGER trg_service_areas_updated_at
    BEFORE UPDATE ON service_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. COUNTRY-SCOPED DRIVER SEARCH ============================================

-- Extends ridely_find_nearby_drivers (created in 012) with an optional
-- country filter so a ride request in one market never matches a driver
-- registered in another.
CREATE OR REPLACE FUNCTION ridely_find_nearby_drivers(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 5.0,
    p_vehicle_type TEXT DEFAULT NULL,
    p_country_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    driver_id     UUID,
    user_id       UUID,
    name          TEXT,
    avatar_url    TEXT,
    vehicle_type  TEXT,
    vehicle_make  TEXT,
    vehicle_model TEXT,
    vehicle_color TEXT,
    rating        NUMERIC,
    total_trips   INT,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    distance_km   DOUBLE PRECISION
) AS $$
DECLARE
    v_uid       UUID;
    v_radius_km DOUBLE PRECISION;
BEGIN
    v_uid       := require_authenticated();
    v_radius_km := LEAST(GREATEST(p_radius_km, 0.5), 25.0);

    RETURN QUERY
    SELECT
        d.id                                      AS driver_id,
        p.id                                      AS user_id,
        p.full_name                               AS name,
        p.avatar_url                              AS avatar_url,
        v.type                                    AS vehicle_type,
        v.make                                    AS vehicle_make,
        v.model                                   AS vehicle_model,
        v.color                                   AS vehicle_color,
        d.rating                                  AS rating,
        d.total_trips                             AS total_trips,
        ST_Y(dl.location::geometry)               AS lat,
        ST_X(dl.location::geometry)               AS lng,
        ROUND(ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0, 2) AS distance_km
    FROM driver_locations dl
    JOIN drivers d ON d.id = dl.driver_id
    JOIN profiles p ON p.id = d.profile_id
    LEFT JOIN LATERAL (
        SELECT * FROM vehicles v
        WHERE v.driver_id = d.id AND v.is_active = true
        ORDER BY v.id LIMIT 1
    ) v ON true
    WHERE d.is_available = true
      AND d.status = 'online'
      AND dl.last_seen_at > now() - INTERVAL '5 minutes'
      AND (
          p_vehicle_type IS NULL
          OR v.type = p_vehicle_type
      )
      AND (
          p_country_code IS NULL
          OR UPPER(p_country_code) = UPPER(COALESCE(d.country_code, ''))
      )
      AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, v_radius_km * 1000)
    ORDER BY ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) ASC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- 5. ROW LEVEL SECURITY ======================================================

ALTER TABLE fx_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- FX quotes: everyone may read; only authenticated users may insert their own;
-- admins may manage. Quotes are immutable business records — no update/delete
-- for end users.
CREATE POLICY fx_quotes_select_all ON fx_quotes
    FOR SELECT USING (true);

CREATE POLICY fx_quotes_insert_own ON fx_quotes
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY fx_quotes_update_admin ON fx_quotes
    FOR UPDATE USING (is_admin());

CREATE POLICY fx_quotes_delete_admin ON fx_quotes
    FOR DELETE USING (is_admin());

-- Capability matrix: public read (drives checkout UI); admin-only writes.
CREATE POLICY ppc_select_all ON payment_provider_capabilities
    FOR SELECT USING (true);

CREATE POLICY ppc_insert_admin ON payment_provider_capabilities
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY ppc_update_admin ON payment_provider_capabilities
    FOR UPDATE USING (is_admin());

CREATE POLICY ppc_delete_admin ON payment_provider_capabilities
    FOR DELETE USING (is_admin());

-- Service areas: public read; admin-only writes.
CREATE POLICY service_areas_select_all ON service_areas
    FOR SELECT USING (true);

CREATE POLICY service_areas_insert_admin ON service_areas
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY service_areas_update_admin ON service_areas
    FOR UPDATE USING (is_admin());

CREATE POLICY service_areas_delete_admin ON service_areas
    FOR DELETE USING (is_admin());

-- 6. LAUNCH-MARKET CAPABILITY SEED ============================================
-- Mirrors the static COUNTRY_PROVIDER_MAP / COUNTRY_METHODS_MAP in
-- src/lib/payments/types.ts. Populated so the runtime table is usable from
-- day one; extend at runtime via the backoffice (admin-only writes).
-- Generated rows: 122
INSERT INTO payment_provider_capabilities (provider_code, country_code, method, currency_codes) VALUES
    ('paystack', 'NG', 'card', ARRAY['NGN']),
    ('paystack', 'NG', 'bank_transfer', ARRAY['NGN']),
    ('paystack', 'NG', 'ussd', ARRAY['NGN']),
    ('paystack', 'NG', 'mobile_money', ARRAY['NGN']),
    ('flutterwave', 'NG', 'card', ARRAY['NGN']),
    ('flutterwave', 'NG', 'bank_transfer', ARRAY['NGN']),
    ('flutterwave', 'NG', 'ussd', ARRAY['NGN']),
    ('flutterwave', 'NG', 'mobile_money', ARRAY['NGN']),
    ('pawapay', 'NG', 'card', ARRAY['NGN']),
    ('pawapay', 'NG', 'bank_transfer', ARRAY['NGN']),
    ('pawapay', 'NG', 'ussd', ARRAY['NGN']),
    ('pawapay', 'NG', 'mobile_money', ARRAY['NGN']),
    ('paystack', 'GH', 'card', ARRAY['GHS']),
    ('paystack', 'GH', 'bank_transfer', ARRAY['GHS']),
    ('paystack', 'GH', 'mobile_money', ARRAY['GHS']),
    ('flutterwave', 'GH', 'card', ARRAY['GHS']),
    ('flutterwave', 'GH', 'bank_transfer', ARRAY['GHS']),
    ('flutterwave', 'GH', 'mobile_money', ARRAY['GHS']),
    ('pawapay', 'GH', 'card', ARRAY['GHS']),
    ('pawapay', 'GH', 'bank_transfer', ARRAY['GHS']),
    ('pawapay', 'GH', 'mobile_money', ARRAY['GHS']),
    ('mpesa', 'KE', 'mpesa', ARRAY['KES']),
    ('mpesa', 'KE', 'card', ARRAY['KES']),
    ('pawapay', 'KE', 'mpesa', ARRAY['KES']),
    ('pawapay', 'KE', 'card', ARRAY['KES']),
    ('airwallex', 'KE', 'mpesa', ARRAY['KES']),
    ('airwallex', 'KE', 'card', ARRAY['KES']),
    ('mpesa', 'TZ', 'mpesa', ARRAY['TZS']),
    ('pawapay', 'TZ', 'mpesa', ARRAY['TZS']),
    ('mpesa', 'UG', 'mpesa', ARRAY['UGX']),
    ('mpesa', 'UG', 'airtel_money', ARRAY['UGX']),
    ('pawapay', 'UG', 'mpesa', ARRAY['UGX']),
    ('pawapay', 'UG', 'airtel_money', ARRAY['UGX']),
    ('paychangu', 'MW', 'mobile_money', ARRAY['MWK']),
    ('paychangu', 'MW', 'airtel_money', ARRAY['MWK']),
    ('paychangu', 'MW', 'mtn_mobile_money', ARRAY['MWK']),
    ('paychangu', 'MW', 'bank_transfer', ARRAY['MWK']),
    ('paychangu', 'MW', 'card', ARRAY['MWK']),
    ('pawapay', 'MW', 'mobile_money', ARRAY['MWK']),
    ('pawapay', 'MW', 'airtel_money', ARRAY['MWK']),
    ('pawapay', 'MW', 'mtn_mobile_money', ARRAY['MWK']),
    ('pawapay', 'MW', 'bank_transfer', ARRAY['MWK']),
    ('pawapay', 'MW', 'card', ARRAY['MWK']),
    ('flutterwave', 'ZA', 'card', ARRAY['ZAR']),
    ('flutterwave', 'ZA', 'bank_transfer', ARRAY['ZAR']),
    ('airwallex', 'ZA', 'card', ARRAY['ZAR']),
    ('airwallex', 'ZA', 'bank_transfer', ARRAY['ZAR']),
    ('pawapay', 'ZA', 'card', ARRAY['ZAR']),
    ('pawapay', 'ZA', 'bank_transfer', ARRAY['ZAR']),
    ('pawapay', 'ZM', 'mobile_money', ARRAY['ZMW']),
    ('airwallex', 'ZM', 'mobile_money', ARRAY['ZMW']),
    ('pawapay', 'RW', 'mobile_money', ARRAY['RWF']),
    ('airwallex', 'RW', 'mobile_money', ARRAY['RWF']),
    ('pawapay', 'SN', 'mobile_money', ARRAY['XOF']),
    ('pawapay', 'SN', 'card', ARRAY['XOF']),
    ('airwallex', 'SN', 'mobile_money', ARRAY['XOF']),
    ('airwallex', 'SN', 'card', ARRAY['XOF']),
    ('pawapay', 'CI', 'mobile_money', ARRAY['XOF']),
    ('pawapay', 'CI', 'card', ARRAY['XOF']),
    ('airwallex', 'CI', 'mobile_money', ARRAY['XOF']),
    ('airwallex', 'CI', 'card', ARRAY['XOF']),
    ('pawapay', 'CM', 'mobile_money', ARRAY['XAF']),
    ('pawapay', 'CM', 'card', ARRAY['XAF']),
    ('airwallex', 'CM', 'mobile_money', ARRAY['XAF']),
    ('airwallex', 'CM', 'card', ARRAY['XAF']),
    ('paychangu', 'EG', 'card', ARRAY['EGP']),
    ('paychangu', 'EG', 'fawry', ARRAY['EGP']),
    ('paychangu', 'EG', 'wallet', ARRAY['EGP']),
    ('airwallex', 'EG', 'card', ARRAY['EGP']),
    ('airwallex', 'EG', 'fawry', ARRAY['EGP']),
    ('airwallex', 'EG', 'wallet', ARRAY['EGP']),
    ('pawapay', 'EG', 'card', ARRAY['EGP']),
    ('pawapay', 'EG', 'fawry', ARRAY['EGP']),
    ('pawapay', 'EG', 'wallet', ARRAY['EGP']),
    ('stripe', 'US', 'card', ARRAY['USD']),
    ('stripe', 'US', 'bank_transfer', ARRAY['USD']),
    ('airwallex', 'US', 'card', ARRAY['USD']),
    ('airwallex', 'US', 'bank_transfer', ARRAY['USD']),
    ('adyen', 'US', 'card', ARRAY['USD']),
    ('adyen', 'US', 'bank_transfer', ARRAY['USD']),
    ('stripe', 'GB', 'card', ARRAY['GBP']),
    ('stripe', 'GB', 'bank_transfer', ARRAY['GBP']),
    ('airwallex', 'GB', 'card', ARRAY['GBP']),
    ('airwallex', 'GB', 'bank_transfer', ARRAY['GBP']),
    ('adyen', 'GB', 'card', ARRAY['GBP']),
    ('adyen', 'GB', 'bank_transfer', ARRAY['GBP']),
    ('stripe', 'FR', 'card', ARRAY['EUR']),
    ('stripe', 'FR', 'sepa', ARRAY['EUR']),
    ('airwallex', 'FR', 'card', ARRAY['EUR']),
    ('airwallex', 'FR', 'sepa', ARRAY['EUR']),
    ('adyen', 'FR', 'card', ARRAY['EUR']),
    ('adyen', 'FR', 'sepa', ARRAY['EUR']),
    ('stripe', 'DE', 'card', ARRAY['EUR']),
    ('stripe', 'DE', 'sepa', ARRAY['EUR']),
    ('airwallex', 'DE', 'card', ARRAY['EUR']),
    ('airwallex', 'DE', 'sepa', ARRAY['EUR']),
    ('adyen', 'DE', 'card', ARRAY['EUR']),
    ('adyen', 'DE', 'sepa', ARRAY['EUR']),
    ('stripe', 'AE', 'card', ARRAY['AED']),
    ('airwallex', 'AE', 'card', ARRAY['AED']),
    ('adyen', 'AE', 'card', ARRAY['AED']),
    ('razorpay', 'IN', 'card', ARRAY['INR']),
    ('razorpay', 'IN', 'upi', ARRAY['INR']),
    ('razorpay', 'IN', 'wallet', ARRAY['INR']),
    ('razorpay', 'IN', 'net_banking', ARRAY['INR']),
    ('airwallex', 'IN', 'card', ARRAY['INR']),
    ('airwallex', 'IN', 'upi', ARRAY['INR']),
    ('airwallex', 'IN', 'wallet', ARRAY['INR']),
    ('airwallex', 'IN', 'net_banking', ARRAY['INR']),
    ('stripe', 'IN', 'card', ARRAY['INR']),
    ('stripe', 'IN', 'upi', ARRAY['INR']),
    ('stripe', 'IN', 'wallet', ARRAY['INR']),
    ('stripe', 'IN', 'net_banking', ARRAY['INR']),
    ('dlocal', 'BR', 'card', ARRAY['BRL']),
    ('dlocal', 'BR', 'bank_transfer', ARRAY['BRL']),
    ('dlocal', 'BR', 'cash', ARRAY['BRL']),
    ('adyen', 'BR', 'card', ARRAY['BRL']),
    ('adyen', 'BR', 'bank_transfer', ARRAY['BRL']),
    ('adyen', 'BR', 'cash', ARRAY['BRL']),
    ('airwallex', 'BR', 'card', ARRAY['BRL']),
    ('airwallex', 'BR', 'bank_transfer', ARRAY['BRL']),
    ('airwallex', 'BR', 'cash', ARRAY['BRL'])
ON CONFLICT (provider_code, country_code, method) DO NOTHING;
