-- ─────────────────────────────────────────────────────────────
-- AfriBook Seed Data
-- ─────────────────────────────────────────────────────────────

-- Admin user (password: Admin@123456)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@afribook.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NOW(),
  '{"full_name":"AfriBook Admin","role":"super_admin","country_code":"US"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, phone, name, role, country_code, language_code, email_verified, phone_verified, is_active, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@afribook.com',
  '+1-555-000-0000',
  'AfriBook Admin',
  'super_admin',
  'US',
  'en',
  true,
  true,
  true,
  '{"seed":true}'
) ON CONFLICT (id) DO NOTHING;

-- ─── Countries ───────────────────────────────────────────────
INSERT INTO public.countries (code, name, native_name, flag, domain, timezone, phone_format, phone_length, date_format, time_format, week_starts_on, minimum_fee_floor, tax_rate, tax_name, legal_terms_url, privacy_url, is_rtl, subdomain)
VALUES
  ('US', 'United States', 'United States', '🇺🇸', 'us.afribook.com', 'America/New_York', '+1 (XXX) XXX-XXXX', 10, 'MM/dd/yyyy', '12h', 0, 0.50, 0.08, 'Sales Tax', 'https://us.afribook.com/legal/terms', 'https://us.afribook.com/legal/privacy', false, 'us'),
  ('CA', 'Canada', 'Canada', '🇨🇦', 'ca.afribook.com', 'America/Toronto', '+1 XXX-XXX-XXXX', 10, 'yyyy-MM-dd', '12h', 0, 0.50, 0.13, 'HST', 'https://ca.afribook.com/legal/terms', 'https://ca.afribook.com/legal/privacy', false, 'ca'),
  ('GB', 'United Kingdom', 'United Kingdom', '🇬🇧', 'gb.afribook.com', 'Europe/London', '+44 XXXX XXXXXX', 10, 'dd/MM/yyyy', '24h', 1, 0.30, 0.20, 'VAT', 'https://gb.afribook.com/legal/terms', 'https://gb.afribook.com/legal/privacy', false, 'gb'),
  ('FR', 'France', 'France', '🇫🇷', 'fr.afribook.com', 'Europe/Paris', '+33 X XX XX XX XX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.20, 'VAT', 'https://fr.afribook.com/legal/terms', 'https://fr.afribook.com/legal/privacy', false, 'fr'),
  ('DE', 'Germany', 'Deutschland', '🇩🇪', 'de.afribook.com', 'Europe/Berlin', '+49 XXX XXXXXXX', 10, 'dd.MM.yyyy', '24h', 1, 0.50, 0.19, 'VAT', 'https://de.afribook.com/legal/terms', 'https://de.afribook.com/legal/privacy', false, 'de'),
  ('AE', 'United Arab Emirates', 'الإمارات العربية المتحدة', '🇦🇪', 'ae.afribook.com', 'Asia/Dubai', '+971 XX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 1.00, 0.05, 'VAT', 'https://ae.afribook.com/legal/terms', 'https://ae.afribook.com/legal/privacy', true, 'ae'),
  ('IN', 'India', 'भारत', '🇮🇳', 'in.afribook.com', 'Asia/Kolkata', '+91 XXXXX XXXXX', 10, 'dd/MM/yyyy', '24h', 1, 5.00, 0.18, 'GST', 'https://in.afribook.com/legal/terms', 'https://in.afribook.com/legal/privacy', false, 'in'),
  ('NG', 'Nigeria', 'Nigeria', '🇳🇬', 'ng.afribook.com', 'Africa/Lagos', '+234 XXX XXX XXXX', 11, 'dd/MM/yyyy', '24h', 1, 100.00, 0.075, 'VAT', 'https://ng.afribook.com/legal/terms', 'https://ng.afribook.com/legal/privacy', false, 'ng'),
  ('GH', 'Ghana', 'Ghana', '🇬🇭', 'gh.afribook.com', 'Africa/Accra', '+233 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 5.00, 0.15, 'VAT', 'https://gh.afribook.com/legal/terms', 'https://gh.afribook.com/legal/privacy', false, 'gh'),
  ('KE', 'Kenya', 'Kenya', '🇰🇪', 'ke.afribook.com', 'Africa/Nairobi', '+254 XXX XXXXXX', 10, 'dd/MM/yyyy', '24h', 1, 20.00, 0.16, 'VAT', 'https://ke.afribook.com/legal/terms', 'https://ke.afribook.com/legal/privacy', false, 'ke'),
  ('TZ', 'Tanzania', 'Tanzania', '🇹🇿', 'tz.afribook.com', 'Africa/Dar_es_Salaam', '+255 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 500.00, 0.18, 'VAT', 'https://tz.afribook.com/legal/terms', 'https://tz.afribook.com/legal/privacy', false, 'tz'),
  ('UG', 'Uganda', 'Uganda', '🇺🇬', 'ug.afribook.com', 'Africa/Kampala', '+256 XXX XXXXXX', 10, 'dd/MM/yyyy', '24h', 1, 500.00, 0.18, 'VAT', 'https://ug.afribook.com/legal/terms', 'https://ug.afribook.com/legal/privacy', false, 'ug'),
  ('MW', 'Malawi', 'Malawi', '🇲🇼', 'mw.afribook.com', 'Africa/Blantyre', '+265 XXXX XXXXXX', 9, 'dd/MM/yyyy', '24h', 1, 200.00, 0.165, 'VAT', 'https://mw.afribook.com/legal/terms', 'https://mw.afribook.com/legal/privacy', false, 'mw'),
  ('ZA', 'South Africa', 'South Africa', '🇿🇦', 'za.afribook.com', 'Africa/Johannesburg', '+27 XX XXX XXXX', 10, 'yyyy/MM/dd', '24h', 0, 5.00, 0.15, 'VAT', 'https://za.afribook.com/legal/terms', 'https://za.afribook.com/legal/privacy', false, 'za'),
  ('EG', 'Egypt', 'مصر', '🇪🇬', 'eg.afribook.com', 'Africa/Cairo', '+20 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 0, 5.00, 0.14, 'VAT', 'https://eg.afribook.com/legal/terms', 'https://eg.afribook.com/legal/privacy', true, 'eg'),
  ('AR', 'Argentina', 'Argentina', '🇦🇷', 'ar.afribook.com', 'America/Argentina/Buenos_Aires', '+54 XX XXXX-XXXX', 10, 'dd/MM/yyyy', '24h', 1, 50.00, 0.21, 'IVA', 'https://ar.afribook.com/legal/terms', 'https://ar.afribook.com/legal/privacy', false, 'ar')
ON CONFLICT (code) DO NOTHING;

-- ─── Additional Global Countries (worldwide activation) ───────
INSERT INTO public.countries (code, name, native_name, flag, domain, timezone, phone_format, phone_length, date_format, time_format, week_starts_on, minimum_fee_floor, tax_rate, tax_name, legal_terms_url, privacy_url, is_rtl, subdomain)
VALUES
  ('ES', 'Spain', 'España', '🇪🇸', 'es.afribook.com', 'Europe/Madrid', '+34 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.21, 'IVA', 'https://es.afribook.com/legal/terms', 'https://es.afribook.com/legal/privacy', false, 'es'),
  ('IT', 'Italy', 'Italia', '🇮🇹', 'it.afribook.com', 'Europe/Rome', '+39 XXX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.22, 'IVA', 'https://it.afribook.com/legal/terms', 'https://it.afribook.com/legal/privacy', false, 'it'),
  ('NL', 'Netherlands', 'Nederland', '🇳🇱', 'nl.afribook.com', 'Europe/Amsterdam', '+31 X XXXXXXXX', 9, 'dd-MM-yyyy', '24h', 1, 0.50, 0.21, 'BTW', 'https://nl.afribook.com/legal/terms', 'https://nl.afribook.com/legal/privacy', false, 'nl'),
  ('PT', 'Portugal', 'Portugal', '🇵🇹', 'pt.afribook.com', 'Europe/Lisbon', '+351 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.23, 'IVA', 'https://pt.afribook.com/legal/terms', 'https://pt.afribook.com/legal/privacy', false, 'pt'),
  ('IE', 'Ireland', 'Ireland', '🇮🇪', 'ie.afribook.com', 'Europe/Dublin', '+353 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.23, 'VAT', 'https://ie.afribook.com/legal/terms', 'https://ie.afribook.com/legal/privacy', false, 'ie'),
  ('SE', 'Sweden', 'Sverige', '🇸🇪', 'se.afribook.com', 'Europe/Stockholm', '+46 XX XXX XX XX', 9, 'yyyy-MM-dd', '24h', 1, 5.00, 0.25, 'Moms', 'https://se.afribook.com/legal/terms', 'https://se.afribook.com/legal/privacy', false, 'se'),
  ('PL', 'Poland', 'Polska', '🇵🇱', 'pl.afribook.com', 'Europe/Warsaw', '+48 XXX XXX XXX', 9, 'dd.MM.yyyy', '24h', 1, 2.00, 0.23, 'VAT', 'https://pl.afribook.com/legal/terms', 'https://pl.afribook.com/legal/privacy', false, 'pl'),
  ('BE', 'Belgium', 'Belgique', '🇧🇪', 'be.afribook.com', 'Europe/Brussels', '+32 XXX XX XX XX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.21, 'TVA', 'https://be.afribook.com/legal/terms', 'https://be.afribook.com/legal/privacy', false, 'be'),
  ('CH', 'Switzerland', 'Schweiz', '🇨🇭', 'ch.afribook.com', 'Europe/Zurich', '+41 XX XXX XX XX', 9, 'dd.MM.yyyy', '24h', 1, 0.50, 0.077, 'MWST', 'https://ch.afribook.com/legal/terms', 'https://ch.afribook.com/legal/privacy', false, 'ch'),
  ('AT', 'Austria', 'Österreich', '🇦🇹', 'at.afribook.com', 'Europe/Vienna', '+43 XXX XXXXXXX', 10, 'dd.MM.yyyy', '24h', 1, 0.50, 0.20, 'USt', 'https://at.afribook.com/legal/terms', 'https://at.afribook.com/legal/privacy', false, 'at'),
  ('GR', 'Greece', 'Ελλάδα', '🇬🇷', 'gr.afribook.com', 'Europe/Athens', '+30 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 0.50, 0.24, 'ΦΠΑ', 'https://gr.afribook.com/legal/terms', 'https://gr.afribook.com/legal/privacy', false, 'gr'),
  ('TR', 'Turkey', 'Türkiye', '🇹🇷', 'tr.afribook.com', 'Europe/Istanbul', '+90 XXX XXX XXXX', 10, 'dd.MM.yyyy', '24h', 1, 5.00, 0.20, 'KDV', 'https://tr.afribook.com/legal/terms', 'https://tr.afribook.com/legal/privacy', false, 'tr'),
  ('SA', 'Saudi Arabia', 'السعودية', '🇸🇦', 'sa.afribook.com', 'Asia/Riyadh', '+966 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 0, 2.00, 0.15, 'VAT', 'https://sa.afribook.com/legal/terms', 'https://sa.afribook.com/legal/privacy', true, 'sa'),
  ('MA', 'Morocco', 'المغرب', '🇲🇦', 'ma.afribook.com', 'Africa/Casablanca', '+212 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 5.00, 0.20, 'TVA', 'https://ma.afribook.com/legal/terms', 'https://ma.afribook.com/legal/privacy', true, 'ma'),
  ('DZ', 'Algeria', 'الجزائر', '🇩🇿', 'dz.afribook.com', 'Africa/Algiers', '+213 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 50.00, 0.19, 'TVA', 'https://dz.afribook.com/legal/terms', 'https://dz.afribook.com/legal/privacy', true, 'dz'),
  ('TN', 'Tunisia', 'تونس', '🇹🇳', 'tn.afribook.com', 'Africa/Tunis', '+216 XX XXX XXX', 8, 'dd/MM/yyyy', '24h', 1, 1.00, 0.19, 'TVA', 'https://tn.afribook.com/legal/terms', 'https://tn.afribook.com/legal/privacy', true, 'tn'),
  ('ET', 'Ethiopia', 'ኢትዮጵያ', '🇪🇹', 'et.afribook.com', 'Africa/Addis_Ababa', '+251 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 20.00, 0.15, 'VAT', 'https://et.afribook.com/legal/terms', 'https://et.afribook.com/legal/privacy', false, 'et'),
  ('AO', 'Angola', 'Angola', '🇦🇴', 'ao.afribook.com', 'Africa/Luanda', '+244 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 200.00, 0.14, 'IVA', 'https://ao.afribook.com/legal/terms', 'https://ao.afribook.com/legal/privacy', false, 'ao'),
  ('MZ', 'Mozambique', 'Moçambique', '🇲🇿', 'mz.afribook.com', 'Africa/Maputo', '+258 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 20.00, 0.17, 'IVA', 'https://mz.afribook.com/legal/terms', 'https://mz.afribook.com/legal/privacy', false, 'mz'),
  ('NA', 'Namibia', 'Namibia', '🇳🇦', 'na.afribook.com', 'Africa/Windhoek', '+264 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 5.00, 0.15, 'VAT', 'https://na.afribook.com/legal/terms', 'https://na.afribook.com/legal/privacy', false, 'na'),
  ('RW', 'Rwanda', 'Rwanda', '🇷🇼', 'rw.afribook.com', 'Africa/Kigali', '+250 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 200.00, 0.18, 'VAT', 'https://rw.afribook.com/legal/terms', 'https://rw.afribook.com/legal/privacy', false, 'rw'),
  ('ZM', 'Zambia', 'Zambia', '🇿🇲', 'zm.afribook.com', 'Africa/Lusaka', '+260 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 5.00, 0.16, 'VAT', 'https://zm.afribook.com/legal/terms', 'https://zm.afribook.com/legal/privacy', false, 'zm'),
  ('ZW', 'Zimbabwe', 'Zimbabwe', '🇿🇼', 'zw.afribook.com', 'Africa/Harare', '+263 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 5.00, 0.15, 'VAT', 'https://zw.afribook.com/legal/terms', 'https://zw.afribook.com/legal/privacy', false, 'zw'),
  ('SN', 'Senegal', 'Sénégal', '🇸🇳', 'sn.afribook.com', 'Africa/Dakar', '+221 XX XXX XX XX', 9, 'dd/MM/yyyy', '24h', 1, 200.00, 0.18, 'TVA', 'https://sn.afribook.com/legal/terms', 'https://sn.afribook.com/legal/privacy', false, 'sn'),
  ('CI', 'Ivory Coast', "Côte d'Ivoire", '🇨🇮', 'ci.afribook.com', 'Africa/Abidjan', '+225 XX XX XXX XXX', 10, 'dd/MM/yyyy', '24h', 1, 200.00, 0.18, 'TVA', 'https://ci.afribook.com/legal/terms', 'https://ci.afribook.com/legal/privacy', false, 'ci'),
  ('CM', 'Cameroon', 'Cameroun', '🇨🇲', 'cm.afribook.com', 'Africa/Douala', '+237 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 100.00, 0.192, 'TVA', 'https://cm.afribook.com/legal/terms', 'https://cm.afribook.com/legal/privacy', false, 'cm'),
  ('AU', 'Australia', 'Australia', '🇦🇺', 'au.afribook.com', 'Australia/Sydney', '+61 X XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 0, 0.50, 0.10, 'GST', 'https://au.afribook.com/legal/terms', 'https://au.afribook.com/legal/privacy', false, 'au'),
  ('NZ', 'New Zealand', 'New Zealand', '🇳🇿', 'nz.afribook.com', 'Pacific/Auckland', '+64 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 0.50, 0.15, 'GST', 'https://nz.afribook.com/legal/terms', 'https://nz.afribook.com/legal/privacy', false, 'nz'),
  ('SG', 'Singapore', 'Singapore', '🇸🇬', 'sg.afribook.com', 'Asia/Singapore', '+65 XXXX XXXX', 8, 'dd/MM/yyyy', '24h', 0, 0.50, 0.09, 'GST', 'https://sg.afribook.com/legal/terms', 'https://sg.afribook.com/legal/privacy', false, 'sg'),
  ('HK', 'Hong Kong', '香港', '🇭🇰', 'hk.afribook.com', 'Asia/Hong_Kong', '+852 XXXX XXXX', 8, 'dd/MM/yyyy', '24h', 0, 4.00, 0.00, 'No Tax', 'https://hk.afribook.com/legal/terms', 'https://hk.afribook.com/legal/privacy', false, 'hk'),
  ('JP', 'Japan', '日本', '🇯🇵', 'jp.afribook.com', 'Asia/Tokyo', '+81 XX XXXX XXXX', 10, 'yyyy/MM/dd', '24h', 0, 50.00, 0.10, '消費税', 'https://jp.afribook.com/legal/terms', 'https://jp.afribook.com/legal/privacy', false, 'jp'),
  ('CN', 'China', '中国', '🇨🇳', 'cn.afribook.com', 'Asia/Shanghai', '+86 XXX XXXX XXXX', 11, 'yyyy/MM/dd', '24h', 1, 2.00, 0.13, 'VAT', 'https://cn.afribook.com/legal/terms', 'https://cn.afribook.com/legal/privacy', false, 'cn'),
  ('MY', 'Malaysia', 'Malaysia', '🇲🇾', 'my.afribook.com', 'Asia/Kuala_Lumpur', '+60 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 2.00, 0.06, 'GST', 'https://my.afribook.com/legal/terms', 'https://my.afribook.com/legal/privacy', false, 'my'),
  ('ID', 'Indonesia', 'Indonesia', '🇮🇩', 'id.afribook.com', 'Asia/Jakarta', '+62 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 2000.00, 0.11, 'PPN', 'https://id.afribook.com/legal/terms', 'https://id.afribook.com/legal/privacy', false, 'id'),
  ('PH', 'Philippines', 'Pilipinas', '🇵🇭', 'ph.afribook.com', 'Asia/Manila', '+63 XXX XXX XXXX', 10, 'MM/dd/yyyy', '24h', 0, 10.00, 0.12, 'VAT', 'https://ph.afribook.com/legal/terms', 'https://ph.afribook.com/legal/privacy', false, 'ph'),
  ('TH', 'Thailand', 'ไทย', '🇹🇭', 'th.afribook.com', 'Asia/Bangkok', '+66 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 5.00, 0.07, 'VAT', 'https://th.afribook.com/legal/terms', 'https://th.afribook.com/legal/privacy', false, 'th'),
  ('VN', 'Vietnam', 'Việt Nam', '🇻🇳', 'vn.afribook.com', 'Asia/Ho_Chi_Minh', '+84 XX X XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 5000.00, 0.10, 'VAT', 'https://vn.afribook.com/legal/terms', 'https://vn.afribook.com/legal/privacy', false, 'vn'),
  ('KR', 'South Korea', '대한민국', '🇰🇷', 'kr.afribook.com', 'Asia/Seoul', '+82 XX XXXX XXXX', 10, 'yyyy.MM.dd', '24h', 0, 500.00, 0.10, 'VAT', 'https://kr.afribook.com/legal/terms', 'https://kr.afribook.com/legal/privacy', false, 'kr'),
  ('LK', 'Sri Lanka', 'ශ්‍රී ලංකාව', '🇱🇰', 'lk.afribook.com', 'Asia/Colombo', '+94 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 50.00, 0.15, 'VAT', 'https://lk.afribook.com/legal/terms', 'https://lk.afribook.com/legal/privacy', false, 'lk'),
  ('PK', 'Pakistan', 'پاکستان', '🇵🇰', 'pk.afribook.com', 'Asia/Karachi', '+92 XXX XXXXXXXX', 10, 'dd/MM/yyyy', '24h', 1, 50.00, 0.17, 'GST', 'https://pk.afribook.com/legal/terms', 'https://pk.afribook.com/legal/privacy', false, 'pk'),
  ('BD', 'Bangladesh', 'বাংলাদেশ', '🇧🇩', 'bd.afribook.com', 'Asia/Dhaka', '+880 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 50.00, 0.15, 'VAT', 'https://bd.afribook.com/legal/terms', 'https://bd.afribook.com/legal/privacy', false, 'bd'),
  ('BR', 'Brazil', 'Brasil', '🇧🇷', 'br.afribook.com', 'America/Sao_Paulo', '+55 XX XXXXX XXXX', 11, 'dd/MM/yyyy', '24h', 0, 2.00, 0.17, 'ICMS', 'https://br.afribook.com/legal/terms', 'https://br.afribook.com/legal/privacy', false, 'br'),
  ('MX', 'Mexico', 'México', '🇲🇽', 'mx.afribook.com', 'America/Mexico_City', '+52 XX XXXX XXXX', 10, 'dd/MM/yyyy', '24h', 0, 10.00, 0.16, 'IVA', 'https://mx.afribook.com/legal/terms', 'https://mx.afribook.com/legal/privacy', false, 'mx'),
  ('CL', 'Chile', 'Chile', '🇨🇱', 'cl.afribook.com', 'America/Santiago', '+56 X XXXX XXXX', 9, 'dd-MM-yyyy', '24h', 1, 500.00, 0.19, 'IVA', 'https://cl.afribook.com/legal/terms', 'https://cl.afribook.com/legal/privacy', false, 'cl'),
  ('CO', 'Colombia', 'Colombia', '🇨🇴', 'co.afribook.com', 'America/Bogota', '+57 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 2000.00, 0.19, 'IVA', 'https://co.afribook.com/legal/terms', 'https://co.afribook.com/legal/privacy', false, 'co'),
  ('PE', 'Peru', 'Perú', '🇵🇪', 'pe.afribook.com', 'America/Lima', '+51 XXX XXX XXX', 9, 'dd/MM/yyyy', '24h', 1, 2.00, 0.18, 'IGV', 'https://pe.afribook.com/legal/terms', 'https://pe.afribook.com/legal/privacy', false, 'pe'),
  ('UY', 'Uruguay', 'Uruguay', '🇺🇾', 'uy.afribook.com', 'America/Montevideo', '+598 X XXX XX XX', 8, 'dd/MM/yyyy', '24h', 1, 20.00, 0.22, 'IVA', 'https://uy.afribook.com/legal/terms', 'https://uy.afribook.com/legal/privacy', false, 'uy'),
  ('EC', 'Ecuador', 'Ecuador', '🇪🇨', 'ec.afribook.com', 'America/Guayaquil', '+593 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 1, 2.00, 0.12, 'IVA', 'https://ec.afribook.com/legal/terms', 'https://ec.afribook.com/legal/privacy', false, 'ec'),
  ('CR', 'Costa Rica', 'Costa Rica', '🇨🇷', 'cr.afribook.com', 'America/Costa_Rica', '+506 X XXX XXXX', 8, 'dd/MM/yyyy', '24h', 1, 500.00, 0.13, 'IVA', 'https://cr.afribook.com/legal/terms', 'https://cr.afribook.com/legal/privacy', false, 'cr'),
  ('PA', 'Panama', 'Panamá', '🇵🇦', 'pa.afribook.com', 'America/Panama', '+507 XXX XXXX', 8, 'dd/MM/yyyy', '24h', 0, 1.00, 0.07, 'ITBMS', 'https://pa.afribook.com/legal/terms', 'https://pa.afribook.com/legal/privacy', false, 'pa'),
  ('DO', 'Dominican Republic', 'República Dominicana', '🇩🇴', 'do.afribook.com', 'America/Santo_Domingo', '+1 XXX XXX XXXX', 10, 'dd/MM/yyyy', '24h', 1, 50.00, 0.18, 'ITBIS', 'https://do.afribook.com/legal/terms', 'https://do.afribook.com/legal/privacy', false, 'do'),
  ('RU', 'Russia', 'Россия', '🇷🇺', 'ru.afribook.com', 'Europe/Moscow', '+7 XXX XXX XX XX', 10, 'dd.MM.yyyy', '24h', 1, 30.00, 0.20, 'НДС', 'https://ru.afribook.com/legal/terms', 'https://ru.afribook.com/legal/privacy', false, 'ru'),
  ('UA', 'Ukraine', 'Україна', '🇺🇦', 'ua.afribook.com', 'Europe/Kyiv', '+380 XX XXX XX XX', 9, 'dd.MM.yyyy', '24h', 1, 10.00, 0.20, 'ПДВ', 'https://ua.afribook.com/legal/terms', 'https://ua.afribook.com/legal/privacy', false, 'ua'),
  ('IL', 'Israel', 'ישראל', '🇮🇱', 'il.afribook.com', 'Asia/Jerusalem', '+972 XX XXX XXXX', 9, 'dd/MM/yyyy', '24h', 0, 2.00, 0.17, 'Ma''am', 'https://il.afribook.com/legal/terms', 'https://il.afribook.com/legal/privacy', true, 'il')
ON CONFLICT (code) DO NOTHING;

-- ─── Additional Global Currencies ────────────────────────────
INSERT INTO public.currencies (code, symbol, name, native_name, decimal_places, format, exchange_rate)
VALUES
  ('EUR', '€', 'Euro', 'Euro', 2, 'symbol amount', 0.92),
  ('SEK', 'kr', 'Swedish Krona', 'Svensk krona', 2, 'amount symbol', 10.5),
  ('PLN', 'zł', 'Polish Zloty', 'Złoty', 2, 'amount symbol', 4.0),
  ('CHF', 'CHF', 'Swiss Franc', 'Franken', 2, 'symbol amount', 0.88),
  ('TRY', '₺', 'Turkish Lira', 'Türk lirası', 2, 'symbol amount', 32.0),
  ('SAR', '﷼', 'Saudi Riyal', 'ريال سعودي', 2, 'symbol amount', 3.75),
  ('MAD', 'DH', 'Moroccan Dirham', 'درهم مغربي', 2, 'amount symbol', 10.0),
  ('DZD', 'DA', 'Algerian Dinar', 'دينار جزائري', 2, 'amount symbol', 135.0),
  ('TND', 'د.ت', 'Tunisian Dinar', 'دينار تونسي', 3, 'amount symbol', 3.1),
  ('ETB', 'Br', 'Ethiopian Birr', 'ብር', 2, 'amount symbol', 57.0),
  ('AOA', 'Kz', 'Angolan Kwanza', 'Kwanza', 2, 'amount symbol', 880.0),
  ('MZN', 'MT', 'Mozambican Metical', 'Metical', 2, 'amount symbol', 64.0),
  ('NAD', 'N$', 'Namibian Dollar', 'Dollar', 2, 'symbol amount', 18.5),
  ('RWF', 'FRw', 'Rwandan Franc', 'Farangi', 0, 'amount symbol', 1300.0),
  ('ZMW', 'ZK', 'Zambian Kwacha', 'Kwacha', 2, 'amount symbol', 25.0),
  ('ZWL', 'Z$', 'Zimbabwean Dollar', 'Dollar', 2, 'amount symbol', 3200.0),
  ('XOF', 'CFA', 'West African CFA', 'Franc CFA', 0, 'amount symbol', 600.0),
  ('XAF', 'FCFA', 'Central African CFA', 'Franc CFA', 0, 'amount symbol', 600.0),
  ('AUD', 'A$', 'Australian Dollar', 'Dollar', 2, 'symbol amount', 1.52),
  ('NZD', 'NZ$', 'New Zealand Dollar', 'Dollar', 2, 'symbol amount', 1.66),
  ('SGD', 'S$', 'Singapore Dollar', 'Dollar', 2, 'symbol amount', 1.35),
  ('HKD', 'HK$', 'Hong Kong Dollar', '港幣', 2, 'symbol amount', 7.8),
  ('JPY', '¥', 'Japanese Yen', '円', 0, 'symbol amount', 156.0),
  ('CNY', '¥', 'Chinese Yuan', '元', 2, 'symbol amount', 7.2),
  ('MYR', 'RM', 'Malaysian Ringgit', 'Ringgit', 2, 'symbol amount', 4.7),
  ('IDR', 'Rp', 'Indonesian Rupiah', 'Rupiah', 0, 'amount symbol', 16000.0),
  ('PHP', '₱', 'Philippine Peso', 'Piso', 2, 'symbol amount', 58.0),
  ('THB', '฿', 'Thai Baht', 'บาท', 2, 'symbol amount', 36.0),
  ('VND', '₫', 'Vietnamese Dong', 'Đồng', 0, 'amount symbol', 25000.0),
  ('KRW', '₩', 'South Korean Won', '원', 0, 'amount symbol', 1350.0),
  ('LKR', 'Rs', 'Sri Lankan Rupee', 'රුපියල්', 2, 'amount symbol', 320.0),
  ('PKR', '₨', 'Pakistani Rupee', 'روپیہ', 2, 'amount symbol', 278.0),
  ('BDT', '৳', 'Bangladeshi Taka', 'টাকা', 2, 'amount symbol', 118.0),
  ('BRL', 'R$', 'Brazilian Real', 'Real', 2, 'symbol amount', 5.4),
  ('MXN', '$', 'Mexican Peso', 'Peso', 2, 'symbol amount', 18.0),
  ('CLP', '$', 'Chilean Peso', 'Peso', 0, 'amount symbol', 950.0),
  ('COP', '$', 'Colombian Peso', 'Peso', 0, 'amount symbol', 4000.0),
  ('PEN', 'S/', 'Peruvian Sol', 'Sol', 2, 'symbol amount', 3.7),
  ('UYU', '$U', 'Uruguayan Peso', 'Peso', 2, 'symbol amount', 39.0),
  ('CRC', '₡', 'Costa Rican Colón', 'Colón', 2, 'amount symbol', 520.0),
  ('PAB', 'B/.', 'Panamanian Balboa', 'Balboa', 2, 'symbol amount', 1.0),
  ('DOP', 'RD$', 'Dominican Peso', 'Peso', 2, 'symbol amount', 58.0),
  ('RUB', '₽', 'Russian Ruble', 'рубль', 2, 'amount symbol', 92.0),
  ('UAH', '₴', 'Ukrainian Hryvnia', 'гривня', 2, 'amount symbol', 40.0),
  ('ILS', '₪', 'Israeli Shekel', 'שקל', 2, 'symbol amount', 3.7)
ON CONFLICT (code) DO NOTHING;

-- ─── Currencies ──────────────────────────────────────────────
INSERT INTO public.currencies (code, symbol, name, native_name, decimal_places, format, exchange_rate)
VALUES
  ('USD', '$', 'US Dollar', 'US Dollar', 2, 'symbol amount', 1.00),
  ('CAD', 'CA$', 'Canadian Dollar', 'Dollar Canadien', 2, 'symbol amount', 1.36),
  ('GBP', '£', 'British Pound', 'Pound Sterling', 2, 'symbol amount', 0.79),
  ('EUR', '€', 'Euro', 'Euro', 2, 'symbol amount', 0.92),
  ('AED', 'د.إ', 'UAE Dirham', 'درهم إماراتي', 2, 'symbol amount', 3.67),
  ('INR', '₹', 'Indian Rupee', 'भारतीय रुपया', 2, 'symbol amount', 83.00),
  ('NGN', '₦', 'Nigerian Naira', 'Naira', 2, 'symbol amount', 1550.00),
  ('GHS', 'GH₵', 'Ghanaian Cedi', 'Cedi', 2, 'symbol amount', 15.30),
  ('KES', 'KSh', 'Kenyan Shilling', 'Shilingi ya Kenya', 2, 'symbol amount', 145.00),
  ('TZS', 'TSh', 'Tanzanian Shilling', 'Shilingi ya Tanzania', 2, 'symbol amount', 2550.00),
  ('UGX', 'USh', 'Ugandan Shilling', 'Shilingi ya Uganda', 2, 'symbol amount', 3700.00),
  ('MWK', 'MK', 'Malawian Kwacha', 'Kwacha ya Malawi', 2, 'symbol amount', 1730.00),
  ('ZAR', 'R', 'South African Rand', 'Rand', 2, 'symbol amount', 18.50),
  ('EGP', 'E£', 'Egyptian Pound', 'جنيه مصري', 2, 'symbol amount', 49.00),
  ('ARS', '$', 'Argentine Peso', 'Peso Argentino', 2, 'symbol amount', 850.00)
ON CONFLICT (code) DO NOTHING;

-- ─── Languages ───────────────────────────────────────────────
INSERT INTO public.languages (code, name, native_name, is_rtl)
VALUES
  ('en', 'English', 'English', false),
  ('fr', 'French', 'Français', false),
  ('ar', 'Arabic', 'العربية', true),
  ('de', 'German', 'Deutsch', false),
  ('ig', 'Igbo', 'Igbo', false),
  ('yo', 'Yoruba', 'Yorùbá', false),
  ('ha', 'Hausa', 'Hausa', false),
  ('sw', 'Swahili', 'Kiswahili', false),
  ('am', 'Amharic', 'አማርኛ', false),
  ('pt', 'Portuguese', 'Português', false),
  ('es', 'Spanish', 'Español', false),
  ('zu', 'Zulu', 'isiZulu', false)
ON CONFLICT (code) DO NOTHING;

-- ─── Business Categories ─────────────────────────────────────
INSERT INTO public.business_categories (name, description, icon)
VALUES
  ('Home Services', 'Cleaning, plumbing, electrical, repairs', 'home'),
  ('Healthcare', 'Doctors, dentists, clinics, wellness', 'heart-pulse'),
  ('Education', 'Tutoring, courses, training', 'book-open'),
  ('Technology', 'IT services, web dev, repair', 'monitor'),
  ('Food & Dining', 'Restaurants, cafes, catering', 'utensils-crossed'),
  ('Beauty & Wellness', 'Salon, spa, barber, nails', 'sparkles'),
  ('Automotive', 'Car repair, detailing, rental', 'car'),
  ('Legal & Financial', 'Lawyers, accountants, insurance', 'scale'),
  ('Real Estate', 'Agents, property management', 'building'),
  ('Entertainment', 'Events, music, cinema, games', 'music'),
  ('Fashion & Tailoring', 'Clothing, alterations, design', 'shirt'),
  ('Agriculture', 'Farming, produce, equipment', 'tractor'),
  ('Transportation', 'Logistics, moving, delivery', 'truck'),
  ('Tourism', 'Travel, tours, hospitality', 'compass'),
  ('Tutoring', 'Academic tutoring, test prep', 'graduation-cap'),
  ('Event Planning', 'Weddings, parties, corporate events', 'calendar-check'),
  ('Logistics', 'Shipping, warehousing, freight', 'package'),
  ('Fitness', 'Gyms, trainers, yoga', 'dumbbell')
ON CONFLICT (name) DO NOTHING;

-- ─── Payment Providers Configuration ─────────────────────────
INSERT INTO public.payment_providers (code, name, active, supported_countries, supported_currencies, fee_percent, fee_fixed, min_amount, max_amount)
VALUES
  ('stripe', 'Stripe', true, '{US,CA,GB,FR,DE,AE,AU,SG,HK,JP}', '{USD,CAD,GBP,EUR,AED,AUD,SGD,HKD,JPY}', 2.9, 0.30, 0.50, 999999.99),
  ('razorpay', 'Razorpay', true, '{IN}', '{INR}', 2.0, 0.00, 5.00, 999999.99),
  ('paystack', 'Paystack', true, '{NG,GH}', '{NGN,GHS}', 1.5, 0.00, 100.00, 999999.99),
  ('flutterwave', 'Flutterwave', true, '{NG,GH,ZA}', '{NGN,GHS,ZAR,USD,EUR,GBP}', 1.4, 0.00, 5.00, 999999.99),
  ('paychangu', 'PayChangu', true, '{MW,EG}', '{MWK,EGP}', 1.0, 0.00, 200.00, 999999.99),
  ('mpesa', 'M-Pesa', true, '{KE,TZ,UG}', '{KES,TZS,UGX}', 1.0, 0.00, 20.00, 999999.99),
  ('airwallex', 'Airwallex', true, '{US,CA,GB,FR,DE,AE,AU,SG,HK,JP,CN,IN,NG,GH,KE,ZA,EG,RW,ZM,SN}', '{USD,CAD,GBP,EUR,AED,AUD,SGD,HKD,JPY,CNY,INR,NGN,GHS,KES,ZAR,EGP,RWF,ZMW,XOF}', 2.9, 0.30, 0.50, 999999.99),
  ('pawapay', 'PawaPay', true, '{KE,UG,TZ,GH,NG,ZM,ZW,RW,SN,CI,CM}', '{KES,UGX,TZS,GHS,NGN,ZMW,ZWL,RWF,XOF}', 1.5, 0.00, 20.00, 999999.99),
  ('adyen', 'Adyen', true, '{US,CA,GB,FR,DE,AE,AU,SG,HK,JP,BR,MX,AR,CL,CO,PE,UY,NG,GH,ZA,EG}', '{USD,CAD,GBP,EUR,AED,AUD,SGD,HKD,JPY,BRL,MXN,ARS,CLP,COP,PEN,UYU,NGN,GHS,ZAR,EGP}', 2.9, 0.30, 0.50, 999999.99),
  ('dlocal', 'dLocal', true, '{AR,BR,MX,CL,CO,PE,UY,PY,BO,EC,CR,PA,DO,GT,HN,NI,SV}', '{ARS,BRL,MXN,CLP,COP,PEN,UYU,PYG,BOB,USD,CRC,DOP,GTQ,HNL,NIO}', 3.9, 0.00, 5.00, 999999.99)
ON CONFLICT (code) DO NOTHING;

-- ─── Sample Businesses ───────────────────────────────────────

-- Nigeria: Tech Solutions
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ng-001', 'Lagos Tech Hub', 'Full-service IT support and web development', 'Technology', 'NG', '00000000-0000-0000-0000-000000000001', 'active', 4.5, 127, false, 0, 0, 0.10, '{tech,web,it,support}', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326));

-- Nigeria: Fashion
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ng-002', 'African Elegance Tailors', 'Custom African print fashion and tailoring', 'Fashion & Tailoring', 'NG', '00000000-0000-0000-0000-000000000001', 'active', 4.8, 89, true, 15, 5000, 0.08, '{fashion,tailoring,african-print}', ST_SetSRID(ST_MakePoint(3.4064, 6.4657), 4326));

-- Nigeria: Food
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ng-003', 'Naija Bites Restaurant', 'Authentic Nigerian cuisine - jollof, egusi, suya', 'Food & Dining', 'NG', '00000000-0000-0000-0000-000000000001', 'active', 4.3, 312, true, 8, 3000, 0.12, '{restaurant,nigerian,food}', ST_SetSRID(ST_MakePoint(3.3875, 6.4473), 4326));

-- Kenya: Healthcare
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ke-001', 'Nairobi Health Clinic', 'General practice and family medicine', 'Healthcare', 'KE', '00000000-0000-0000-0000-000000000001', 'active', 4.6, 234, false, 0, 0, 0.07, '{healthcare,clinic,medical}', ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326));

-- Kenya: Beauty
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ke-002', 'Mzuri Beauty Salon', 'Braiding, makeup, nails and skincare', 'Beauty & Wellness', 'KE', '00000000-0000-0000-0000-000000000001', 'active', 4.4, 178, false, 0, 0, 0.10, '{beauty,salon,braiding}', ST_SetSRID(ST_MakePoint(36.8172, -1.2864), 4326));

-- Ghana: Education
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-gh-001', 'Accra Learning Center', 'Tutoring and test preparation services', 'Education', 'GH', '00000000-0000-0000-0000-000000000001', 'active', 4.7, 95, false, 0, 0, 0.08, '{education,tutoring,test-prep}', ST_SetSRID(ST_MakePoint(-0.1869, 5.6037), 4326));

-- Ghana: Agriculture
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-gh-002', 'Kumasi Fresh Farms', 'Fresh organic produce and farm products', 'Agriculture', 'GH', '00000000-0000-0000-0000-000000000001', 'active', 4.2, 67, true, 25, 50, 0.06, '{agriculture,fresh,organic}', ST_SetSRID(ST_MakePoint(-1.6252, 6.6885), 4326));

-- South Africa: Automotive
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-za-001', 'Cape Town Auto Care', 'Vehicle repairs, servicing, and detailing', 'Automotive', 'ZA', '00000000-0000-0000-0000-000000000001', 'active', 4.1, 156, false, 0, 0, 0.09, '{automotive,repair,service}', ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326));

-- Tanzania: Tourism
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-tz-001', 'Serengeti Adventure Tours', 'Safari tours and travel experiences', 'Tourism', 'TZ', '00000000-0000-0000-0000-000000000001', 'active', 4.9, 423, false, 0, 0, 0.11, '{tourism,safari,travel}', ST_SetSRID(ST_MakePoint(35.2518, -2.3333), 4326));

-- Uganda: Transportation
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-ug-001', 'Kampala Logistics Express', 'Same-day delivery and courier services', 'Transportation', 'UG', '00000000-0000-0000-0000-000000000001', 'active', 4.3, 89, true, 30, 5000, 0.08, '{logistics,delivery,courier}', ST_SetSRID(ST_MakePoint(32.5825, 0.3476), 4326));

-- Egypt: Real Estate
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-eg-001', 'Cairo Property Group', 'Real estate sales, rentals, and property management', 'Real Estate', 'EG', '00000000-0000-0000-0000-000000000001', 'active', 4.4, 198, false, 0, 0, 0.12, '{real-estate,property,rental}', ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326));

-- India: Technology
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-in-001', 'Mumbai Digital Solutions', 'Web development, app development, and digital marketing', 'Technology', 'IN', '00000000-0000-0000-0000-000000000001', 'active', 4.6, 345, false, 0, 0, 0.10, '{tech,digital,marketing}', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326));

-- UK: Legal
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-gb-001', 'London Legal Associates', 'Business law, contracts, and intellectual property', 'Legal & Financial', 'GB', '00000000-0000-0000-0000-000000000001', 'active', 4.7, 87, false, 0, 0, 0.10, '{legal,law,business}', ST_SetSRID(ST_MakePoint(-0.1276, 51.5074), 4326));

-- Malawi: Agriculture
INSERT INTO public.businesses (id, name, description, category, country_code, owner_id, status, rating, review_count, delivery_available, delivery_radius_km, minimum_order, commission_rate, tags, location)
VALUES
  ('b-mw-001', 'Lilongwe Agri-Cooperative', 'Farm supplies, equipment rental, and crop advisory', 'Agriculture', 'MW', '00000000-0000-0000-0000-000000000001', 'active', 4.0, 45, true, 20, 2000, 0.05, '{agriculture,farming,cooperative}', ST_SetSRID(ST_MakePoint(33.7703, -13.9626), 4326));

-- ─── Services per Business ───────────────────────────────────

-- Lagos Tech Hub
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-ng-001', 'b-ng-001', 'Website Development', 'Custom website design and development', 120, 150000, 'NGN', 'Technology', true, 3, 15),
  ('s-ng-002', 'b-ng-001', 'IT Support Session', 'Remote or on-site IT troubleshooting', 60, 25000, 'NGN', 'Technology', true, 5, 10),
  ('s-ng-003', 'b-ng-001', 'Network Setup', 'Office/home network installation and configuration', 180, 75000, 'NGN', 'Technology', true, 2, 30);

-- African Elegance Tailors
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-ng-004', 'b-ng-002', 'Custom Dashiki', 'Tailored African print dashiki', 60, 15000, 'NGN', 'Fashion & Tailoring', true, 5, 15),
  ('s-ng-005', 'b-ng-002', 'Agbada Set', 'Complete agbada with cap', 120, 45000, 'NGN', 'Fashion & Tailoring', true, 3, 20),
  ('s-ng-006', 'b-ng-002', 'Alterations', 'Clothing repair and resizing', 30, 5000, 'NGN', 'Fashion & Tailoring', true, 10, 5);

-- Naija Bites Restaurant
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-ng-007', 'b-ng-003', 'Dine-In Experience', 'Full restaurant dining experience', 90, 8000, 'NGN', 'Food & Dining', true, 40, 10),
  ('s-ng-008', 'b-ng-003', 'Catering Service', 'Event catering for groups', 0, 50000, 'NGN', 'Food & Dining', true, 1, 30);

-- Nairobi Health Clinic
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-ke-001', 'b-ke-001', 'General Consultation', 'General medical consultation', 30, 2000, 'KES', 'Healthcare', true, 10, 10),
  ('s-ke-002', 'b-ke-001', 'Dental Checkup', 'Dental examination and cleaning', 45, 3500, 'KES', 'Healthcare', true, 5, 15),
  ('s-ke-003', 'b-ke-001', 'Vaccination', 'Routine vaccinations', 20, 1500, 'KES', 'Healthcare', true, 15, 5);

-- Mzuri Beauty Salon
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-ke-004', 'b-ke-002', 'Box Braids', 'Full box braids installation', 180, 3000, 'KES', 'Beauty & Wellness', true, 3, 20),
  ('s-ke-005', 'b-ke-002', 'Manicure & Pedicure', 'Nail care and polish', 60, 1500, 'KES', 'Beauty & Wellness', true, 4, 10);

-- Accra Learning Center
INSERT INTO public.services (id, business_id, name, description, duration, price, currency_code, category, available, max_capacity_per_slot, padding_minutes)
VALUES
  ('s-gh-001', 'b-gh-001', 'Math Tutoring', 'Mathematics tutoring (all levels)', 60, 200, 'GHS', 'Education', true, 5, 5),
  ('s-gh-002', 'b-gh-001', 'English Tutoring', 'English language and literature', 60, 180, 'GHS', 'Education', true, 5, 5),
  ('s-gh-003', 'b-gh-001', 'SAT Prep Course', 'SAT preparation tutoring', 120, 500, 'GHS', 'Education', true, 10, 10);

-- ─── Sample Staff ────────────────────────────────────────────

INSERT INTO public.staff (id, business_id, name, role, email, phone, is_active, rating, service_ids, schedule)
VALUES
  ('st-ng-001', 'b-ng-001', 'Chinedu Okonkwo', 'Senior Developer', 'chinedu@lagostechhub.ng', '+234-801-234-5678', true, 4.8, '{s-ng-001,s-ng-002}', '[{"day":"mon","start":"09:00","end":"17:00","isAvailable":true},{"day":"tue","start":"09:00","end":"17:00","isAvailable":true},{"day":"wed","start":"09:00","end":"17:00","isAvailable":true},{"day":"thu","start":"09:00","end":"17:00","isAvailable":true},{"day":"fri","start":"09:00","end":"15:00","isAvailable":true}]'),
  ('st-ng-002', 'b-ng-002', 'Aisha Bello', 'Master Tailor', 'aisha@africanelegance.ng', '+234-802-345-6789', true, 4.9, '{s-ng-004,s-ng-005,s-ng-006}', '[{"day":"mon","start":"08:00","end":"18:00","isAvailable":true},{"day":"tue","start":"08:00","end":"18:00","isAvailable":true},{"day":"wed","start":"08:00","end":"18:00","isAvailable":true},{"day":"thu","start":"08:00","end":"18:00","isAvailable":true},{"day":"fri","start":"08:00","end":"17:00","isAvailable":true},{"day":"sat","start":"09:00","end":"14:00","isAvailable":true}]'),
  ('st-ke-001', 'b-ke-001', 'Dr. Jane Mwangi', 'General Practitioner', 'jane@nairohealth.ke', '+254-712-345-678', true, 4.7, '{s-ke-001,s-ke-003}', '[{"day":"mon","start":"08:00","end":"16:00","isAvailable":true},{"day":"tue","start":"08:00","end":"16:00","isAvailable":true},{"day":"wed","start":"08:00","end":"16:00","isAvailable":true},{"day":"thu","start":"08:00","end":"16:00","isAvailable":true},{"day":"fri","start":"08:00","end":"13:00","isAvailable":true}]'),
  ('st-ke-002', 'b-ke-002', 'Faith Nyambura', 'Senior Stylist', 'faith@mzuribeauty.ke', '+254-723-456-789', true, 4.6, '{s-ke-004,s-ke-005}', '[{"day":"mon","start":"09:00","end":"18:00","isAvailable":true},{"day":"tue","start":"09:00","end":"18:00","isAvailable":true},{"day":"wed","start":"09:00","end":"18:00","isAvailable":true},{"day":"thu","start":"09:00","end":"18:00","isAvailable":true},{"day":"fri","start":"09:00","end":"18:00","isAvailable":true},{"day":"sat","start":"10:00","end":"16:00","isAvailable":true}]');

-- ─── Sample Products ─────────────────────────────────────────

INSERT INTO public.products (id, business_id, name, description, price, currency_code, stock, category, tags, is_available, requires_shipping, images)
VALUES
  ('p-ng-001', 'b-ng-002', 'Ankara Print Fabric', 'Premium 100% cotton Ankara fabric (6 yards)', 12000, 'NGN', 50, 'Fashion & Tailoring', '{fabric,ankara,textile}', true, true, '{}'),
  ('p-ng-002', 'b-ng-002', 'Beaded Necklace', 'Handmade African bead necklace', 3500, 'NGN', 30, 'Fashion & Tailoring', '{accessories,beads,handmade}', true, true, '{}'),
  ('p-ng-003', 'b-ng-003', 'Suya Spice Mix', 'Authentic Nigerian suya spice blend (250g)', 1500, 'NGN', 200, 'Food & Dining', '{spice,suya,nigerian}', true, true, '{}'),
  ('p-gh-001', 'b-gh-002', 'Organic Tomatoes', 'Farm-fresh organic tomatoes (1kg)', 15, 'GHS', 500, 'Agriculture', '{organic,fresh,tomatoes}', true, false, '{}'),
  ('p-gh-002', 'b-gh-002', 'Plantain Bundle', 'Ripe plantains (5 pieces)', 25, 'GHS', 300, 'Agriculture', '{plantain,fresh}', true, false, '{}');

-- ─── Sample Menu Items (Naija Bites) ─────────────────────────

INSERT INTO public.menu_categories (id, business_id, name, description, sort_order)
VALUES
  ('mc-ng-001', 'b-ng-003', 'Main Dishes', 'Hearty Nigerian main courses', 1),
  ('mc-ng-002', 'b-ng-003', 'Small Chops', 'Appetizers and sides', 2),
  ('mc-ng-003', 'b-ng-003', 'Drinks', 'Refreshing beverages', 3),
  ('mc-ng-004', 'b-ng-003', 'Soups', 'Traditional Nigerian soups', 4);

INSERT INTO public.menu_items (id, business_id, category_id, name, description, price, currency_code, available, preparation_time, sort_order, ingredients, dietary_tags)
VALUES
  ('mi-ng-001', 'b-ng-003', 'mc-ng-001', 'Jollof Rice & Chicken', 'Classic Nigerian jollof rice with grilled chicken and plantain', 4500, 'NGN', true, 20, 1, '{rice,chicken,tomatoes,pepper,onions,plantain}', '{}'),
  ('mi-ng-002', 'b-ng-003', 'mc-ng-001', 'Egusi Soup & Pounded Yam', 'Ground melon seed soup with leafy greens, served with pounded yam', 5500, 'NGN', true, 25, 2, '{egusi,melon,yam,spinach,meat}', '{gluten-free}'),
  ('mi-ng-003', 'b-ng-003', 'mc-ng-001', 'Fried Rice & Suya', 'Nigerian fried rice with beef suya skewers', 5000, 'NGN', true, 20, 3, '{rice,beef,pepper,vegetables}', '{}'),
  ('mi-ng-004', 'b-ng-003', 'mc-ng-002', 'Moi Moi', 'Steamed bean pudding with peppers and onions', 1500, 'NGN', true, 15, 1, '{beans,peppers,onions,oil}', '{vegetarian,vegan}'),
  ('mi-ng-005', 'b-ng-003', 'mc-ng-002', 'Puff Puff (5pcs)', 'Deep-fried dough balls, lightly sweetened', 1000, 'NGN', true, 10, 2, '{flour,sugar,yeast,nutmeg}', '{vegetarian}'),
  ('mi-ng-006', 'b-ng-003', 'mc-ng-002', 'Samosa (3pcs)', 'Spiced meat and vegetable samosas', 1200, 'NGN', true, 12, 3, '{flour,meat,vegetables,spices}', '{}'),
  ('mi-ng-007', 'b-ng-003', 'mc-ng-003', 'Zobo Drink', 'Hibiscus flower drink with ginger', 800, 'NGN', true, 5, 1, '{hibiscus,ginger,sugar}', '{vegan,gluten-free}'),
  ('mi-ng-008', 'b-ng-003', 'mc-ng-003', 'Chapman Cocktail', 'Non-alcoholic Nigerian cocktail', 1500, 'NGN', true, 5, 2, '{grenadine,sprite,angostura,fruits}', '{vegan}'),
  ('mi-ng-009', 'b-ng-003', 'mc-ng-004', 'Ogbono Soup', 'Wild mango seed soup with assorted meat', 4000, 'NGN', true, 25, 1, '{ogbono,meat,fish,spinach}', '{gluten-free}'),
  ('mi-ng-010', 'b-ng-003', 'mc-ng-004', 'Vegetable Soup', 'Fresh green vegetable soup with assorted meat and fish', 3500, 'NGN', true, 20, 2, '{vegetables,meat,fish,spinach}', '{gluten-free}');

-- ─── Sample Reviews ──────────────────────────────────────────

INSERT INTO public.reviews (business_id, user_id, target_type, target_id, rating, title, body, is_verified_purchase, is_approved)
VALUES
  ('b-ng-001', '00000000-0000-0000-0000-000000000001', 'business', 'b-ng-001', 5, 'Excellent service!', 'They built our company website and did an amazing job. Very professional.', true, true),
  ('b-ng-003', '00000000-0000-0000-0000-000000000001', 'business', 'b-ng-003', 4, 'Best jollof in Lagos', 'The jollof rice is absolutely incredible. Delivery was fast too.', true, true);
