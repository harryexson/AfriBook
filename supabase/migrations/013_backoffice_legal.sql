-- ============================================================================
-- AfriBook — Back-office CRM, Billing, Marketing & Legal Document Registry
-- Supabase PostgreSQL migration 013
-- ============================================================================
-- Powers the admin back-office modules (CRM, sales pipeline, promotions,
-- support center, billing) and the legal-document registry that backs the
-- /legal/ pages and the consent records written by /api/consents.
--
--  1. Extends `consent_type` (011) with the four marketplace agreement kinds
--     (host / driver / rider / guest) so the new data-driven agreements can be
--     accepted and audited through the existing `user_consents` table.
--  2. CRM: `crm_leads` (sales leads) and `sales_deals` (pipeline / contracts).
--  3. Marketing: `promo_codes` + `promo_redemptions`, and `ad_campaigns`.
--  4. Support: `support_tickets` + `ticket_messages`.
--  5. Billing: `invoices` (platform billing for vendors / advertisers).
--  6. Messaging: `email_logs` (delivery audit trail for transactional mail).
--  7. Legal: `legal_document_versions` (versioned published/draft documents,
--     consumed by the admin /admin/legal page and referenced by consent
--     records via `consent_version`).
--
-- Access model: every table uses RLS. `is_admin()` (012) grants full access;
-- `is_admin_with_role(admin_role)` scopes sensitive roles (support / payment /
-- super_admin). End-users can always read and create their own support
-- tickets, read their own invoices and promo redemptions, and read their own
-- consent records. The service_role bypasses RLS as usual for server jobs.
-- This migration is additive and idempotent.
-- ============================================================================

-- ============================================================================
-- 1. EXTEND consent_type WITH THE MARKETPLACE AGREEMENTS
-- ============================================================================
-- The agreements in src/lib/legal-agreements.ts (Host / Driver / Rider / Guest)
-- are accepted at onboarding and recorded via POST /api/consents. Adding the
-- enum values lets those flows use the existing `user_consents` audit table
-- instead of a parallel `legal_acceptances` table.
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'host_agreement';
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'driver_agreement';
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'rider_agreement';
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'guest_agreement';

-- ============================================================================
-- 2. CRM — LEADS & SALES PIPELINE
-- ============================================================================

CREATE TABLE crm_leads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID REFERENCES businesses(id) ON DELETE SET NULL,
    owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
    contact_name    VARCHAR(255),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(32),
    country_code    VARCHAR(4) REFERENCES countries(code) ON DELETE SET NULL,
    source          VARCHAR(64) DEFAULT 'manual',      -- web | referral | event | partner | manual
    status          VARCHAR(32) DEFAULT 'new',         -- new | contacted | qualified | converted | lost
    deal_value      NUMERIC(12, 2) DEFAULT 0,
    notes           TEXT,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}'::jsonb,
    assigned_at     TIMESTAMPTZ,
    converted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE crm_leads IS 'Sales leads tracked by the back-office CRM';

CREATE TABLE sales_deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    business_id         UUID REFERENCES businesses(id) ON DELETE SET NULL,
    owner_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    customer_name       VARCHAR(255),
    amount              NUMERIC(12, 2) DEFAULT 0,
    currency_code       VARCHAR(3) DEFAULT 'USD',
    stage               VARCHAR(32) DEFAULT 'prospecting', -- prospecting|qualification|proposal|negotiation|won|lost
    probability         SMALLINT DEFAULT 10,
    expected_close_date DATE,
    won_at              TIMESTAMPTZ,
    lost_reason         VARCHAR(255),
    notes               TEXT,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE sales_deals IS 'Deals / contracts in the back-office sales pipeline';

-- ============================================================================
-- 3. MARKETING — PROMO CODES & AD CAMPAIGNS
-- ============================================================================

CREATE TABLE promo_codes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(64) NOT NULL UNIQUE,
    description         TEXT,
    discount_type       VARCHAR(16) NOT NULL DEFAULT 'percentage', -- percentage|fixed|free_delivery
    discount_value      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code       VARCHAR(3),
    applies_to          VARCHAR(64) DEFAULT 'all',          -- all | delivery | rides | events | <business_id>
    business_id         UUID REFERENCES businesses(id) ON DELETE SET NULL,
    min_order_amount    NUMERIC(12, 2) DEFAULT 0,
    max_redemptions     INT,
    current_redemptions INT DEFAULT 0,
    per_user_limit      INT DEFAULT 1,
    starts_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE promo_codes IS 'Discount / promo codes issued by the back office';

CREATE TABLE promo_redemptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_id        UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id        UUID,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    currency_code   VARCHAR(3),
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE promo_redemptions IS 'One row per promo-code redemption, for usage limits and audit';

CREATE TABLE ad_campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    platform        VARCHAR(64) NOT NULL,       -- google | meta | tiktok | linkedin | offline
    status          VARCHAR(32) DEFAULT 'draft',-- draft|active|paused|completed|archived
    budget          NUMERIC(12, 2) DEFAULT 0,
    spent           NUMERIC(12, 2) DEFAULT 0,
    currency_code   VARCHAR(3) DEFAULT 'USD',
    starts_at       TIMESTAMPTZ,
    ends_at         TIMESTAMPTZ,
    targeting       JSONB DEFAULT '{}'::jsonb,
    impressions     BIGINT DEFAULT 0,
    clicks          BIGINT DEFAULT 0,
    conversions     INT DEFAULT 0,
    notes           TEXT,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ad_campaigns IS 'Ad campaigns managed from the back office';

-- ============================================================================
-- 4. SUPPORT — TICKETS & MESSAGES
-- ============================================================================

CREATE TABLE support_tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number       VARCHAR(32) NOT NULL UNIQUE,
    user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
    business_id         UUID REFERENCES businesses(id) ON DELETE SET NULL,
    subject             VARCHAR(255) NOT NULL,
    description         TEXT,
    category            VARCHAR(64),               -- billing|account|order|delivery|rides|technical|other
    priority            VARCHAR(16) DEFAULT 'medium', -- low|medium|high|critical
    status              VARCHAR(16) DEFAULT 'open',   -- open|in_progress|waiting_on_customer|resolved|closed
    assigned_to         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tags                TEXT[] DEFAULT '{}',
    first_response_at   TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE support_tickets IS 'Customer support tickets handled by the support center';

CREATE TABLE ticket_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    body            TEXT NOT NULL,
    attachments     JSONB DEFAULT '[]'::jsonb,
    internal        BOOLEAN DEFAULT false,      -- admin-only notes never shown to the customer
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ticket_messages IS 'Message thread belonging to a support ticket';

-- ============================================================================
-- 5. BILLING — INVOICES
-- ============================================================================

CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number          VARCHAR(32) NOT NULL UNIQUE,
    user_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL,
    business_id             UUID REFERENCES businesses(id) ON DELETE SET NULL,
    customer_name           VARCHAR(255),
    customer_email          VARCHAR(255),
    currency_code           VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal                NUMERIC(12, 2) DEFAULT 0,
    tax                     NUMERIC(12, 2) DEFAULT 0,
    discount                NUMERIC(12, 2) DEFAULT 0,
    total                   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status                  VARCHAR(16) DEFAULT 'draft', -- draft|sent|paid|overdue|void
    line_items              JSONB DEFAULT '[]'::jsonb,
    due_date                DATE,
    issued_at               TIMESTAMPTZ,
    paid_at                 TIMESTAMPTZ,
    payment_transaction_id  UUID,
    notes                   TEXT,
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Platform invoices billed to vendors / advertisers';

-- ============================================================================
-- 6. MESSAGING — EMAIL DELIVERY LOG
-- ============================================================================

CREATE TABLE email_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient       VARCHAR(255) NOT NULL,
    subject         VARCHAR(255),
    template        VARCHAR(128),
    provider        VARCHAR(64),                  -- resend|postmark|ses|brevo|console
    status          VARCHAR(16) DEFAULT 'queued', -- queued|sent|delivered|opened|clicked|failed|bounced
    message_id      VARCHAR(255),
    error           TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE email_logs IS 'Audit trail of transactional emails sent by the platform';

-- ============================================================================
-- 7. LEGAL — DOCUMENT VERSION REGISTRY
-- ============================================================================

CREATE TABLE legal_document_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(64) NOT NULL,            -- terms | privacy | cookies | seller-terms | host | driver | rider | guest
    title           VARCHAR(255) NOT NULL,
    version         VARCHAR(32) NOT NULL,            -- '2026-08-01'
    status          VARCHAR(16) DEFAULT 'draft',     -- draft|published|archived
    effective_date  DATE,
    last_updated    DATE,
    author          VARCHAR(255),
    content         TEXT,                            -- Markdown/HTML body of the document
    languages       JSONB DEFAULT '["en"]'::jsonb,
    sections        INT DEFAULT 0,
    word_count      INT DEFAULT 0,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT legal_document_versions_slug_version_key UNIQUE (slug, version)
);

COMMENT ON TABLE legal_document_versions IS 'Versioned registry of legal documents driving /legal/ pages and consent_version';

CREATE INDEX idx_legal_document_versions_slug_status ON legal_document_versions(slug, status);
CREATE INDEX idx_crm_leads_owner_status ON crm_leads(owner_id, status);
CREATE INDEX idx_crm_leads_business ON crm_leads(business_id);
CREATE INDEX idx_sales_deals_stage_owner ON sales_deals(stage, owner_id);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_promo_redemptions_promo ON promo_redemptions(promo_id);
CREATE INDEX idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assignee ON support_tickets(assigned_to);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------------
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_deals ENABLE ROW LEVEL SECURITY;

-- Back-office roles may administer leads; owners/admins of the linked business
-- may also read leads tied to their own business.
CREATE POLICY crm_leads_admin_all ON crm_leads
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY crm_leads_business_owner_read ON crm_leads
    FOR SELECT
    USING (is_business_owner(business_id));

CREATE POLICY sales_deals_admin_all ON sales_deals
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY sales_deals_business_owner_read ON sales_deals
    FOR SELECT
    USING (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Marketing
-- ---------------------------------------------------------------------------
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_codes_admin_all ON promo_codes
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY promo_codes_active_read ON promo_codes
    FOR SELECT
    USING (is_active = true);

CREATE POLICY promo_redemptions_admin_all ON promo_redemptions
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY promo_redemptions_own_read ON promo_redemptions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY ad_campaigns_admin_all ON ad_campaigns
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Support
-- ---------------------------------------------------------------------------
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_tickets_admin_all ON support_tickets
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY support_tickets_own_all ON support_tickets
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY ticket_messages_admin_all ON ticket_messages
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Customers can read the public thread of their own tickets and add to it.
CREATE POLICY ticket_messages_own_read ON ticket_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_id
              AND t.user_id = auth.uid()
        )
        AND internal = false
    );

CREATE POLICY ticket_messages_own_insert ON ticket_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_id
              AND t.user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_admin_all ON invoices
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY invoices_own_read ON invoices
    FOR SELECT
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Email log
-- ---------------------------------------------------------------------------
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_logs_admin_read ON email_logs
    FOR SELECT
    USING (is_admin());

CREATE POLICY email_logs_insert ON email_logs
    FOR INSERT
    WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Legal document registry
-- ---------------------------------------------------------------------------
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_document_versions_admin_all ON legal_document_versions
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Published legal docs are readable by everyone (anon included) so the
-- /legal/ pages can render from the registry without a session.
CREATE POLICY legal_document_versions_published_read ON legal_document_versions
    FOR SELECT
    USING (status = 'published');

-- ============================================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER trg_crm_leads_updated_at
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sales_deals_updated_at
    BEFORE UPDATE ON sales_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ad_campaigns_updated_at
    BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_legal_document_versions_updated_at
    BEFORE UPDATE ON legal_document_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
