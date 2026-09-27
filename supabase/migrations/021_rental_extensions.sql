-- Extends the existing Neon-native rental_vehicles/rental_bookings schema
-- (never a Supabase table — created directly against Neon) with the pieces
-- it didn't yet have: an availability calendar, reviews, favorites, and a
-- partner API-key/webhook layer for external platform integration. Host
-- payouts reuse the existing generic `payouts` table (vendor_id = host's
-- profiles.id) rather than a rental-specific one.

CREATE TABLE rental_vehicle_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES rental_vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  price_override NUMERIC,
  minimum_days INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, date)
);
CREATE INDEX idx_rental_vehicle_availability_vehicle_date ON rental_vehicle_availability(vehicle_id, date);

CREATE TABLE rental_vehicle_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES rental_vehicles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  condition_rating SMALLINT CHECK (condition_rating BETWEEN 1 AND 5),
  communication_rating SMALLINT CHECK (communication_rating BETWEEN 1 AND 5),
  value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  comment TEXT,
  host_reply TEXT,
  host_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, reviewer_id)
);
CREATE INDEX idx_rental_vehicle_reviews_vehicle ON rental_vehicle_reviews(vehicle_id);
CREATE INDEX idx_rental_vehicle_reviews_host ON rental_vehicle_reviews(host_id);

CREATE TABLE rental_vehicle_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES rental_vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, vehicle_id)
);
CREATE INDEX idx_rental_vehicle_favorites_user ON rental_vehicle_favorites(user_id);

-- Recompute a vehicle's aggregate rating/review_count whenever a review is
-- written, so rental_vehicles never drifts from rental_vehicle_reviews.
CREATE OR REPLACE FUNCTION update_rental_vehicle_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE rental_vehicles SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM rental_vehicle_reviews WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)), 0),
    review_count = (SELECT COUNT(*) FROM rental_vehicle_reviews WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.vehicle_id, OLD.vehicle_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rental_vehicle_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE ON rental_vehicle_reviews
  FOR EACH ROW EXECUTE FUNCTION update_rental_vehicle_rating();

-- ─── Partner API integration (external platform access to a host's own
-- rental_vehicles/rental_bookings) ───────────────────────────────────────

CREATE TYPE rental_api_key_scope AS ENUM ('read', 'write', 'bookings', 'vehicles', 'availability', 'webhooks', 'admin');

CREATE TABLE rental_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  scopes rental_api_key_scope[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  last_used_at TIMESTAMPTZ,
  last_used_ip VARCHAR(64),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rental_api_keys_host ON rental_api_keys(host_id);
CREATE INDEX idx_rental_api_keys_prefix ON rental_api_keys(key_prefix);

CREATE TABLE rental_api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES rental_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rental_api_key_usage_key_time ON rental_api_key_usage_logs(api_key_id, created_at);

CREATE TABLE rental_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES rental_api_keys(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  secret VARCHAR(80) NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rental_webhook_endpoints_host ON rental_webhook_endpoints(host_id);

CREATE TABLE rental_webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES rental_webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rental_webhook_delivery_endpoint ON rental_webhook_delivery_logs(webhook_endpoint_id, delivered_at);

CREATE TABLE rental_external_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform_name VARCHAR(80) NOT NULL,
  external_account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  auto_sync BOOLEAN NOT NULL DEFAULT FALSE,
  sync_status VARCHAR(30) NOT NULL DEFAULT 'disconnected',
  sync_error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rental_external_platform_host ON rental_external_platform_connections(host_id);

-- No SECURITY DEFINER key-validation RPC here (unlike the Supabase-era
-- `validate_api_key`): the app-side lookup goes through
-- src/lib/neon/admin.ts's raw `query()`, which already runs on a
-- privileged connection that bypasses RLS the same way Supabase's
-- service-role key did, so a privilege-escalating function isn't needed.
