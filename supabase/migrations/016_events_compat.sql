-- ---------------------------------------------------------------------------
-- 016 — EVENTS RUNTIME COMPAT
--
-- Serves the live API routes that target tables missing from 001–015:
--   * ticket_purchases          (new ticketing path)
--   * event_ticket_types        (new ticketing path)
--   * check_in_logs             (new check-in path)
--   * event_shares              (share tracking path)
--   * get_event_daily_sales()   RPC used by the analytics route
--
-- Plus ALTERs that reconcile 003's legacy schema with app-expected columns:
--   * events                   (venue_*, is_free, share_url, published_at, ...)
--   * event_guests             (new-path columns + nullable legacy registration)
--   * event_invitations        (event_url)
--   * event_promo_codes        (created_by)
--   * organizer_subscriptions  (organizer_id, max_events, cancelled_at, ...)
--
-- Legacy tables event_registrations / event_ticket_tiers / event_tickets are
-- left intact for the register + Stripe-webhook flows.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
-- event_ticket_status ('active'|'used'|...) does not contain the values the
-- app writes for ticket/guest check-in, so add a dedicated enum.
CREATE TYPE ticket_check_in_status AS ENUM (
    'not_checked_in',
    'checked_in'
);

-- The app creates promo codes with discount_type 'percent'; 003's enum only
-- has 'percentage'/'fixed'. Add the value (unused within this migration, so
-- it is safe inside the transaction).
ALTER TYPE promo_discount_type ADD VALUE IF NOT EXISTS 'percent';

-- ---------------------------------------------------------------------------
-- 2. NEW TABLES
-- ---------------------------------------------------------------------------

-- EVENT TICKET TYPES — the app's ticket-tier table (new path).
CREATE TABLE event_ticket_types (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name                        VARCHAR(255) NOT NULL,
    tier                        event_ticket_tier NOT NULL DEFAULT 'general',
    type                        event_ticket_type NOT NULL DEFAULT 'paid',
    description                 TEXT NOT NULL DEFAULT '',
    price                       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price              NUMERIC(12, 2),
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'NGN',
    quantity_available          INT NOT NULL DEFAULT 0,
    quantity_sold               INT NOT NULL DEFAULT 0,
    max_per_order               INT NOT NULL DEFAULT 10,
    min_per_order               INT NOT NULL DEFAULT 1,
    sale_starts_at              TIMESTAMPTZ,
    sale_ends_at                TIMESTAMPTZ,
    includes_guest_registration BOOLEAN NOT NULL DEFAULT false,
    max_guests_per_ticket       INT NOT NULL DEFAULT 0,
    benefits                    JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    sort_order                  INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ett_quantity CHECK (quantity_sold >= 0 AND quantity_sold <= quantity_available),
    CONSTRAINT chk_ett_order_limits CHECK (max_per_order >= min_per_order),
    CONSTRAINT chk_ett_price CHECK (price >= 0)
);

CREATE INDEX idx_ett_event ON event_ticket_types(event_id);
CREATE INDEX idx_ett_event_active ON event_ticket_types(event_id, is_active);
CREATE INDEX idx_ett_tier ON event_ticket_types(tier);
CREATE INDEX idx_ett_sale_window ON event_ticket_types(sale_starts_at, sale_ends_at);

-- TICKET PURCHASES — an order placed against an event_ticket_types tier.
CREATE TABLE ticket_purchases (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id              UUID NOT NULL REFERENCES event_ticket_types(id) ON DELETE RESTRICT,
    buyer_id                    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    buyer_name                  VARCHAR(255) NOT NULL,
    buyer_email                 VARCHAR(255) NOT NULL,
    buyer_phone                 VARCHAR(32),
    quantity                    INT NOT NULL DEFAULT 1,
    unit_price                  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal                    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    platform_fee                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    processing_fee              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total                       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'NGN',
    payment_status              event_payment_status NOT NULL DEFAULT 'pending',
    payment_method              VARCHAR(32),
    order_status                registration_status NOT NULL DEFAULT 'pending',
    ticket_code                 VARCHAR(16) NOT NULL,
    qr_code_url                 TEXT,
    promo_code                  VARCHAR(64),
    ticket_tier_name            VARCHAR(255),
    check_in_status             ticket_check_in_status NOT NULL DEFAULT 'not_checked_in',
    checked_in_at               TIMESTAMPTZ,
    check_in_at                 TIMESTAMPTZ,
    metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_tp_quantity CHECK (quantity >= 1),
    CONSTRAINT chk_tp_total CHECK (total >= 0)
);

CREATE UNIQUE INDEX idx_tp_ticket_code ON ticket_purchases(ticket_code);
CREATE INDEX idx_tp_event ON ticket_purchases(event_id);
CREATE INDEX idx_tp_buyer ON ticket_purchases(buyer_id);
CREATE INDEX idx_tp_ticket_type ON ticket_purchases(ticket_type_id);
CREATE INDEX idx_tp_event_status ON ticket_purchases(event_id, order_status);
CREATE INDEX idx_tp_event_checkin ON ticket_purchases(event_id, check_in_status);
CREATE INDEX idx_tp_created ON ticket_purchases(created_at);

-- Auto-fill ticket_code (the app always provides one; safety net only).
CREATE OR REPLACE FUNCTION trg_tp_set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tp_set_ticket_code
    BEFORE INSERT ON ticket_purchases
    FOR EACH ROW EXECUTE FUNCTION trg_tp_set_ticket_code();

-- Maintain derived columns the app reads but never writes:
--   * check_in_at      mirrors checked_in_at (GET /check-in selects check_in_at)
--   * ticket_tier_name denormalized from event_ticket_types.name
--   * updated_at       kept fresh
CREATE OR REPLACE FUNCTION trg_tp_maintain_derived()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.ticket_type_id IS DISTINCT FROM OLD.ticket_type_id THEN
        SELECT name INTO NEW.ticket_tier_name
        FROM event_ticket_types
        WHERE id = NEW.ticket_type_id;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.checked_in_at IS DISTINCT FROM OLD.checked_in_at THEN
        NEW.check_in_at := NEW.checked_in_at;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tp_maintain_derived
    BEFORE INSERT OR UPDATE ON ticket_purchases
    FOR EACH ROW EXECUTE FUNCTION trg_tp_maintain_derived();

-- CHECK-IN LOGS — audit trail for the new check-in flow.
CREATE TABLE check_in_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_purchase_id  UUID REFERENCES ticket_purchases(id) ON DELETE SET NULL,
    guest_id            UUID REFERENCES event_guests(id) ON DELETE SET NULL,
    ticket_code         VARCHAR(16),
    scanned_by          TEXT NOT NULL DEFAULT 'system',
    scanned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    method              check_in_method NOT NULL DEFAULT 'qr_scan',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cil_event ON check_in_logs(event_id);
CREATE INDEX idx_cil_ticket ON check_in_logs(ticket_purchase_id);
CREATE INDEX idx_cil_guest ON check_in_logs(guest_id);
CREATE INDEX idx_cil_scanned_at ON check_in_logs(scanned_at);

-- EVENT SHARES — per-share tracking used by POST/GET /events/:id/share.
CREATE TABLE event_shares (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform    share_platform NOT NULL,
    share_url   TEXT,
    clicked     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_eshares_event ON event_shares(event_id);
CREATE INDEX idx_eshares_event_created ON event_shares(event_id, created_at);
CREATE INDEX idx_eshares_clicked ON event_shares(event_id, clicked);

-- ---------------------------------------------------------------------------
-- 3. RPC — get_event_daily_sales
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_event_daily_sales(
    p_event_id UUID,
    p_since_date TIMESTAMPTZ
)
RETURNS TABLE(date DATE, count BIGINT, revenue NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (created_at AT TIME ZONE 'UTC')::date AS date,
           COUNT(*)::bigint AS count,
           COALESCE(SUM(total), 0)::numeric AS revenue
    FROM ticket_purchases
    WHERE event_id = p_event_id
      AND order_status = 'confirmed'
      AND created_at >= p_since_date
    GROUP BY (created_at AT TIME ZONE 'UTC')::date
    ORDER BY date ASC;
$$;

GRANT EXECUTE ON FUNCTION get_event_daily_sales(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_daily_sales(UUID, TIMESTAMPTZ) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. ALTER EVENTS — app columns missing from 003
-- ---------------------------------------------------------------------------
ALTER TABLE events
    ADD COLUMN venue_name VARCHAR(255),
    ADD COLUMN venue_address TEXT,
    ADD COLUMN venue_city VARCHAR(128),
    ADD COLUMN venue_country VARCHAR(128),
    ADD COLUMN venue_lat DOUBLE PRECISION,
    ADD COLUMN venue_lng DOUBLE PRECISION,
    ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN min_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN max_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN share_url TEXT,
    ADD COLUMN enable_referrals BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN enable_waitlist BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN require_approval BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN allow_guest_registration BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN published_at TIMESTAMPTZ,
    ADD COLUMN cancelled_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 5. ALTER EVENT GUESTS — new-path columns + drop NOT NULL on legacy fields
-- ---------------------------------------------------------------------------
-- 003's registration_id / name / email are NOT NULL, but the new guest path
-- writes ticket_purchase_id / guest_name / guest_email instead.
ALTER TABLE event_guests
    ALTER COLUMN registration_id DROP NOT NULL,
    ALTER COLUMN name DROP NOT NULL,
    ALTER COLUMN email DROP NOT NULL,
    ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ADD COLUMN ticket_purchase_id UUID REFERENCES ticket_purchases(id) ON DELETE CASCADE,
    ADD COLUMN host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ADD COLUMN guest_name VARCHAR(255),
    ADD COLUMN guest_email VARCHAR(255),
    ADD COLUMN guest_phone VARCHAR(32),
    ADD COLUMN qr_code_url TEXT,
    ADD COLUMN check_in_status ticket_check_in_status NOT NULL DEFAULT 'not_checked_in',
    ADD COLUMN checked_in_by TEXT;

CREATE INDEX idx_eg_event ON event_guests(event_id);
CREATE INDEX idx_eg_ticket_purchase ON event_guests(ticket_purchase_id);
CREATE INDEX idx_eg_host ON event_guests(host_id);
CREATE INDEX idx_eg_check_in_status ON event_guests(check_in_status);

-- ---------------------------------------------------------------------------
-- 6. ALTER EVENT INVITATIONS
-- ---------------------------------------------------------------------------
ALTER TABLE event_invitations
    ADD COLUMN event_url TEXT;

-- ---------------------------------------------------------------------------
-- 7. ALTER EVENT PROMO CODES
-- ---------------------------------------------------------------------------
ALTER TABLE event_promo_codes
    ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 8. ALTER ORGANIZER SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
-- events POST looks the subscription up by organizer_id; the app also writes
-- max_events / max_guests_per_registration / platform_fee_fixed / cancelled_at.
ALTER TABLE organizer_subscriptions
    ADD COLUMN organizer_id UUID,
    ADD COLUMN max_events INT NOT NULL DEFAULT -1,
    ADD COLUMN max_guests_per_registration INT NOT NULL DEFAULT 0,
    ADD COLUMN platform_fee_fixed NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    ADD COLUMN cancelled_at TIMESTAMPTZ;

-- Keep organizer_id in sync with user_id (subscriptions POST only sets user_id).
CREATE OR REPLACE FUNCTION trg_sub_sync_organizer_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.organizer_id := COALESCE(NEW.organizer_id, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sub_sync_organizer_id
    BEFORE INSERT OR UPDATE OF user_id, organizer_id ON organizer_subscriptions
    FOR EACH ROW EXECUTE FUNCTION trg_sub_sync_organizer_id();

UPDATE organizer_subscriptions SET organizer_id = user_id WHERE organizer_id IS NULL;

-- ---------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY — new tables (mirrors 003's policies)
-- ---------------------------------------------------------------------------
ALTER TABLE event_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_shares ENABLE ROW LEVEL SECURITY;

-- EVENT TICKET TYPES (mirror event_ticket_tiers)
CREATE POLICY event_ticket_types_read ON event_ticket_types
    FOR SELECT
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_ticket_types.event_id
              AND events.status = 'published'
        ))
        OR is_event_organizer(event_ticket_types.event_id)
        OR is_admin()
    );

CREATE POLICY event_ticket_types_insert ON event_ticket_types
    FOR INSERT
    WITH CHECK (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_ticket_types_update ON event_ticket_types
    FOR UPDATE
    USING (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_ticket_types_delete ON event_ticket_types
    FOR DELETE
    USING (is_event_organizer(event_id) OR is_admin());

-- TICKET PURCHASES
CREATE POLICY ticket_purchases_read ON ticket_purchases
    FOR SELECT
    USING (
        buyer_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY ticket_purchases_insert ON ticket_purchases
    FOR INSERT
    WITH CHECK (buyer_id = auth.uid() OR is_admin());

CREATE POLICY ticket_purchases_update ON ticket_purchases
    FOR UPDATE
    USING (
        buyer_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY ticket_purchases_delete ON ticket_purchases
    FOR DELETE
    USING (is_admin());

-- CHECK-IN LOGS
CREATE POLICY check_in_logs_read ON check_in_logs
    FOR SELECT
    USING (
        is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY check_in_logs_insert ON check_in_logs
    FOR INSERT
    WITH CHECK (
        is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY check_in_logs_update ON check_in_logs
    FOR UPDATE
    USING (
        is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY check_in_logs_delete ON check_in_logs
    FOR DELETE
    USING (is_admin());

-- EVENT SHARES
CREATE POLICY event_shares_read ON event_shares
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_shares_insert ON event_shares
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY event_shares_update ON event_shares
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_shares_delete ON event_shares
    FOR DELETE
    USING (is_admin());

-- ---------------------------------------------------------------------------
-- 10. REPLACE EVENT GUESTS POLICIES — support both legacy (registration_id)
--     and new-path (ticket_purchase_id / host_id / event_id) rows.
-- ---------------------------------------------------------------------------
DROP POLICY event_guests_read ON event_guests;
DROP POLICY event_guests_insert ON event_guests;
DROP POLICY event_guests_update ON event_guests;
DROP POLICY event_guests_delete ON event_guests;

CREATE POLICY event_guests_read ON event_guests
    FOR SELECT
    USING (
        host_id = auth.uid()
        OR (registration_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM event_registrations r
            WHERE r.id = event_guests.registration_id
              AND r.user_id = auth.uid()
        ))
        OR is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY event_guests_insert ON event_guests
    FOR INSERT
    WITH CHECK (
        (host_id = auth.uid() AND EXISTS (
            SELECT 1 FROM ticket_purchases tp
            WHERE tp.id = event_guests.ticket_purchase_id
              AND tp.buyer_id = auth.uid()
        ))
        OR (registration_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM event_registrations r
            WHERE r.id = event_guests.registration_id
              AND r.user_id = auth.uid()
        ))
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_guests_update ON event_guests
    FOR UPDATE
    USING (
        host_id = auth.uid()
        OR (registration_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM event_registrations r
            WHERE r.id = event_guests.registration_id
              AND r.user_id = auth.uid()
        ))
        OR is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY event_guests_delete ON event_guests
    FOR DELETE
    USING (
        host_id = auth.uid()
        OR (registration_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM event_registrations r
            WHERE r.id = event_guests.registration_id
              AND r.user_id = auth.uid()
        ))
        OR is_event_organizer(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- 11. REALTIME
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE event_ticket_types;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE check_in_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE event_shares;
