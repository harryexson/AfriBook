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
    '[]', '{"is_demo":true,"seed":true}'),
  -- Food & Dining — restaurants (used by the /food ordering flow)
  ('b0000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000003',
    'Lagos Jollof House', 'Authentic Nigerian kitchen — wood-fired jollof, suya and small chops. is_demo.',
    (SELECT id FROM public.business_categories WHERE name = 'Food & Dining'),
    'NG', 'active', 'approved', 4.8, ST_SetSRID(ST_MakePoint(3.39, 6.45), 4326)::geography,
    '[]', '{"is_demo":true,"seed":true,"delivery_fee":1500,"minimum_order":3000}'),
  ('b0000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000004',
    'Nyama Choma Nairobi', 'The home of Kenyan nyama choma, ugali and cold drinks. is_demo.',
    (SELECT id FROM public.business_categories WHERE name = 'Food & Dining'),
    'KE', 'active', 'approved', 4.7, ST_SetSRID(ST_MakePoint(36.82, -1.26), 4326)::geography,
    '[]', '{"is_demo":true,"seed":true,"delivery_fee":250,"minimum_order":500}'),
  ('b0000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000005',
    'Cape Malay Kitchen', 'Home-style Cape Malay cooking — bobotie, curries and koeksisters. is_demo.',
    (SELECT id FROM public.business_categories WHERE name = 'Food & Dining'),
    'ZA', 'active', 'approved', 4.6, ST_SetSRID(ST_MakePoint(18.42, -33.93), 4326)::geography,
    '[]', '{"is_demo":true,"seed":true,"delivery_fee":35,"minimum_order":80}'),
  ('b0000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000003',
    'Accra Waakye Spot', 'Ghanaian street-food favourite — waakye, banku, tilapia and kelewele. is_demo.',
    (SELECT id FROM public.business_categories WHERE name = 'Food & Dining'),
    'GH', 'active', 'approved', 4.5, ST_SetSRID(ST_MakePoint(-0.19, 5.56), 4326)::geography,
    '[]', '{"is_demo":true,"seed":true,"delivery_fee":20,"minimum_order":30}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8b. RESTAURANTS (food-specific extensions for Food & Dining businesses)
-- ============================================================================

INSERT INTO public.restaurants (id, business_id, cuisine_type, preparation_time,
                                delivery_radius_km, minimum_order, service_hours)
VALUES
  ('r0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000006',
   'Nigerian', 25, 8.00, 3000, '{"mon":["09:00","22:00"],"tue":["09:00","22:00"],"wed":["09:00","22:00"],"thu":["09:00","22:00"],"fri":["09:00","23:00"],"sat":["10:00","23:00"],"sun":["12:00","21:00"]}'),
  ('r0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000007',
   'Kenyan / BBQ', 30, 10.00, 500, '{"mon":["10:00","22:00"],"tue":["10:00","22:00"],"wed":["10:00","22:00"],"thu":["10:00","22:00"],"fri":["10:00","23:00"],"sat":["11:00","23:00"],"sun":["12:00","22:00"]}'),
  ('r0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000008',
   'South African / Cape Malay', 20, 7.00, 80, '{"mon":["08:00","21:00"],"tue":["08:00","21:00"],"wed":["08:00","21:00"],"thu":["08:00","21:00"],"fri":["08:00","22:00"],"sat":["09:00","22:00"],"sun":["09:00","20:00"]}'),
  ('r0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000009',
   'Ghanaian', 20, 6.00, 30, '{"mon":["07:00","21:00"],"tue":["07:00","21:00"],"wed":["07:00","21:00"],"thu":["07:00","21:00"],"fri":["07:00","22:00"],"sat":["08:00","22:00"],"sun":["09:00","20:00"]}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8c. MENU CATEGORIES
-- ============================================================================

INSERT INTO public.menu_categories (id, restaurant_id, name, description, sort_order, is_available)
VALUES
  -- Lagos Jollof House (NG)
  ('mc0000000-0000-4000-8000-000000000001', 'r0000000-0000-4000-8000-000000000001',
   'Mains', 'Rice dishes, stews and swallows.', 1, true),
  ('mc0000000-0000-4000-8000-000000000002', 'r0000000-0000-4000-8000-000000000001',
   'Small Chops', 'Street-food bites and sides.', 2, true),
  ('mc0000000-0000-4000-8000-000000000003', 'r0000000-0000-4000-8000-000000000001',
   'Drinks', 'Coolers and mocktails.', 3, true),
  -- Nyama Choma Nairobi (KE)
  ('mc0000000-0000-4000-8000-000000000004', 'r0000000-0000-4000-8000-000000000002',
   'Grill', 'Signature grilled meats.', 1, true),
  ('mc0000000-0000-4000-8000-000000000005', 'r0000000-0000-4000-8000-000000000002',
   'Sides', 'Ugali, chips and more.', 2, true),
  ('mc0000000-0000-4000-8000-000000000006', 'r0000000-0000-4000-8000-000000000002',
   'Drinks', 'Fresh juices and sodas.', 3, true),
  -- Cape Malay Kitchen (ZA)
  ('mc0000000-0000-4000-8000-000000000007', 'r0000000-0000-4000-8000-000000000003',
   'Breakfast', 'Morning favourites.', 1, true),
  ('mc0000000-0000-4000-8000-000000000008', 'r0000000-0000-4000-8000-000000000003',
   'Mains', 'Cape Malay classics.', 2, true),
  ('mc0000000-0000-4000-8000-000000000009', 'r0000000-0000-4000-8000-000000000003',
   'Desserts', 'Sweet treats.', 3, true),
  -- Accra Waakye Spot (GH)
  ('mc0000000-0000-4000-8000-000000000010', 'r0000000-0000-4000-8000-000000000004',
   'Mains', 'Comfort plates.', 1, true),
  ('mc0000000-0000-4000-8000-000000000011', 'r0000000-0000-4000-8000-000000000004',
   'Street Food', 'Kelewele, bofrot and more.', 2, true),
  ('mc0000000-0000-4000-8000-000000000012', 'r0000000-0000-4000-8000-000000000004',
   'Drinks', 'Chilled drinks.', 3, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8d. MENU ITEMS (priced in each market's currency)
-- ============================================================================

INSERT INTO public.menu_items (id, category_id, restaurant_id, name, description, price,
                               currency, image, ingredients, allergens, preparation_time,
                               is_available, modifiers, metadata)
VALUES
  -- Lagos Jollof House — Nigerian (NGN)
  ('mi0000000-0000-4000-8000-000000000001', 'mc0000000-0000-4000-8000-000000000001',
   'r0000000-0000-4000-8000-000000000001', 'Smoky Party Jollof & Chicken',
   'Long-grain rice slow-cooked in rich tomato-pepper base with grilled chicken.', 4500,
   'NGN', '', ARRAY['rice','tomatoes','peppers','chicken'], ARRAY['none'], 25,
   true, '[]', '{"is_demo":true,"spicy":true}'),
  ('mi0000000-0000-4000-8000-000000000002', 'mc0000000-0000-4000-8000-000000000001',
   'r0000000-0000-4000-8000-000000000001', 'Egusi Soup & Pounded Yam',
   'Melon-seed soup with assorted meat and leafy greens, served with smooth pounded yam.', 4800,
   'NGN', '', ARRAY['egusi','yam','beef','leafy greens'], ARRAY['none'], 30,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000003', 'mc0000000-0000-4000-8000-000000000001',
   'r0000000-0000-4000-8000-000000000001', 'Fried Rice & Grilled Beef',
   'Nigerian fried rice with liver, prawns and grilled beef skewers.', 4200,
   'NGN', '', ARRAY['rice','liver','prawns','beef','vegetables'], ARRAY['shellfish'], 25,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000004', 'mc0000000-0000-4000-8000-000000000002',
   'r0000000-0000-4000-8000-000000000001', 'Suya Skewers (5 pcs)',
   'Spicy chargrilled beef skewers dusted with yaji spice mix.', 2500,
   'NGN', '', ARRAY['beef','yaji','peanuts'], ARRAY['peanuts'], 15,
   true, '[]', '{"is_demo":true,"spicy":true}'),
  ('mi0000000-0000-4000-8000-000000000005', 'mc0000000-0000-4000-8000-000000000002',
   'r0000000-0000-4000-8000-000000000001', 'Puff Puff (8 pcs)',
   'Golden deep-fried dough balls, lightly sweet.', 1500,
   'NGN', '', ARRAY['flour','yeast','sugar'], ARRAY['gluten'], 15,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000006', 'mc0000000-0000-4000-8000-000000000002',
   'r0000000-0000-4000-8000-000000000001', 'Moi Moi (wrap)',
   'Steamed bean pudding with eggs and peppers.', 1200,
   'NGN', '', ARRAY['beans','onions','peppers','egg'], ARRAY['none'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000007', 'mc0000000-0000-4000-8000-000000000003',
   'r0000000-0000-4000-8000-000000000001', 'Chilled Zobo',
   'Hibiscus cooler with ginger and pineapple.', 800,
   'NGN', '', ARRAY['hibiscus','ginger','pineapple'], ARRAY['none'], 5,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000008', 'mc0000000-0000-4000-8000-000000000003',
   'r0000000-0000-4000-8000-000000000001', 'Chapman',
   'Nigerian mocktail with citrus, grenadine and bitters.', 1000,
   'NGN', '', ARRAY['citrus','grenadine','bitters','soda'], ARRAY['none'], 5,
   true, '[]', '{"is_demo":true}'),
  -- Nyama Choma Nairobi — Kenyan (KES)
  ('mi0000000-0000-4000-8000-000000000009', 'mc0000000-0000-4000-8000-000000000004',
   'r0000000-0000-4000-8000-000000000002', 'Nyama Choma (1 kg)',
   'Slow-roasted goat meat with kachumbari and ugali on the side.', 1450,
   'KES', '', ARRAY['goat meat','onions','tomatoes','cilantro'], ARRAY['none'], 30,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000010', 'mc0000000-0000-4000-8000-000000000004',
   'r0000000-0000-4000-8000-000000000002', 'Chicken Tikka',
   'Charcoal-grilled chicken thighs in spiced yoghurt marinade.', 850,
   'KES', '', ARRAY['chicken','yoghurt','spices'], ARRAY['dairy'], 20,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000011', 'mc0000000-0000-4000-8000-000000000005',
   'r0000000-0000-4000-8000-000000000002', 'Ugali & Sukuma Wiki',
   'Classic white ugali with sautéed collard greens.', 250,
   'KES', '', ARRAY['maize meal','collard greens','onions'], ARRAY['none'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000012', 'mc0000000-0000-4000-8000-000000000005',
   'r0000000-0000-4000-8000-000000000002', 'Chips Masala',
   'Crispy fries tossed in tangy spiced masala sauce.', 350,
   'KES', '', ARRAY['potatoes','masala','onions'], ARRAY['none'], 15,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000013', 'mc0000000-0000-4000-8000-000000000005',
   'r0000000-0000-4000-8000-000000000002', 'Chapati',
   'Soft flaky flatbread.', 80,
   'KES', '', ARRAY['flour','oil','salt'], ARRAY['gluten'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000014', 'mc0000000-0000-4000-8000-000000000006',
   'r0000000-0000-4000-8000-000000000002', 'Fresh Mango Juice',
   'Cold-pressed Kenyan mango juice.', 200,
   'KES', '', ARRAY['mango'], ARRAY['none'], 5,
   true, '[]', '{"is_demo":true}'),
  -- Cape Malay Kitchen — South African (ZAR)
  ('mi0000000-0000-4000-8000-000000000015', 'mc0000000-0000-4000-8000-000000000007',
   'r0000000-0000-4000-8000-000000000003', 'Cape Malay Breakfast',
   'Eggs, boerewors, grilled tomato and roosterkoek.', 110,
   'ZAR', '', ARRAY['eggs','boerewors','tomato','roosterkoek'], ARRAY['gluten'], 15,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000016', 'mc0000000-0000-4000-8000-000000000008',
   'r0000000-0000-4000-8000-000000000003', 'Bobotie',
   'Spiced minced lamb baked with an egg topping, served with yellow rice.', 145,
   'ZAR', '', ARRAY['lamb','eggs','curry','rice'], ARRAY['gluten','dairy'], 25,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000017', 'mc0000000-0000-4000-8000-000000000008',
   'r0000000-0000-4000-8000-000000000003', 'Cape Malay Curry',
   'Fragrant chicken curry with apricots and sambal.', 135,
   'ZAR', '', ARRAY['chicken','apricots','curry','sambal'], ARRAY['none'], 25,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000018', 'mc0000000-0000-4000-8000-000000000008',
   'r0000000-0000-4000-8000-000000000003', 'Gatsby',
   'Overloaded roll of spiced steak, chips and sauce.', 95,
   'ZAR', '', ARRAY['steak','chips','sauce','roll'], ARRAY['gluten'], 20,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000019', 'mc0000000-0000-4000-8000-000000000009',
   'r0000000-0000-4000-8000-000000000003', 'Milk Tart',
   'Creamy cinnamon-dusted milk tart.', 55,
   'ZAR', '', ARRAY['milk','sugar','cinnamon','pastry'], ARRAY['gluten','dairy'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000020', 'mc0000000-0000-4000-8000-000000000009',
   'r0000000-0000-4000-8000-000000000003', 'Koeksisters (4 pcs)',
   'Syrupy twisted doughnuts with a coconut crumb.', 35,
   'ZAR', '', ARRAY['flour','syrup','coconut'], ARRAY['gluten'], 10,
   true, '[]', '{"is_demo":true}'),
  -- Accra Waakye Spot — Ghanaian (GHS)
  ('mi0000000-0000-4000-8000-000000000021', 'mc0000000-0000-4000-8000-000000000010',
   'r0000000-0000-4000-8000-000000000004', 'Waakye & Fried Fish',
   'Rice and beans with fried tilapia, shito and gari.', 45,
   'GHS', '', ARRAY['rice','beans','tilapia','shito','gari'], ARRAY['fish'], 20,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000022', 'mc0000000-0000-4000-8000-000000000010',
   'r0000000-0000-4000-8000-000000000004', 'Jollof & Grilled Chicken',
   'Ghanaian-style jollof rice with juicy grilled chicken.', 55,
   'GHS', '', ARRAY['rice','tomatoes','chicken','peppers'], ARRAY['none'], 25,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000023', 'mc0000000-0000-4000-8000-000000000010',
   'r0000000-0000-4000-8000-000000000004', 'Banku & Tilapia',
   'Fermented corn-cassava dumplings with grilled tilapia and pepper sauce.', 65,
   'GHS', '', ARRAY['banku','tilapia','pepper sauce'], ARRAY['fish'], 25,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000024', 'mc0000000-0000-4000-8000-000000000011',
   'r0000000-0000-4000-8000-000000000004', 'Kelewele',
   'Spiced fried plantain bites.', 20,
   'GHS', '', ARRAY['plantain','ginger','pepper','nutmeg'], ARRAY['none'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000025', 'mc0000000-0000-4000-8000-000000000011',
   'r0000000-0000-4000-8000-000000000004', 'Bofrot (4 pcs)',
   'Light Ghanaian doughnuts.', 10,
   'GHS', '', ARRAY['flour','sugar','yeast'], ARRAY['gluten'], 10,
   true, '[]', '{"is_demo":true}'),
  ('mi0000000-0000-4000-8000-000000000026', 'mc0000000-0000-4000-8000-000000000012',
   'r0000000-0000-4000-8000-000000000004', 'Sobolo',
   'Chilled hibiscus drink with ginger.', 8,
   'GHS', '', ARRAY['hibiscus','ginger','sugar'], ARRAY['none'], 5,
   true, '[]', '{"is_demo":true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. MARKETPLACE PRODUCTS (demo catalogue, priced per market)
-- ============================================================================

INSERT INTO public.products (id, business_id, name, description, price, compare_price,
                             currency, stock, images, variants, category, tags,
                             is_available, metadata)
VALUES
  -- AfriBook Demo Store - Lilongwe (MW)
  ('p0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   'Handwoven Chitenje Bag', 'Colourful hand-stitched fabric tote, perfect for daily use.', 12000, 15000,
   'MWK', 25, '[]', '[]', 'Fashion', ARRAY['handmade','bags'], true, '{"is_demo":true}'),
  ('p0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002',
   'Shea & Baobab Skincare Set', 'Nourishing shea butter balm with baobab oil, body bar and scrub.', 18500, NULL,
   'MWK', 40, '[]', '[]', 'Beauty', ARRAY['skincare','natural'], true, '{"is_demo":true}'),
  ('p0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002',
   'Handwoven Sisal Basket', 'Sturdy market basket hand-coiled from dyed sisal.', 9500, NULL,
   'MWK', 30, '[]', '[]', 'Home & Garden', ARRAY['handmade','home'], true, '{"is_demo":true}'),
  -- AfriBook Demo Hair Salon - Nairobi (KES)
  ('p0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003',
   'Natural Hair Growth Oil', 'Cold-pressed castor, rosemary and peppermint blend for scalp care.', 950, 1250,
   'KES', 60, '[]', '[]', 'Beauty', ARRAY['hair','natural'], true, '{"is_demo":true}'),
  ('p0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000003',
   'Silk Hair Scarf Set', 'Two-pack satin-lined scarves to protect braids and twists.', 1200, NULL,
   'KES', 45, '[]', '[]', 'Fashion', ARRAY['hair','accessories'], true, '{"is_demo":true}'),
  -- AfriBook Demo Barber - Lagos (NGN)
  ('p0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005',
   'Premium Hair Clipper', 'Professional cordless clipper with titanium blades.', 25000, 32000,
   'NGN', 15, '[]', '[]', 'Electronics', ARRAY['grooming','tools'], true, '{"is_demo":true}'),
  ('p0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000005',
   'Beard Grooming Kit', 'Beard oil, balm, comb and scissors in a travel case.', 12000, NULL,
   'NGN', 35, '[]', '[]', 'Beauty', ARRAY['grooming','beard'], true, '{"is_demo":true}'),
  ('p0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000005',
   'Ankara Print Cap', 'Men''s snapback cap in bold Ankara print.', 5000, 6500,
   'NGN', 50, '[]', '[]', 'Fashion', ARRAY['caps','ankara'], true, '{"is_demo":true}'),
  -- Lagos Jollof House (NGN) — retail pantry items
  ('p0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000006',
   'House Suya Spice (150g)', 'Signature yaji blend — smoky, nutty, spicy.', 3500, NULL,
   'NGN', 80, '[]', '[]', 'Home & Garden', ARRAY['spices','suya'], true, '{"is_demo":true}'),
  -- Cape Malay Kitchen (ZAR) — retail pantry items
  ('p0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000008',
   'Cape Malay Curry Powder (120g)', 'Warm curry blend with coriander, turmeric and fennel.', 85, 110,
   'ZAR', 70, '[]', '[]', 'Home & Garden', ARRAY['spices','curry'], true, '{"is_demo":true}')
ON CONFLICT (id) DO NOTHING;