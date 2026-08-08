-- ---------------------------------------------------------------------------
-- 017 — CELEBRATIONS & EVENT-PLANNER SUBSYSTEM
--
-- Hosted celebration pages for weddings, baby showers, bridal showers,
-- birthdays, engagement parties and more. Planners run on capacity-tiered
-- plans (free <= 25 guests, paid 45 / 75 / 100 / 150 / unlimited) that are
-- billed EITHER as a monthly subscription OR per-event, always payable in
-- the planner's own currency (USD canonical prices are PPP-localized at
-- request time in the API layer via src/lib/celebrations/service.ts).
--
-- Adds:
--   * celebration_plans / celebration_subscriptions  (capacity + billing)
--   * celebration_donations                          (gifts w/ platform fee)
--   * celebration_menu_items / celebration_guest_choices (RSVP menu picks)
--   * sms_logs                                       (SMS audit trail)
--   * celebration columns on events + event_guests
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE celebration_type AS ENUM (
    'wedding',
    'baby_shower',
    'bridal_shower',
    'birthday',
    'engagement',
    'housewarming',
    'other'
);

CREATE TYPE celebration_billing_mode AS ENUM (
    'subscription',
    'per_event'
);

CREATE TYPE celebration_billing_status AS ENUM (
    'unpaid',
    'paid',
    'waived'
);

CREATE TYPE celebration_guest_status AS ENUM (
    'invited',
    'confirmed',
    'declined',
    'attended'
);

CREATE TYPE donation_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE menu_item_category AS ENUM (
    'starter',
    'main',
    'dessert',
    'drink',
    'snack',
    'other'
);

CREATE TYPE domain_verification_status AS ENUM (
    'none',
    'pending',
    'verified',
    'failed'
);

CREATE TYPE sms_delivery_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'delivered'
);

-- ---------------------------------------------------------------------------
-- 2. CELEBRATION PLANS — capacity-tier catalog with canonical USD pricing.
--    Monthly (subscription mode) and per-event prices are stored in USD and
--    localized to the planner's currency (PPP) by the API before display.
-- ---------------------------------------------------------------------------
CREATE TABLE celebration_plans (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                        VARCHAR(24) NOT NULL UNIQUE,
    name                        VARCHAR(64) NOT NULL,
    guest_capacity              INT CHECK (guest_capacity IS NULL OR guest_capacity > 0),
    price_monthly_usd           NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price_monthly_usd >= 0),
    price_per_event_usd         NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price_per_event_usd >= 0),
    donation_fee_percent        NUMERIC(5, 2) NOT NULL DEFAULT 8.00 CHECK (donation_fee_percent >= 0 AND donation_fee_percent <= 100),
    sms_enabled                 BOOLEAN NOT NULL DEFAULT false,
    custom_domain_enabled       BOOLEAN NOT NULL DEFAULT false,
    photo_upload_enabled        BOOLEAN NOT NULL DEFAULT false,
    donations_enabled           BOOLEAN NOT NULL DEFAULT true,
    menu_enabled                BOOLEAN NOT NULL DEFAULT true,
    guest_list_enabled          BOOLEAN NOT NULL DEFAULT true,
    max_reminders_per_event     INT NOT NULL DEFAULT 3 CHECK (max_reminders_per_event >= 0),
    sort_order                  INT NOT NULL DEFAULT 0,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE celebration_plans IS
    'Capacity-tiered plans for hosted celebration pages. Prices are canonical USD; localize with PPP at request time.';

CREATE INDEX idx_cplans_active ON celebration_plans(is_active, sort_order);

INSERT INTO celebration_plans (
    code, name, guest_capacity, price_monthly_usd, price_per_event_usd,
    donation_fee_percent, sms_enabled, custom_domain_enabled, photo_upload_enabled,
    donations_enabled, menu_enabled, guest_list_enabled, max_reminders_per_event,
    sort_order
) VALUES
    ('free',          'Free',             25,    0.00,  0.00,  8.00, false, false, false, true,  true,  true,  1,  1),
    ('cap_45',        '45 Guests',        45,    9.00,  5.00,  6.00, true,  false, false, true,  true,  true,  3,  2),
    ('cap_75',        '75 Guests',        75,   19.00, 10.00,  5.00, true,  false, true,  true,  true,  true,  3,  3),
    ('cap_100',       '100 Guests',      100,   29.00, 15.00,  4.50, true,  true,  true,  true,  true,  true,  5,  4),
    ('cap_150',       '150 Guests',      150,   49.00, 25.00,  4.00, true,  true,  true,  true,  true,  true, 10,  5),
    ('cap_unlimited', 'Unlimited Guests', NULL, 99.00, 49.00,  3.00, true,  true,  true,  true,  true,  true, 20,  6)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. CELEBRATION SUBSCRIPTIONS — a planner's active billing arrangement.
--    billing_mode 'subscription' -> recurring Stripe subscription.
--    billing_mode 'per_event'    -> one-off per-event fee per celebration.
-- ---------------------------------------------------------------------------
CREATE TABLE celebration_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_code               VARCHAR(24) NOT NULL REFERENCES celebration_plans(code) ON DELETE RESTRICT,
    billing_mode            celebration_billing_mode NOT NULL DEFAULT 'subscription',
    status                  VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
    currency_code           VARCHAR(3) NOT NULL DEFAULT 'USD',
    price_monthly_local     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_per_event_local   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stripe_subscription_id  TEXT,
    stripe_customer_id      TEXT,
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_csub_currency CHECK (currency_code ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE celebration_subscriptions IS
    'Planner-level billing for celebration pages: monthly subscription OR per-event pricing, in the planner''s currency.';

CREATE INDEX idx_csub_user ON celebration_subscriptions(user_id);
CREATE INDEX idx_csub_user_active ON celebration_subscriptions(user_id) WHERE status = 'active';
CREATE INDEX idx_csub_plan ON celebration_subscriptions(plan_code);

-- ---------------------------------------------------------------------------
-- 4. ALTER EVENTS — celebration page fields (also see RLS at the end).
-- ---------------------------------------------------------------------------
ALTER TABLE events
    ADD COLUMN celebration_type            celebration_type,
    ADD COLUMN celebrant_a_name            VARCHAR(255),
    ADD COLUMN celebrant_b_name            VARCHAR(255),
    ADD COLUMN dress_code                  TEXT,
    ADD COLUMN rsvp_deadline               TIMESTAMPTZ,
    ADD COLUMN menu_deadline               TIMESTAMPTZ,
    ADD COLUMN allow_menu_choice           BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN allow_donations             BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN donation_goal               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN donation_fee_percent        NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
    ADD COLUMN custom_domain               TEXT,
    ADD COLUMN custom_domain_status        domain_verification_status NOT NULL DEFAULT 'none',
    ADD COLUMN hashtag                     VARCHAR(64),
    ADD COLUMN billing_mode                celebration_billing_mode NOT NULL DEFAULT 'subscription',
    ADD COLUMN billing_status              celebration_billing_status NOT NULL DEFAULT 'unpaid',
    ADD COLUMN per_event_fee               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN billing_payment_intent_id   TEXT,
    ADD COLUMN billing_paid_at             TIMESTAMPTZ;

CREATE INDEX idx_events_celebration ON events(celebration_type) WHERE celebration_type IS NOT NULL;
CREATE INDEX idx_events_custom_domain ON events(custom_domain) WHERE custom_domain IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. ALTER EVENT GUESTS — RSVP lifecycle + menu choice linkage.
-- ---------------------------------------------------------------------------
ALTER TABLE event_guests
    ADD COLUMN rsvp_status        celebration_guest_status NOT NULL DEFAULT 'invited',
    ADD COLUMN rsvp_response_date TIMESTAMPTZ,
    ADD COLUMN rsvp_token         VARCHAR(64),
    ADD COLUMN attending_count    INT NOT NULL DEFAULT 1 CHECK (attending_count >= 1),
    ADD COLUMN dietary_notes      TEXT,
    ADD COLUMN notes              TEXT;

CREATE UNIQUE INDEX idx_eg_rsvp_token ON event_guests(rsvp_token) WHERE rsvp_token IS NOT NULL;
CREATE INDEX idx_eg_rsvp_status ON event_guests(rsvp_status);
CREATE INDEX idx_eg_rsvp_event ON event_guests(event_id, rsvp_status);

-- ---------------------------------------------------------------------------
-- 6. CELEBRATION MENU ITEMS — per-celebration menu (active when menu_enabled).
-- ---------------------------------------------------------------------------
CREATE TABLE celebration_menu_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    category        menu_item_category NOT NULL DEFAULT 'other',
    description     TEXT NOT NULL DEFAULT '',
    is_vegetarian   BOOLEAN NOT NULL DEFAULT false,
    is_vegan        BOOLEAN NOT NULL DEFAULT false,
    is_halal        BOOLEAN NOT NULL DEFAULT false,
    is_kosher       BOOLEAN NOT NULL DEFAULT false,
    allergens       JSONB NOT NULL DEFAULT '[]'::jsonb,
    price           NUMERIC(12, 2),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE celebration_menu_items IS 'Menu items guests can select during RSVP when allow_menu_choice is true';

CREATE INDEX idx_cmi_event ON celebration_menu_items(event_id);
CREATE INDEX idx_cmi_event_active ON celebration_menu_items(event_id, is_active);
CREATE INDEX idx_cmi_category ON celebration_menu_items(category);

-- ---------------------------------------------------------------------------
-- 7. CELEBRATION GUEST CHOICES — a guest's RSVP menu selections.
-- ---------------------------------------------------------------------------
CREATE TABLE celebration_guest_choices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id        UUID NOT NULL REFERENCES event_guests(id) ON DELETE CASCADE,
    menu_item_id    UUID NOT NULL REFERENCES celebration_menu_items(id) ON DELETE CASCADE,
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_cgc_guest_item UNIQUE (guest_id, menu_item_id)
);

COMMENT ON TABLE celebration_guest_choices IS 'Menu selections made by an invited guest during RSVP';

CREATE INDEX idx_cgc_guest ON celebration_guest_choices(guest_id);
CREATE INDEX idx_cgc_item ON celebration_guest_choices(menu_item_id);

-- ---------------------------------------------------------------------------
-- 8. CELEBRATION DONATIONS — monetary gifts with platform commission.
--    platform_fee = amount * donation_fee_percent/100 (per the event's plan).
-- ---------------------------------------------------------------------------
CREATE TABLE celebration_donations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    donor_name                  VARCHAR(255) NOT NULL,
    donor_email                 VARCHAR(255),
    donor_phone                 VARCHAR(32),
    amount                      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',
    fee_percent                 NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
    platform_fee                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_amount                  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    message                     TEXT,
    is_anonymous                BOOLEAN NOT NULL DEFAULT false,
    stripe_payment_intent_id    TEXT,
    stripe_charge_id            TEXT,
    status                      donation_status NOT NULL DEFAULT 'pending',
    paid_at                     TIMESTAMPTZ,
    refund_amount               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    refunded_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_cdon_net CHECK (net_amount >= 0),
    CONSTRAINT chk_cdon_fee CHECK (platform_fee >= 0)
);

COMMENT ON TABLE celebration_donations IS 'Gifts to a celebration; platform keeps the commission (fee_percent)';

CREATE INDEX idx_cdon_event ON celebration_donations(event_id);
CREATE INDEX idx_cdon_event_status ON celebration_donations(event_id, status);
CREATE INDEX idx_cdon_stripe ON celebration_donations(stripe_payment_intent_id);
CREATE INDEX idx_cdon_created ON celebration_donations(created_at);

-- Donation totals RPC (public page shows raised/remaining, never donor rows).
CREATE OR REPLACE FUNCTION get_celebration_donation_totals(p_event_id UUID)
RETURNS TABLE(total_amount NUMERIC, donor_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(amount), 0)::numeric AS total_amount,
           COUNT(*)::bigint AS donor_count
    FROM celebration_donations
    WHERE event_id = p_event_id AND status = 'completed';
$$;

GRANT EXECUTE ON FUNCTION get_celebration_donation_totals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_celebration_donation_totals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_celebration_donation_totals(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 9. SMS LOGS — audit trail for every SMS attempt (provider-agnostic).
-- ---------------------------------------------------------------------------
CREATE TABLE sms_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                UUID REFERENCES events(id) ON DELETE SET NULL,
    recipient_name          VARCHAR(255),
    recipient_phone         VARCHAR(32) NOT NULL,
    template_key            VARCHAR(64),
    body                    TEXT,
    status                  sms_delivery_status NOT NULL DEFAULT 'pending',
    provider                VARCHAR(32),
    provider_message_id     TEXT,
    error                   TEXT,
    sent_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sms_logs IS 'Audit trail for SMS sends (invites, RSVP alerts, reminders)';

CREATE INDEX idx_sms_event ON sms_logs(event_id);
CREATE INDEX idx_sms_phone ON sms_logs(recipient_phone);
CREATE INDEX idx_sms_status ON sms_logs(status);
CREATE INDEX idx_sms_created ON sms_logs(created_at);

-- ---------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- Note: events / event_guests RLS was created in 003 and replaced in 016; the
-- added celebration columns are covered by those policies. New tables below
-- mirror the same organizer/admin/owner conventions.
ALTER TABLE celebration_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_guest_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- CELEBRATION PLANS (public catalog; only admins mutate)
CREATE POLICY celebration_plans_read ON celebration_plans
    FOR SELECT USING (true);

CREATE POLICY celebration_plans_write ON celebration_plans
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CELEBRATION SUBSCRIPTIONS (owner-scoped; admins manage)
CREATE POLICY celebration_subscriptions_read ON celebration_subscriptions
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY celebration_subscriptions_insert ON celebration_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY celebration_subscriptions_update ON celebration_subscriptions
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY celebration_subscriptions_delete ON celebration_subscriptions
    FOR DELETE USING (is_admin());

-- CELEBRATION MENU ITEMS (public read when event published; organizer/admin write)
CREATE POLICY celebration_menu_items_read ON celebration_menu_items
    FOR SELECT USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM events
            WHERE events.id = celebration_menu_items.event_id
              AND events.status = 'published'
        ))
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY celebration_menu_items_insert ON celebration_menu_items
    FOR INSERT WITH CHECK (is_event_organizer(event_id) OR is_admin());

CREATE POLICY celebration_menu_items_update ON celebration_menu_items
    FOR UPDATE USING (is_event_organizer(event_id) OR is_admin());

CREATE POLICY celebration_menu_items_delete ON celebration_menu_items
    FOR DELETE USING (is_event_organizer(event_id) OR is_admin());

-- CELEBRATION GUEST CHOICES (organizer/admin read+write; RSVP flows use the
-- API's service-role client, so public writes here are not required)
CREATE POLICY celebration_guest_choices_read ON celebration_guest_choices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM event_guests g
            WHERE g.id = celebration_guest_choices.guest_id
              AND (g.event_id IS NOT NULL AND (is_event_organizer(g.event_id) OR is_admin()))
        )
    );

CREATE POLICY celebration_guest_choices_write ON celebration_guest_choices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM event_guests g
            WHERE g.id = celebration_guest_choices.guest_id
              AND g.event_id IS NOT NULL
              AND (is_event_organizer(g.event_id) OR is_admin())
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM event_guests g
            WHERE g.id = celebration_guest_choices.guest_id
              AND g.event_id IS NOT NULL
              AND (is_event_organizer(g.event_id) OR is_admin())
        )
    );

-- CELEBRATION DONATIONS (donors can create; organizer/admin read + admin manage)
CREATE POLICY celebration_donations_insert ON celebration_donations
    FOR INSERT WITH CHECK (true);

CREATE POLICY celebration_donations_read ON celebration_donations
    FOR SELECT USING (
        is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

CREATE POLICY celebration_donations_update ON celebration_donations
    FOR UPDATE USING (
        is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY celebration_donations_delete ON celebration_donations
    FOR DELETE USING (is_admin());

-- SMS LOGS (organizer/admin read; writes are service-role)
CREATE POLICY sms_logs_read ON sms_logs
    FOR SELECT USING (
        (event_id IS NOT NULL AND (is_event_organizer(event_id) OR is_event_staff(event_id)))
        OR is_admin()
    );

CREATE POLICY sms_logs_insert ON sms_logs
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY sms_logs_update ON sms_logs
    FOR UPDATE USING (is_admin());

CREATE POLICY sms_logs_delete ON sms_logs
    FOR DELETE USING (is_admin());

-- ---------------------------------------------------------------------------
-- 11. REALTIME
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE celebration_donations;
ALTER PUBLICATION supabase_realtime ADD TABLE celebration_menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE celebration_guest_choices;
ALTER PUBLICATION supabase_realtime ADD TABLE celebration_subscriptions;
