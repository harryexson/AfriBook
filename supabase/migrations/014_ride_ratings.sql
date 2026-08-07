-- ============================================================================
-- AfriBook — Ride Ratings (rider → driver)
-- Supabase PostgreSQL migration 014
-- ============================================================================
-- Backs the mobile "rate this ride" flow (POST /api/ridely/rides/:id/rate).
-- One rating per ride; riders may rate only completed rides they booked, and
-- drivers may read ratings they received. Admins get full access via the
-- existing `is_admin()` helper (012).
--
-- Additive and idempotent.
-- ============================================================================

CREATE TABLE ridely_ride_ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id     UUID NOT NULL REFERENCES ridely_rides(id) ON DELETE CASCADE,
    rider_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    driver_id   UUID REFERENCES drivers(id) ON DELETE SET NULL,
    rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review      TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ridely_ride_ratings IS 'Rider ratings of completed ridely rides';

CREATE UNIQUE INDEX idx_ridely_ride_ratings_ride ON ridely_ride_ratings(ride_id);
CREATE INDEX idx_ridely_ride_ratings_driver ON ridely_ride_ratings(driver_id);
CREATE INDEX idx_ridely_ride_ratings_rider ON ridely_ride_ratings(rider_id);

ALTER TABLE ridely_ride_ratings ENABLE ROW LEVEL SECURITY;

-- Admins may see all ratings (support / fraud review).
CREATE POLICY ridely_ride_ratings_admin_all ON ridely_ride_ratings
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Riders may insert a rating for a ride they booked.
CREATE POLICY ridely_ride_ratings_insert_own ON ridely_ride_ratings
    FOR INSERT TO authenticated
    WITH CHECK (rider_id = auth.uid());

-- Riders and the rated driver may read their own ratings.
CREATE POLICY ridely_ride_ratings_select_own ON ridely_ride_ratings
    FOR SELECT TO authenticated
    USING (
        rider_id = auth.uid()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
    );

-- Riders may update/remove their own rating.
CREATE POLICY ridely_ride_ratings_update_own ON ridely_ride_ratings
    FOR UPDATE TO authenticated
    USING (rider_id = auth.uid())
    WITH CHECK (rider_id = auth.uid());

CREATE POLICY ridely_ride_ratings_delete_own ON ridely_ride_ratings
    FOR DELETE TO authenticated
    USING (rider_id = auth.uid());

CREATE TRIGGER trg_ridely_ride_ratings_updated_at
    BEFORE UPDATE ON ridely_ride_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON ridely_ride_ratings TO authenticated;
