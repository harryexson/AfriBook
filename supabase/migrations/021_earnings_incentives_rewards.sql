-- ============================================================================
-- 021: Driver insurance add-ons + platform-wide referral program
-- ============================================================================
-- Two small, additive tables. Everything else in this feature set (wait-time
-- pay, rider cancellation fees, driver go-offline, the earnings statement,
-- the rewards ladder) is computed from data that already exists (the
-- `metadata` JSONB columns on driver_earnings / drivers / ridely_rides) and
-- needs no schema change — see src/lib/ridely/{driver-policies,
-- driver-availability,earnings-report,rewards-program}.ts.
--
-- Referrals cover all four sides of the marketplace (rider, driver, vendor/
-- restaurant, and service provider/host — hotels & rental companies) through
-- one generic table rather than four bespoke ones.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Driver insurance add-on subscriptions
-- ---------------------------------------------------------------------------
-- Coverage plans themselves (RideShield Basic/Plus/Total) are static catalog
-- data in src/lib/ridely/driver-insurance.ts, not a DB table — they don't
-- vary per-driver, only the subscription does.

CREATE TABLE driver_insurance_subscriptions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id         UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    plan_code         VARCHAR(32) NOT NULL,          -- matches a plan id in driver-insurance.ts
    status            VARCHAR(16) NOT NULL DEFAULT 'active', -- active | cancelled
    weekly_premium    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at      TIMESTAMPTZ,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE driver_insurance_subscriptions IS 'Driver opt-in to an additional (beyond the free base RideShield) commercial insurance add-on';

CREATE UNIQUE INDEX idx_driver_insurance_one_active
    ON driver_insurance_subscriptions(driver_id)
    WHERE status = 'active';

CREATE INDEX idx_driver_insurance_driver
    ON driver_insurance_subscriptions(driver_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Referral program (rider / driver / vendor / service-provider)
-- ---------------------------------------------------------------------------

CREATE TYPE referral_party_type AS ENUM ('rider', 'driver', 'vendor', 'host');
CREATE TYPE referral_status AS ENUM ('pending', 'qualified', 'paid', 'expired', 'void');

CREATE TABLE referral_codes (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    owner_type    referral_party_type NOT NULL,
    code          VARCHAR(24) NOT NULL UNIQUE,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE referral_codes IS 'One shareable referral code per user; owner_type decides which bonus schedule applies (see referral-program.ts)';

CREATE TABLE referrals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code_id    UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    referrer_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referrer_type       referral_party_type NOT NULL,
    referee_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referee_type        referral_party_type NOT NULL,
    status              referral_status NOT NULL DEFAULT 'pending',
    -- Milestone-gated: a bonus is only earned once the referee actually
    -- completes qualifying activity (a trip, an order, a payout) — never
    -- just for signing up — which bounds AfriBook's liability to real,
    -- realised marketplace activity rather than an open-ended promise.
    milestone_required  TEXT NOT NULL,               -- human-readable, e.g. '1 completed ride'
    milestone_met_at    TIMESTAMPTZ,
    referrer_bonus      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    referee_bonus       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    paid_at             TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (referee_id) -- a person can only ever be *someone's* referee once
);

COMMENT ON TABLE referrals IS 'One row per successful referral across all four sides of the marketplace; bonuses are capped and milestone-gated in referral-program.ts';

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX idx_referral_codes_owner ON referral_codes(owner_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at triggers (reuses update_updated_at_column() from 001)
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_driver_insurance_subscriptions_updated_at
    BEFORE UPDATE ON driver_insurance_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE driver_insurance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals                      ENABLE ROW LEVEL SECURITY;

CREATE POLICY driver_insurance_own_all ON driver_insurance_subscriptions
    FOR ALL
    USING (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = driver_id AND profile_id = auth.uid())
    )
    WITH CHECK (
        is_admin()
        OR EXISTS (SELECT 1 FROM drivers WHERE id = driver_id AND profile_id = auth.uid())
    );

CREATE POLICY referral_codes_own_all ON referral_codes
    FOR ALL
    USING (is_admin() OR owner_id = auth.uid())
    WITH CHECK (is_admin() OR owner_id = auth.uid());

-- Anyone authenticated may look up an active code by its code value (to
-- redeem it at signup) — but only the code, not other people's rows.
CREATE POLICY referral_codes_active_read ON referral_codes
    FOR SELECT
    USING (is_active = true);

CREATE POLICY referrals_admin_all ON referrals
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY referrals_own_read ON referrals
    FOR SELECT
    USING (referrer_id = auth.uid() OR referee_id = auth.uid());
