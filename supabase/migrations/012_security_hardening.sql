-- ============================================================================
-- AfriBook — Security Hardening & Schema Reconciliation — Migration 012
-- ============================================================================
-- Addresses the findings in docs/audits/AFRIBOOK_PRODUCTION_AUDIT.md,
-- FINANCIAL_INVARIANTS.md, and INTEGRATION_MATRIX.md. This migration merges
-- the security-hardening and schema-reconciliation work into a single
-- idempotent, additive migration:
--
--   1. Reconciles the app-expected `users` table with the real `profiles`
--      table by exposing a read-compatible auto-updatable VIEW (`users`),
--      and adds app-expected columns to `drivers` + `countries`.
--   2. Adds internal guard helpers (`is_service_role`, `require_authenticated`,
--      `require_service_or_admin`, `is_admin`, `is_admin_with_role`,
--      `is_business_owner`, `auth_driver_id`).
--   3. Prevents non-admin users from escalating their own `role`,
--      `kyc_status`, or `is_verified` (closes the RLS self-escalation) and
--      coerces self-INSERTs to safe defaults.
--   4. Introduces a double-entry ledger (`ledger_accounts` / `ledger_entries`)
--      with an internal posting function wired into `handle_payment_succeeded`.
--   5. Hardens every public SECURITY DEFINER function with caller
--      authorization + a fixed `search_path`; removes server-only money /
--      state functions from the /rpc surface (handle_payment_succeeded,
--      record_driver_earning, award_loyalty_points).
--   6. Fixes the record_safety_event FK bug (drivers.id was written into
--      notifications.user_id, which references profiles.id).
--   7. Adds the missing `ridely_find_nearby_drivers`, `ridely_dispatch`, and
--      `ridely_dispatch_delivery` RPCs the API routes already call, plus
--      `verify_pickup_code` / compliance / theft-prevention guards.
--   8. Revokes EXECUTE on money-movement / sensitive functions from PUBLIC
--      and `anon`; revokes column-level UPDATE on money columns.
--   9. Narrows the `webhook_events` INSERT policy to internal roles only.
--  10. Enables RLS on the content-moderation tables (007).
--  11. Drops forgeable INSERT policies on history / audit tables and extends
--      payment_transactions / escrow_holds / refunds SELECT coverage to
--      ridely_ride_id / delivery_id references.
--  12. Validates driver_payouts inserts (pending-only, consistent net amount,
--      balance check) for non-internal actors.
--  13. Reconciles the ridely schema with the API routes (lat/lng columns,
--      GEOGRAPHY-populating triggers, nullable GEOGRAPHY columns, ride_type
--      enum additions).
--
-- Prerequisite: a repaired migration chain (001-011), including the fixes for
-- migration 006 (duplicate payout_status removed; updated_at columns added).
-- This file is additive and safe to apply after 006 is repaired.
--
-- The webhook-route code change that switches webhook routes to a service-role
-- client MUST ship in the same release as items 5, 9 and 11.
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA RECONCILIATION
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 `users` view (app / seed expectation vs. real `profiles` table)
-- ---------------------------------------------------------------------------
-- The application (hooks/useAuth.ts, api/order, api/booking, proxy.ts, etc.)
-- reads from a `users` table that never existed in migrations (only in
-- seed.sql). Expose `profiles` through an auto-updatable view so existing
-- SELECT / UPDATE-by-uid code keeps working while RLS on `profiles` still
-- applies. `role`, `kyc_status`, and `is_verified` are single-source columns
-- on `profiles`; the view only aliases them.
CREATE OR REPLACE VIEW users AS
SELECT
    p.id,
    p.email,
    p.role::TEXT        AS role,
    p.full_name         AS name,
    p.phone,
    p.avatar_url,
    p.country_code,
    p.preferred_language AS language_code,
    p.is_verified       AS email_verified,
    p.kyc_status::TEXT  AS kyc_status,
    p.metadata,
    p.created_at,
    p.updated_at
FROM profiles p;

COMMENT ON VIEW users IS 'Compatibility view over profiles for app code that referenced a users table. Writes that mutate role/kyc_status/is_verified are blocked for non-admins by trg_profiles_protect_privileged_columns.';

-- ---------------------------------------------------------------------------
-- 1.2 `drivers` app-expected columns
-- ---------------------------------------------------------------------------
ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS vehicle_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS payout_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(4),
    ADD COLUMN IF NOT EXISTS total_trips INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- `pending_review` status for driver applications awaiting approval.
-- (PG 12+ allows ALTER TYPE inside a migration; the new value is only used
-- by the application after this migration is applied.)
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'pending_review';

-- ---------------------------------------------------------------------------
-- 1.3 `countries` column used by seed.sql / app
-- ---------------------------------------------------------------------------
ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS language VARCHAR(10);

-- ============================================================================
-- 2. GUARD HELPERS
-- ============================================================================

-- True when the current session role is a trusted internal role (service key
-- or database superuser). Safe to call from RLS policies: it reflects the
-- role of the querying user.
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('role', true) IN (
        'service_role', 'postgres', 'supabase_admin', 'authenticator', 'dashboard_user'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Returns the caller's auth.uid() or NULL for internal roles. Raises for
-- unauthenticated (anon) callers.
CREATE OR REPLACE FUNCTION require_authenticated()
RETURNS UUID AS $$
DECLARE
    v_uid UUID;
BEGIN
    IF is_service_role() THEN
        RETURN NULL;
    END IF;

    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    RETURN v_uid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Raises unless the caller is an internal role or a platform admin.
CREATE OR REPLACE FUNCTION require_service_or_admin()
RETURNS VOID AS $$
BEGIN
    IF is_service_role() OR is_admin() THEN
        RETURN;
    END IF;
    RAISE EXCEPTION 'Not authorized';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Hardened admin helpers (fixed search_path so they cannot be hijacked via
-- a malicious search_path).
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users au
        JOIN profiles p ON p.id = au.profile_id
        WHERE p.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_admin_with_role(required_role admin_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users au
        JOIN profiles p ON p.id = au.profile_id
        WHERE p.id = auth.uid() AND au.role = required_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_business_owner(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = business_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Returns the drivers.id of the current user, or NULL if they are not a driver.
CREATE OR REPLACE FUNCTION auth_driver_id()
RETURNS UUID AS $$
    SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION is_admin_with_role(admin_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION is_business_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_admin_with_role(admin_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_business_owner(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_service_role() TO authenticated, anon;

-- ============================================================================
-- 3. PRIVILEGE-COLUMN ESCALATION GUARD
-- ============================================================================
-- `profiles_update_own` (001) allows a user to UPDATE their own row without a
-- column allow-list, and the self-INSERT policy allows creating a row with
-- privileged values. This BEFORE INSERT OR UPDATE trigger coerces INSERTs to
-- safe defaults and rejects changes to `role`, `kyc_status`, and
-- `is_verified` unless the caller is an internal role or an admin.
CREATE OR REPLACE FUNCTION trg_profiles_protect_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF is_service_role() OR is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.role       := 'customer';
        NEW.kyc_status := 'not_submitted';
        NEW.is_verified := false;
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Cannot change role directly';
    END IF;

    IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
        RAISE EXCEPTION 'Cannot change kyc_status directly';
    END IF;

    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'Cannot change is_verified directly';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_profiles_protect_privileged_columns ON profiles;
CREATE TRIGGER trg_profiles_protect_privileged_columns
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trg_profiles_protect_privileged_columns();

-- ============================================================================
-- 4. DOUBLE-ENTRY LEDGER
-- ============================================================================
-- Single source of truth for money movement. Client roles get no INSERT /
-- UPDATE policies, so only internal roles (or the SECURITY DEFINER posting
-- function) can write; reads are admin-only.

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    kind         TEXT NOT NULL CHECK (kind IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'contra')),
    currency     VARCHAR(10) NOT NULL DEFAULT 'USD',
    metadata     JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date             TIMESTAMPTZ NOT NULL DEFAULT now(),
    debit_id               UUID NOT NULL REFERENCES ledger_accounts(id),
    credit_id              UUID NOT NULL REFERENCES ledger_accounts(id),
    amount                 NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency               VARCHAR(10) NOT NULL,
    reference_type         VARCHAR(64),
    reference_id           UUID,
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    memo                   TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_debit ON ledger_entries(debit_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_credit ON ledger_entries(credit_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tx ON ledger_entries(payment_transaction_id);

COMMENT ON TABLE ledger_entries IS 'Immutable double-entry journal. Every money movement debits one account and credits another atomically.';

-- Posting function (internal/admin only). Accounts are created on demand.
CREATE OR REPLACE FUNCTION post_ledger_entry(
    p_debit_code  TEXT,
    p_credit_code TEXT,
    p_amount      NUMERIC(14, 2),
    p_currency    VARCHAR(10),
    p_reference_type   TEXT DEFAULT NULL,
    p_reference_id     UUID DEFAULT NULL,
    p_payment_transaction_id UUID DEFAULT NULL,
    p_memo        TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_debit_id  UUID;
    v_credit_id UUID;
    v_entry_id  UUID;
BEGIN
    PERFORM require_service_or_admin();

    SELECT id INTO v_debit_id FROM ledger_accounts WHERE account_code = p_debit_code;
    IF v_debit_id IS NULL THEN
        INSERT INTO ledger_accounts (account_code, name, kind, currency)
        VALUES (p_debit_code, p_debit_code, 'contra', p_currency)
        ON CONFLICT (account_code) DO NOTHING;
        SELECT id INTO v_debit_id FROM ledger_accounts WHERE account_code = p_debit_code;
    END IF;

    SELECT id INTO v_credit_id FROM ledger_accounts WHERE account_code = p_credit_code;
    IF v_credit_id IS NULL THEN
        INSERT INTO ledger_accounts (account_code, name, kind, currency)
        VALUES (p_credit_code, p_credit_code, 'liability', p_currency)
        ON CONFLICT (account_code) DO NOTHING;
        SELECT id INTO v_credit_id FROM ledger_accounts WHERE account_code = p_credit_code;
    END IF;

    INSERT INTO ledger_entries (
        debit_id, credit_id, amount, currency,
        reference_type, reference_id, payment_transaction_id, memo
    ) VALUES (
        v_debit_id, v_credit_id, p_amount, p_currency,
        p_reference_type, p_reference_id, p_payment_transaction_id, p_memo
    ) RETURNING id INTO v_entry_id;

    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION post_ledger_entry(TEXT, TEXT, NUMERIC, VARCHAR, TEXT, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION post_ledger_entry(TEXT, TEXT, NUMERIC, VARCHAR, TEXT, UUID, UUID, TEXT) TO service_role;

-- Ledger balances view (debit total - credit total per account).
CREATE OR REPLACE VIEW ledger_balances AS
SELECT
    a.id            AS account_id,
    a.account_code,
    a.name,
    a.kind,
    a.currency,
    COALESCE((SELECT SUM(e.amount) FROM ledger_entries e WHERE e.debit_id = a.id), 0)
        AS debit_total,
    COALESCE((SELECT SUM(e.amount) FROM ledger_entries e WHERE e.credit_id = a.id), 0)
        AS credit_total,
    COALESCE((SELECT SUM(e.amount) FROM ledger_entries e WHERE e.debit_id = a.id), 0)
        - COALESCE((SELECT SUM(e.amount) FROM ledger_entries e WHERE e.credit_id = a.id), 0)
        AS balance
FROM ledger_accounts a;

ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_accounts_admin_select ON ledger_accounts
    FOR SELECT USING (is_admin());
CREATE POLICY ledger_entries_admin_select ON ledger_entries
    FOR SELECT USING (is_admin());

-- ============================================================================
-- 5. HARDENED SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Server-only money / state functions (removed from the /rpc surface)
-- ---------------------------------------------------------------------------

-- handle_payment_succeeded (010) — internal/admin only; credits the vendor
-- wallet and posts the credit to the double-entry ledger.
CREATE OR REPLACE FUNCTION handle_payment_succeeded(p_transaction_id UUID)
RETURNS VOID AS $$
DECLARE
    v_tx            payment_transactions%ROWTYPE;
    v_business_id   UUID;
    v_vendor_id     UUID;
    v_wallet_id     UUID;
BEGIN
    PERFORM require_service_or_admin();

    SELECT * INTO v_tx FROM payment_transactions WHERE id = p_transaction_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Only credit once per transaction.
    IF v_tx.status = 'succeeded' THEN
        RETURN;
    END IF;

    -- Mark the transaction succeeded first (before crediting so a wallet
    -- failure cannot leave the record permanently in a pending state).
    UPDATE payment_transactions
    SET status = 'succeeded', updated_at = now()
    WHERE id = p_transaction_id;

    -- Resolve the business from the linked order or booking.
    IF v_tx.order_id IS NOT NULL THEN
        SELECT business_id INTO v_business_id FROM orders WHERE id = v_tx.order_id;
    ELSIF v_tx.booking_id IS NOT NULL THEN
        SELECT business_id INTO v_business_id FROM bookings WHERE id = v_tx.booking_id;
    END IF;

    IF v_business_id IS NULL THEN
        RETURN;
    END IF;

    -- Resolve the vendor (business owner).
    SELECT owner_id INTO v_vendor_id FROM businesses WHERE id = v_business_id;
    IF v_vendor_id IS NULL THEN
        RETURN;
    END IF;

    -- Upsert the wallet row if it does not exist yet.
    SELECT id INTO v_wallet_id
    FROM vendor_wallets
    WHERE vendor_id = v_vendor_id AND business_id = v_business_id;

    IF v_wallet_id IS NULL THEN
        INSERT INTO vendor_wallets (vendor_id, business_id, balance, currency, available_balance)
        VALUES (v_vendor_id, v_business_id, 0, v_tx.currency, 0)
        RETURNING id INTO v_wallet_id;
    END IF;

    UPDATE vendor_wallets
    SET
        balance           = balance + COALESCE(v_tx.net_amount, v_tx.amount),
        available_balance = available_balance + COALESCE(v_tx.net_amount, v_tx.amount),
        updated_at        = now()
    WHERE id = v_wallet_id;

    -- Double-entry ledger: debit customer clearing, credit vendor wallet.
    PERFORM post_ledger_entry(
        'customer-clearing',
        'vendor-wallet:' || v_vendor_id::TEXT || ':' || v_business_id::TEXT,
        COALESCE(v_tx.net_amount, v_tx.amount),
        v_tx.currency,
        'payment_succeeded',
        p_transaction_id,
        p_transaction_id,
        'Vendor wallet credit for payment transaction ' || p_transaction_id::TEXT
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- record_driver_earning (006) — internal/admin only
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
    PERFORM require_service_or_admin();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- award_loyalty_points (006) — internal/admin only
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
    PERFORM require_service_or_admin();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.2 find_nearby_drivers (002) — authenticated only, radius/limit clamped
-- ---------------------------------------------------------------------------
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
DECLARE
    v_uid     UUID;
    v_radius  DOUBLE PRECISION;
    v_limit   INT;
BEGIN
    v_uid    := require_authenticated();
    v_radius := LEAST(GREATEST(p_radius_m, 100), 20000);
    v_limit  := LEAST(GREATEST(p_limit, 1), 50);

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
          v_radius
      )
      AND dl.last_seen_at >= now() - INTERVAL '30 seconds'
    ORDER BY dl.location <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.3 find_nearby_drivers_h3 (006) — authenticated only, radius/limit clamped;
--     repairs the 006 bugs (drivers.status uses 'online', vehicle filter via
--     the vehicles table).
-- ---------------------------------------------------------------------------
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
    v_uid       UUID;
    v_radius_km DOUBLE PRECISION;
BEGIN
    v_uid       := require_authenticated();
    v_radius_km := LEAST(GREATEST(p_radius_km, 0.1), 25.0);

    RETURN QUERY
    SELECT
        dl.driver_id,
        ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography) / 1000.0 AS distance_km,
        dl.heading,
        dl.speed,
        dl.accuracy,
        dl.last_seen_at
    FROM driver_locations dl
    JOIN drivers d ON d.id = dl.driver_id
    WHERE dl.last_seen_at > now() - INTERVAL '5 minutes'
      AND d.status = 'online'
      AND d.is_available = true
      AND (
          p_vehicle_type IS NULL
          OR EXISTS (
              SELECT 1 FROM vehicles v
              WHERE v.driver_id = dl.driver_id
                AND v.is_active = true
                AND v.type = p_vehicle_type
          )
      )
      AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography, v_radius_km * 1000)
    ORDER BY dl.last_seen_at DESC, ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography) ASC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.4 get_surge_multiplier (002) — authenticated only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_surge_multiplier(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS NUMERIC AS $$
DECLARE
    v_uid         UUID;
    v_multiplier  NUMERIC := 1.0;
    v_zone        RECORD;
BEGIN
    v_uid := require_authenticated();

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.5 transition_ride_status (002) — caller must be rider, driver, or admin
-- ---------------------------------------------------------------------------
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
    v_uid        UUID;
    v_old_status ridely_ride_status;
    v_rider_id   UUID;
    v_driver_id  UUID;
    v_location   GEOGRAPHY;
BEGIN
    v_uid := require_authenticated();

    SELECT status, rider_id, driver_id INTO v_old_status, v_rider_id, v_driver_id
    FROM ridely_rides WHERE id = p_ride_id;
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Ride % not found', p_ride_id;
    END IF;

    IF v_uid IS NOT NULL AND NOT (
        v_rider_id = v_uid
        OR v_driver_id IN (SELECT id FROM drivers WHERE profile_id = v_uid)
        OR is_admin()
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    INSERT INTO ride_status_history (ride_id, previous_status, new_status, changed_by, location, metadata)
    VALUES (p_ride_id, v_old_status, p_new_status, p_changed_by, v_location, p_metadata);

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.6 transition_delivery_status (002) — caller must be customer, driver, admin
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
    v_uid          UUID;
    v_old_status   ridely_delivery_status;
    v_customer_id  UUID;
    v_driver_id    UUID;
    v_location     GEOGRAPHY;
BEGIN
    v_uid := require_authenticated();

    SELECT status, customer_id, driver_id INTO v_old_status, v_customer_id, v_driver_id
    FROM ridely_deliveries WHERE id = p_delivery_id;
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Delivery % not found', p_delivery_id;
    END IF;

    IF v_uid IS NOT NULL AND NOT (
        v_customer_id = v_uid
        OR v_driver_id IN (SELECT id FROM drivers WHERE profile_id = v_uid)
        OR is_admin()
    ) THEN
        RAISE EXCEPTION 'Not authorized';
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.7 update_driver_location (002) — caller must be the driver (or admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_driver_location(
    p_driver_id  UUID,
    p_lat        DOUBLE PRECISION,
    p_lng        DOUBLE PRECISION,
    p_heading    NUMERIC DEFAULT 0,
    p_speed      NUMERIC DEFAULT 0,
    p_accuracy   NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := require_authenticated();

    IF v_uid IS NOT NULL AND NOT (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id AND profile_id = v_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.8 start/end driver session (006) — caller must be the driver (or admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION start_driver_session(
    p_driver_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_uid        UUID;
    v_session_id UUID;
BEGIN
    v_uid := require_authenticated();

    IF v_uid IS NOT NULL AND NOT (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id AND profile_id = v_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    INSERT INTO driver_online_sessions (driver_id)
    VALUES (p_driver_id)
    RETURNING id INTO v_session_id;

    UPDATE drivers SET status = 'online', is_available = true WHERE id = p_driver_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION end_driver_session(
    p_driver_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := require_authenticated();

    IF v_uid IS NOT NULL AND NOT (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id AND profile_id = v_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE driver_online_sessions
    SET ended_at = now()
    WHERE driver_id = p_driver_id
      AND ended_at IS NULL;

    UPDATE drivers SET status = 'offline', is_available = false WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.9 record_safety_event (004) — caller must be the driver (or admin);
--      FIXES FK bug where drivers.id was written into notifications.user_id
--      (FK -> profiles.id), causing a runtime failure on SOS.
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
    v_event_id  UUID;
    v_uid       UUID;
    v_profile_id UUID;
    v_emergency_contacts RECORD;
BEGIN
    v_uid := require_authenticated();

    IF v_uid IS NOT NULL AND NOT (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id AND profile_id = v_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT profile_id INTO v_profile_id FROM drivers WHERE id = p_driver_id;

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
        FOR v_emergency_contacts IN
            SELECT dec.name, dec.phone
            FROM driver_emergency_contacts dec
            WHERE dec.driver_id = p_driver_id AND dec.notify_on_sos = true
        LOOP
            INSERT INTO notifications (user_id, type, title, body, data)
            VALUES (
                v_profile_id,
                'system',
                'SAFETY ALERT: ' || p_event_type,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.10 get_driver_stats_batch (006) — authenticated only (client dispatch
--      UI fetches stats for nearby drivers).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_driver_stats_batch(
    p_driver_ids UUID[]
)
RETURNS TABLE (
    p_driver_id       UUID,
    p_acceptance_rate INT,
    p_hours_this_week NUMERIC,
    p_total_rides     INT
) AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := require_authenticated();

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.11 verify_pickup_code (004) — authentication + courier/admin check
--      (prevents anonymous brute force of 8-character pickup codes).
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
    v_uid     UUID;
    v_pickup  RECORD;
BEGIN
    v_uid := require_authenticated();
    IF v_uid IS NOT NULL AND NOT (is_admin() OR auth_driver_id() IS NOT NULL) THEN
        RAISE EXCEPTION 'Forbidden: couriers and admins only';
    END IF;

    SELECT * INTO v_pickup
    FROM pickup_orders
    WHERE order_id = p_order_id AND status = 'ready_for_pickup'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Pickup order not found or not ready for collection'::TEXT;
        RETURN;
    END IF;

    IF v_pickup.pickup_code != p_code THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Invalid pickup code'::TEXT;
        RETURN;
    END IF;

    UPDATE pickup_orders
    SET status = 'picked_up',
        picked_up_at = now(),
        collected_by = p_collector_id,
        collected_by_name = p_collector_name,
        updated_at = now()
    WHERE id = v_pickup.id;

    UPDATE orders
    SET status = 'delivered',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    RETURN QUERY SELECT true::BOOLEAN, 'Pickup verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.12 create_delivery_compliance_record (004) — courier/admin only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_delivery_compliance_record(
    p_order_id     UUID,
    p_delivery_id  UUID,
    p_estimated_delivery_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    v_uid       UUID;
    v_tracker_id UUID;
BEGIN
    v_uid := require_authenticated();
    IF v_uid IS NOT NULL AND NOT (is_admin() OR auth_driver_id() IS NOT NULL) THEN
        RAISE EXCEPTION 'Forbidden: couriers and admins only';
    END IF;

    INSERT INTO delivery_compliance_tracker (
        order_id, delivery_id, assigned_at, estimated_delivery_at, status
    ) VALUES (
        p_order_id, p_delivery_id, now(), p_estimated_delivery_at, 'pending'
    )
    RETURNING id INTO v_tracker_id;

    RETURN v_tracker_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.13 create_theft_prevention_record (004) — courier/admin only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_theft_prevention_record(
    p_order_id      UUID,
    p_expected_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_uid       UUID;
    v_record_id UUID;
BEGIN
    v_uid := require_authenticated();
    IF v_uid IS NOT NULL AND NOT (is_admin() OR auth_driver_id() IS NOT NULL) THEN
        RAISE EXCEPTION 'Forbidden: couriers and admins only';
    END IF;

    INSERT INTO theft_prevention_log (order_id, expected_items, status)
    VALUES (p_order_id, p_expected_items, 'pending')
    RETURNING id INTO v_record_id;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 5.14 verify_item_integrity (004) — the verified-by actor must be the caller
--      (prevents a driver from forging a vendor/customer confirmation).
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
    v_uid            UUID;
    v_record         RECORD;
    v_all_confirmed  BOOLEAN;
BEGIN
    v_uid := require_authenticated();
    IF v_uid IS NOT NULL AND NOT (p_verified_by = v_uid OR is_admin()) THEN
        RAISE EXCEPTION 'Forbidden: you may only confirm on your own behalf';
    END IF;

    SELECT * INTO v_record FROM theft_prevention_log WHERE order_id = p_order_id;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, 'No theft prevention record found for this order'::TEXT;
        RETURN;
    END IF;

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
            actual_items = COALESCE(p_items_confirmed, actual_items),
            has_discrepancy = p_has_discrepancy,
            discrepancy_notes = CASE WHEN p_has_discrepancy THEN p_discrepancy_notes ELSE discrepancy_notes END
        WHERE id = v_record.id;
    ELSE
        RETURN QUERY SELECT false::BOOLEAN, 'Invalid role'::TEXT;
        RETURN;
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================================
-- 6. MISSING DISPATCH RPCs
-- ============================================================================
-- The API routes already call `ridely_find_nearby_drivers`, `ridely_dispatch`,
-- and `ridely_dispatch_delivery` — none existed in any migration. These are
-- the DB-side implementations (ownership-guarded, service/admin-only).

-- ---------------------------------------------------------------------------
-- 6.1 ridely_find_nearby_drivers — authenticated-only candidate search that
--     joins profile + vehicle details for the dispatch UI.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ridely_find_nearby_drivers(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION DEFAULT 5.0,
    p_vehicle_type TEXT DEFAULT NULL
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
      AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, v_radius_km * 1000)
    ORDER BY ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) ASC
    LIMIT 30;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 6.2 ridely_dispatch — assigns the best nearby driver to a ride.
--     Caller must be the ride's rider (or admin/internal).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ridely_dispatch(
    p_ride_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_uid       UUID;
    v_rider_id  UUID;
    v_status    TEXT;
    v_candidate RECORD;
BEGIN
    v_uid := require_authenticated();

    SELECT rider_id, status::TEXT INTO v_rider_id, v_status
    FROM ridely_rides WHERE id = p_ride_id;
    IF v_rider_id IS NULL THEN
        RAISE EXCEPTION 'Ride % not found', p_ride_id;
    END IF;

    IF v_uid IS NOT NULL AND NOT (v_rider_id = v_uid OR is_admin()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_status NOT IN ('requesting', 'searching') THEN
        RETURN;
    END IF;

    UPDATE ridely_rides SET status = 'searching', updated_at = now() WHERE id = p_ride_id;

    SELECT * INTO v_candidate
    FROM ridely_find_nearby_drivers(
        (SELECT pickup_lat FROM ridely_rides WHERE id = p_ride_id),
        (SELECT pickup_lng FROM ridely_rides WHERE id = p_ride_id),
        5.0,
        (SELECT ride_type FROM ridely_rides WHERE id = p_ride_id)
    )
    ORDER BY distance_km ASC
    LIMIT 1;

    IF v_candidate.driver_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE ridely_rides
    SET driver_id = v_candidate.driver_id,
        status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    WHERE id = p_ride_id;

    UPDATE drivers
    SET status = 'on_trip',
        current_trip_id = p_ride_id,
        updated_at = now()
    WHERE id = v_candidate.driver_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_rider_id,
        'system',
        'Driver Found!',
        COALESCE(v_candidate.name, 'Your driver') || ' has been assigned to your ride.',
        jsonb_build_object('ride_id', p_ride_id, 'driver_id', v_candidate.driver_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 6.3 ridely_dispatch_delivery — assigns the best nearby driver to a delivery.
--     `p_table` must be one of the supported ridely delivery tables.
--     Caller must be the delivery's customer (or admin/internal).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ridely_dispatch_delivery(
    p_delivery_id UUID,
    p_table TEXT DEFAULT 'ridely_deliveries'
)
RETURNS VOID AS $$
DECLARE
    v_uid         UUID;
    v_customer_id UUID;
    v_status      TEXT;
    v_pickup_lat  DOUBLE PRECISION;
    v_pickup_lng  DOUBLE PRECISION;
    v_type        TEXT;
    v_candidate   RECORD;
BEGIN
    v_uid := require_authenticated();

    IF p_table NOT IN ('ridely_deliveries', 'ridely_food_deliveries') THEN
        RAISE EXCEPTION 'Unsupported delivery table';
    END IF;

    IF p_table = 'ridely_deliveries' THEN
        SELECT customer_id, status::TEXT, pickup_lat, pickup_lng, delivery_type
        INTO v_customer_id, v_status, v_pickup_lat, v_pickup_lng, v_type
        FROM ridely_deliveries WHERE id = p_delivery_id;
    ELSE
        SELECT customer_id, status::TEXT, pickup_lat, pickup_lng, delivery_type
        INTO v_customer_id, v_status, v_pickup_lat, v_pickup_lng, v_type
        FROM ridely_food_deliveries WHERE id = p_delivery_id;
    END IF;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Delivery % not found', p_delivery_id;
    END IF;

    IF v_uid IS NOT NULL AND NOT (v_customer_id = v_uid OR is_admin()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_status NOT IN ('requesting', 'searching') THEN
        RETURN;
    END IF;

    SELECT * INTO v_candidate
    FROM ridely_find_nearby_drivers(v_pickup_lat, v_pickup_lng, 10.0, NULL)
    ORDER BY distance_km ASC
    LIMIT 1;

    IF v_candidate.driver_id IS NULL THEN
        RETURN;
    END IF;

    IF p_table = 'ridely_deliveries' THEN
        UPDATE ridely_deliveries
        SET driver_id = v_candidate.driver_id,
            status = 'accepted',
            accepted_at = now(),
            updated_at = now()
        WHERE id = p_delivery_id;
    ELSE
        UPDATE ridely_food_deliveries
        SET driver_id = v_candidate.driver_id,
            status = 'accepted',
            accepted_at = now(),
            updated_at = now()
        WHERE id = p_delivery_id;
    END IF;

    UPDATE drivers
    SET status = 'on_trip',
        current_trip_id = p_delivery_id,
        updated_at = now()
    WHERE id = v_candidate.driver_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_customer_id,
        'system',
        'Driver Found!',
        COALESCE(v_candidate.name, 'Your driver') || ' has been assigned to your delivery.',
        jsonb_build_object('delivery_id', p_delivery_id, 'driver_id', v_candidate.driver_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- ============================================================================
-- 7. REVOKE EXECUTE FROM PUBLIC / anon ON SENSITIVE FUNCTIONS
-- ============================================================================

-- Money movement & internal settlement (server-only; off the /rpc surface)
REVOKE ALL ON FUNCTION handle_payment_succeeded(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION record_driver_earning(UUID, UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION award_loyalty_points(UUID, INT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_payment_succeeded(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION record_driver_earning(UUID, UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION award_loyalty_points(UUID, INT, TEXT, UUID) TO service_role;

-- Dispatch RPCs: only authenticated callers via API routes
REVOKE ALL ON FUNCTION ridely_dispatch(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION ridely_dispatch_delivery(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION ridely_find_nearby_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION find_nearby_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION find_nearby_drivers_h3(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_surge_multiplier(DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_driver_stats_batch(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION ridely_dispatch(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION ridely_dispatch_delivery(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION ridely_find_nearby_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION find_nearby_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION find_nearby_drivers_h3(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_surge_multiplier(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_driver_stats_batch(UUID[]) TO authenticated, service_role;

-- State transitions & driver telemetry: authenticated callers (guards inside)
REVOKE ALL ON FUNCTION transition_ride_status(UUID, ridely_ride_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION transition_delivery_status(UUID, ridely_delivery_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION update_driver_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION start_driver_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION end_driver_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION record_safety_event(UUID, safety_event_type, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, VARCHAR(16), UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transition_ride_status(UUID, ridely_ride_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION transition_delivery_status(UUID, ridely_delivery_status, UUID, DOUBLE PRECISION, DOUBLE PRECISION, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_driver_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION start_driver_session(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION end_driver_session(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_safety_event(UUID, safety_event_type, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, VARCHAR(16), UUID, UUID) TO authenticated, service_role;

-- Pickup / compliance / theft-prevention: couriers and admins (guards inside)
REVOKE ALL ON FUNCTION verify_pickup_code(UUID, VARCHAR(8), UUID, VARCHAR(255), DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION create_delivery_compliance_record(UUID, UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION create_theft_prevention_record(UUID, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION verify_item_integrity(UUID, UUID, VARCHAR(16), JSONB, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION verify_pickup_code(UUID, VARCHAR(8), UUID, VARCHAR(255), DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_delivery_compliance_record(UUID, UUID, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_theft_prevention_record(UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION verify_item_integrity(UUID, UUID, VARCHAR(16), JSONB, BOOLEAN, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 8. WEBHOOK EVENTS — NARROW INSERT POLICY
-- ============================================================================
-- Only internal roles (service key) or admins may write the idempotency
-- ledger; anonymous clients can no longer inject fake events. (Webhook routes
-- run as the service role, which bypasses RLS; this closes the PostgREST hole.)
DROP POLICY IF EXISTS webhook_events_insert ON webhook_events;
CREATE POLICY webhook_events_insert ON webhook_events
    FOR INSERT
    WITH CHECK (is_service_role() OR is_admin());

-- ============================================================================
-- 9. CONTENT-MODERATION TABLES RLS (007 had none)
-- ============================================================================
ALTER TABLE prohibited_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY prohibited_terms_select ON prohibited_terms
    FOR SELECT USING (true);
CREATE POLICY prohibited_terms_admin_write ON prohibited_terms
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY moderation_flags_select ON content_moderation_flags
    FOR SELECT USING (is_admin());
CREATE POLICY moderation_flags_admin_write ON content_moderation_flags
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- 10. MONEY COLUMNS ARE NO LONGER WRITABLE BY END-USERS
-- ============================================================================
-- Removes column-level UPDATE from anon/authenticated on money fields. The
-- service role (server-side flows, payment webhooks) bypasses this.
-- Status/lifecycle columns remain governed by their existing RLS policies.
REVOKE UPDATE (subtotal, tax, delivery_fee, total, payment_status) ON orders FROM anon, authenticated;
REVOKE UPDATE (amount, payment_status) ON bookings FROM anon, authenticated;
REVOKE UPDATE (estimated_fare, surge_multiplier, actual_fare, tip) ON ridely_rides FROM anon, authenticated;
REVOKE UPDATE (estimated_fare, surge_multiplier, package_value, actual_fare) ON ridely_deliveries FROM anon, authenticated;

-- ============================================================================
-- 11. driver_payouts VALIDATION
-- ============================================================================
-- A driver could previously insert a payout with an arbitrary amount and a
-- status of their choosing. Non-internal actors may only request pending
-- payouts that are consistent (net = amount - fee) and within their available
-- earnings.
CREATE OR REPLACE FUNCTION validate_driver_payout()
RETURNS TRIGGER AS $$
DECLARE
    v_available NUMERIC;
BEGIN
    IF is_service_role() THEN
        RETURN NEW;
    END IF;

    IF NEW.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending payouts may be created by a driver';
    END IF;

    IF NEW.net_amount <> (NEW.amount - COALESCE(NEW.fee, 0)) THEN
        RAISE EXCEPTION 'Payout net amount must equal amount minus fee';
    END IF;

    SELECT COALESCE(SUM(total_earnings), 0) - COALESCE((
        SELECT SUM(amount) FROM driver_payouts
        WHERE driver_id = NEW.driver_id
          AND status IN ('pending', 'processing', 'completed')
    ), 0)
    INTO v_available
    FROM driver_earnings
    WHERE driver_id = NEW.driver_id
      AND status = 'available';

    IF NEW.amount > v_available THEN
        RAISE EXCEPTION 'Payout amount exceeds available earnings';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- The table only exists if migration 006 applied (or was repaired); create the
-- trigger defensively.
DO $$
BEGIN
    IF to_regclass('public.driver_payouts') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS trg_driver_payouts_validated ON driver_payouts;
        CREATE TRIGGER trg_driver_payouts_validated
            BEFORE INSERT ON driver_payouts
            FOR EACH ROW EXECUTE FUNCTION validate_driver_payout();
    END IF;
END $$;

-- ============================================================================
-- 12. FORGEABLE INSERT POLICIES ON HISTORY / AUDIT TABLES
-- ============================================================================
-- Status-history and audit logs were append-only by convention but writable by
-- anyone via a `WITH CHECK (true)` INSERT policy, letting clients fabricate
-- the audit trail. Server-side writes run as the service role (bypasses RLS);
-- there are no legitimate end-user INSERTs to these tables.
DROP POLICY IF EXISTS order_status_history_insert ON order_status_history;
DROP POLICY IF EXISTS ride_status_history_insert ON ride_status_history;
DROP POLICY IF EXISTS delivery_status_history_insert ON delivery_status_history;
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;

-- ============================================================================
-- 13. payment_transactions / escrow_holds / refunds READ COVERAGE FOR RIDELY
-- ============================================================================
-- These policies joined the legacy ride_requests table, so ridely payments
-- were invisible to their owners. Recreate with ridely_ride_id / delivery_id
-- coverage (admin view retained).
DROP POLICY IF EXISTS payment_transactions_read ON payment_transactions;
CREATE POLICY payment_transactions_read ON payment_transactions
    FOR SELECT
    USING (
        is_admin()
        OR booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
        OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR ride_id IN (SELECT id FROM ride_requests WHERE customer_id = auth.uid())
        OR ridely_ride_id IN (SELECT id FROM ridely_rides WHERE rider_id = auth.uid())
        OR delivery_id IN (SELECT id FROM ridely_deliveries WHERE customer_id = auth.uid())
        OR booking_id IN (SELECT id FROM bookings WHERE is_business_owner(business_id))
        OR order_id IN (SELECT id FROM orders WHERE is_business_owner(business_id))
    );

DROP POLICY IF EXISTS escrow_holds_read ON escrow_holds;
CREATE POLICY escrow_holds_read ON escrow_holds
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM payment_transactions pt
        LEFT JOIN bookings b ON b.id = pt.booking_id
        LEFT JOIN orders o ON o.id = pt.order_id
        LEFT JOIN ridely_rides rr ON rr.id = pt.ridely_ride_id
        LEFT JOIN ridely_deliveries rd ON rd.id = pt.delivery_id
        WHERE pt.id = escrow_holds.transaction_id
        AND (b.customer_id = auth.uid() OR o.customer_id = auth.uid()
             OR rr.rider_id = auth.uid() OR rd.customer_id = auth.uid()
             OR is_business_owner(b.business_id) OR is_business_owner(o.business_id))
    ));

DROP POLICY IF EXISTS refunds_read ON refunds;
CREATE POLICY refunds_read ON refunds
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM payment_transactions pt
        LEFT JOIN bookings b ON b.id = pt.booking_id
        LEFT JOIN orders o ON o.id = pt.order_id
        LEFT JOIN ridely_rides rr ON rr.id = pt.ridely_ride_id
        LEFT JOIN ridely_deliveries rd ON rd.id = pt.delivery_id
        WHERE pt.id = refunds.transaction_id
        AND (b.customer_id = auth.uid() OR o.customer_id = auth.uid()
             OR rr.rider_id = auth.uid() OR rd.customer_id = auth.uid())
    ));

-- ============================================================================
-- 14. GRANTS FOR THE `users` VIEW
-- ============================================================================
-- RLS on `profiles` still applies through the view, so anon/authenticated
-- only see rows they are allowed to see.
GRANT SELECT ON users TO anon, authenticated, service_role;
GRANT SELECT ON ledger_balances TO authenticated;

-- ============================================================================
-- 15. RIDELY SCHEMA RECONCILIATION
-- ============================================================================
-- The ridely API routes insert `pickup_lat`/`pickup_lng`/`pricing`/etc.
-- columns that migration 002 never created (002 stores GEOGRAPHY points only).
-- Add the app-expected columns and derive the GEOGRAPHY columns from them via
-- triggers so both the REST API and the spatial dispatch functions work.

-- 15.1 ridely_rides
ALTER TABLE ridely_rides
    ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS duration_min NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb;

-- 15.2 ridely_deliveries
ALTER TABLE ridely_deliveries
    ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS package_details JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS duration_min NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb;

-- 15.3 ridely_food_deliveries
ALTER TABLE ridely_food_deliveries
    ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS pickup_address TEXT,
    ADD COLUMN IF NOT EXISTS destination_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destination_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS duration_min NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS item_total NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'food';

-- 15.4 ridely_food_deliveries constraints: 002 made restaurant_name /
--      restaurant_location NOT NULL, but the API routes resolve the restaurant
--      lookup from the businesses join and send plain lat/lng. Relax the
--      NOT NULL constraints so the route insert (which supplies these via the
--      GEOGRAPHY-populating trigger) applies cleanly.
ALTER TABLE ridely_food_deliveries
    ALTER COLUMN restaurant_name SET DEFAULT '',
    ALTER COLUMN restaurant_name DROP NOT NULL,
    ALTER COLUMN restaurant_location DROP NOT NULL;

-- 15.5 Make GEOGRAPHY columns nullable and populate them from lat/lng columns.
--      The existing API routes send lat/lng; the triggers below maintain the
--      geography columns required by the spatial dispatch functions.
ALTER TABLE ridely_rides
    ALTER COLUMN pickup_location DROP NOT NULL,
    ALTER COLUMN destination_location DROP NOT NULL;

ALTER TABLE ridely_deliveries
    ALTER COLUMN pickup_location DROP NOT NULL,
    ALTER COLUMN destination_location DROP NOT NULL;

ALTER TABLE ridely_food_deliveries
    ALTER COLUMN destination_location DROP NOT NULL;

CREATE OR REPLACE FUNCTION trg_ridely_rides_geo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
        NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
    END IF;
    IF NEW.destination_lat IS NOT NULL AND NEW.destination_lng IS NOT NULL THEN
        NEW.destination_location := ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_ridely_rides_geo ON ridely_rides;
CREATE TRIGGER trg_ridely_rides_geo
    BEFORE INSERT OR UPDATE ON ridely_rides
    FOR EACH ROW EXECUTE FUNCTION trg_ridely_rides_geo();

CREATE OR REPLACE FUNCTION trg_ridely_deliveries_geo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
        NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
    END IF;
    IF NEW.destination_lat IS NOT NULL AND NEW.destination_lng IS NOT NULL THEN
        NEW.destination_location := ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_ridely_deliveries_geo ON ridely_deliveries;
CREATE TRIGGER trg_ridely_deliveries_geo
    BEFORE INSERT OR UPDATE ON ridely_deliveries
    FOR EACH ROW EXECUTE FUNCTION trg_ridely_deliveries_geo();

CREATE OR REPLACE FUNCTION trg_ridely_food_deliveries_geo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
        NEW.restaurant_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
    END IF;
    IF NEW.destination_lat IS NOT NULL AND NEW.destination_lng IS NOT NULL THEN
        NEW.destination_location := ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions, pg_temp;

DROP TRIGGER IF EXISTS trg_ridely_food_deliveries_geo ON ridely_food_deliveries;
CREATE TRIGGER trg_ridely_food_deliveries_geo
    BEFORE INSERT OR UPDATE ON ridely_food_deliveries
    FOR EACH ROW EXECUTE FUNCTION trg_ridely_food_deliveries_geo();

-- 15.6 ride_type enum: the client type includes motorcycle / bicycle aliases
ALTER TYPE ride_type ADD VALUE IF NOT EXISTS 'motorcycle';
ALTER TYPE ride_type ADD VALUE IF NOT EXISTS 'bicycle';

-- ============================================================================
-- END 012
-- ============================================================================
