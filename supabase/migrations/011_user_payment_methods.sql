-- ============================================================================
-- AfriBook — User Payment Methods & Consent Records
-- Supabase PostgreSQL migration for saving payment methods (mobile money,
-- bank accounts, debit/credit cards) on user accounts, and recording the
-- disclosures/consents accepted during signup and subscription onboarding
-- (Terms, Privacy, communications consent, and the hold-harmless waiver).
-- ============================================================================
-- Migration: 011_user_payment_methods
-- ============================================================================

-- 1. ENUM TYPES ==============================================================

-- Broad category of a saved payment method.
CREATE TYPE saved_payment_type AS ENUM (
    'card',          -- debit / credit card (Visa, Mastercard, Amex, etc.)
    'mobile_money',  -- M-Pesa, Airtel Money, MTN MoMo, Orange Money, MoMo, etc.
    'bank'           -- bank account / bank transfer details
);

-- Consent / disclosure kinds a user may accept during signup or subscription.
CREATE TYPE consent_type AS ENUM (
    'terms_of_service',
    'privacy_policy',
    'communications',
    'data_sharing',
    'payment_authorization',
    'hold_harmless_waiver'
);

-- Optional: subscription billing consent flag enum for auto-renewal consent.
CREATE TYPE billing_consent AS ENUM (
    'none',
    'one_time',
    'auto_renew'
);

-- 2. USER PAYMENT METHODS ====================================================

CREATE TABLE user_payment_methods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type            saved_payment_type NOT NULL,
    provider        VARCHAR(64),                  -- 'stripe', 'paystack', 'flutterwave', 'mpesa', 'bank', ...
    label           VARCHAR(255),                 -- optional nickname, e.g. 'Salary card'
    -- Masked / display identifiers only — never store raw PANs server-side.
    last4           VARCHAR(4),
    network         VARCHAR(32),                  -- 'visa', 'mastercard', 'amex' for cards / bank name for bank
    account_name    VARCHAR(255),                 -- bank account / MoMo holder name
    account_number  VARCHAR(255),                 -- bank account number (may be masked)
    phone_number    VARCHAR(32),                  -- mobile money number (may be masked)
    country_code    VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    currency        VARCHAR(10),
    expiry_month    SMALLINT CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year     SMALLINT,
    is_default      BOOLEAN DEFAULT false,
    -- Tokenised reference returned by the payment processor (BIN, card token,
    -- MoMo one-time token). Actual card numbers are never stored.
    provider_token  TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_payment_methods IS 'Saved payment methods (cards, mobile money, bank accounts) for a user account';

CREATE UNIQUE INDEX idx_user_payment_methods_default_unique
    ON user_payment_methods(user_id)
    WHERE is_default = true;

CREATE INDEX idx_user_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_type ON user_payment_methods(type);

-- 3. USER CONSENTS ===========================================================

CREATE TABLE user_consents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type    consent_type NOT NULL,
    consent_version VARCHAR(32),                  -- e.g. '2025-01-01'
    context         VARCHAR(64),                  -- 'signup', 'onboarding', 'subscription'
    granted         BOOLEAN DEFAULT true,
    granted_at      TIMESTAMPTZ DEFAULT now(),
    revoked_at      TIMESTAMPTZ,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE user_consents IS 'Audit trail of legal/regulatory consents accepted or revoked by users';

CREATE UNIQUE INDEX idx_user_consents_type_latest ON user_consents(user_id, consent_type);
CREATE INDEX idx_user_consents_user ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);

-- 4. UPDATED_AT TRIGGER ======================================================

CREATE TRIGGER trg_user_payment_methods_updated_at
    BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. ROW LEVEL SECURITY ======================================================

ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Helpers (SCRUD helpers are SECURITY DEFINER and use auth.uid()).
-- Users can manage their own payment methods; admins may read all.
CREATE POLICY user_payment_methods_select_own ON user_payment_methods
    FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_payment_methods_insert_own ON user_payment_methods
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_payment_methods_update_own ON user_payment_methods
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_payment_methods_delete_own ON user_payment_methods
    FOR DELETE
    USING (user_id = auth.uid());

-- Consents: users read/write their own; admins may read all.
CREATE POLICY user_consents_select_own ON user_consents
    FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_consents_insert_own ON user_consents
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_consents_update_own ON user_consents
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. SINGLE-DEFAULT HELPERS ==================================================

-- Enforce a single default: turning a method into default clears others.
CREATE OR REPLACE FUNCTION set_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE user_payment_methods
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_payment_methods_set_default
    BEFORE INSERT OR UPDATE OF is_default ON user_payment_methods
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION set_default_payment_method();