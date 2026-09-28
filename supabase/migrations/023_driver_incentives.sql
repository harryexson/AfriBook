-- Tables for the driver earnings/incentives feature merged in from the
-- afribook-earnings-incentives cloud session branch: RideShield insurance
-- add-ons (src/lib/ridely/driver-insurance.ts) and the cross-vertical
-- referral program (src/lib/incentives/referral-program.ts). Road Rewards
-- (rewards-program.ts) needed no new table — it scores existing
-- drivers/ridely_rides data.

CREATE TABLE driver_insurance_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plan_code VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  weekly_premium NUMERIC NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);
CREATE INDEX idx_driver_insurance_driver ON driver_insurance_subscriptions(driver_id, status);

CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('rider', 'driver', 'vendor', 'host')),
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_referral_codes_owner ON referral_codes(owner_id, owner_type, is_active);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referrer_type VARCHAR(20) NOT NULL CHECK (referrer_type IN ('rider', 'driver', 'vendor', 'host')),
  referee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_type VARCHAR(20) NOT NULL CHECK (referee_type IN ('rider', 'driver', 'vendor', 'host')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'paid')),
  milestone_required TEXT NOT NULL,
  referrer_bonus NUMERIC NOT NULL DEFAULT 0,
  referee_bonus NUMERIC NOT NULL DEFAULT 0,
  milestone_met_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referee_id)
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id, status, created_at);
