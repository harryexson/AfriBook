-- ============================================================================
-- AfriBook Stripe Connect Payments — Webhook events & vendor wallet crediting — Migration 010
-- Comprehensive Supabase PostgreSQL migration covering:
--   • Table: webhook_events (idempotent processing ledger for provider webhooks)
--   • Column: vendor_wallets.metadata (stores provider account ids / status)
--   • Function: handle_payment_succeeded (credits vendor wallets on payment)
--   • Indexes + RLS policies for webhook_events
-- ============================================================================

-- 1. VENDOR WALLET METADATA ===================================================

-- The payments layer persists provider connection details (e.g. the Stripe
-- Express account id) inside vendor_wallets.metadata. This column did not
-- exist in migration 001, so add it idempotently.
ALTER TABLE vendor_wallets
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN vendor_wallets.metadata IS 'Provider-specific wallet state, e.g. {"stripe_account_id":"acct_...","details_submitted":true}';

-- 1b. PAYMENT TRANSACTION REFERENCE COLUMNS ====================================

-- The app's ride-hailing and courier flows use the ridely tables
-- (ridely_rides / ridely_deliveries), which differ from the legacy
-- ride_requests / deliveries tables. Add FK-safe reference columns so
-- payments can be linked to those records without violating FKs.
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES ridely_deliveries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ridely_ride_id UUID REFERENCES ridely_rides(id) ON DELETE SET NULL;

COMMENT ON COLUMN payment_transactions.delivery_id IS 'Reference to the ridely_deliveries record this payment is for';
COMMENT ON COLUMN payment_transactions.ridely_ride_id IS 'Reference to the ridely_rides record this payment is for';

-- 2. WEBHOOK EVENTS TABLE =====================================================

-- ---------------------------------------------------------------------------
-- WEBHOOK EVENTS — idempotency ledger for provider webhook deliveries.
-- Stripe sends an Idempotency-Key header; the webhook route checks this table
-- to avoid double-processing the same delivery.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider        VARCHAR(64) NOT NULL,
    event_type      VARCHAR(128) NOT NULL,
    event_id        VARCHAR(255),
    idempotency_key VARCHAR(255),
    raw_event       JSONB DEFAULT '{}'::jsonb,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE webhook_events IS 'Ledger of received provider webhook events for idempotent processing';
COMMENT ON COLUMN webhook_events.idempotency_key IS 'Stripe Idempotency-Key header used to dedupe retries';

-- 3. INDEXES ==================================================================

CREATE INDEX IF NOT EXISTS webhook_events_idempotency_key_idx ON webhook_events(idempotency_key);
CREATE INDEX IF NOT EXISTS webhook_events_event_id_idx ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS webhook_events_provider_created_idx ON webhook_events(provider, created_at DESC);

-- 4. HELPER FUNCTION ==========================================================

-- ---------------------------------------------------------------------------
-- HANDLE PAYMENT SUCCEEDED — credits the vendor wallet on a successful
-- payment. Resolves the vendor through the transaction's order / booking →
-- business → owner, then adds the transaction's net amount to the wallet.
-- SECURITY DEFINER so the webhook (running as anon/postgres) can write
-- wallets despite RLS. Idempotent: re-running for an already-succeeded
-- transaction is a no-op.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_payment_succeeded(p_transaction_id UUID)
RETURNS VOID AS $$
DECLARE
    v_tx            payment_transactions%ROWTYPE;
    v_business_id   UUID;
    v_vendor_id     UUID;
    v_wallet_id     UUID;
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION handle_payment_succeeded(UUID) IS 'Marks a payment transaction succeeded and credits the vendor wallet with the net amount';

-- 5. ROW LEVEL SECURITY =======================================================

-- webhook_events is written by the server-side webhook route. The route runs
-- with the service role (or anon), so we allow insert for the anon and
-- authenticated roles used by server-side code, and read access for admins.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_insert ON webhook_events
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY webhook_events_read_admin ON webhook_events
    FOR SELECT
    USING (is_admin());
