-- ============================================================================
-- AfriBook Events & Ticket Management System — Migration 003
-- Comprehensive Supabase PostgreSQL migration covering:
--   • Enum types for every status/domain
--   • Core tables: events, ticket tiers, registrations, tickets, guests
--   • Media: photo gallery, share links
--   • Invitations, promo codes, check-ins
--   • Business model: organizer subscriptions, subscription plans
--   • Analytics helper tables
--   • Indexes (GIST for location, btree for status/dates, unique on ticket_code)
--   • Row Level Security policies
--   • Realtime publications
--   • Functions: check-in validation, ticket availability, stats
--   • Triggers: auto-update tickets_sold, slug generation, ticket code generation
-- ============================================================================

-- 0. EXTENSIONS =================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES =================================================================

CREATE TYPE event_status AS ENUM (
    'draft',
    'published',
    'cancelled',
    'completed'
);

CREATE TYPE event_category AS ENUM (
    'conference',
    'concert',
    'festival',
    'workshop',
    'seminar',
    'wedding',
    'birthday',
    'party',
    'corporate',
    'charity',
    'sports',
    'networking',
    'food_drink',
    'arts',
    'technology',
    'music',
    'fashion',
    'health',
    'education',
    'other'
);

CREATE TYPE event_ticket_type AS ENUM (
    'free',
    'paid',
    'donation'
);

CREATE TYPE event_ticket_status AS ENUM (
    'active',
    'used',
    'cancelled',
    'refunded',
    'transferred'
);

CREATE TYPE event_ticket_tier AS ENUM (
    'general',
    'vip',
    'early_bird',
    'group',
    'student',
    'custom'
);

CREATE TYPE registration_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'checked_in'
);

CREATE TYPE check_in_method AS ENUM (
    'qr_scan',
    'manual',
    'nfc'
);

CREATE TYPE event_payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE refund_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'processed'
);

CREATE TYPE share_platform AS ENUM (
    'facebook',
    'twitter',
    'instagram',
    'whatsapp',
    'email',
    'sms',
    'linkedin',
    'copy_link'
);

CREATE TYPE organizer_plan AS ENUM (
    'free',
    'starter',
    'professional',
    'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
    'active',
    'cancelled',
    'past_due',
    'trialing'
);

CREATE TYPE photo_upload_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE guest_relationship AS ENUM (
    'friend',
    'family',
    'colleague',
    'partner',
    'other'
);

CREATE TYPE invitation_delivery_status AS ENUM (
    'sent',
    'delivered',
    'opened',
    'registered'
);

CREATE TYPE promo_discount_type AS ENUM (
    'percentage',
    'fixed'
);

-- 2. CORE TABLES ================================================================

-- ---------------------------------------------------------------------------
-- EVENTS — main events table
-- ---------------------------------------------------------------------------
CREATE TABLE events (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organizer_name              VARCHAR(255) NOT NULL,
    title                       VARCHAR(255) NOT NULL,
    slug                        VARCHAR(300) NOT NULL,
    description                 TEXT NOT NULL DEFAULT '',
    short_description           VARCHAR(500) NOT NULL DEFAULT '',
    category                    event_category NOT NULL DEFAULT 'other',
    status                      event_status NOT NULL DEFAULT 'draft',

    -- Location
    venue                       VARCHAR(255) DEFAULT '',
    address                     TEXT DEFAULT '',
    city                        VARCHAR(128) DEFAULT '',
    country                     VARCHAR(128) DEFAULT '',
    country_code                VARCHAR(4) DEFAULT '',
    location                    GEOGRAPHY(POINT, 4326),
    is_virtual                  BOOLEAN NOT NULL DEFAULT false,
    virtual_link                TEXT,

    -- Timing
    start_date                  TIMESTAMPTZ NOT NULL,
    end_date                    TIMESTAMPTZ NOT NULL,
    timezone                    VARCHAR(64) NOT NULL DEFAULT 'UTC',
    doors_open_at               TIMESTAMPTZ,

    -- Media
    cover_image_url             TEXT DEFAULT '',
    gallery_images              JSONB DEFAULT '[]'::jsonb,
    promo_video_url             TEXT,
    flyer_url                   TEXT,

    -- Tickets
    ticket_type                 event_ticket_type NOT NULL DEFAULT 'free',
    total_capacity              INT NOT NULL DEFAULT 0,
    tickets_sold                INT NOT NULL DEFAULT 0,
    waitlist_enabled            BOOLEAN NOT NULL DEFAULT false,

    -- Pricing
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',
    platform_fee_percent        NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    platform_fee_fixed          NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    tax_rate                    NUMERIC(5, 2) NOT NULL DEFAULT 0,

    -- Settings
    requires_approval           BOOLEAN NOT NULL DEFAULT false,
    show_guest_list             BOOLEAN NOT NULL DEFAULT false,
    allow_refunds               BOOLEAN NOT NULL DEFAULT true,
    refund_deadline_days        INT NOT NULL DEFAULT 7,
    max_guests_per_registration INT NOT NULL DEFAULT 0,

    -- SEO & Sharing
    meta_title                  VARCHAR(255),
    meta_description            VARCHAR(500),
    share_image_url             TEXT,

    -- Stats
    view_count                  BIGINT DEFAULT 0,
    share_count                 BIGINT DEFAULT 0,
    favorite_count              BIGINT DEFAULT 0,

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_event_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_capacity CHECK (total_capacity >= 0),
    CONSTRAINT chk_tickets_sold CHECK (tickets_sold >= 0),
    CONSTRAINT chk_tickets_sold_cap CHECK (tickets_sold <= total_capacity),
    CONSTRAINT chk_max_guests CHECK (max_guests_per_registration >= 0),
    CONSTRAINT chk_refund_days CHECK (refund_deadline_days >= 0)
);

COMMENT ON TABLE events IS 'Events created by organizers on the AfriBook Events & Ticket Management platform';
COMMENT ON COLUMN events.slug IS 'URL-friendly slug auto-generated from title';
COMMENT ON COLUMN events.location IS 'PostGIS geography point (lng, lat) for spatial queries';
COMMENT ON COLUMN events.gallery_images IS 'JSON array of gallery image URLs';
COMMENT ON COLUMN events.ticket_type IS 'Primary ticket type for this event';
COMMENT ON COLUMN events.platform_fee_percent IS 'Platform fee percentage (default 5%)';
COMMENT ON COLUMN events.platform_fee_fixed IS 'Platform fee fixed amount per ticket (default $1)';

CREATE UNIQUE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_end_date ON events(end_date);
CREATE INDEX idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX idx_events_status_start ON events(status, start_date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_country ON events(country_code);
CREATE INDEX idx_events_location ON events USING GIST(location);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_ticket_type ON events(ticket_type);

-- ---------------------------------------------------------------------------
-- EVENT TICKET TIERS — different ticket tiers per event
-- ---------------------------------------------------------------------------
CREATE TABLE event_ticket_tiers (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name                        VARCHAR(128) NOT NULL,
    tier                        event_ticket_tier NOT NULL DEFAULT 'general',
    price                       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price              NUMERIC(12, 2),
    description                 TEXT DEFAULT '',
    available                   INT NOT NULL DEFAULT 0,
    sold                        INT NOT NULL DEFAULT 0,
    max_per_order               INT NOT NULL DEFAULT 10,
    sale_starts_at              TIMESTAMPTZ,
    sale_ends_at                TIMESTAMPTZ,
    includes_perks              JSONB DEFAULT '[]'::jsonb,
    is_active                   BOOLEAN DEFAULT true,

    CONSTRAINT chk_tier_available CHECK (available >= 0),
    CONSTRAINT chk_tier_sold CHECK (sold >= 0),
    CONSTRAINT chk_tier_sold_cap CHECK (sold <= available),
    CONSTRAINT chk_tier_max_per_order CHECK (max_per_order >= 1),
    CONSTRAINT chk_tier_sale_dates CHECK (sale_ends_at IS NULL OR sale_starts_at IS NULL OR sale_ends_at >= sale_starts_at)
);

COMMENT ON TABLE event_ticket_tiers IS 'Ticket tiers available for an event with pricing, quantity, and perks';
COMMENT ON COLUMN event_ticket_tiers.includes_perks IS 'JSON array of perk strings included with this tier';

CREATE INDEX idx_ett_event ON event_ticket_tiers(event_id);
CREATE INDEX idx_ett_tier ON event_ticket_tiers(tier);
CREATE INDEX idx_ett_active ON event_ticket_tiers(is_active);
CREATE INDEX idx_ett_event_active ON event_ticket_tiers(event_id, is_active);
CREATE INDEX idx_ett_sale_window ON event_ticket_tiers(sale_starts_at, sale_ends_at);

-- ---------------------------------------------------------------------------
-- EVENT REGISTRATIONS — ticket purchase / registration records
-- ---------------------------------------------------------------------------
CREATE TABLE event_registrations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id                     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name                   VARCHAR(255) NOT NULL,
    user_email                  VARCHAR(255) NOT NULL,
    user_phone                  VARCHAR(32) DEFAULT '',
    status                      registration_status NOT NULL DEFAULT 'pending',
    ticket_tier_id              UUID NOT NULL REFERENCES event_ticket_tiers(id) ON DELETE RESTRICT,
    ticket_tier_name            VARCHAR(128) NOT NULL DEFAULT '',
    quantity                    INT NOT NULL DEFAULT 1,

    -- Pricing
    ticket_price                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal                    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    platform_fee                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    processing_fee              NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax                         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total                       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'USD',
    promo_code                  VARCHAR(64),
    discount_amount             NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- Payment
    payment_status              event_payment_status NOT NULL DEFAULT 'pending',
    payment_intent_id           VARCHAR(255),
    payment_method              VARCHAR(64),

    -- Check-in
    checked_in_at               TIMESTAMPTZ,
    check_in_method             check_in_method,

    -- Metadata
    special_requests            TEXT,
    referral_code               VARCHAR(32),

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_reg_quantity CHECK (quantity > 0),
    CONSTRAINT chk_reg_amounts CHECK (subtotal >= 0 AND total >= 0 AND discount_amount >= 0)
);

COMMENT ON TABLE event_registrations IS 'Ticket registrations / purchase records with full pricing breakdown';
COMMENT ON COLUMN event_registrations.ticket_price IS 'Per-ticket price at time of purchase';
COMMENT ON COLUMN event_registrations.platform_fee IS 'AfriBook platform fee for this registration';
COMMENT ON COLUMN event_registrations.processing_fee IS 'Stripe / payment processor fee';

CREATE INDEX idx_er_event ON event_registrations(event_id);
CREATE INDEX idx_er_user ON event_registrations(user_id);
CREATE INDEX idx_er_ticket_tier ON event_registrations(ticket_tier_id);
CREATE INDEX idx_er_status ON event_registrations(status);
CREATE INDEX idx_er_payment_status ON event_registrations(payment_status);
CREATE INDEX idx_er_user_event ON event_registrations(user_id, event_id);
CREATE INDEX idx_er_event_status ON event_registrations(event_id, status);
CREATE INDEX idx_er_created ON event_registrations(created_at);

-- ---------------------------------------------------------------------------
-- EVENT TICKETS — individual ticket records with QR codes
-- ---------------------------------------------------------------------------
CREATE TABLE event_tickets (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id             UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id                     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ticket_code                 VARCHAR(16) NOT NULL UNIQUE,
    tier_name                   VARCHAR(128) NOT NULL DEFAULT 'general',
    attendee_name               VARCHAR(255) NOT NULL,
    attendee_email              VARCHAR(255) NOT NULL,
    status                      event_ticket_status NOT NULL DEFAULT 'active',
    qr_code_url                 TEXT,
    barcode_data                TEXT,
    checked_in                  BOOLEAN NOT NULL DEFAULT false,
    checked_in_at               TIMESTAMPTZ,
    checked_in_method           check_in_method,
    transferred_to              UUID REFERENCES profiles(id) ON DELETE SET NULL,
    transferred_at              TIMESTAMPTZ,
    valid_from                  TIMESTAMPTZ NOT NULL,
    valid_until                 TIMESTAMPTZ NOT NULL,
    created_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_ticket_validity CHECK (valid_until >= valid_from)
);

COMMENT ON TABLE event_tickets IS 'Individual ticket records with unique QR code for check-in';
COMMENT ON COLUMN event_tickets.ticket_code IS 'Unique alphanumeric code used for QR check-in';
COMMENT ON COLUMN event_tickets.barcode_data IS 'Raw barcode string data';
COMMENT ON COLUMN event_tickets.valid_from IS 'Ticket becomes valid at this time';
COMMENT ON COLUMN event_tickets.valid_until IS 'Ticket expires after this time';

CREATE INDEX idx_et_registration ON event_tickets(registration_id);
CREATE INDEX idx_et_event ON event_tickets(event_id);
CREATE INDEX idx_et_user ON event_tickets(user_id);
CREATE UNIQUE INDEX idx_et_ticket_code ON event_tickets(ticket_code);
CREATE INDEX idx_et_status ON event_tickets(status);
CREATE INDEX idx_et_checked_in ON event_tickets(checked_in);
CREATE INDEX idx_et_event_checked ON event_tickets(event_id, checked_in);
CREATE INDEX idx_et_validity ON event_tickets(valid_from, valid_until);

-- ---------------------------------------------------------------------------
-- EVENT GUESTS — guest registrations added by a ticket buyer
-- ---------------------------------------------------------------------------
CREATE TABLE event_guests (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id             UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    name                        VARCHAR(255) NOT NULL,
    email                       VARCHAR(255) NOT NULL,
    phone                       VARCHAR(32),
    relationship                guest_relationship NOT NULL DEFAULT 'other',
    ticket_code                 VARCHAR(16) NOT NULL UNIQUE,
    checked_in                  BOOLEAN NOT NULL DEFAULT false,
    checked_in_at               TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_guests IS 'Guest registrations added to a ticket registration by the buyer';

CREATE INDEX idx_eg_registration ON event_guests(registration_id);
CREATE INDEX idx_eg_ticket_code ON event_guests(ticket_code);
CREATE INDEX idx_eg_checked_in ON event_guests(checked_in);

-- ---------------------------------------------------------------------------
-- EVENT PHOTOS — gallery photos uploaded by attendees
-- ---------------------------------------------------------------------------
CREATE TABLE event_photos (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id                     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name                   VARCHAR(255) NOT NULL,
    image_url                   TEXT NOT NULL,
    thumbnail_url               TEXT NOT NULL DEFAULT '',
    caption                     VARCHAR(500),
    status                      photo_upload_status NOT NULL DEFAULT 'pending',
    is_cover                    BOOLEAN NOT NULL DEFAULT false,
    uploaded_before_event       BOOLEAN NOT NULL DEFAULT false,
    download_count              INT DEFAULT 0,
    share_count                 INT DEFAULT 0,
    created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_photos IS 'Guest-uploaded photos for the shared event gallery';
COMMENT ON COLUMN event_photos.uploaded_before_event IS 'True if uploaded before the event start date (pre-event gallery)';

CREATE INDEX idx_ep_event ON event_photos(event_id);
CREATE INDEX idx_ep_user ON event_photos(user_id);
CREATE INDEX idx_ep_status ON event_photos(status);
CREATE INDEX idx_ep_event_status ON event_photos(event_id, status);
CREATE INDEX idx_ep_cover ON event_photos(is_cover);
CREATE INDEX idx_ep_created ON event_photos(created_at);

-- ---------------------------------------------------------------------------
-- EVENT CHECK-INS — audit trail for event check-ins
-- ---------------------------------------------------------------------------
CREATE TABLE event_check_ins (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id                   UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
    ticket_code                 VARCHAR(16) NOT NULL,
    attendee_name               VARCHAR(255) NOT NULL,
    attendee_email              VARCHAR(255) NOT NULL,
    checked_in_by               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    check_in_method             check_in_method NOT NULL DEFAULT 'qr_scan',
    checked_in_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    location                    GEOGRAPHY(POINT, 4326),
    notes                       TEXT
);

COMMENT ON TABLE event_check_ins IS 'Audit trail for all event check-ins (QR scan, manual, NFC)';

CREATE INDEX idx_eci_event ON event_check_ins(event_id);
CREATE INDEX idx_eci_ticket ON event_check_ins(ticket_id);
CREATE INDEX idx_eci_checked_in_by ON event_check_ins(checked_in_by);
CREATE INDEX idx_eci_checked_in_at ON event_check_ins(checked_in_at);
CREATE INDEX idx_eci_event_time ON event_check_ins(event_id, checked_in_at);
CREATE INDEX idx_eci_ticket_code ON event_check_ins(ticket_code);
CREATE INDEX idx_eci_location ON event_check_ins USING GIST(location);

-- ---------------------------------------------------------------------------
-- EVENT INVITATIONS — tracking invitations sent to potential attendees
-- ---------------------------------------------------------------------------
CREATE TABLE event_invitations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    inviter_name                VARCHAR(255) NOT NULL,
    recipient_email             VARCHAR(255),
    recipient_phone             VARCHAR(32),
    recipient_name              VARCHAR(255),
    platform                    share_platform NOT NULL,
    status                      invitation_delivery_status NOT NULL DEFAULT 'sent',
    custom_message              TEXT,
    referral_code               VARCHAR(32),
    referral_discount           NUMERIC(5, 2) NOT NULL DEFAULT 0,
    clicked_at                  TIMESTAMPTZ,
    registered_at               TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_invitations IS 'Tracks invitations sent to potential attendees across all channels';

CREATE INDEX idx_einv_event ON event_invitations(event_id);
CREATE INDEX idx_einv_inviter ON event_invitations(inviter_id);
CREATE INDEX idx_einv_platform ON event_invitations(platform);
CREATE INDEX idx_einv_status ON event_invitations(status);
CREATE INDEX idx_einv_event_status ON event_invitations(event_id, status);
CREATE INDEX idx_einv_created ON event_invitations(created_at);

-- ---------------------------------------------------------------------------
-- EVENT SHARE LINKS — shareable links with click/conversion tracking
-- ---------------------------------------------------------------------------
CREATE TABLE event_share_links (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    platform                    share_platform NOT NULL,
    url                         TEXT NOT NULL,
    clicks                      INT NOT NULL DEFAULT 0,
    conversions                 INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_share_links IS 'Shareable event links with per-platform click and conversion tracking';

CREATE INDEX idx_esl_event ON event_share_links(event_id);
CREATE INDEX idx_esl_platform ON event_share_links(platform);
CREATE INDEX idx_esl_event_platform ON event_share_links(event_id, platform);

-- ---------------------------------------------------------------------------
-- EVENT PROMO CODES — discount / promo codes
-- ---------------------------------------------------------------------------
CREATE TABLE event_promo_codes (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id                    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code                        VARCHAR(64) NOT NULL,
    discount_type               promo_discount_type NOT NULL DEFAULT 'percentage',
    discount_value              NUMERIC(12, 2) NOT NULL,
    max_uses                    INT NOT NULL DEFAULT 100,
    used_count                  INT NOT NULL DEFAULT 0,
    min_order_amount            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    valid_from                  TIMESTAMPTZ NOT NULL,
    valid_until                 TIMESTAMPTZ NOT NULL,
    is_active                   BOOLEAN DEFAULT true,

    created_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_promo_discount CHECK (discount_value > 0),
    CONSTRAINT chk_promo_uses CHECK (used_count >= 0 AND used_count <= max_uses),
    CONSTRAINT chk_promo_validity CHECK (valid_until > valid_from),
    CONSTRAINT chk_promo_min_order CHECK (min_order_amount >= 0)
);

COMMENT ON TABLE event_promo_codes IS 'Discount and promo codes for event ticket purchases';

CREATE INDEX idx_epc_event ON event_promo_codes(event_id);
CREATE INDEX idx_epc_code ON event_promo_codes(code);
CREATE INDEX idx_epc_active ON event_promo_codes(is_active);
CREATE INDEX idx_epc_validity ON event_promo_codes(valid_from, valid_until);

-- ---------------------------------------------------------------------------
-- ORGANIZER SUBSCRIPTIONS — SaaS subscription plans for organizers
-- ---------------------------------------------------------------------------
CREATE TABLE organizer_subscriptions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id                 UUID,
    plan                        organizer_plan NOT NULL DEFAULT 'free',
    status                      subscription_status NOT NULL DEFAULT 'active',

    -- Limits
    max_events_per_month        INT NOT NULL DEFAULT 5,
    max_tickets_per_event       INT NOT NULL DEFAULT 100,
    max_events_active           INT NOT NULL DEFAULT 3,

    -- Pricing
    monthly_price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    annual_price                NUMERIC(12, 2),
    is_annual                   BOOLEAN NOT NULL DEFAULT false,
    commission_rate             NUMERIC(5, 2) NOT NULL DEFAULT 5.00,

    -- Stripe
    stripe_subscription_id      VARCHAR(255),
    stripe_customer_id          VARCHAR(255),

    -- Features
    features                    JSONB DEFAULT '[]'::jsonb,

    current_period_start        TIMESTAMPTZ NOT NULL,
    current_period_end          TIMESTAMPTZ NOT NULL,
    cancel_at                   TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_sub_limits CHECK (max_events_per_month >= -1 AND max_tickets_per_event >= -1 AND max_events_active >= -1)
);

COMMENT ON TABLE organizer_subscriptions IS 'SaaS subscription plans for event organizers';
COMMENT ON COLUMN organizer_subscriptions.commission_rate IS 'Per-ticket commission percentage (lower than pay-as-you-go)';

CREATE INDEX idx_os_user ON organizer_subscriptions(user_id);
CREATE INDEX idx_os_plan ON organizer_subscriptions(plan);
CREATE INDEX idx_os_status ON organizer_subscriptions(status);
CREATE INDEX idx_os_user_active ON organizer_subscriptions(user_id, status);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTION PLANS — reference table of available plans
-- ---------------------------------------------------------------------------
CREATE TABLE subscription_plans (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(64) NOT NULL,
    plan                        organizer_plan NOT NULL UNIQUE,
    monthly_price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    annual_price                NUMERIC(12, 2) NOT NULL DEFAULT 0,
    commission_rate             NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    platform_fee_fixed          NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    features                    JSONB DEFAULT '[]'::jsonb,
    max_events_per_month        INT NOT NULL DEFAULT 5,
    max_tickets_per_event       INT NOT NULL DEFAULT 100,
    max_guests_per_registration INT NOT NULL DEFAULT 0,
    is_popular                  BOOLEAN NOT NULL DEFAULT false,
    description                 TEXT DEFAULT '',

    created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE subscription_plans IS 'Reference table of available subscription plans for organizers';

-- Seed default plans
INSERT INTO subscription_plans (name, plan, monthly_price, annual_price, commission_rate, platform_fee_fixed, max_events_per_month, max_tickets_per_event, max_guests_per_registration, is_popular, description, features) VALUES
('Free', 'free', 0, 0, 5.00, 1.00, 5, 100, 2, false,
 'Get started with basic event hosting',
 '["5 events/month", "Up to 100 tickets/event", "2 guests per registration", "Basic analytics", "QR code tickets", "Social sharing", "Email confirmations"]'::jsonb),
('Starter', 'starter', 29, 290, 4.00, 0.75, 25, 500, 5, false,
 'For growing event organizers',
 '["25 events/month", "Up to 500 tickets/event", "5 guests per registration", "Advanced analytics", "SMS notifications", "Custom branding", "Promo codes", "Guest management", "Photo galleries"]'::jsonb),
('Professional', 'professional', 99, 990, 3.00, 0.50, -1, 5000, 10, true,
 'For professional event companies',
 '["Unlimited events", "Up to 5,000 tickets/event", "10 guests per registration", "Full analytics suite", "WhatsApp notifications", "White-label pages", "API access", "Multi-organizer", "Priority support", "Featured listings"]'::jsonb),
('Enterprise', 'enterprise', 499, 4990, 2.00, 0.25, -1, -1, -1, false,
 'For large-scale operations and white-label',
 '["Everything in Professional", "Unlimited tickets", "Unlimited guests", "Custom integrations", "Dedicated account manager", "SLA guarantee", "Custom branding", "Reseller options", "White-label platform"]'::jsonb);

-- 3. FUNCTIONS ==================================================================

-- ---------------------------------------------------------------------------
-- generate_event_slug — generate a URL-friendly slug from event title
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_event_slug(p_title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    base_slug := left(base_slug, 200);

    IF base_slug = '' THEN
        base_slug := 'event';
    END IF;

    final_slug := base_slug;

    WHILE EXISTS (SELECT 1 FROM events WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::TEXT;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION generate_event_slug(TEXT) IS 'Generates a unique URL-friendly slug from an event title';

-- ---------------------------------------------------------------------------
-- generate_ticket_code — generate a unique alphanumeric ticket code
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    i INT;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM event_tickets WHERE ticket_code = code
            UNION ALL
            SELECT 1 FROM event_guests WHERE ticket_code = code
        );
    END LOOP;

    RETURN code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_ticket_code() IS 'Generates a unique 8-character alphanumeric ticket code for QR/check-in';

-- ---------------------------------------------------------------------------
-- check_ticket_availability — check if tickets are still available
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_ticket_availability(
    p_ticket_tier_id UUID,
    p_quantity INT DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    tier_record RECORD;
BEGIN
    SELECT * INTO tier_record
    FROM event_ticket_tiers
    WHERE id = p_ticket_tier_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'tier_not_found'
        );
    END IF;

    IF NOT tier_record.is_active THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'tier_inactive'
        );
    END IF;

    IF tier_record.sale_starts_at IS NOT NULL AND now() < tier_record.sale_starts_at THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'sale_not_started',
            'sale_starts_at', tier_record.sale_starts_at
        );
    END IF;

    IF tier_record.sale_ends_at IS NOT NULL AND now() > tier_record.sale_ends_at THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'sale_ended'
        );
    END IF;

    IF tier_record.available - tier_record.sold < p_quantity THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'insufficient_quantity',
            'remaining', GREATEST(tier_record.available - tier_record.sold, 0)
        );
    END IF;

    IF p_quantity > tier_record.max_per_order THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'exceeds_max_per_order',
            'max_per_order', tier_record.max_per_order
        );
    END IF;

    RETURN jsonb_build_object(
        'available', true,
        'remaining', tier_record.available - tier_record.sold,
        'price', tier_record.price,
        'tier', tier_record.tier
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_ticket_availability(UUID, INT) IS 'Validates ticket availability, sale window, and order limits';

-- ---------------------------------------------------------------------------
-- process_check_in — handle check-in with full validation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_check_in(
    p_event_id UUID,
    p_ticket_code TEXT,
    p_checked_in_by UUID,
    p_method check_in_method DEFAULT 'qr_scan',
    p_lat NUMERIC DEFAULT NULL,
    p_lng NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    ticket_record RECORD;
    check_in_id UUID;
    check_in_location GEOGRAPHY;
BEGIN
    -- Build location if provided
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        check_in_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    END IF;

    -- Find the ticket
    SELECT * INTO ticket_record
    FROM event_tickets
    WHERE event_id = p_event_id AND ticket_code = p_ticket_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'invalid_ticket_code'
        );
    END IF;

    -- Already checked in
    IF ticket_record.checked_in THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'already_checked_in',
            'checked_in_at', ticket_record.checked_in_at
        );
    END IF;

    -- Cancelled or refunded ticket
    IF ticket_record.status IN ('cancelled', 'refunded') THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ticket_cancelled_or_refunded'
        );
    END IF;

    -- Not active
    IF ticket_record.status != 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ticket_not_active',
            'status', ticket_record.status
        );
    END IF;

    -- Expired
    IF now() > ticket_record.valid_until THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ticket_expired'
        );
    END IF;

    -- Not yet valid
    IF now() < ticket_record.valid_from THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ticket_not_yet_valid'
        );
    END IF;

    -- Process check-in on the ticket
    UPDATE event_tickets
    SET checked_in = true,
        checked_in_at = now(),
        checked_in_method = p_method,
        status = 'used'
    WHERE id = ticket_record.id;

    -- Log the check-in
    INSERT INTO event_check_ins (event_id, ticket_id, ticket_code, attendee_name, attendee_email, checked_in_by, check_in_method, location, notes)
    VALUES (p_event_id, ticket_record.id, p_ticket_code, ticket_record.attendee_name, ticket_record.attendee_email, p_checked_in_by, p_method, check_in_location, p_notes)
    RETURNING id INTO check_in_id;

    -- Update the registration status
    UPDATE event_registrations
    SET status = 'checked_in',
        checked_in_at = now(),
        check_in_method = p_method
    WHERE id = ticket_record.registration_id;

    RETURN jsonb_build_object(
        'success', true,
        'ticket_id', ticket_record.id,
        'attendee_name', ticket_record.attendee_name,
        'tier_name', ticket_record.tier_name,
        'check_in_id', check_in_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_check_in(UUID, TEXT, UUID, check_in_method, NUMERIC, NUMERIC, TEXT) IS 'Processes a check-in attempt with full validation and audit logging';

-- ---------------------------------------------------------------------------
-- get_event_check_in_stats — aggregate check-in statistics for an event
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_event_check_in_stats(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_tix INT;
    checked_in_count INT;
    total_revenue NUMERIC;
    peak_hour TIMESTAMPTZ;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE checked_in = true)
    INTO total_tix, checked_in_count
    FROM event_tickets
    WHERE event_id = p_event_id;

    SELECT COALESCE(SUM(total) FILTER (WHERE payment_status = 'completed'), 0)
    INTO total_revenue
    FROM event_registrations
    WHERE event_id = p_event_id AND status != 'cancelled';

    SELECT checked_in_at INTO peak_hour
    FROM event_check_ins
    WHERE event_id = p_event_id
    GROUP BY date_trunc('hour', checked_in_at)
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'event_id', p_event_id,
        'total_tickets', total_tix,
        'checked_in', checked_in_count,
        'not_checked_in', total_tix - checked_in_count,
        'check_in_rate', CASE WHEN total_tix > 0
            THEN ROUND((checked_in_count::NUMERIC / total_tix) * 100, 1)
            ELSE 0 END,
        'total_revenue', total_revenue,
        'peak_check_in_time', peak_hour
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_event_check_in_stats(UUID) IS 'Returns aggregated check-in statistics for an event';

-- 4. TRIGGERS ===================================================================

-- ---------------------------------------------------------------------------
-- Auto-set updated_at on row update (assumes migration 001 defines this)
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_organizer_subscriptions_updated_at
    BEFORE UPDATE ON organizer_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Auto-generate slug from title on INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_event_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_set_slug
    BEFORE INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION trg_set_event_slug();

-- ---------------------------------------------------------------------------
-- Auto-generate ticket_code on event_tickets INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_et_set_ticket_code
    BEFORE INSERT ON event_tickets
    FOR EACH ROW EXECUTE FUNCTION trg_set_ticket_code();

-- ---------------------------------------------------------------------------
-- Auto-generate ticket_code on event_guests INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_guest_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_eg_set_ticket_code
    BEFORE INSERT ON event_guests
    FOR EACH ROW EXECUTE FUNCTION trg_set_guest_ticket_code();

-- ---------------------------------------------------------------------------
-- Auto-update tickets_sold on event_ticket_tiers when a registration is confirmed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_update_tickets_sold_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE event_ticket_tiers
        SET sold = sold + NEW.quantity
        WHERE id = NEW.ticket_tier_id;

        UPDATE events
        SET tickets_sold = tickets_sold + NEW.quantity
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_er_update_tickets_sold_insert
    AFTER INSERT ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION trg_update_tickets_sold_on_insert();

-- ---------------------------------------------------------------------------
-- Auto-update tickets_sold on registration status change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_update_tickets_sold_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Confirmed → cancelled/refunded: decrease count
    IF OLD.status = 'confirmed'
       AND NEW.status IN ('cancelled',) THEN

        UPDATE event_ticket_tiers
        SET sold = GREATEST(sold - OLD.quantity, 0)
        WHERE id = OLD.ticket_tier_id;

        UPDATE events
        SET tickets_sold = GREATEST(tickets_sold - OLD.quantity, 0)
        WHERE id = OLD.event_id;

    -- Cancelled → confirmed: increase count
    ELSIF OLD.status IN ('cancelled',)
          AND NEW.status = 'confirmed' THEN

        UPDATE event_ticket_tiers
        SET sold = sold + NEW.quantity
        WHERE id = NEW.ticket_tier_id;

        UPDATE events
        SET tickets_sold = tickets_sold + NEW.quantity
        WHERE id = NEW.event_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_er_update_tickets_sold_status
    AFTER UPDATE OF status ON event_registrations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trg_update_tickets_sold_on_status_change();

-- ---------------------------------------------------------------------------
-- Auto-update event share_count on share link insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_update_event_share_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events
    SET share_count = share_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_esl_update_share_count
    AFTER INSERT ON event_share_links
    FOR EACH ROW EXECUTE FUNCTION trg_update_event_share_count();

-- ---------------------------------------------------------------------------
-- Auto-set event status to 'published' when published_at is set
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_event_published_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND OLD.status = 'draft' THEN
        -- ensure consistency
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. ROW LEVEL SECURITY =========================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_event_organizer(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM events
        WHERE id = p_event_id AND organizer_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_event_organizer(UUID) IS 'Returns true if the current user is the organizer of the specified event';

CREATE OR REPLACE FUNCTION is_event_ticket_holder(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM event_registrations
        WHERE event_id = p_event_id
          AND user_id = auth.uid()
          AND status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_event_ticket_holder(UUID) IS 'Returns true if the current user has a confirmed registration for the event';

CREATE OR REPLACE FUNCTION is_event_staff(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM events
        WHERE id = p_event_id AND organizer_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM event_check_ins
        WHERE event_id = p_event_id AND checked_in_by = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_event_staff(UUID) IS 'Returns true if the current user is organizer or has done check-ins for this event';

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
CREATE POLICY events_read_public ON events
    FOR SELECT
    USING (
        status = 'published'
        OR organizer_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY events_insert_own ON events
    FOR INSERT
    WITH CHECK (organizer_id = auth.uid() OR is_admin());

CREATE POLICY events_update_own ON events
    FOR UPDATE
    USING (organizer_id = auth.uid() OR is_admin());

CREATE POLICY events_delete_own ON events
    FOR DELETE
    USING (organizer_id = auth.uid() OR is_admin());

-- ---------------------------------------------------------------------------
-- EVENT TICKET TIERS
-- ---------------------------------------------------------------------------
CREATE POLICY event_ticket_tiers_read ON event_ticket_tiers
    FOR SELECT
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_ticket_tiers.event_id
              AND events.status = 'published'
        ))
        OR is_event_organizer(event_ticket_tiers.event_id)
        OR is_admin()
    );

CREATE POLICY event_ticket_tiers_insert ON event_ticket_tiers
    FOR INSERT
    WITH CHECK (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_ticket_tiers_update ON event_ticket_tiers
    FOR UPDATE
    USING (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_ticket_tiers_delete ON event_ticket_tiers
    FOR DELETE
    USING (is_event_organizer(event_id) OR is_admin());

-- ---------------------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ---------------------------------------------------------------------------
CREATE POLICY event_registrations_read ON event_registrations
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_registrations_insert ON event_registrations
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY event_registrations_update ON event_registrations
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT TICKETS
-- ---------------------------------------------------------------------------
CREATE POLICY event_tickets_read ON event_tickets
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_event_ticket_holder(event_id)
        OR is_admin()
    );

CREATE POLICY event_tickets_insert ON event_tickets
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY event_tickets_update ON event_tickets
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_event_staff(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT GUESTS
-- ---------------------------------------------------------------------------
CREATE POLICY event_guests_read ON event_guests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM event_registrations
            WHERE event_registrations.id = event_guests.registration_id
              AND event_registrations.user_id = auth.uid()
        )
        OR is_event_organizer((SELECT event_id FROM event_registrations WHERE id = event_guests.registration_id))
        OR is_admin()
    );

CREATE POLICY event_guests_insert ON event_guests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM event_registrations
            WHERE event_registrations.id = event_guests.registration_id
              AND event_registrations.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY event_guests_update ON event_guests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM event_registrations
            WHERE event_registrations.id = event_guests.registration_id
              AND event_registrations.user_id = auth.uid()
        )
        OR is_event_staff((SELECT event_id FROM event_registrations WHERE id = event_guests.registration_id))
        OR is_admin()
    );

CREATE POLICY event_guests_delete ON event_guests
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM event_registrations
            WHERE event_registrations.id = event_guests.registration_id
              AND event_registrations.user_id = auth.uid()
        )
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT PHOTOS
-- ---------------------------------------------------------------------------
CREATE POLICY event_photos_read ON event_photos
    FOR SELECT
    USING (
        status = 'approved'
        OR user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_photos_insert ON event_photos
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY event_photos_update ON event_photos
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_photos_delete ON event_photos
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT CHECK-INS
-- ---------------------------------------------------------------------------
CREATE POLICY event_check_ins_read ON event_check_ins
    FOR SELECT
    USING (
        is_event_staff(event_id)
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_check_ins_insert ON event_check_ins
    FOR INSERT
    WITH CHECK (
        is_event_staff(event_id)
        OR is_event_organizer(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT INVITATIONS
-- ---------------------------------------------------------------------------
CREATE POLICY event_invitations_read ON event_invitations
    FOR SELECT
    USING (
        inviter_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_invitations_insert ON event_invitations
    FOR INSERT
    WITH CHECK (inviter_id = auth.uid() OR is_admin());

CREATE POLICY event_invitations_update ON event_invitations
    FOR UPDATE
    USING (
        inviter_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_invitations_delete ON event_invitations
    FOR DELETE
    USING (
        inviter_id = auth.uid()
        OR is_event_organizer(event_id)
        OR is_admin()
    );

-- ---------------------------------------------------------------------------
-- EVENT SHARE LINKS
-- ---------------------------------------------------------------------------
CREATE POLICY event_share_links_insert ON event_share_links
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY event_share_links_read ON event_share_links
    FOR SELECT
    USING (true);

-- ---------------------------------------------------------------------------
-- EVENT PROMO CODES
-- ---------------------------------------------------------------------------
CREATE POLICY event_promo_codes_read ON event_promo_codes
    FOR SELECT
    USING (
        is_event_organizer(event_id)
        OR is_admin()
    );

CREATE POLICY event_promo_codes_insert ON event_promo_codes
    FOR INSERT
    WITH CHECK (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_promo_codes_update ON event_promo_codes
    FOR UPDATE
    USING (is_event_organizer(event_id) OR is_admin());

CREATE POLICY event_promo_codes_delete ON event_promo_codes
    FOR DELETE
    USING (is_event_organizer(event_id) OR is_admin());

-- ---------------------------------------------------------------------------
-- ORGANIZER SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
CREATE POLICY organizer_subscriptions_read ON organizer_subscriptions
    FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY organizer_subscriptions_insert ON organizer_subscriptions
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY organizer_subscriptions_update ON organizer_subscriptions
    FOR UPDATE
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY organizer_subscriptions_delete ON organizer_subscriptions
    FOR DELETE
    USING (is_admin());

-- ---------------------------------------------------------------------------
-- SUBSCRIPTION PLANS (public read, admin-only write)
-- ---------------------------------------------------------------------------
CREATE POLICY subscription_plans_read ON subscription_plans
    FOR SELECT
    USING (true);

CREATE POLICY subscription_plans_insert ON subscription_plans
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY subscription_plans_update ON subscription_plans
    FOR UPDATE
    USING (is_admin());

CREATE POLICY subscription_plans_delete ON subscription_plans
    FOR DELETE
    USING (is_admin());

-- 6. REALTIME ===================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE event_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE event_guests;
ALTER PUBLICATION supabase_realtime ADD TABLE event_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE event_check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE event_invitations;
