-- ============================================================================
-- AfriBook Business Subdomains — Free subdomain per business — Migration 009
-- Comprehensive Supabase PostgreSQL migration covering:
--   • Enum type: domain_status
--   • Table: business_domains (one free subdomain per business)
--   • Indexes (unique on business_id, unique on subdomain / full_domain)
--   • Row Level Security policies (owner CRUD, admin full access)
--   • Trigger: auto-set updated_at
--   • Function: auto-generate a subdomain from a business name
-- ============================================================================

-- 1. ENUM TYPES =================================================================

CREATE TYPE domain_status AS ENUM (
    'pending',
    'active',
    'failed'
);

-- 2. CORE TABLE =================================================================

-- ---------------------------------------------------------------------------
-- BUSINESS DOMAINS — the free hosted subdomain each vendor business gets
-- (e.g. <business>.afribook.xyz). The root domain is covered by a free
-- wildcard TLS certificate so every business page is served over HTTPS at
-- zero cost to the vendor.
-- ---------------------------------------------------------------------------
CREATE TABLE business_domains (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    subdomain       VARCHAR(63) NOT NULL UNIQUE,
    root_domain     VARCHAR(255) NOT NULL DEFAULT 'afribook.xyz',
    full_domain     TEXT NOT NULL UNIQUE,
    status          domain_status DEFAULT 'pending',
    dns_records     JSONB DEFAULT '{}'::jsonb,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT business_domains_subdomain_format CHECK (
        subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
        AND length(subdomain) BETWEEN 3 AND 63
    ),
    CONSTRAINT business_domains_full_domain_format CHECK (
        full_domain = subdomain || '.' || root_domain
    )
);

COMMENT ON TABLE business_domains IS 'Free hosted subdomains provisioned for each vendor business (e.g. <business>.afribook.xyz)';
COMMENT ON COLUMN business_domains.dns_records IS 'DNS records required to point the subdomain at the AfriBook edge, kept for reference and automation';

-- 3. INDEXES ====================================================================

CREATE INDEX business_domains_status_idx ON business_domains(status);
CREATE INDEX business_domains_root_domain_idx ON business_domains(root_domain);

-- 4. TRIGGERS ===================================================================

CREATE TRIGGER trg_business_domains_updated_at
    BEFORE UPDATE ON business_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. HELPER FUNCTION ============================================================

-- Generates a unique, DNS-safe subdomain slug from a business name.
-- Falls back to a short random suffix when the desired slug is taken.
CREATE OR REPLACE FUNCTION generate_business_subdomain(p_business_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_name          VARCHAR(255);
    v_slug          TEXT;
    v_candidate     TEXT;
    v_taken         BOOLEAN := true;
    v_suffix        TEXT;
    v_attempts      INT := 0;
BEGIN
    SELECT name INTO v_name FROM businesses WHERE id = p_business_id;

    IF v_name IS NULL OR v_name = '' THEN
        v_name := 'business';
    END IF;

    v_slug := lower(regexp_replace(v_name, '[^a-z0-9]+', '-', 'g'));
    v_slug := btrim(v_slug, '-');
    IF length(v_slug) < 3 THEN
        v_slug := 'biz-' || v_slug;
    END IF;
    IF length(v_slug) > 58 THEN
        v_slug := left(v_slug, 58);
        v_slug := btrim(v_slug, '-');
    END IF;

    WHILE v_taken AND v_attempts < 20 LOOP
        v_attempts := v_attempts + 1;
        IF v_attempts = 1 THEN
            v_candidate := v_slug;
        ELSE
            v_suffix := encode(gen_random_bytes(3), 'hex');
            v_candidate := left(v_slug, 50) || '-' || v_suffix;
        END IF;

        SELECT NOT EXISTS (
            SELECT 1 FROM business_domains WHERE subdomain = v_candidate
        ) INTO v_taken;
    END LOOP;

    RETURN NULLIF(v_candidate, '');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION generate_business_subdomain(UUID) IS 'Generates a unique subdomain slug from a business name';

-- 6. ROW LEVEL SECURITY =========================================================

ALTER TABLE business_domains ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- BUSINESS DOMAINS
-- ---------------------------------------------------------------------------
-- Owners can CRUD their own business subdomains; admins can manage all.
CREATE POLICY business_domains_read_own ON business_domains
    FOR SELECT
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_domains_insert_own ON business_domains
    FOR INSERT
    WITH CHECK (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_domains_update_own ON business_domains
    FOR UPDATE
    USING (is_business_owner(business_id) OR is_admin());

CREATE POLICY business_domains_delete_own ON business_domains
    FOR DELETE
    USING (is_business_owner(business_id) OR is_admin());

-- 7. REALTIME ===================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE business_domains;
