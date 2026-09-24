-- Vehicle Rental Marketplace Tables
-- Migration: 020_vehicle_rental_marketplace.sql

-- Vehicle types enum
CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'truck', 'van', 'coupe', 'convertible', 'hatchback', 'wagon', 'minivan', 'pickup', 'luxury', 'electric', 'hybrid', 'motorcycle', 'scooter', 'rv', 'trailer', 'bus');

-- Vehicle transmission enum
CREATE TYPE vehicle_transmission AS ENUM ('automatic', 'manual', 'cvt', 'semi_automatic');

-- Vehicle fuel type enum
CREATE TYPE vehicle_fuel_type AS ENUM ('gasoline', 'diesel', 'electric', 'hybrid', 'plug_in_hybrid', 'cng', 'lpg', 'hydrogen');

-- Vehicle condition enum
CREATE TYPE vehicle_condition AS ENUM ('new', 'excellent', 'good', 'fair', 'poor');

-- Host type enum
CREATE TYPE host_type AS ENUM ('individual', 'company', 'dealership', 'rental_company');

-- Vehicle verification status enum
CREATE TYPE vehicle_verification_status AS ENUM ('pending', 'approved', 'rejected', 'requires_update', 'suspended');

-- Booking status for vehicle rentals
CREATE TYPE vehicle_booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show', 'disputed');

-- Host profiles (vehicle owners/companies)
CREATE TABLE host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_type host_type NOT NULL DEFAULT 'individual',
  company_name TEXT,
  company_registration_number TEXT,
  tax_id TEXT,
  business_license TEXT,
  insurance_policy_number TEXT,
  insurance_provider TEXT,
  insurance_expiry_date DATE,
  contact_person_name TEXT,
  contact_person_phone TEXT,
  contact_person_email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country_code TEXT DEFAULT 'US',
  stripe_account_id TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Platform commission percentage
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB DEFAULT '[]',
  verification_status vehicle_verification_status DEFAULT 'pending',
  verification_notes TEXT,
  total_vehicles INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  vehicle_type vehicle_type NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  trim TEXT,
  color TEXT NOT NULL,
  exterior_color_hex TEXT,
  interior_color TEXT,
  interior_color_hex TEXT,
  transmission vehicle_transmission NOT NULL DEFAULT 'automatic',
  fuel_type vehicle_fuel_type NOT NULL DEFAULT 'gasoline',
  engine_size TEXT, -- e.g., '2.0L', '3.5L V6'
  horsepower INTEGER,
  drivetrain TEXT, -- FWD, RWD, AWD, 4WD
  doors INTEGER DEFAULT 4 CHECK (doors >= 2 AND doors <= 5),
  seats INTEGER DEFAULT 5 CHECK (seats >= 1 AND seats <= 15),
  mileage INTEGER DEFAULT 0 CHECK (mileage >= 0),
  condition vehicle_condition NOT NULL DEFAULT 'good',
  vin TEXT UNIQUE, -- Vehicle Identification Number
  license_plate TEXT NOT NULL,
  license_plate_state TEXT,
  license_plate_country TEXT DEFAULT 'US',
  registration_expiry_date DATE,
  insurance_policy_number TEXT,
  insurance_provider TEXT,
  insurance_expiry_date DATE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  registration_verified BOOLEAN DEFAULT FALSE,
  inspection_verified BOOLEAN DEFAULT FALSE,
  inspection_date DATE,
  inspection_notes TEXT,
  features JSONB DEFAULT '[]', -- Array of feature strings
  amenities JSONB DEFAULT '[]', -- Array of amenity strings
  rules JSONB DEFAULT '[]', -- House rules for renters
  location_address TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_state TEXT NOT NULL,
  location_postal_code TEXT NOT NULL,
  location_country_code TEXT DEFAULT 'US',
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  daily_rate DECIMAL(10,2) NOT NULL,
  weekly_discount_percent DECIMAL(5,2) DEFAULT 0,
  monthly_discount_percent DECIMAL(5,2) DEFAULT 0,
  minimum_rental_days INTEGER DEFAULT 1,
  maximum_rental_days INTEGER DEFAULT 30,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  delivery_available BOOLEAN DEFAULT FALSE,
  delivery_radius_km INTEGER DEFAULT 0,
  delivery_fee_per_km DECIMAL(8,2) DEFAULT 0,
  pickup_instructions TEXT,
  dropoff_instructions TEXT,
  images JSONB DEFAULT '[]', -- Array of image objects with url, type (exterior/interior/engine/dashboard/etc), is_primary
  verification_status vehicle_verification_status DEFAULT 'pending',
  verification_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_instant_book BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  total_bookings INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle availability calendar
CREATE TABLE vehicle_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  price_override DECIMAL(10,2), -- Override daily rate for specific dates
  minimum_days INTEGER, -- Override minimum rental days for this date
  note TEXT, -- Reason for unavailability or special pricing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, date)
);

-- Vehicle bookings
CREATE TABLE vehicle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status vehicle_booking_status DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '10:00',
  end_time TIME NOT NULL DEFAULT '10:00',
  pickup_location_address TEXT,
  pickup_location_city TEXT,
  pickup_location_state TEXT,
  pickup_location_postal_code TEXT,
  pickup_location_country_code TEXT DEFAULT 'US',
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  dropoff_location_address TEXT,
  dropoff_location_city TEXT,
  dropoff_location_state TEXT,
  dropoff_location_postal_code TEXT,
  dropoff_location_country_code TEXT DEFAULT 'US',
  dropoff_latitude DECIMAL(10, 8),
  dropoff_longitude DECIMAL(11, 8),
  delivery_requested BOOLEAN DEFAULT FALSE,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) NOT NULL,
  number_of_days INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  weekly_discount DECIMAL(10,2) DEFAULT 0,
  monthly_discount DECIMAL(10,2) DEFAULT 0,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  platform_fee_percent DECIMAL(5,2) NOT NULL,
  platform_fee_amount DECIMAL(10,2) NOT NULL,
  host_earnings DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, refunded, partially_refunded
  escrow_status TEXT DEFAULT 'held', -- held, released, refunded, disputed
  renter_insurance_verified BOOLEAN DEFAULT FALSE,
  renter_license_verified BOOLEAN DEFAULT FALSE,
  host_confirmed_at TIMESTAMPTZ,
  renter_confirmed_at TIMESTAMPTZ,
  pickup_confirmed_at TIMESTAMPTZ,
  dropoff_confirmed_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle images (detailed)
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exterior_front', 'exterior_rear', 'exterior_side', 'interior_front', 'interior_rear', 'dashboard', 'engine', 'trunk', 'wheels', 'damage', 'other')),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle reviews
CREATE TABLE vehicle_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES vehicle_bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  title TEXT,
  comment TEXT,
  images JSONB DEFAULT '[]',
  is_verified_booking BOOLEAN DEFAULT TRUE,
  host_reply TEXT,
  host_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Vehicle documents (insurance, registration, inspection)
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('insurance', 'registration', 'inspection', 'title', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Host payouts
CREATE TABLE host_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES vehicle_bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  stripe_transfer_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle favorites (wishlist)
CREATE TABLE vehicle_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Indexes for performance
CREATE INDEX idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX idx_host_profiles_verification_status ON host_profiles(verification_status);
CREATE INDEX idx_vehicles_host_id ON vehicles(host_id);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_location ON vehicles(location_city, location_state, location_country_code);
CREATE INDEX idx_vehicles_active ON vehicles(is_active, verification_status);
CREATE INDEX idx_vehicles_price ON vehicles(daily_rate);
CREATE INDEX idx_vehicle_availability_vehicle_date ON vehicle_availability(vehicle_id, date);
CREATE INDEX idx_vehicle_bookings_vehicle_id ON vehicle_bookings(vehicle_id);
CREATE INDEX idx_vehicle_bookings_renter_id ON vehicle_bookings(renter_id);
CREATE INDEX idx_vehicle_bookings_host_id ON vehicle_bookings(host_id);
CREATE INDEX idx_vehicle_bookings_status ON vehicle_bookings(status);
CREATE INDEX idx_vehicle_bookings_dates ON vehicle_bookings(start_date, end_date);
CREATE INDEX idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_reviews_vehicle_id ON vehicle_reviews(vehicle_id);
CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX idx_host_payouts_host_id ON host_payouts(host_id);
CREATE INDEX idx_vehicle_favorites_user_id ON vehicle_favorites(user_id);

-- Enable Row Level Security
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for host_profiles
CREATE POLICY "Hosts can view own profile" ON host_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Hosts can insert own profile" ON host_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Hosts can update own profile" ON host_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all host profiles" ON host_profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view active verified vehicles" ON vehicles
  FOR SELECT USING (is_active = TRUE AND verification_status = 'approved');
CREATE POLICY "Hosts can view own vehicles" ON vehicles
  FOR SELECT USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = vehicles.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM host_profiles WHERE id = vehicles.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can update own vehicles" ON vehicles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = vehicles.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can delete own vehicles" ON vehicles
  FOR DELETE USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = vehicles.host_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for vehicle_availability
CREATE POLICY "Anyone can view availability for active vehicles" ON vehicle_availability
  FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_availability.vehicle_id AND is_active = TRUE AND verification_status = 'approved'));
CREATE POLICY "Hosts can manage own vehicle availability" ON vehicle_availability
  FOR ALL USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_availability.vehicle_id AND h.user_id = auth.uid()));

-- RLS Policies for vehicle_bookings
CREATE POLICY "Renters can view own bookings" ON vehicle_bookings
  FOR SELECT USING (renter_id = auth.uid());
CREATE POLICY "Hosts can view bookings for their vehicles" ON vehicle_bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_bookings.vehicle_id AND h.user_id = auth.uid()));
CREATE POLICY "Renters can create bookings" ON vehicle_bookings
  FOR INSERT WITH CHECK (renter_id = auth.uid());
CREATE POLICY "Hosts can update booking status" ON vehicle_bookings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_bookings.vehicle_id AND h.user_id = auth.uid()));
CREATE POLICY "Renters can cancel own bookings" ON vehicle_bookings
  FOR UPDATE USING (renter_id = auth.uid() AND status IN ('pending', 'confirmed'));
CREATE POLICY "Admins can view all bookings" ON vehicle_bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for vehicle_images
CREATE POLICY "Anyone can view images for active vehicles" ON vehicle_images
  FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_images.vehicle_id AND is_active = TRUE AND verification_status = 'approved'));
CREATE POLICY "Hosts can manage own vehicle images" ON vehicle_images
  FOR ALL USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_images.vehicle_id AND h.user_id = auth.uid()));

-- RLS Policies for vehicle_reviews
CREATE POLICY "Anyone can view reviews for active vehicles" ON vehicle_reviews
  FOR SELECT USING (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_reviews.vehicle_id AND is_active = TRUE AND verification_status = 'approved'));
CREATE POLICY "Renters can create reviews for completed bookings" ON vehicle_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() 
    AND EXISTS (SELECT 1 FROM vehicle_bookings WHERE id = vehicle_reviews.booking_id AND renter_id = auth.uid() AND status = 'completed')
  );
CREATE POLICY "Hosts can reply to reviews for their vehicles" ON vehicle_reviews
  FOR UPDATE USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_reviews.vehicle_id AND h.user_id = auth.uid()));

-- RLS Policies for vehicle_documents
CREATE POLICY "Hosts can manage own vehicle documents" ON vehicle_documents
  FOR ALL USING (EXISTS (SELECT 1 FROM vehicles v JOIN host_profiles h ON v.host_id = h.id WHERE v.id = vehicle_documents.vehicle_id AND h.user_id = auth.uid()));
CREATE POLICY "Admins can view all vehicle documents" ON vehicle_documents
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for host_payouts
CREATE POLICY "Hosts can view own payouts" ON host_payouts
  FOR SELECT USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = host_payouts.host_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all payouts" ON host_payouts
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for vehicle_favorites
CREATE POLICY "Users can manage own favorites" ON vehicle_favorites
  FOR ALL USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_host_profiles_updated_at BEFORE UPDATE ON host_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_availability_updated_at BEFORE UPDATE ON vehicle_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_bookings_updated_at BEFORE UPDATE ON vehicle_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_reviews_updated_at BEFORE UPDATE ON vehicle_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_documents_updated_at BEFORE UPDATE ON vehicle_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_payouts_updated_at BEFORE UPDATE ON host_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate host earnings from booking
CREATE OR REPLACE FUNCTION calculate_host_earnings(booking_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  booking_record vehicle_bookings%ROWTYPE;
  host_commission DECIMAL(5,2);
BEGIN
  SELECT * INTO booking_record FROM vehicle_bookings WHERE id = booking_id;
  SELECT commission_rate INTO host_commission FROM host_profiles WHERE id = booking_record.host_id;
  RETURN booking_record.subtotal * (100 - host_commission) / 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check vehicle availability for date range
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  unavailable_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unavailable_count
  FROM vehicle_availability
  WHERE vehicle_id = p_vehicle_id
    AND date >= p_start_date
    AND date < p_end_date
    AND is_available = FALSE;
  
  IF unavailable_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO unavailable_count
  FROM vehicle_bookings
  WHERE vehicle_id = p_vehicle_id
    AND status IN ('pending', 'confirmed', 'active')
    AND start_date < p_end_date
    AND end_date > p_start_date;
  
  RETURN unavailable_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vehicle pricing for date range
CREATE OR REPLACE FUNCTION get_vehicle_pricing(
  p_vehicle_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  daily_rate DECIMAL(10,2),
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.date,
    COALESCE(va.price_override, v.daily_rate) AS daily_rate,
    COALESCE(va.is_available, TRUE) AS is_available
  FROM generate_series(p_start_date, p_end_date - INTERVAL '1 day', INTERVAL '1 day') AS gs(date)
  LEFT JOIN vehicle_availability va ON va.vehicle_id = p_vehicle_id AND va.date = gs.date
  CROSS JOIN vehicles v
  WHERE v.id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── API Keys for External Platform Integration ─────────────────

-- API key scopes enum
CREATE TYPE api_key_scope AS ENUM ('read', 'write', 'bookings', 'vehicles', 'availability', 'webhooks', 'admin');

-- API keys table for external platform integration
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Website Integration", "Mobile App", "Partner Platform"
  key_prefix TEXT NOT NULL, -- First 8 chars for display: "afb_live_abc123"
  key_hash TEXT NOT NULL, -- bcrypt hash of the full key
  scopes api_key_scope[] NOT NULL DEFAULT ARRAY['read'],
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API key usage logs for monitoring
CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook endpoints for external platforms
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- Used to sign webhook payloads
  events TEXT[] NOT NULL DEFAULT ARRAY['booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed', 'vehicle.availability_changed'],
  is_active BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External platform connections (for tracking partner integrations)
CREATE TABLE external_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL, -- e.g., "Turo", "Getaround", "Custom Website"
  platform_url TEXT,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  sync_enabled BOOLEAN DEFAULT FALSE,
  sync_frequency TEXT DEFAULT 'hourly', -- hourly, daily, manual
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, success, failed
  sync_error_message TEXT,
  field_mapping JSONB DEFAULT '{}', -- Map external fields to our fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_host_id ON api_keys(host_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at);
CREATE INDEX idx_webhook_endpoints_host_id ON webhook_endpoints(host_id);
CREATE INDEX idx_webhook_endpoints_api_key_id ON webhook_endpoints(api_key_id);
CREATE INDEX idx_webhook_delivery_logs_webhook_endpoint_id ON webhook_delivery_logs(webhook_endpoint_id);
CREATE INDEX idx_external_platform_connections_host_id ON external_platform_connections(host_id);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_platform_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Hosts can view own api keys" ON api_keys
  FOR SELECT USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = api_keys.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can create own api keys" ON api_keys
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM host_profiles WHERE id = api_keys.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can update own api keys" ON api_keys
  FOR UPDATE USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = api_keys.host_id AND user_id = auth.uid()));
CREATE POLICY "Hosts can delete own api keys" ON api_keys
  FOR DELETE USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = api_keys.host_id AND user_id = auth.uid()));

-- RLS Policies for api_key_usage_logs
CREATE POLICY "Hosts can view own api key usage logs" ON api_key_usage_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM api_keys ak JOIN host_profiles hp ON ak.host_id = hp.id WHERE ak.id = api_key_usage_logs.api_key_id AND hp.user_id = auth.uid()));

-- RLS Policies for webhook_endpoints
CREATE POLICY "Hosts can manage own webhook endpoints" ON webhook_endpoints
  FOR ALL USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = webhook_endpoints.host_id AND user_id = auth.uid()));

-- RLS Policies for webhook_delivery_logs
CREATE POLICY "Hosts can view own webhook delivery logs" ON webhook_delivery_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM webhook_endpoints we JOIN host_profiles hp ON we.host_id = hp.id WHERE we.id = webhook_delivery_logs.webhook_endpoint_id AND hp.user_id = auth.uid()));

-- RLS Policies for external_platform_connections
CREATE POLICY "Hosts can manage own external platform connections" ON external_platform_connections
  FOR ALL USING (EXISTS (SELECT 1 FROM host_profiles WHERE id = external_platform_connections.host_id AND user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_platform_connections_updated_at BEFORE UPDATE ON external_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate API key and return host_id
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS UUID AS $$
DECLARE
  v_host_id UUID;
  v_scopes api_key_scope[];
  v_rate_limit_min INTEGER;
  v_rate_limit_day INTEGER;
BEGIN
  SELECT host_id, scopes, rate_limit_per_minute, rate_limit_per_day
  INTO v_host_id, v_scopes, v_rate_limit_min, v_rate_limit_day
  FROM api_keys
  WHERE key_hash = p_key_hash
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_host_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Update last used timestamp
  UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = p_key_hash;
  
  RETURN v_host_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check API key rate limits
CREATE OR REPLACE FUNCTION check_api_key_rate_limit(p_api_key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_minute_count INTEGER;
  v_day_count INTEGER;
  v_limit_min INTEGER;
  v_limit_day INTEGER;
BEGIN
  SELECT rate_limit_per_minute, rate_limit_per_day
  INTO v_limit_min, v_limit_day
  FROM api_keys WHERE id = p_api_key_id;
  
  SELECT COUNT(*) INTO v_minute_count
  FROM api_key_usage_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  SELECT COUNT(*) INTO v_day_count
  FROM api_key_usage_logs
  WHERE api_key_id = p_api_key_id
    AND created_at > NOW() - INTERVAL '1 day';
  
  RETURN v_minute_count < v_limit_min AND v_day_count < v_limit_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION log_api_key_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_ip_address INET,
  p_user_agent TEXT,
  p_request_id TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_key_usage_logs (
    api_key_id, endpoint, method, status_code, response_time_ms,
    ip_address, user_agent, request_id
  ) VALUES (
    p_api_key_id, p_endpoint, p_method, p_status_code, p_response_time_ms,
    p_ip_address, p_user_agent, p_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;