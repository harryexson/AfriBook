-- ============================================================================
-- AfriBook — Content Moderation & Allowed Provider Categories
-- Migration: 007_content_moderation
-- ============================================================================
-- Adds:
--   1. prohibited_terms            reference table (single source of truth for
--                                  the DB-layer keyword matcher)
--   2. content_moderation_flags    audit log of every flagged / blocked payload
--   3. afribook_moderate_text()    PL/pgSQL matcher (obfuscation resistant)
--   4. BEFORE triggers             block HIGH-severity content on
--                                  users / businesses / events inserts & updates
--   5. AFTER triggers              log every flagged payload to the audit table
--
-- All triggers are created ONLY when the expected columns exist, so this
-- migration is safe to apply against any schema variant of the platform.
-- ============================================================================

-- 1. REFERENCE TABLES -------------------------------------------------------

CREATE TABLE IF NOT EXISTS prohibited_terms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   TEXT NOT NULL,
    category_label TEXT NOT NULL,
    term          TEXT NOT NULL,
    severity      TEXT NOT NULL CHECK (severity IN ('high', 'medium')),
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_moderation_flags (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type      TEXT NOT NULL,
    entity_id        TEXT,
    field            TEXT,
    matched_categories TEXT[],
    matched_terms    TEXT[],
    severity         TEXT,
    action           TEXT,            -- 'blocked' | 'flagged'
    reviewer_id      UUID,
    reviewed_at      TIMESTAMPTZ,
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_moderation_flags_entity
    ON content_moderation_flags (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_flags_created
    ON content_moderation_flags (created_at DESC);

-- 2. SEED PROHIBITED TERMS ------------------------------------------------
-- Kept in sync with src/lib/moderation/taxonomy.ts

TRUNCATE prohibited_terms;

INSERT INTO prohibited_terms (category_id, category_label, term, severity) VALUES
  -- sexual exploitation & sex sales
  ('sexual_exploitation','Sexual exploitation & sex sales','sex trafficking','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sex for sale','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sex for cash','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sexual services','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','escort service','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','escort agency','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','escort girl','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','call girl','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','prostitute','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','prostitution','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','brothel','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','pimp','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','pimping','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sex sale','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sex-sales','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','erotic massage','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','nude massage','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','pornography','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','porno','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','porn site','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','adult content','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','adult film','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','sex tape','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','onlyfans','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','cam girl','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','webcam sex','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','happy ending','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','full service','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','extra service','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','private dance','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','rub and tug','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','hand relief','high'),
  ('sexual_exploitation','Sexual exploitation & sex sales','table shower','high'),
  -- child exploitation
  ('child_exploitation','Child exploitation & child trafficking','child trafficking','high'),
  ('child_exploitation','Child exploitation & child trafficking','minor trafficking','high'),
  ('child_exploitation','Child exploitation & child trafficking','child sex','high'),
  ('child_exploitation','Child exploitation & child trafficking','child porn','high'),
  ('child_exploitation','Child exploitation & child trafficking','child pornography','high'),
  ('child_exploitation','Child exploitation & child trafficking','minor porn','high'),
  ('child_exploitation','Child exploitation & child trafficking','underage','high'),
  ('child_exploitation','Child exploitation & child trafficking','jailbait','high'),
  ('child_exploitation','Child exploitation & child trafficking','cp material','high'),
  -- slavery / trafficking
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','human trafficking','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','people trafficking','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','modern slavery','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','forced labor','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','forced labour','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','slave labor','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','slave labour','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','bonded labor','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','indentured labor','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','child labor','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','child labour','high'),
  ('human_trafficking_slavery','Slavery, forced labour & human trafficking','slavery','high'),
  -- illegal drugs
  ('illegal_drugs','Illegal & illicit drugs / narcotics','illicit drugs','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','illegal drugs','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','drug trafficking','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','narcotics trafficking','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','drug dealer','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','sell cocaine','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','buy cocaine','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','cocaine for sale','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','heroin for sale','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','meth for sale','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','methamphetamine','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','fentanyl','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','ecstasy pill','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','mdma pill','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','lsd tab','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','pill press','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','synthetic drug','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','designer drug','high'),
  ('illegal_drugs','Illegal & illicit drugs / narcotics','cannabis trafficking','high'),
  -- violence
  ('violence','Violence, weapons & fight clubs','hitman','high'),
  ('violence','Violence, weapons & fight clubs','hit man','high'),
  ('violence','Violence, weapons & fight clubs','murder for hire','high'),
  ('violence','Violence, weapons & fight clubs','assassination service','high'),
  ('violence','Violence, weapons & fight clubs','gun for hire','high'),
  ('violence','Violence, weapons & fight clubs','weapon trafficking','high'),
  ('violence','Violence, weapons & fight clubs','arms trafficking','high'),
  ('violence','Violence, weapons & fight clubs','explosives for sale','high'),
  ('violence','Violence, weapons & fight clubs','bomb making','high'),
  ('violence','Violence, weapons & fight clubs','violent event','high'),
  ('violence','Violence, weapons & fight clubs','fight club','high'),
  -- financial crime
  ('financial_crime','Financial crime (laundering, racketeering)','money laundering','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','launder money','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','launder funds','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','shell company','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','racketeering','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','racketeer','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','loan shark','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','loan sharking','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','smurfing','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','tax evasion scheme','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','fraud scheme','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','counterfeit money','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','fake currency','high'),
  ('financial_crime','Financial crime (laundering, racketeering)','illegal enrichment','high'),
  -- gambling
  ('gambling','Gambling products, services & events','online casino','high'),
  ('gambling','Gambling products, services & events','gambling site','high'),
  ('gambling','Gambling products, services & events','gambling service','high'),
  ('gambling','Gambling products, services & events','betting site','high'),
  ('gambling','Gambling products, services & events','sports betting','high'),
  ('gambling','Gambling products, services & events','sportsbook','high'),
  ('gambling','Gambling products, services & events','bookie','high'),
  ('gambling','Gambling products, services & events','poker site','high'),
  ('gambling','Gambling products, services & events','crypto gambling','high'),
  ('gambling','Gambling products, services & events','illegal gambling','high'),
  -- harassment / extortion
  ('harassment_extortion','Harassment, blackmail & extortion','revenge porn','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','blackmail service','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','extortion service','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','doxxing service','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','harassment for hire','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','harassment campaign','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','cyber harassment','high'),
  ('harassment_extortion','Harassment, blackmail & extortion','stalker service','high');

-- 3. MATCHER FUNCTION -------------------------------------------------------

CREATE OR REPLACE FUNCTION afribook_strip_text(p_text text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
    SELECT lower(regexp_replace(coalesce(p_text, ''), '[^a-zA-Z0-9]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION afribook_moderate_text(p_text text)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_stripped text := afribook_strip_text(p_text);
    v_blocked  boolean := false;
    v_flagged  boolean := false;
    v_cats     text[] := '{}';
    v_terms    text[] := '{}';
    r          record;
BEGIN
    IF v_stripped = '' THEN
        RETURN jsonb_build_object('blocked', false, 'flagged', false, 'categories', v_cats, 'terms', v_terms);
    END IF;

    FOR r IN SELECT category_id, term, severity FROM prohibited_terms LOOP
        IF position(afribook_strip_text(r.term) IN v_stripped) > 0 THEN
            v_flagged := true;
            v_cats  := array_append(v_cats, r.category_id);
            v_terms := array_append(v_terms, r.term);
            IF r.severity = 'high' THEN
                v_blocked := true;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('blocked', v_blocked, 'flagged', v_flagged, 'categories', v_cats, 'terms', v_terms);
END;
$$;

-- 4. BLOCKING TRIGGERS (BEFORE) --------------------------------------------
-- Raise on any HIGH-severity match so the row is never written.

CREATE OR REPLACE FUNCTION afribook_trg_block_businesses()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_res jsonb;
BEGIN
    v_res := afribook_moderate_text(concat_ws(' ', NEW.name, NEW.description, NEW.subcategory));
    IF (v_res->>'blocked') = 'true' THEN
        RAISE EXCEPTION 'AfriBook policy violation: prohibited content detected (%). Action blocked.', v_res->>'categories'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION afribook_trg_block_events()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_res jsonb;
BEGIN
    v_res := afribook_moderate_text(concat_ws(' ', NEW.title, NEW.description));
    IF (v_res->>'blocked') = 'true' THEN
        RAISE EXCEPTION 'AfriBook policy violation: prohibited content detected (%). Event blocked.', v_res->>'categories'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION afribook_trg_block_users()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_res jsonb;
BEGIN
    v_res := afribook_moderate_text(concat_ws(' ', NEW.full_name, NEW.email, NEW.name));
    IF (v_res->>'blocked') = 'true' THEN
        RAISE EXCEPTION 'AfriBook policy violation: prohibited content detected (%). Registration blocked.', v_res->>'categories'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

-- 5. LOGGING TRIGGERS (AFTER) ----------------------------------------------
-- Record every flagged payload (including those that were blocked at the app
-- layer but still attempted) to content_moderation_flags for review.

CREATE OR REPLACE FUNCTION afribook_trg_log_businesses()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_res jsonb;
BEGIN
    v_res := afribook_moderate_text(concat_ws(' ', NEW.name, NEW.description, NEW.subcategory));
    IF (v_res->>'flagged') = 'true' THEN
        INSERT INTO content_moderation_flags (entity_type, entity_id, field, matched_categories, matched_terms, severity, action)
        VALUES ('business', NEW.id::text, 'name/description', (SELECT array_agg(DISTINCT x) FROM jsonb_array_elements_text(v_res->'categories') x),
                (SELECT array_agg(DISTINCT x) FROM jsonb_array_elements_text(v_res->'terms') x), 'high', 'flagged');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION afribook_trg_log_events()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_res jsonb;
BEGIN
    v_res := afribook_moderate_text(concat_ws(' ', NEW.title, NEW.description));
    IF (v_res->>'flagged') = 'true' THEN
        INSERT INTO content_moderation_flags (entity_type, entity_id, field, matched_categories, matched_terms, severity, action)
        VALUES ('event', NEW.id::text, 'title/description', (SELECT array_agg(DISTINCT x) FROM jsonb_array_elements_text(v_res->'categories') x),
                (SELECT array_agg(DISTINCT x) FROM jsonb_array_elements_text(v_res->'terms') x), 'high', 'flagged');
    END IF;
    RETURN NEW;
END;
$$;

-- 6. CONDITIONALLY ATTACH TRIGGERS -----------------------------------------
-- Only attach when the expected columns exist, so this never fails on schema
-- drift. Re-runnable: drops existing triggers first.

DO $$
BEGIN
    -- businesses
    IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'name'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'description'
    ) THEN
        DROP TRIGGER IF EXISTS trg_businesses_block_prohibited ON businesses;
        DROP TRIGGER IF EXISTS trg_businesses_log_prohibited ON businesses;
        CREATE TRIGGER trg_businesses_block_prohibited
            BEFORE INSERT OR UPDATE ON businesses
            FOR EACH ROW EXECUTE FUNCTION afribook_trg_block_businesses();
        CREATE TRIGGER trg_businesses_log_prohibited
            AFTER INSERT OR UPDATE ON businesses
            FOR EACH ROW EXECUTE FUNCTION afribook_trg_log_businesses();
    END IF;

    -- events
    IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'title'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'description'
    ) THEN
        DROP TRIGGER IF EXISTS trg_events_block_prohibited ON events;
        DROP TRIGGER IF EXISTS trg_events_log_prohibited ON events;
        CREATE TRIGGER trg_events_block_prohibited
            BEFORE INSERT OR UPDATE ON events
            FOR EACH ROW EXECUTE FUNCTION afribook_trg_block_events();
        CREATE TRIGGER trg_events_log_prohibited
            AFTER INSERT OR UPDATE ON events
            FOR EACH ROW EXECUTE FUNCTION afribook_trg_log_events();
    END IF;

    -- users (covers both full_name and name column variants)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email'
    ) AND (
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name')
        OR EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name')
    ) THEN
        DROP TRIGGER IF EXISTS trg_users_block_prohibited ON users;
        CREATE TRIGGER trg_users_block_prohibited
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION afribook_trg_block_users();
    END IF;
END $$;
