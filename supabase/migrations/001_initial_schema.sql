-- ============================================================================
-- AfriBook Global Marketplace — Initial Schema Migration
-- Supabase PostgreSQL migration for a multi-vendor marketplace platform
-- supporting services, products, food ordering, ride-hailing, delivery, and
-- a full payment orchestration layer with escrow, payouts, and disputes.
-- ============================================================================
-- Migration: 001_initial_schema
-- Description: Creates all foundational tables, enums, functions, triggers,
--              indexes, RLS policies, and table comments.
-- ============================================================================

-- 0. EXTENSIONS ==============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES ==============================================================

CREATE TYPE user_role AS ENUM (
    'customer',
    'vendor',
    'staff',
    'driver',
    'super_admin',
    'country_admin',
    'support_admin',
    'compliance_admin',
    'payment_admin'
);

CREATE TYPE business_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'closed'
);

CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'partially_refunded'
);

CREATE TYPE payment_escrow_status AS ENUM (
    'held',
    'released',
    'partially_released',
    'disputed'
);

CREATE TYPE payout_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'on_hold'
);

CREATE TYPE dispute_status AS ENUM (
    'opened',
    'investigation',
    'resolved',
    'appeal',
    'closed'
);

CREATE TYPE ride_status AS ENUM (
    'requested',
    'accepted',
    'arrived',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE delivery_status AS ENUM (
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'delivered',
    'failed'
);

CREATE TYPE driver_status AS ENUM (
    'offline',
    'online',
    'busy',
    'on_trip'
);

CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'country_admin',
    'support_admin',
    'compliance_admin',
    'payment_admin',
    'dispute_admin',
    'fraud_admin'
);

CREATE TYPE kyc_status AS ENUM (
    'not_submitted',
    'pending',
    'verified',
    'rejected'
);

-- 2. CORE TABLES =============================================================

-- Countries: reference data for supported markets
CREATE TABLE countries (
    code          VARCHAR(4) PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    flag_url      TEXT,
    currency_code VARCHAR(3) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    timezone      VARCHAR(64),
    phone_format  VARCHAR(32),
    payment_methods JSONB DEFAULT '[]'::jsonb,
    minimum_fee_floor NUMERIC(12, 2) DEFAULT 0,
    tax_rate      NUMERIC(5, 4) DEFAULT 0,
    legal_terms   TEXT,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE countries IS 'Supported countries / markets on the AfriBook platform';

-- Currencies: multi-currency support with exchange rates
CREATE TABLE currencies (
    code          VARCHAR(10) PRIMARY KEY,
    symbol        VARCHAR(10) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    exchange_rate NUMERIC(18, 6) DEFAULT 1,
    is_active     BOOLEAN DEFAULT true
);

COMMENT ON TABLE currencies IS 'Supported currencies and their exchange rates relative to platform base';

-- Languages: i18n support
CREATE TABLE languages (
    code          VARCHAR(10) PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    native_name   VARCHAR(255),
    is_rtl        BOOLEAN DEFAULT false,
    is_active     BOOLEAN DEFAULT true
);

COMMENT ON TABLE languages IS 'Supported languages for platform localisation';

-- 3. AUTH / USERS ============================================================

-- Profiles: extends auth.users with marketplace-specific fields
CREATE TABLE profiles (
    id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email             VARCHAR(255) NOT NULL,
    role              user_role DEFAULT 'customer',
    full_name         VARCHAR(255),
    phone             VARCHAR(32),
    avatar_url        TEXT,
    country_code      VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    preferred_language VARCHAR(10) REFERENCES languages(code) ON DELETE SET NULL,
    is_verified       BOOLEAN DEFAULT false,
    kyc_status        kyc_status DEFAULT 'not_submitted',
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles linked to auth.users with roles and KYC status';

-- User sessions: track active sessions and device info
CREATE TABLE user_sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_info   JSONB DEFAULT '{}'::jsonb,
    ip_address    INET,
    user_agent    TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_sessions IS 'Track user login sessions and device metadata';

-- 4. BUSINESSES / VENDORS ====================================================

-- Business categories: hierarchical taxonomy
CREATE TABLE business_categories (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    icon          TEXT,
    parent_id     UUID REFERENCES business_categories(id) ON DELETE SET NULL,
    country_code  VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    sort_order    INT DEFAULT 0
);

COMMENT ON TABLE business_categories IS 'Hierarchical business category taxonomy per country';

-- Businesses: vendor stores/service providers
CREATE TABLE businesses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    category            UUID REFERENCES business_categories(id) ON DELETE SET NULL,
    subcategory         VARCHAR(255),
    country_code        VARCHAR(4) NOT NULL REFERENCES countries(code) ON DELETE RESTRICT,
    address             JSONB DEFAULT '{}'::jsonb,
    location            GEOGRAPHY(POINT, 4326),
    media               JSONB DEFAULT '[]'::jsonb,
    hours               JSONB DEFAULT '{}'::jsonb,
    status              business_status DEFAULT 'pending',
    verification_status VARCHAR(32) DEFAULT 'unverified',
    rating              NUMERIC(3, 2) DEFAULT 0,
    qr_booking_url      TEXT,
    cancellation_policy TEXT,
    no_show_policy      TEXT,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE businesses IS 'Vendor businesses — stores, service providers, and restaurants';

-- Business staff: employees linked to a business
CREATE TABLE business_staff (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(64),
    email         VARCHAR(255),
    phone         VARCHAR(32),
    schedule      JSONB DEFAULT '{}'::jsonb,
    services      UUID[] DEFAULT '{}',
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE business_staff IS 'Staff members working at a business';

-- Staff weekly schedules
CREATE TABLE staff_schedule (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id      UUID NOT NULL REFERENCES business_staff(id) ON DELETE CASCADE,
    day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    is_available  BOOLEAN DEFAULT true
);

COMMENT ON TABLE staff_schedule IS 'Recurring weekly schedule for each staff member';

-- Staff break times
CREATE TABLE staff_breaks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id      UUID NOT NULL REFERENCES business_staff(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    reason        TEXT
);

COMMENT ON TABLE staff_breaks IS 'Ad-hoc break entries for staff members';

-- Staff time-off requests
CREATE TABLE staff_time_off (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id      UUID NOT NULL REFERENCES business_staff(id) ON DELETE CASCADE,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    reason        TEXT,
    approved      BOOLEAN DEFAULT false
);

COMMENT ON TABLE staff_time_off IS 'Time-off / leave requests for staff members';

-- 5. SERVICES & PRODUCTS =====================================================

-- Services: offered by businesses (salon, consulting, etc.)
CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    duration_minutes    INT NOT NULL CHECK (duration_minutes > 0),
    price               NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'USD',
    category            VARCHAR(255),
    image               TEXT,
    is_available        BOOLEAN DEFAULT true,
    max_per_day         INT,
    advance_booking_days INT DEFAULT 30,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE services IS 'Services offered by businesses with duration and pricing';

-- Service variants: add-ons, tiers, packages
CREATE TABLE service_variants (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    price             NUMERIC(12, 2),
    duration_minutes  INT CHECK (duration_minutes > 0)
);

COMMENT ON TABLE service_variants IS 'Variants for services — different tiers, add-ons, or packages';

-- Products: physical goods sold by businesses
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price           NUMERIC(12, 2) NOT NULL,
    compare_price   NUMERIC(12, 2),
    currency        VARCHAR(10) DEFAULT 'USD',
    stock           INT DEFAULT 0,
    images          JSONB DEFAULT '[]'::jsonb,
    variants        JSONB DEFAULT '[]'::jsonb,
    category        VARCHAR(255),
    tags            TEXT[] DEFAULT '{}',
    is_available    BOOLEAN DEFAULT true,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE products IS 'Physical products sold by businesses';

-- Inventory log: stock movement audit trail
CREATE TABLE inventory_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INT NOT NULL,
    reason          VARCHAR(255),
    reference_id    UUID,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE inventory_log IS 'Audit trail for product stock changes';

-- 6. RESTAURANTS =============================================================

-- Restaurants: food-specific business extensions
CREATE TABLE restaurants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    cuisine_type        VARCHAR(128),
    preparation_time    INT DEFAULT 15 CHECK (preparation_time > 0),
    delivery_radius_km  NUMERIC(8, 2),
    minimum_order       NUMERIC(12, 2) DEFAULT 0,
    service_hours       JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE restaurants IS 'Restaurant-specific extensions for food businesses';

-- Menu categories
CREATE TABLE menu_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    sort_order      INT DEFAULT 0,
    is_available    BOOLEAN DEFAULT true
);

COMMENT ON TABLE menu_categories IS 'Menu category groupings for restaurants';

-- Menu items
CREATE TABLE menu_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id       UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    price             NUMERIC(12, 2) NOT NULL,
    currency          VARCHAR(10) DEFAULT 'USD',
    image             TEXT,
    ingredients       TEXT[] DEFAULT '{}',
    allergens         TEXT[] DEFAULT '{}',
    preparation_time  INT,
    is_available      BOOLEAN DEFAULT true,
    modifiers         JSONB DEFAULT '[]'::jsonb,
    metadata          JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE menu_items IS 'Individual menu items with pricing, ingredients, and modifiers';

-- 7. DRIVERS / COURIERS ======================================================

-- Drivers: delivery and ride-hailing drivers
CREATE TABLE drivers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status            driver_status DEFAULT 'offline',
    current_location  GEOGRAPHY(POINT, 4326),
    is_available      BOOLEAN DEFAULT false,
    earnings_total    NUMERIC(14, 2) DEFAULT 0,
    rating            NUMERIC(3, 2) DEFAULT 0,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE drivers IS 'Driver profiles for ride-hailing and delivery services';

-- Vehicles
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    make            VARCHAR(64) NOT NULL,
    model           VARCHAR(64) NOT NULL,
    year            SMALLINT,
    color           VARCHAR(32),
    plate_number    VARCHAR(32) NOT NULL,
    type            VARCHAR(32),
    documents       JSONB DEFAULT '[]'::jsonb,
    is_active       BOOLEAN DEFAULT true
);

COMMENT ON TABLE vehicles IS 'Driver-owned or operated vehicles';

-- Driver documents
CREATE TABLE driver_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type            VARCHAR(64) NOT NULL,
    url             TEXT NOT NULL,
    status          VARCHAR(32) DEFAULT 'pending',
    expiry_date     DATE,
    uploaded_at     TIMESTAMPTZ DEFAULT now(),
    verified_at     TIMESTAMPTZ
);

COMMENT ON TABLE driver_documents IS 'Driver document uploads (licence, insurance, etc.)';

-- 8. BOOKINGS =================================================================

-- Bookings: service appointment reservations
CREATE TABLE bookings (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_id        UUID REFERENCES services(id) ON DELETE SET NULL,
    customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    staff_id          UUID REFERENCES business_staff(id) ON DELETE SET NULL,
    start_time        TIMESTAMPTZ NOT NULL,
    end_time          TIMESTAMPTZ NOT NULL,
    status            booking_status DEFAULT 'pending',
    amount            NUMERIC(12, 2) NOT NULL,
    currency          VARCHAR(10) DEFAULT 'USD',
    payment_status    payment_status DEFAULT 'pending',
    payment_id        UUID,
    notes             TEXT,
    is_walk_in        BOOLEAN DEFAULT false,
    qr_check_in       TEXT,
    reminders_sent    JSONB DEFAULT '[]'::jsonb,
    cancellation_reason TEXT,
    no_show           BOOLEAN DEFAULT false,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE bookings IS 'Service appointment bookings with full lifecycle tracking';

-- Booking reminders
CREATE TABLE booking_reminders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type            VARCHAR(32) NOT NULL,
    channel         VARCHAR(32),
    sent_at         TIMESTAMPTZ,
    status          VARCHAR(32) DEFAULT 'pending'
);

COMMENT ON TABLE booking_reminders IS 'Outbound reminders sent for bookings';

-- Booking status history
CREATE TABLE booking_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status booking_status,
    new_status      booking_status NOT NULL,
    changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE booking_history IS 'Status change audit trail for bookings';

-- 9. ORDERS ===================================================================

-- Orders: product, food, or mixed-order transactions
CREATE TABLE orders (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type              VARCHAR(32) NOT NULL CHECK (type IN ('products', 'food', 'mixed')),
    status            order_status DEFAULT 'pending',
    items             JSONB DEFAULT '[]'::jsonb,
    subtotal          NUMERIC(14, 2) NOT NULL,
    tax               NUMERIC(14, 2) DEFAULT 0,
    delivery_fee      NUMERIC(14, 2) DEFAULT 0,
    total             NUMERIC(14, 2) NOT NULL,
    currency          VARCHAR(10) DEFAULT 'USD',
    payment_status    payment_status DEFAULT 'pending',
    payment_id        UUID,
    delivery_address  JSONB DEFAULT '{}'::jsonb,
    notes             TEXT,
    estimated_at      TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE orders IS 'Product and food orders with payment and delivery tracking';

-- Order line items
CREATE TABLE order_items (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type             VARCHAR(32) NOT NULL,
    item_id               UUID,
    name                  VARCHAR(255) NOT NULL,
    quantity              NUMERIC(10, 3) NOT NULL CHECK (quantity > 0),
    unit_price            NUMERIC(14, 2) NOT NULL,
    modifiers             JSONB DEFAULT '[]'::jsonb,
    special_instructions  TEXT
);

COMMENT ON TABLE order_items IS 'Individual line items within an order';

-- Order status history
CREATE TABLE order_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status      order_status NOT NULL,
    changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE order_status_history IS 'Status change audit trail for orders';

-- 10. RIDES / DELIVERY =======================================================

-- Ride requests: point-to-point ride hailing
CREATE TABLE ride_requests (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    driver_id         UUID REFERENCES drivers(id) ON DELETE SET NULL,
    pickup_location   GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address    TEXT,
    dropoff_location  GEOGRAPHY(POINT, 4326) NOT NULL,
    dropoff_address   TEXT,
    status            ride_status DEFAULT 'requested',
    distance_km       NUMERIC(10, 2),
    estimated_fare    NUMERIC(12, 2),
    final_fare        NUMERIC(12, 2),
    currency          VARCHAR(10) DEFAULT 'USD',
    payment_id        UUID,
    rating            SMALLINT CHECK (rating BETWEEN 1 AND 5),
    feedback          TEXT,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ride_requests IS 'Ride-hailing requests with pickup/dropoff geocoding';

-- Deliveries: courier delivery assignments
CREATE TABLE deliveries (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id         UUID REFERENCES drivers(id) ON DELETE SET NULL,
    pickup_location   GEOGRAPHY(POINT, 4326),
    dropoff_location  GEOGRAPHY(POINT, 4326),
    status            delivery_status DEFAULT 'pending',
    estimated_at      TIMESTAMPTZ,
    picked_up_at      TIMESTAMPTZ,
    delivered_at      TIMESTAMPTZ,
    distance_km       NUMERIC(10, 2),
    fee               NUMERIC(12, 2),
    metadata          JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE deliveries IS 'Delivery assignments linking orders to drivers';

-- 11. PAYMENTS — THE ORCHESTRATOR ============================================

-- Payment providers: configured payment gateways
CREATE TABLE payment_providers (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                  VARCHAR(64) UNIQUE NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    is_active             BOOLEAN DEFAULT true,
    supported_countries   TEXT[] DEFAULT '{}',
    supported_methods     TEXT[] DEFAULT '{}',
    processor_fee_percent NUMERIC(5, 4) DEFAULT 0,
    processor_fee_fixed   NUMERIC(12, 4) DEFAULT 0
);

COMMENT ON TABLE payment_providers IS 'Configured payment gateway providers';

-- Payment transactions: unified payment record
CREATE TABLE payment_transactions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id            UUID REFERENCES bookings(id) ON DELETE SET NULL,
    order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
    ride_id               UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
    amount                NUMERIC(14, 2) NOT NULL,
    currency              VARCHAR(10) NOT NULL,
    provider_code         VARCHAR(64),
    provider_transaction_id VARCHAR(255),
    method                VARCHAR(64),
    status                payment_status DEFAULT 'pending',
    escrow_status         payment_escrow_status,
    fee_platform          NUMERIC(14, 2) DEFAULT 0,
    fee_processor         NUMERIC(14, 2) DEFAULT 0,
    fee_tax               NUMERIC(14, 2) DEFAULT 0,
    net_amount            NUMERIC(14, 2) DEFAULT 0,
    metadata              JSONB DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE payment_transactions IS 'Unified payment transaction record for all order types';

-- Payouts: vendor/driver fund settlements
CREATE TABLE payouts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id       UUID REFERENCES businesses(id) ON DELETE SET NULL,
    amount            NUMERIC(14, 2) NOT NULL,
    currency          VARCHAR(10) NOT NULL,
    status            payout_status DEFAULT 'pending',
    period_start      DATE NOT NULL,
    period_end        DATE NOT NULL,
    transaction_ids   UUID[] DEFAULT '{}',
    provider_payout_id VARCHAR(255),
    fee_platform      NUMERIC(14, 2) DEFAULT 0,
    fee_processor     NUMERIC(14, 2) DEFAULT 0,
    net_amount        NUMERIC(14, 2) DEFAULT 0,
    bank_account      JSONB DEFAULT '{}'::jsonb,
    paid_at           TIMESTAMPTZ,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE payouts IS 'Scheduled payouts transferring earned funds to vendors';

-- Escrow holds: funds held in escrow pending fulfilment
CREATE TABLE escrow_holds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    amount          NUMERIC(14, 2) NOT NULL,
    currency        VARCHAR(10) NOT NULL,
    status          payment_escrow_status DEFAULT 'held',
    release_at      TIMESTAMPTZ,
    released_at     TIMESTAMPTZ,
    dispute_id      UUID,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE escrow_holds IS 'Funds held in escrow pending service fulfilment or dispute resolution';

-- Vendor wallets: real-time balance tracking
CREATE TABLE vendor_wallets (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id       UUID REFERENCES businesses(id) ON DELETE CASCADE,
    balance           NUMERIC(14, 2) DEFAULT 0,
    currency          VARCHAR(10) NOT NULL,
    pending_balance   NUMERIC(14, 2) DEFAULT 0,
    available_balance NUMERIC(14, 2) DEFAULT 0,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE vendor_wallets IS 'Real-time wallet balances for vendors and drivers';

-- Settlements: aggregated settlement records
CREATE TABLE settlements (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id         UUID REFERENCES payouts(id) ON DELETE SET NULL,
    transaction_ids   UUID[] DEFAULT '{}',
    gross_amount      NUMERIC(14, 2) NOT NULL,
    fees_total        NUMERIC(14, 2) DEFAULT 0,
    net_amount        NUMERIC(14, 2) DEFAULT 0,
    status            VARCHAR(32) DEFAULT 'pending',
    settled_at        TIMESTAMPTZ
);

COMMENT ON TABLE settlements IS 'Aggregated settlement records for accounting reconciliation';

-- Refunds
CREATE TABLE refunds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    amount          NUMERIC(14, 2) NOT NULL,
    reason          TEXT,
    status          VARCHAR(32) DEFAULT 'pending',
    approved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    processed_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE refunds IS 'Refund requests linked to payment transactions';

-- Disputes
CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    raised_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason          VARCHAR(255) NOT NULL,
    description     TEXT,
    status          dispute_status DEFAULT 'opened',
    resolution      TEXT,
    resolved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

COMMENT ON TABLE disputes IS 'Transaction and booking disputes with full lifecycle';

-- Chargebacks
CREATE TABLE chargebacks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id    UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    dispute_id        UUID REFERENCES disputes(id) ON DELETE SET NULL,
    amount            NUMERIC(14, 2) NOT NULL,
    reason            TEXT,
    status            VARCHAR(32) DEFAULT 'pending',
    response_due_date DATE,
    metadata          JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE chargebacks IS 'Chargeback records from payment providers';

-- 12. REVIEWS =================================================================

CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id          UUID REFERENCES bookings(id) ON DELETE SET NULL,
    order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title               VARCHAR(255),
    content             TEXT,
    images              JSONB DEFAULT '[]'::jsonb,
    reply_from_business TEXT,
    is_verified         BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for businesses';

-- 13. NOTIFICATIONS ==========================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type            VARCHAR(64) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB DEFAULT '{}'::jsonb,
    channel         VARCHAR(32) DEFAULT 'in_app',
    read            BOOLEAN DEFAULT false,
    sent_at         TIMESTAMPTZ DEFAULT now(),
    read_at         TIMESTAMPTZ
);

COMMENT ON TABLE notifications IS 'In-app and push notifications for users';

-- 14. ADMIN ===================================================================

-- Admin users: elevated platform administrators
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role            admin_role NOT NULL,
    country_code    VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    permissions     JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_users IS 'Platform administrators with role-based permissions';

-- Admin audit log: admin action tracking
CREATE TABLE admin_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action          VARCHAR(128) NOT NULL,
    entity_type     VARCHAR(64),
    entity_id       UUID,
    changes         JSONB DEFAULT '{}'::jsonb,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_audit_log IS 'Audit trail for all administrative actions';

-- 15. AUDIT ===================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action          VARCHAR(128) NOT NULL,
    entity_type     VARCHAR(64),
    entity_id       UUID,
    changes         JSONB DEFAULT '{}'::jsonb,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'General audit trail for user actions across the platform';

-- 16. KYC / KYB ==============================================================

CREATE TABLE kyc_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
    type            VARCHAR(64) NOT NULL,
    document_url    TEXT NOT NULL,
    status          kyc_status DEFAULT 'pending',
    verified_by     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    verified_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kyc_documents IS 'KYC/KYB document submissions for identity and business verification';

-- ============================================================================
-- 17. INDEXES
-- ============================================================================

-- Geography indexes
CREATE INDEX idx_businesses_location ON businesses USING GIST (location);
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_ride_requests_pickup ON ride_requests USING GIST (pickup_location);
CREATE INDEX idx_ride_requests_dropoff ON ride_requests USING GIST (dropoff_location);
CREATE INDEX idx_deliveries_pickup ON deliveries USING GIST (pickup_location);
CREATE INDEX idx_deliveries_dropoff ON deliveries USING GIST (dropoff_location);

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_country ON profiles(country_code);
CREATE INDEX idx_profiles_kyc ON profiles(kyc_status);
CREATE INDEX idx_profiles_created ON profiles(created_at);

-- User sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(last_active_at);

-- Businesses
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_country ON businesses(country_code);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_verification ON businesses(verification_status);
CREATE INDEX idx_businesses_created ON businesses(created_at);
CREATE INDEX idx_businesses_owner_status ON businesses(owner_id, status);

-- Business categories
CREATE INDEX idx_business_categories_parent ON business_categories(parent_id);
CREATE INDEX idx_business_categories_country ON business_categories(country_code);

-- Business staff
CREATE INDEX idx_business_staff_business ON business_staff(business_id);
CREATE INDEX idx_business_staff_profile ON business_staff(profile_id);
CREATE INDEX idx_business_staff_active ON business_staff(is_active);

-- Staff schedules
CREATE INDEX idx_staff_schedule_staff ON staff_schedule(staff_id);
CREATE INDEX idx_staff_schedule_day ON staff_schedule(day_of_week);

-- Staff breaks
CREATE INDEX idx_staff_breaks_staff ON staff_breaks(staff_id);
CREATE INDEX idx_staff_breaks_date ON staff_breaks(date);

-- Staff time off
CREATE INDEX idx_staff_time_off_staff ON staff_time_off(staff_id);
CREATE INDEX idx_staff_time_off_dates ON staff_time_off(start_date, end_date);

-- Services
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_available ON services(is_available);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_created ON services(created_at);

-- Service variants
CREATE INDEX idx_service_variants_service ON service_variants(service_id);

-- Products
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created ON products(created_at);

-- Inventory log
CREATE INDEX idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX idx_inventory_log_created ON inventory_log(created_at);

-- Restaurants
CREATE INDEX idx_restaurants_business ON restaurants(business_id);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);

-- Menu categories
CREATE INDEX idx_menu_categories_restaurant ON menu_categories(restaurant_id);

-- Menu items
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- Drivers
CREATE INDEX idx_drivers_profile ON drivers(profile_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_available ON drivers(is_available);

-- Vehicles
CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- Driver documents
CREATE INDEX idx_driver_documents_driver ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON driver_documents(status);

-- Bookings
CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start ON bookings(start_time);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);
CREATE INDEX idx_bookings_created ON bookings(created_at);
CREATE INDEX idx_bookings_business_status ON bookings(business_id, status);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);

-- Booking reminders
CREATE INDEX idx_booking_reminders_booking ON booking_reminders(booking_id);
CREATE INDEX idx_booking_reminders_status ON booking_reminders(status);

-- Booking history
CREATE INDEX idx_booking_history_booking ON booking_history(booking_id);
CREATE INDEX idx_booking_history_created ON booking_history(created_at);

-- Orders
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(type);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- Order items
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Order status history
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at);

-- Ride requests
CREATE INDEX idx_ride_requests_customer ON ride_requests(customer_id);
CREATE INDEX idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_created ON ride_requests(created_at);

-- Deliveries
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Payment transactions
CREATE INDEX idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_ride ON payment_transactions(ride_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider_code);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at);

-- Payouts
CREATE INDEX idx_payouts_vendor ON payouts(vendor_id);
CREATE INDEX idx_payouts_business ON payouts(business_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_period ON payouts(period_start, period_end);
CREATE INDEX idx_payouts_created ON payouts(created_at);

-- Escrow holds
CREATE INDEX idx_escrow_holds_transaction ON escrow_holds(transaction_id);
CREATE INDEX idx_escrow_holds_status ON escrow_holds(status);
CREATE INDEX idx_escrow_holds_release ON escrow_holds(release_at);

-- Vendor wallets
CREATE UNIQUE INDEX idx_vendor_wallets_vendor_business ON vendor_wallets(vendor_id, business_id);
CREATE INDEX idx_vendor_wallets_balance ON vendor_wallets(available_balance);

-- Settlements
CREATE INDEX idx_settlements_payout ON settlements(payout_id);
CREATE INDEX idx_settlements_status ON settlements(status);

-- Refunds
CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Disputes
CREATE INDEX idx_disputes_transaction ON disputes(transaction_id);
CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created ON disputes(created_at);

-- Chargebacks
CREATE INDEX idx_chargebacks_transaction ON chargebacks(transaction_id);
CREATE INDEX idx_chargebacks_dispute ON chargebacks(dispute_id);
CREATE INDEX idx_chargebacks_status ON chargebacks(status);

-- Reviews
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at);
CREATE INDEX idx_reviews_business_rating ON reviews(business_id, rating);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);

-- Admin
CREATE INDEX idx_admin_users_profile ON admin_users(profile_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_country ON admin_users(country_code);

-- Admin audit log
CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at);

-- Audit logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- KYC documents
CREATE INDEX idx_kyc_documents_profile ON kyc_documents(profile_id);
CREATE INDEX idx_kyc_documents_business ON kyc_documents(business_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX idx_kyc_documents_type ON kyc_documents(type);

-- ============================================================================
-- 18. FUNCTIONS
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function that sets updated_at to now() on row update';

-- Generate QR booking URL for a business
CREATE OR REPLACE FUNCTION generate_qr_booking_url(business_id UUID)
RETURNS TEXT AS $$
DECLARE
    business_name VARCHAR(255);
    base_url TEXT;
BEGIN
    SELECT name INTO business_name FROM businesses WHERE id = business_id;
    base_url := COALESCE(current_setting('app.frontend_url', true), 'https://afribook.app');
    RETURN base_url || '/book/' || business_id::TEXT || '?ref=' || encode(gen_random_bytes(6), 'hex');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION generate_qr_booking_url(UUID) IS 'Generates a QR-friendly booking URL for a business';

-- Calculate platform fee based on amount and country tax rate
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount NUMERIC, country_code TEXT)
RETURNS NUMERIC AS $$
DECLARE
    base_fee_percent NUMERIC := 0.05;   -- 5% platform commission
    vat_rate NUMERIC;
    fee_before_tax NUMERIC;
    final_fee NUMERIC;
BEGIN
    SELECT tax_rate INTO vat_rate FROM countries WHERE code = country_code AND is_active = true;
    vat_rate := COALESCE(vat_rate, 0);
    fee_before_tax := GREATEST(amount * base_fee_percent, 0.50); -- minimum $0.50
    final_fee := ROUND(fee_before_tax * (1 + vat_rate), 2);
    RETURN final_fee;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_platform_fee(NUMERIC, TEXT) IS 'Calculates the platform fee (commission + tax) given an amount and country code';

-- ============================================================================
-- 19. TRIGGERS
-- ============================================================================

-- updated_at triggers for tables with an updated_at column
CREATE TRIGGER trg_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ride_requests_updated_at
    BEFORE UPDATE ON ride_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate QR booking URL for new businesses
CREATE OR REPLACE FUNCTION set_qr_booking_url()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qr_booking_url := generate_qr_booking_url(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_set_qr
    BEFORE INSERT ON businesses
    FOR EACH ROW EXECUTE FUNCTION set_qr_booking_url();

-- Auto-update vendor wallet available_balance on payout completion
CREATE OR REPLACE FUNCTION update_wallet_on_payout()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'processing' THEN
        UPDATE vendor_wallets
        SET
            balance = balance - NEW.amount,
            pending_balance = pending_balance - NEW.amount,
            available_balance = GREATEST(available_balance - NEW.amount, 0),
            updated_at = now()
        WHERE vendor_id = NEW.vendor_id AND business_id = NEW.business_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payouts_update_wallet
    AFTER UPDATE OF status ON payouts
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_wallet_on_payout();

-- ============================================================================
-- 20. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 21. RLS POLICIES
-- ============================================================================

-- Helper: check if user has an admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users au
        JOIN profiles p ON p.id = au.profile_id
        WHERE p.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: check if user has specific admin role
CREATE OR REPLACE FUNCTION is_admin_with_role(required_role admin_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users au
        JOIN profiles p ON p.id = au.profile_id
        WHERE p.id = auth.uid() AND au.role = required_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: check if user owns a business (is vendor)
CREATE OR REPLACE FUNCTION is_business_owner(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM businesses
        WHERE id = business_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------------------------
-- Users can read their own profile; admins can read all
CREATE POLICY profiles_read_own ON profiles
    FOR SELECT
    USING (id = auth.uid() OR is_admin());

-- Users can update their own profile (but not role or kyc_status)
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Profiles are created via trigger, so no insert policy needed for users
CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- -------------------------------------------------------------------------
-- USER SESSIONS
-- -------------------------------------------------------------------------
CREATE POLICY user_sessions_read_own ON user_sessions
    FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY user_sessions_delete_own ON user_sessions
    FOR DELETE
    USING (user_id = auth.uid() OR is_admin());

-- -------------------------------------------------------------------------
-- COUNTRIES
-- -------------------------------------------------------------------------
CREATE POLICY countries_read_all ON countries
    FOR SELECT
    USING (true);

CREATE POLICY countries_write_admin ON countries
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- CURRENCIES
-- -------------------------------------------------------------------------
CREATE POLICY currencies_read_all ON currencies
    FOR SELECT
    USING (true);

CREATE POLICY currencies_write_admin ON currencies
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- LANGUAGES
-- -------------------------------------------------------------------------
CREATE POLICY languages_read_all ON languages
    FOR SELECT
    USING (true);

CREATE POLICY languages_write_admin ON languages
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- BUSINESSES
-- -------------------------------------------------------------------------
-- Vendors can CRUD their own businesses; customers can read active; admins all
CREATE POLICY businesses_read_active ON businesses
    FOR SELECT
    USING (status = 'active' OR owner_id = auth.uid() OR is_admin());

CREATE POLICY businesses_insert_own ON businesses
    FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR is_admin());

CREATE POLICY businesses_update_own ON businesses
    FOR UPDATE
    USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY businesses_delete_own ON businesses
    FOR DELETE
    USING (owner_id = auth.uid() OR is_admin());

-- -------------------------------------------------------------------------
-- BUSINESS CATEGORIES
-- -------------------------------------------------------------------------
CREATE POLICY business_categories_read_all ON business_categories
    FOR SELECT
    USING (true);

CREATE POLICY business_categories_write_admin ON business_categories
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- BUSINESS STAFF
-- -------------------------------------------------------------------------
CREATE POLICY business_staff_read ON business_staff
    FOR SELECT
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_staff_insert ON business_staff
    FOR INSERT
    WITH CHECK (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_staff_update ON business_staff
    FOR UPDATE
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_staff_delete ON business_staff
    FOR DELETE
    USING (is_business_owner(business_id) OR is_admin());

-- -------------------------------------------------------------------------
-- STAFF SCHEDULE, BREAKS, TIME OFF
-- -------------------------------------------------------------------------
CREATE POLICY staff_schedule_read ON staff_schedule
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_schedule.staff_id AND (b.owner_id = auth.uid() OR bs.profile_id = auth.uid())
    ));

CREATE POLICY staff_schedule_write ON staff_schedule
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_schedule.staff_id AND b.owner_id = auth.uid()
    ));

CREATE POLICY staff_breaks_read ON staff_breaks
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_breaks.staff_id AND (b.owner_id = auth.uid() OR bs.profile_id = auth.uid())
    ));

CREATE POLICY staff_breaks_write ON staff_breaks
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_breaks.staff_id AND b.owner_id = auth.uid()
    ));

CREATE POLICY staff_time_off_read ON staff_time_off
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_time_off.staff_id AND (b.owner_id = auth.uid() OR bs.profile_id = auth.uid())
    ));

CREATE POLICY staff_time_off_write ON staff_time_off
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM business_staff bs
        JOIN businesses b ON b.id = bs.business_id
        WHERE bs.id = staff_time_off.staff_id AND b.owner_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- SERVICES
-- -------------------------------------------------------------------------
-- Vendors CRUD own; customers read active
CREATE POLICY services_read_active ON services
    FOR SELECT
    USING (is_available = true OR is_business_owner(business_id) OR is_admin());

CREATE POLICY services_insert ON services
    FOR INSERT
    WITH CHECK (is_business_owner(business_id) OR is_admin());

CREATE POLICY services_update ON services
    FOR UPDATE
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY services_delete ON services
    FOR DELETE
    USING (is_business_owner(business_id) OR is_admin());

-- -------------------------------------------------------------------------
-- SERVICE VARIANTS
-- -------------------------------------------------------------------------
CREATE POLICY service_variants_read ON service_variants
    FOR SELECT
    USING (true);

CREATE POLICY service_variants_write ON service_variants
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM services s
        JOIN businesses b ON b.id = s.business_id
        WHERE s.id = service_variants.service_id AND b.owner_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- PRODUCTS
-- -------------------------------------------------------------------------
-- Vendors CRUD own; customers read active
CREATE POLICY products_read_active ON products
    FOR SELECT
    USING (is_available = true OR is_business_owner(business_id) OR is_admin());

CREATE POLICY products_insert ON products
    FOR INSERT
    WITH CHECK (is_business_owner(business_id) OR is_admin());

CREATE POLICY products_update ON products
    FOR UPDATE
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY products_delete ON products
    FOR DELETE
    USING (is_business_owner(business_id) OR is_admin());

-- -------------------------------------------------------------------------
-- INVENTORY LOG
-- -------------------------------------------------------------------------
CREATE POLICY inventory_log_read ON inventory_log
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM products p
        JOIN businesses b ON b.id = p.business_id
        WHERE p.id = inventory_log.product_id AND b.owner_id = auth.uid()
    ));

CREATE POLICY inventory_log_insert ON inventory_log
    FOR INSERT
    WITH CHECK (is_admin() OR EXISTS (
        SELECT 1 FROM products p
        JOIN businesses b ON b.id = p.business_id
        WHERE p.id = inventory_log.product_id AND b.owner_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- RESTAURANTS
-- -------------------------------------------------------------------------
CREATE POLICY restaurants_read ON restaurants
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = restaurants.business_id AND (b.owner_id = auth.uid() OR b.status = 'active')
    ));

CREATE POLICY restaurants_write ON restaurants
    FOR ALL
    USING (is_admin() OR is_business_owner(business_id));

-- -------------------------------------------------------------------------
-- MENU CATEGORIES
-- -------------------------------------------------------------------------
CREATE POLICY menu_categories_read ON menu_categories
    FOR SELECT
    USING (true);

CREATE POLICY menu_categories_write ON menu_categories
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM restaurants r
        JOIN businesses b ON b.id = r.business_id
        WHERE r.id = menu_categories.restaurant_id AND b.owner_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- MENU ITEMS
-- -------------------------------------------------------------------------
CREATE POLICY menu_items_read ON menu_items
    FOR SELECT
    USING (is_available = true OR is_admin() OR EXISTS (
        SELECT 1 FROM restaurants r
        JOIN businesses b ON b.id = r.business_id
        WHERE r.id = menu_items.restaurant_id AND b.owner_id = auth.uid()
    ));

CREATE POLICY menu_items_write ON menu_items
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM restaurants r
        JOIN businesses b ON b.id = r.business_id
        WHERE r.id = menu_items.restaurant_id AND b.owner_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- DRIVERS
-- -------------------------------------------------------------------------
CREATE POLICY drivers_read_own ON drivers
    FOR SELECT
    USING (profile_id = auth.uid() OR is_admin());

CREATE POLICY drivers_insert_own ON drivers
    FOR INSERT
    WITH CHECK (profile_id = auth.uid() OR is_admin());

CREATE POLICY drivers_update_own ON drivers
    FOR UPDATE
    USING (profile_id = auth.uid() OR is_admin());

-- -------------------------------------------------------------------------
-- VEHICLES
-- -------------------------------------------------------------------------
CREATE POLICY vehicles_read ON vehicles
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND profile_id = auth.uid()
    ));

CREATE POLICY vehicles_write ON vehicles
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM drivers WHERE id = vehicles.driver_id AND profile_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- DRIVER DOCUMENTS
-- -------------------------------------------------------------------------
CREATE POLICY driver_documents_read ON driver_documents
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM drivers WHERE id = driver_documents.driver_id AND profile_id = auth.uid()
    ));

CREATE POLICY driver_documents_write ON driver_documents
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM drivers WHERE id = driver_documents.driver_id AND profile_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- BOOKINGS
-- -------------------------------------------------------------------------
-- Customers read own; vendors read own business; admin all
CREATE POLICY bookings_read ON bookings
    FOR SELECT
    USING (customer_id = auth.uid() OR is_business_owner(business_id) OR is_admin());

CREATE POLICY bookings_insert ON bookings
    FOR INSERT
    WITH CHECK (customer_id = auth.uid() OR is_admin());

CREATE POLICY bookings_update ON bookings
    FOR UPDATE
    USING (customer_id = auth.uid() OR is_business_owner(business_id) OR is_admin());

-- -------------------------------------------------------------------------
-- BOOKING REMINDERS
-- -------------------------------------------------------------------------
CREATE POLICY booking_reminders_read ON booking_reminders
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_reminders.booking_id
        AND (bookings.customer_id = auth.uid() OR is_business_owner(bookings.business_id))
    ));

CREATE POLICY booking_reminders_write ON booking_reminders
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- BOOKING HISTORY
-- -------------------------------------------------------------------------
CREATE POLICY booking_history_read ON booking_history
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_history.booking_id
        AND (bookings.customer_id = auth.uid() OR is_business_owner(bookings.business_id))
    ));

CREATE POLICY booking_history_insert ON booking_history
    FOR INSERT
    WITH CHECK (is_admin() OR EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_history.booking_id
        AND (bookings.customer_id = auth.uid() OR is_business_owner(bookings.business_id))
    ));

-- -------------------------------------------------------------------------
-- ORDERS
-- -------------------------------------------------------------------------
-- Customers read own; vendors read own business; admin all
CREATE POLICY orders_read ON orders
    FOR SELECT
    USING (customer_id = auth.uid() OR is_business_owner(business_id) OR is_admin());

CREATE POLICY orders_insert ON orders
    FOR INSERT
    WITH CHECK (customer_id = auth.uid() OR is_admin());

CREATE POLICY orders_update ON orders
    FOR UPDATE
    USING (customer_id = auth.uid() OR is_business_owner(business_id) OR is_admin());

-- -------------------------------------------------------------------------
-- ORDER ITEMS
-- -------------------------------------------------------------------------
CREATE POLICY order_items_read ON order_items
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR is_business_owner(orders.business_id))
    ));

CREATE POLICY order_items_write ON order_items
    FOR ALL
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (orders.customer_id = auth.uid() OR is_business_owner(orders.business_id))
    ));

-- -------------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- -------------------------------------------------------------------------
CREATE POLICY order_status_history_read ON order_status_history
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_status_history.order_id
        AND (orders.customer_id = auth.uid() OR is_business_owner(orders.business_id))
    ));

CREATE POLICY order_status_history_insert ON order_status_history
    FOR INSERT
    WITH CHECK (true);

-- -------------------------------------------------------------------------
-- RIDE REQUESTS
-- -------------------------------------------------------------------------
CREATE POLICY ride_requests_read ON ride_requests
    FOR SELECT
    USING (customer_id = auth.uid() OR driver_id IN (
        SELECT id FROM drivers WHERE profile_id = auth.uid()
    ) OR is_admin());

CREATE POLICY ride_requests_insert ON ride_requests
    FOR INSERT
    WITH CHECK (customer_id = auth.uid() OR is_admin());

CREATE POLICY ride_requests_update ON ride_requests
    FOR UPDATE
    USING (customer_id = auth.uid() OR driver_id IN (
        SELECT id FROM drivers WHERE profile_id = auth.uid()
    ) OR is_admin());

-- -------------------------------------------------------------------------
-- DELIVERIES
-- -------------------------------------------------------------------------
CREATE POLICY deliveries_read ON deliveries
    FOR SELECT
    USING (is_admin() OR driver_id IN (
        SELECT id FROM drivers WHERE profile_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM orders WHERE orders.id = deliveries.order_id
        AND (orders.customer_id = auth.uid() OR is_business_owner(orders.business_id))
    ));

CREATE POLICY deliveries_write ON deliveries
    FOR ALL
    USING (is_admin() OR driver_id IN (
        SELECT id FROM drivers WHERE profile_id = auth.uid()
    ));

-- -------------------------------------------------------------------------
-- PAYMENT PROVIDERS
-- -------------------------------------------------------------------------
CREATE POLICY payment_providers_read ON payment_providers
    FOR SELECT
    USING (true);

CREATE POLICY payment_providers_write ON payment_providers
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- PAYMENT TRANSACTIONS
-- -------------------------------------------------------------------------
-- Involved parties read; admin all
CREATE POLICY payment_transactions_read ON payment_transactions
    FOR SELECT
    USING (
        is_admin()
        OR booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
        OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
        OR ride_id IN (SELECT id FROM ride_requests WHERE customer_id = auth.uid())
        OR booking_id IN (SELECT id FROM bookings WHERE is_business_owner(business_id))
        OR order_id IN (SELECT id FROM orders WHERE is_business_owner(business_id))
    );

CREATE POLICY payment_transactions_insert ON payment_transactions
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY payment_transactions_update ON payment_transactions
    FOR UPDATE
    USING (is_admin());

-- -------------------------------------------------------------------------
-- PAYOUTS
-- -------------------------------------------------------------------------
-- Vendors read own; admin all
CREATE POLICY payouts_read ON payouts
    FOR SELECT
    USING (vendor_id = auth.uid() OR is_admin());

CREATE POLICY payouts_write ON payouts
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- ESCROW HOLDS
-- -------------------------------------------------------------------------
CREATE POLICY escrow_holds_read ON escrow_holds
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM payment_transactions pt
        LEFT JOIN bookings b ON b.id = pt.booking_id
        LEFT JOIN orders o ON o.id = pt.order_id
        WHERE pt.id = escrow_holds.transaction_id
        AND (b.customer_id = auth.uid() OR o.customer_id = auth.uid()
             OR is_business_owner(b.business_id) OR is_business_owner(o.business_id))
    ));

CREATE POLICY escrow_holds_write ON escrow_holds
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- VENDOR WALLETS
-- -------------------------------------------------------------------------
CREATE POLICY vendor_wallets_read ON vendor_wallets
    FOR SELECT
    USING (vendor_id = auth.uid() OR is_admin());

CREATE POLICY vendor_wallets_write ON vendor_wallets
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- SETTLEMENTS
-- -------------------------------------------------------------------------
CREATE POLICY settlements_read ON settlements
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM payouts WHERE payouts.id = settlements.payout_id
        AND payouts.vendor_id = auth.uid()
    ));

CREATE POLICY settlements_write ON settlements
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- REFUNDS
-- -------------------------------------------------------------------------
CREATE POLICY refunds_read ON refunds
    FOR SELECT
    USING (is_admin() OR EXISTS (
        SELECT 1 FROM payment_transactions pt
        LEFT JOIN bookings b ON b.id = pt.booking_id
        LEFT JOIN orders o ON o.id = pt.order_id
        WHERE pt.id = refunds.transaction_id
        AND (b.customer_id = auth.uid() OR o.customer_id = auth.uid())
    ));

CREATE POLICY refunds_write ON refunds
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- DISPUTES
-- -------------------------------------------------------------------------
CREATE POLICY disputes_read ON disputes
    FOR SELECT
    USING (raised_by = auth.uid() OR is_admin());

CREATE POLICY disputes_insert ON disputes
    FOR INSERT
    WITH CHECK (raised_by = auth.uid() OR is_admin());

CREATE POLICY disputes_update ON disputes
    FOR UPDATE
    USING (raised_by = auth.uid() OR is_admin());

-- -------------------------------------------------------------------------
-- CHARGEBACKS
-- -------------------------------------------------------------------------
CREATE POLICY chargebacks_read ON chargebacks
    FOR SELECT
    USING (is_admin());

CREATE POLICY chargebacks_write ON chargebacks
    FOR ALL
    USING (is_admin());

-- -------------------------------------------------------------------------
-- REVIEWS
-- -------------------------------------------------------------------------
-- Anyone can read reviews; authenticated users can create
CREATE POLICY reviews_read_all ON reviews
    FOR SELECT
    USING (true);

CREATE POLICY reviews_insert_own ON reviews
    FOR INSERT
    WITH CHECK (reviewer_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY reviews_update_own ON reviews
    FOR UPDATE
    USING (reviewer_id = auth.uid() OR is_admin());

-- -------------------------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------------------------
-- Users read own notifications; system inserts
CREATE POLICY notifications_read_own ON notifications
    FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- ADMIN USERS
-- -------------------------------------------------------------------------
CREATE POLICY admin_users_read ON admin_users
    FOR SELECT
    USING (is_admin());

CREATE POLICY admin_users_write ON admin_users
    FOR ALL
    USING (is_admin_with_role('super_admin'));

-- -------------------------------------------------------------------------
-- ADMIN AUDIT LOG
-- -------------------------------------------------------------------------
CREATE POLICY admin_audit_log_read ON admin_audit_log
    FOR SELECT
    USING (is_admin());

CREATE POLICY admin_audit_log_insert ON admin_audit_log
    FOR INSERT
    WITH CHECK (is_admin());

-- -------------------------------------------------------------------------
-- AUDIT LOGS
-- -------------------------------------------------------------------------
CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY audit_logs_read ON audit_logs
    FOR SELECT
    USING (is_admin());

-- -------------------------------------------------------------------------
-- KYC DOCUMENTS
-- -------------------------------------------------------------------------
CREATE POLICY kyc_documents_read ON kyc_documents
    FOR SELECT
    USING (profile_id = auth.uid() OR is_admin() OR EXISTS (
        SELECT 1 FROM businesses WHERE businesses.id = kyc_documents.business_id AND businesses.owner_id = auth.uid()
    ));

CREATE POLICY kyc_documents_insert_own ON kyc_documents
    FOR INSERT
    WITH CHECK (profile_id = auth.uid() OR is_admin());

CREATE POLICY kyc_documents_update ON kyc_documents
    FOR UPDATE
    USING (is_admin());

-- ============================================================================
-- 22. DEFAULT DATA (OPTIONAL SEED)
-- ============================================================================

-- Insert default payment providers
INSERT INTO payment_providers (code, name, is_active, supported_methods, processor_fee_percent, processor_fee_fixed)
VALUES
    ('stripe', 'Stripe', true, ARRAY['card', 'apple_pay', 'google_pay'], 0.029, 0.30),
    ('paystack', 'Paystack', true, ARRAY['card', 'bank_transfer', 'ussd', 'mobile_money'], 0.015, 0.20),
    ('flutterwave', 'Flutterwave', true, ARRAY['card', 'bank_transfer', 'mobile_money'], 0.014, 0.00),
    ('mpesa', 'M-Pesa', true, ARRAY['mobile_money'], 0.005, 0.10),
    ('square', 'Square', true, ARRAY['card'], 0.026, 0.10)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE payment_providers IS 'Configured payment gateway providers';
