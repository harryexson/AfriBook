-- ============================================================================
-- AfriBook — Development / Staging Seed Data
--
-- This seed is designed to run against the FULL migration set (001 → 017).
-- Every insert targets the actual schema produced by those migrations.
-- All sample records are explicitly flagged as demo data (is_demo=true in
-- metadata) and use realistic per-country currencies derived from the
-- `currencies` table — never hard-coded USD.
--
-- Section order respects FK dependencies:
--   reference tables (currencies, languages, countries) FIRST, then
--   auth.users → profiles, then business_categories / admin_users / businesses.
--
-- Login accounts (auth) use deterministic emails + bcrypt-hashed passwords:
--   admin@afribook.com      / Admin@123456
--   customer@afribook.com   / Customer@123456
--   vendor@afribook.com     / Vendor@123456
--   provider@afribook.com   / Provider@123456
--   restaurant@afribook.com / Restaurant@123456
--   driver@afribook.com     / Driver@123456
--   organizer@afribook.com  / Organizer@123456
-- ─===========================================================================

-- ============================================================================
-- 1. CURRENCIES (ISO 4217) — exchange rate vs USD platform base
-- ============================================================================

INSERT INTO public.currencies (code, symbol, name, exchange_rate, is_active)
VALUES
  ('USD', '$', 'US Dollar', 1.000000, true),
  ('CAD', 'CA$', 'Canadian Dollar', 1.360000, true),
  ('GBP', '£', 'British Pound', 0.790000, true),
  ('EUR', '€', 'Euro', 0.920000, true),
  ('AED', 'د.إ', 'UAE Dirham', 3.670000, true),
  ('INR', '₹', 'Indian Rupee', 83.000000, true),
  ('NGN', '₦', 'Nigerian Naira', 1550.000000, true),
  ('GHS', 'GH₵', 'Ghanaian Cedi', 15.300000, true),
  ('KES', 'KSh', 'Kenyan Shilling', 145.000000, true),
  ('TZS', 'TSh', 'Tanzanian Shilling', 2550.000000, true),
  ('UGX', 'USh', 'Ugandan Shilling', 3700.000000, true),
  ('MWK', 'MK', 'Malawian Kwacha', 1730.000000, true),
  ('ZAR', 'R', 'South African Rand', 18.500000, true),
  ('EGP', 'E£', 'Egyptian Pound', 49.000000, true),
  ('ZMW', 'ZK', 'Zambian Kwacha', 25.000000, true),
  ('ZWL', 'Z$', 'Zimbabwean Dollar', 3200.000000, true),
  ('RWF', 'FRw', 'Rwandan Franc', 1300.000000, true),
  ('BWP', 'P', 'Botswana Pula', 13.500000, true),
  ('MZN', 'MT', 'Mozambican Metical', 64.000000, true),
  ('AOA', 'Kz', 'Angolan Kwanza', 880.000000, true),
  ('ETB', 'Br', 'Ethiopian Birr', 57.000000, true),
  ('XOF', 'CFA', 'West African CFA Franc', 600.000000, true),
  ('XAF', 'FCFA', 'Central African CFA Franc', 600.000000, true),
  ('AUD', 'A$', 'Australian Dollar', 1.520000, true),
  ('NZD', 'NZ$', 'New Zealand Dollar', 1.660000, true),
  ('SGD', 'S$', 'Singapore Dollar', 1.350000, true),
  ('HKD', 'HK$', 'Hong Kong Dollar', 7.800000, true),
  ('JPY', '¥', 'Japanese Yen', 156.000000, true),
  ('CNY', '¥', 'Chinese Yuan', 7.200000, true),
  ('MYR', 'RM', 'Malaysian Ringgit', 4.700000, true),
  ('IDR', 'Rp', 'Indonesian Rupiah', 16000.000000, true),
  ('PHP', '₱', 'Philippine Peso', 58.000000, true),
  ('THB', '฿', 'Thai Baht', 36.000000, true),
  ('VND', '₫', 'Vietnamese Dong', 25000.000000, true),
  ('KRW', '₩', 'South Korean Won', 1350.000000, true),
  ('BRL', 'R$', 'Brazilian Real', 5.400000, true),
  ('MXN', '$', 'Mexican Peso', 18.000000, true),
  ('ARS', '$', 'Argentine Peso', 850.000000, true),
  ('CLP', '$', 'Chilean Peso', 950.000000, true),
  ('COP', '$', 'Colombian Peso', 4000.000000, true),
  ('PEN', 'S/', 'Peruvian Sol', 3.700000, true),
  ('UYP', '$U', 'Uruguayan Peso', 39.000000, true),
  ('SEK', 'kr', 'Swedish Krona', 10.500000, true),
  ('DKK', 'kr', 'Danish Krone', 7.000000, true),
  ('NOK', 'kr', 'Norwegian Krone', 10.800000, true),
  ('PLN', 'zł', 'Polish Zloty', 4.000000, true),
  ('CHF', 'CHF', 'Swiss Franc', 0.880000, true),
  ('TRY', '₺', 'Turkish Lira', 32.000000, true),
  ('RUB', '₽', 'Russian Ruble', 92.000000, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. LANGUAGES
-- ============================================================================

INSERT INTO public.languages (code, name, native_name, is_rtl, is_active)
VALUES
  ('en', 'English', 'English', false, true),
  ('fr', 'French', 'Français', false, true),
  ('ar', 'Arabic', 'العربية', true, true),
  ('de', 'German', 'Deutsch', false, true),
  ('sw', 'Swahili', 'Kiswahili', false, true),
  ('rw', 'Kinyarwanda', 'Kinyarwanda', false, true),
  ('am', 'Amharic', 'አማርኛ', false, true),
  ('pt', 'Portuguese', 'Português', false, true),
  ('mg', 'Malagasy', 'Malagasy', false, true),
  ('hi', 'Hindi', 'हिन्दी', false, true),
  ('zu', 'Zulu', 'isiZulu', false, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. COUNTRIES — full market catalog (currency/language derived per country)
-- ============================================================================

INSERT INTO public.countries (code, name, currency_code, language_code, timezone,
                              phone_format, payment_methods, minimum_fee_floor,
                              tax_rate, legal_terms, is_active)
VALUES
  -- United States
  ('US', 'United States', 'USD', 'en', 'America/New_York', '+1 (XXX) XXX-XXXX',
   '["card","bank_transfer","apple_pay","google_pay"]', 0.50, 0.00,
   'https://us.afribook.com/legal/terms', true),
  ('CA', 'Canada', 'CAD', 'en', 'America/Toronto', '+1 XXX-XXX-XXXX',
   '["card","bank_transfer","interac"]', 0.50, 0.13,
   'https://ca.afribook.com/legal/terms', true),
  ('GB', 'United Kingdom', 'GBP', 'en', 'Europe/London', '+44 XXXX XXXXXX',
   '["card","bank_transfer"]', 0.30, 0.20,
   'https://gb.afribook.com/legal/terms', true),
  -- Eurozone
  ('DE', 'Germany', 'EUR', 'de', 'Europe/Berlin', '+49 XXX XXXXXXX',
   '["card","sepa"]', 0.50, 0.19, 'https://de.afribook.com/legal/terms', true),
  ('FR', 'France', 'EUR', 'fr', 'Europe/Paris', '+33 X XX XX XX XX',
   '["card","sepa"]', 0.50, 0.20, 'https://fr.afribook.com/legal/terms', true),
  -- India
  ('IN', 'India', 'INR', 'en', 'Asia/Kolkata', '+91 XXXXX-XXXXX',
   '["card","upi","wallet","net_banking"]', 5.00, 0.18,
   'https://in.afribook.com/legal/terms', true),
  -- Africa — primary markets
  ('NG', 'Nigeria', 'NGN', 'en', 'Africa/Lagos', '+234 XXX XXX XXXX',
   '["card","bank_transfer","ussd","mobile_money"]', 100.00, 0.075,
   'https://ng.afribook.com/legal/terms', true),
  ('GH', 'Ghana', 'GHS', 'en', 'Africa/Accra', '+233 XXX XXX XXXX',
   '["card","bank_transfer","mobile_money"]', 5.00, 0.15,
   'https://gh.afribook.com/legal/terms', true),
  ('KE', 'Kenya', 'KES', 'en', 'Africa/Nairobi', '+254 XXX XXXXXX',
   '["mpesa","card","bank_transfer"]', 20.00, 0.16,
   'https://ke.afribook.com/legal/terms', true),
  ('TZ', 'Tanzania', 'TZS', 'sw', 'Africa/Dar_es_Salaam', '+255 XXX XXX XXX',
   '["mpesa","card","bank_transfer"]', 500.00, 0.18,
   'https://tz.afribook.com/legal/terms', true),
  ('UG', 'Uganda', 'UGX', 'en', 'Africa/Kampala', '+256 XXX XXXXXX',
   '["mpesa","airtel_money","card","bank_transfer"]', 500.00, 0.18,
   'https://ug.afribook.com/legal/terms', true),
  ('MW', 'Malawi', 'MWK', 'en', 'Africa/Blantyre', '+265 XXXX XXXXXX',
   '["mobile_money","airtel_money","mtn_mobile_money","card","bank_transfer"]',
   200.00, 0.165, 'https://mw.afribook.com/legal/terms', true),
  ('ZA', 'South Africa', 'ZAR', 'en', 'Africa/Johannesburg', '+27 XXX XXX XXXX',
   '["card","bank_transfer"]', 5.00, 0.15,
   'https://za.afribook.com/legal/terms', true),
  ('ZM', 'Zambia', 'ZMW', 'en', 'Africa/Lusaka', '+260 XX XXX XXXX',
   '["mobile_money","card","bank_transfer"]', 5.00, 0.16,
   'https://zm.afribook.com/legal/terms', true),
  ('ZW', 'Zimbabwe', 'ZWL', 'en', 'Africa/Harare', '+263 XXX XXX XXX',
   '["card","bank_transfer","mobile_money"]', 5.00, 0.15,
   'https://zw.afribook.com/legal/terms', true),
  ('RW', 'Rwanda', 'RWF', 'en', 'Africa/Kigali', '+250 XXX XXX XXX',
   '["mobile_money","card","bank_transfer"]', 200.00, 0.18,
   'https://rw.afribook.com/legal/terms', true),
  ('BW', 'Botswana', 'BWP', 'en', 'Africa/Gaborone', '+267 XX XXX XXX',
   '["mobile_money","card","bank_transfer"]', 2.00, 0.12,
   'https://bw.afribook.com/legal/terms', true),
  ('MZ', 'Mozambique', 'MZN', 'pt', 'Africa/Maputo', '+258 XX XXX XXXX',
   '["mobile_money","card","bank_transfer"]', 20.00, 0.17,
   'https://mz.afribook.com/legal/terms', true),
  ('AO', 'Angola', 'AOA', 'pt', 'Africa/Luanda', '+244 XXX XXX XXX',
   '["mobile_money","card","bank_transfer"]', 200.00, 0.14,
   'https://ao.afribook.com/legal/terms', true),
  ('ET', 'Ethiopia', 'ETB', 'am', 'Africa/Addis_Ababa', '+251 XX XXX XXXX',
   '["card","mobile_money"]', 20.00, 0.15,
   'https://et.afribook.com/legal/terms', true),
  ('EG', 'Egypt', 'EGP', 'ar', 'Africa/Cairo', '+20 XXX XXX XXXX',
   '["card","fawry","wallet"]', 5.00, 0.14,
   'https://eg.afribook.com/legal/terms', true),
  ('SN', 'Senegal', 'XOF', 'fr', 'Africa/Dakar', '+221 XX XXX XX XX',
   '["mobile_money","card","bank_transfer"]', 200.00, 0.18,
   'https://sn.afribook.com/legal/terms', true),
  ('CM', 'Cameroon', 'XAF', 'fr', 'Africa/Douala', '+237 XXX XXX XXX',
   '["mobile_money","card","bank_transfer"]', 100.00, 0.1925,
   'https://cm.afribook.com/legal/terms', true),
  ('CI', 'Ivory Coast', 'XOF', 'fr', 'Africa/Abidjan', '+225 XX XX XXXX',
   '["mobile_money","card","bank_transfer"]', 200.00, 0.18,
   'https://ci.afribook.com/legal/terms', true),
  -- Rest of world (subset)
  ('AE', 'United Arab Emirates', 'AED', 'ar', 'Asia/Dubai', '+971 XX XXX XXXX',
   '["card"]', 1.00, 0.05, 'https://ae.afribook.com/legal/terms', true),
  ('AU', 'Australia', 'AUD', 'en', 'Australia/Sydney', '+61 XX XXXX XXXX',
   '["card","apple_pay","google_pay"]', 0.50, 0.10,
   'https://au.afribook.com/legal/terms', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 4. AUTH USERS
-- ============================================================================

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin@afribook.com',
   crypt('Admin@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Admin"}', now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'customer@afribook.com',
   crypt('Customer@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Customer"}', now(), now()),
  ('00000000-0000-4000-8000-000000000003', 'vendor@afribook.com',
   crypt('Vendor@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Vendor"}', now(), now()),
  ('00000000-0000-4000-8000-000000000004', 'provider@afribook.com',
   crypt('Provider@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Provider"}', now(), now()),
  ('00000000-0000-4000-8000-000000000005', 'restaurant@afribook.com',
   crypt('Restaurant@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Restaurant"}', now(), now()),
  ('00000000-0000-4000-8000-000000000006', 'driver@afribook.com',
   crypt('Driver@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Driver"}', now(), now()),
  ('00000000-0000-4000-8000-000000000007', 'organizer@afribook.com',
   crypt('Organizer@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"AfriBook Demo Organizer"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. PROFILES (the app reads auth via the `users` view over `profiles`)
-- ============================================================================

INSERT INTO public.profiles (id, email, role, full_name, phone, country_code,
                             preferred_language, is_verified, kyc_status, metadata)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin@afribook.com', 'super_admin',
   'AfriBook Admin', '+1-555-000-0001', 'US', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000002', 'customer@afribook.com', 'customer',
   'AfriBook Demo Customer', '+265-991-234-567', 'MW', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000003', 'vendor@afribook.com', 'vendor',
   'AfriBook Demo Vendor', '+265-992-345-678', 'MW', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000004', 'provider@afribook.com', 'vendor',
   'AfriBook Demo Provider', '+254-712-345-678', 'KE', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000005', 'restaurant@afribook.com', 'vendor',
   'AfriBook Demo Restaurant', '+27-82-123-4567', 'ZA', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000006', 'driver@afribook.com', 'driver',
   'AfriBook Demo Driver', '+265-993-456-789', 'MW', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}'),
  ('00000000-0000-4000-8000-000000000007', 'organizer@afribook.com', 'vendor',
   'AfriBook Demo Organizer', '+260-771-234-567', 'ZM', 'en', true, 'verified',
   '{"is_demo":true,"seed":true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ADMIN GRANTS
-- ============================================================================

INSERT INTO public.admin_users (profile_id, role, country_code, permissions)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'super_admin', NULL,
   '{"all":true,"markets":"*","payments":"*","payouts":"*","users":"*"}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. BUSINESS CATEGORIES
-- ============================================================================

INSERT INTO public.business_categories (name, icon, country_code, sort_order)
SELECT * FROM (VALUES
  ('Home Services', 'home', NULL, 10),
  ('Healthcare', 'heart-pulse', NULL, 20),
  ('Beauty & Wellness', 'sparkles', NULL, 30),
  ('Professional Services', 'briefcase', NULL, 40),
  ('Food & Dining', 'utensils-crossed', NULL, 50),
  ('Fashion & Tailoring', 'shirt', NULL, 60),
  ('Automotive', 'car', NULL, 70),
  ('Technology', 'monitor', NULL, 80),
  ('Photography & Video', 'camera', NULL, 90)
) AS v(name, icon, country_code, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories b WHERE b.name = v.name);

-- ============================================================================
-- 8. SAMPLE BUSINESSES (all demo, correct per-country currencies)
-- ============================================================================

INSERT INTO public.businesses (id, owner_id, name, description, category,
                               country_code, status, verification_status, rating,
                               location, media, metadata)
VALUES
  -- Malawi
  ('b0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003',
   'AfriBook Demo Barber - Lilongwe', 'Demo barbershop. Marked is_demo for testing.',
   (SELECT id FROM public.business_categories WHERE name = 'Beauty & Wellness'),
   'MW', 'active', 'approved', 4.8, ST_SetSRID(ST_MakePoint(33.77, -13.96), 4326)::geography,
   '[]', '{"is_demo":true,"seed":true}'),
  ('b0000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003',
   'AfriBook Demo Store - Lilongwe', 'Demo general store with local-market products.',
   (SELECT id FROM public.business_categories WHERE name = 'Professional Services'),
   'MW', 'active', 'approved', 4.2, ST_SetSRID(ST_MakePoint(33.77, -13.98), 4326)::geography,
   '[]', '{"is_demo":true,"seed":true}'),
  -- Kenya
  ('b0000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004',
   'AfriBook Demo Hair Salon - Nairobi', 'Demo salon. is_demo.',
   (SELECT id FROM public.business_categories WHERE name = 'Beauty & Wellness'),
   'KE', 'active', 'approved', 4.6, ST_SetSRID(ST_MakePoint(36.82, -1.29), 4326)::geography,
   '[]', '{"is_demo":true,"seed":true}'),
  ('b0000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004',
   'AfriBook Demo Photographer - Nairobi', 'Demo photography studio. is_demo.',
   (SELECT id FROM public.business_categories WHERE name = 'Photography & Video'),
   'KE', 'active', 'approved', 4.7, ST_SetSRID(ST_MakePoint(36.80, -1.28), 4326)::geography,
   '[]', '{"is_demo":true,"seed":true}'),
  -- Nigeria
  ('b0000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003',
   'AfriBook Demo Barber - Lagos', 'Demo barbershop in Lagos. is_demo.',
   (SELECT id FROM public.business_categories WHERE name = 'Beauty & Wellness'),
   'NG', 'active', 'approved', 4.5, ST_SetSRID(ST_MakePoint(3.39, 6.52), 4326)::geography,
   '[]', '{"is_demo":true,"seed":true}')
ON CONFLICT (id) DO NOTHING;