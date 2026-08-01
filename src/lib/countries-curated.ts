// ─────────────────────────────────────────────────────────────
// Curated businesses & services for flagship markets.
// These are layered on top of / combined with the deterministic
// generator so the biggest markets always look rich.
// ─────────────────────────────────────────────────────────────

import type { Business, Service } from '@/types'

function h(days: { d: number; open: string; close: string; closed?: boolean }[]) {
  const names = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  return names.map((day, i) => {
    const entry = days.find((x) => x.d === i)
    return {
      day,
      open: entry?.open ?? '08:00',
      close: entry?.close ?? '19:00',
      isClosed: entry?.closed ?? false,
    }
  })
}

const DEFAULT_HOURS = h([
  { d: 0, open: '08:00', close: '19:00' },
  { d: 1, open: '08:00', close: '19:00' },
  { d: 2, open: '08:00', close: '19:00' },
  { d: 3, open: '08:00', close: '19:00' },
  { d: 4, open: '08:00', close: '20:00' },
  { d: 5, open: '09:00', close: '18:00' },
  { d: 6, open: '10:00', close: '16:00' },
])

export const CURATED_BUSINESSES: Record<string, Business[]> = {
  NG: [
    {
      id: 'ng-1', name: 'Lagos Fresh Market', description: 'Premium fresh produce delivered to your doorstep. We source directly from local farmers across Nigeria to bring you the freshest fruits, vegetables, and organic goods.', category: 'Food & Dining', countryCode: 'NG', ownerId: '', address: { street: '12 Ahmadu Bello Way', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Ahmadu Bello Way, Lagos', geoPoint: { latitude: 6.5244, longitude: 3.3792 } }, location: { latitude: 6.5244, longitude: 3.3792 }, contact: { phone: '+234 800 123 4567', email: 'hello@lagosfreshmarket.ng' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 234, qrBookingUrl: '', tags: ['groceries', 'fresh', 'organic', 'delivery'], deliveryAvailable: true, deliveryRadiusKm: 15, minimumOrder: 2000, commissionRate: 0.08, createdAt: '', updatedAt: '',
    },
    {
      id: 'ng-2', name: 'Lekki Beauty Studio', description: 'Full-service beauty salon offering hairstyling, makeup, nails, and skincare treatments.', category: 'Beauty & Wellness', countryCode: 'NG', ownerId: '', address: { street: '45 Admiralty Way', city: 'Lekki', state: 'Lagos', postalCode: '100005', countryCode: 'NG', formatted: '45 Admiralty Way, Lekki, Lagos', geoPoint: { latitude: 6.4281, longitude: 3.4219 } }, location: { latitude: 6.4281, longitude: 3.4219 }, contact: { phone: '+234 800 987 6543', email: 'book@lekki-beauty.ng' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.9, reviewCount: 189, qrBookingUrl: '', tags: ['salon', 'beauty', 'hair', 'nails'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'ng-3', name: 'Abuja Tech Hub', description: 'Computer repairs, IT consulting, web development, and digital services for businesses and individuals.', category: 'Technology', countryCode: 'NG', ownerId: '', address: { street: '10 Shehu Shagari Way', city: 'Abuja', state: 'FCT', postalCode: '900001', countryCode: 'NG', formatted: '10 Shehu Shagari Way, Abuja', geoPoint: { latitude: 9.0579, longitude: 7.4951 } }, location: { latitude: 9.0579, longitude: 7.4951 }, contact: { phone: '+234 800 555 1234', email: 'info@abujatech.ng' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 98, qrBookingUrl: '', tags: ['tech', 'repairs', 'consulting', 'web'], deliveryAvailable: true, deliveryRadiusKm: 10, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'ng-4', name: 'Lagos Fashion House', description: 'Bespoke tailoring, ready-to-wear African fashion, and custom designs.', category: 'Fashion & Tailoring', countryCode: 'NG', ownerId: '', address: { street: '22 Awolowo Road', city: 'Lagos', state: 'Lagos', postalCode: '100002', countryCode: 'NG', formatted: '22 Awolowo Road, Ikoyi, Lagos', geoPoint: { latitude: 6.4478, longitude: 3.4323 } }, location: { latitude: 6.4478, longitude: 3.4323 }, contact: { phone: '+234 800 333 4444', email: 'style@lagosfashion.ng' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.6, reviewCount: 142, qrBookingUrl: '', tags: ['fashion', 'tailoring', 'african', 'bespoke'], deliveryAvailable: true, deliveryRadiusKm: 5, minimumOrder: 5000, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'ng-5', name: 'Victory Barbers', description: 'Classic and modern cuts, hot towel shaves, and premium grooming for men.', category: 'Beauty & Wellness', countryCode: 'NG', ownerId: '', address: { street: '3 Ikeja City Mall', city: 'Lagos', state: 'Lagos', postalCode: '100004', countryCode: 'NG', formatted: '3 Ikeja City Mall, Lagos', geoPoint: { latitude: 6.6017, longitude: 3.3515 } }, location: { latitude: 6.6017, longitude: 3.3515 }, contact: { phone: '+234 800 111 2222', email: 'cut@victorybarbers.ng' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 320, qrBookingUrl: '', tags: ['barber', 'haircut', 'grooming'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  KE: [
    {
      id: 'ke-1', name: 'Nairobi Beauty Studio', description: 'Premium beauty and wellness services including hairstyling, makeup, massage, and skincare.', category: 'Beauty & Wellness', countryCode: 'KE', ownerId: '', address: { street: '100 Moi Avenue', city: 'Nairobi', state: 'Nairobi', postalCode: '00100', countryCode: 'KE', formatted: '100 Moi Avenue, Nairobi', geoPoint: { latitude: -1.2864, longitude: 36.8172 } }, location: { latitude: -1.2864, longitude: 36.8172 }, contact: { phone: '+254 700 123 456', email: 'hello@nairobi-beauty.ke' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.9, reviewCount: 312, qrBookingUrl: '', tags: ['beauty', 'salon', 'wellness', 'spa'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'ke-2', name: 'Mama Mboga Farm Fresh', description: 'Farm-to-table organic produce delivered straight from Kiambu farms to your kitchen.', category: 'Food & Dining', countryCode: 'KE', ownerId: '', address: { street: '50 Kenyatta Market', city: 'Nairobi', state: 'Nairobi', postalCode: '00200', countryCode: 'KE', formatted: '50 Kenyatta Market, Nairobi', geoPoint: { latitude: -1.2921, longitude: 36.8219 } }, location: { latitude: -1.2921, longitude: 36.8219 }, contact: { phone: '+254 711 222 333', email: 'orders@mamamboga.ke' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 189, qrBookingUrl: '', tags: ['organic', 'farm', 'groceries', 'fresh'], deliveryAvailable: true, deliveryRadiusKm: 20, minimumOrder: 500, commissionRate: 0.08, createdAt: '', updatedAt: '',
    },
    {
      id: 'ke-3', name: 'M-Pesa Tech Solutions', description: 'Mobile money integration, fintech consulting, and digital payment solutions for businesses.', category: 'Technology', countryCode: 'KE', ownerId: '', address: { street: '5 Upper Hill Road', city: 'Nairobi', state: 'Nairobi', postalCode: '00300', countryCode: 'KE', formatted: '5 Upper Hill Road, Nairobi', geoPoint: { latitude: -1.3005, longitude: 36.8154 } }, location: { latitude: -1.3005, longitude: 36.8154 }, contact: { phone: '+254 722 444 555', email: 'info@mpesa-tech.ke' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 76, qrBookingUrl: '', tags: ['fintech', 'mobile', 'payments', 'consulting'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'ke-4', name: 'Spa Serenity Mombasa', description: 'Ocean-view spa with massage, facials, and full-body wellness treatments.', category: 'Beauty & Wellness', countryCode: 'KE', ownerId: '', address: { street: 'Diani Beach Road', city: 'Mombasa', state: 'Mombasa', postalCode: '80100', countryCode: 'KE', formatted: 'Diani Beach Road, Mombasa', geoPoint: { latitude: -4.0435, longitude: 39.6682 } }, location: { latitude: -4.0435, longitude: 39.6682 }, contact: { phone: '+254 733 555 666', email: 'relax@spaserenity.ke' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.6, reviewCount: 154, qrBookingUrl: '', tags: ['spa', 'massage', 'wellness'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  GH: [
    {
      id: 'gh-1', name: 'Accra Fashion House', description: 'Contemporary African fashion, bespoke tailoring, and ready-to-wear collections.', category: 'Fashion & Tailoring', countryCode: 'GH', ownerId: '', address: { street: '15 Oxford Street', city: 'Accra', state: 'Greater Accra', postalCode: 'GA001', countryCode: 'GH', formatted: '15 Oxford Street, Osu, Accra', geoPoint: { latitude: 5.5557, longitude: -0.2011 } }, location: { latitude: 5.5557, longitude: -0.2011 }, contact: { phone: '+233 30 123 4567', email: 'hello@accrafashion.gh' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.6, reviewCount: 142, qrBookingUrl: '', tags: ['fashion', 'tailoring', 'african', 'couture'], deliveryAvailable: true, deliveryRadiusKm: 10, minimumOrder: 200, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'gh-2', name: 'Kumasi AgroConnect', description: 'Connecting farmers with buyers. Fresh cocoa, cashew, maize, and vegetables from the Ashanti Region.', category: 'Agriculture', countryCode: 'GH', ownerId: '', address: { street: 'Kejetia Market Rd', city: 'Kumasi', state: 'Ashanti', postalCode: 'AK001', countryCode: 'GH', formatted: 'Kejetia Market Rd, Kumasi', geoPoint: { latitude: 6.6985, longitude: -1.6235 } }, location: { latitude: 6.6985, longitude: -1.6235 }, contact: { phone: '+233 50 987 6543', email: 'info@kumasiagro.gh' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.5, reviewCount: 87, qrBookingUrl: '', tags: ['agriculture', 'farming', 'cocoa', 'organic'], deliveryAvailable: true, deliveryRadiusKm: 50, minimumOrder: 1000, commissionRate: 0.05, createdAt: '', updatedAt: '',
    },
    {
      id: 'gh-3', name: 'Labadi Beach Spa & Resort', description: 'Coastal spa, massage therapy, and wellness retreats.', category: 'Beauty & Wellness', countryCode: 'GH', ownerId: '', address: { street: 'Labadi Beach', city: 'Accra', state: 'Greater Accra', postalCode: 'GA002', countryCode: 'GH', formatted: 'Labadi Beach, Accra', geoPoint: { latitude: 5.5557, longitude: -0.1667 } }, location: { latitude: 5.5557, longitude: -0.1667 }, contact: { phone: '+233 24 555 1212', email: 'book@labadispa.gh' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 210, qrBookingUrl: '', tags: ['spa', 'wellness', 'resort'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  ZA: [
    {
      id: 'za-1', name: 'Cape Town Auto Care', description: 'Vehicle repairs, servicing, and detailing.', category: 'Automotive', countryCode: 'ZA', ownerId: '', address: { street: '4 Long Street', city: 'Cape Town', state: 'Western Cape', postalCode: '8001', countryCode: 'ZA', formatted: '4 Long Street, Cape Town', geoPoint: { latitude: -33.9249, longitude: 18.4241 } }, location: { latitude: -33.9249, longitude: 18.4241 }, contact: { phone: '+27 21 555 0100', email: 'service@capetownauto.za' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.1, reviewCount: 156, qrBookingUrl: '', tags: ['automotive', 'repair', 'service'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.09, createdAt: '', updatedAt: '',
    },
    {
      id: 'za-2', name: 'Sandton City Salon', description: 'Hair, makeup, nails and skincare in the heart of Johannesburg.', category: 'Beauty & Wellness', countryCode: 'ZA', ownerId: '', address: { street: '5 Rivonia Road', city: 'Johannesburg', state: 'Gauteng', postalCode: '2196', countryCode: 'ZA', formatted: '5 Rivonia Road, Sandton, Johannesburg', geoPoint: { latitude: -26.1076, longitude: 28.0567 } }, location: { latitude: -26.1076, longitude: 28.0567 }, contact: { phone: '+27 11 555 2020', email: 'glam@sandtoncity.za' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 264, qrBookingUrl: '', tags: ['salon', 'beauty', 'hair'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  TZ: [
    {
      id: 'tz-1', name: 'Serengeti Adventure Tours', description: 'Safari tours and travel experiences across Tanzania.', category: 'Tourism', countryCode: 'TZ', ownerId: '', address: { street: 'Njiro Road', city: 'Arusha', state: 'Arusha', postalCode: '23100', countryCode: 'TZ', formatted: 'Njiro Road, Arusha', geoPoint: { latitude: -3.3869, longitude: 36.683 } }, location: { latitude: -3.3869, longitude: 36.683 }, contact: { phone: '+255 754 123 456', email: 'safari@serengetiadventure.tz' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.9, reviewCount: 423, qrBookingUrl: '', tags: ['tourism', 'safari', 'travel'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.11, createdAt: '', updatedAt: '',
    },
  ],
  UG: [
    {
      id: 'ug-1', name: 'Kampala Logistics Express', description: 'Same-day delivery and courier services.', category: 'Transportation', countryCode: 'UG', ownerId: '', address: { street: '12 Kampala Road', city: 'Kampala', state: 'Central', postalCode: '', countryCode: 'UG', formatted: '12 Kampala Road, Kampala', geoPoint: { latitude: 0.3476, longitude: 32.5825 } }, location: { latitude: 0.3476, longitude: 32.5825 }, contact: { phone: '+256 700 111 222', email: 'info@kamplex.ug' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.3, reviewCount: 89, qrBookingUrl: '', tags: ['logistics', 'delivery', 'courier'], deliveryAvailable: true, deliveryRadiusKm: 30, minimumOrder: 5000, commissionRate: 0.08, createdAt: '', updatedAt: '',
    },
  ],
  MW: [
    {
      id: 'mw-1', name: 'Lilongwe Agri-Cooperative', description: 'Farm supplies, equipment rental, and crop advisory.', category: 'Agriculture', countryCode: 'MW', ownerId: '', address: { street: 'Presidential Way', city: 'Lilongwe', state: 'Central', postalCode: '', countryCode: 'MW', formatted: 'Presidential Way, Lilongwe', geoPoint: { latitude: -13.9626, longitude: 33.7703 } }, location: { latitude: -13.9626, longitude: 33.7703 }, contact: { phone: '+265 888 555 010', email: 'farm@lilongweagri.mw' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.0, reviewCount: 45, qrBookingUrl: '', tags: ['agriculture', 'farming', 'cooperative'], deliveryAvailable: true, deliveryRadiusKm: 20, minimumOrder: 2000, commissionRate: 0.05, createdAt: '', updatedAt: '',
    },
  ],
  EG: [
    {
      id: 'eg-1', name: 'Cairo Property Group', description: 'Real estate sales, rentals, and property management.', category: 'Real Estate', countryCode: 'EG', ownerId: '', address: { street: '15 Tahrir Square', city: 'Cairo', state: 'Cairo', postalCode: '11511', countryCode: 'EG', formatted: '15 Tahrir Square, Cairo', geoPoint: { latitude: 30.0444, longitude: 31.2357 } }, location: { latitude: 30.0444, longitude: 31.2357 }, contact: { phone: '+20 2 555 0101', email: 'info@cairogroup.eg' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.4, reviewCount: 198, qrBookingUrl: '', tags: ['real-estate', 'property', 'rental'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.12, createdAt: '', updatedAt: '',
    },
  ],
  US: [
    {
      id: 'us-1', name: 'Brooklyn Barbers', description: 'Premium men\u2019s grooming, fades, and hot towel shaves.', category: 'Beauty & Wellness', countryCode: 'US', ownerId: '', address: { street: '250 Bedford Ave', city: 'New York', state: 'NY', postalCode: '11249', countryCode: 'US', formatted: '250 Bedford Ave, Brooklyn, NY', geoPoint: { latitude: 40.7128, longitude: -73.9565 } }, location: { latitude: 40.7128, longitude: -73.9565 }, contact: { phone: '+1 718 555 0134', email: 'cuts@brooklynbarbers.com' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.9, reviewCount: 512, qrBookingUrl: '', tags: ['barber', 'grooming', 'haircut'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.12, createdAt: '', updatedAt: '',
    },
    {
      id: 'us-2', name: 'Golden Hour Day Spa', description: 'Luxury spa, massage, facials and wellness retreats.', category: 'Beauty & Wellness', countryCode: 'US', ownerId: '', address: { street: '800 Sunset Blvd', city: 'Los Angeles', state: 'CA', postalCode: '90046', countryCode: 'US', formatted: '800 Sunset Blvd, Los Angeles, CA', geoPoint: { latitude: 34.0979, longitude: -118.3618 } }, location: { latitude: 34.0979, longitude: -118.3618 }, contact: { phone: '+1 323 555 0178', email: 'hello@goldenhourspa.com' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 234, qrBookingUrl: '', tags: ['spa', 'wellness', 'massage'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.12, createdAt: '', updatedAt: '',
    },
    {
      id: 'us-3', name: 'The Corner Bistro', description: 'Farm-to-table American dining with local craft brews.', category: 'Food & Dining', countryCode: 'US', ownerId: '', address: { street: '1100 Commerce St', city: 'Austin', state: 'TX', postalCode: '78701', countryCode: 'US', formatted: '1100 Commerce St, Austin, TX', geoPoint: { latitude: 30.2672, longitude: -97.7431 } }, location: { latitude: 30.2672, longitude: -97.7431 }, contact: { phone: '+1 512 555 0199', email: 'eat@cornerbistro.com' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.6, reviewCount: 187, qrBookingUrl: '', tags: ['restaurant', 'dining', 'farm-to-table'], deliveryAvailable: true, deliveryRadiusKm: 8, minimumOrder: 25, commissionRate: 0.12, createdAt: '', updatedAt: '',
    },
  ],
  GB: [
    {
      id: 'gb-1', name: 'London Legal Associates', description: 'Business law, contracts, and intellectual property.', category: 'Legal & Financial', countryCode: 'GB', ownerId: '', address: { street: '1 Fleet Street', city: 'London', state: 'England', postalCode: 'EC4A', countryCode: 'GB', formatted: '1 Fleet Street, London', geoPoint: { latitude: 51.5142, longitude: -0.1106 } }, location: { latitude: 51.5142, longitude: -0.1106 }, contact: { phone: '+44 20 5555 0100', email: 'law@londonlegal.co.uk' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 87, qrBookingUrl: '', tags: ['legal', 'law', 'business'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'gb-2', name: 'Soho Style Salon', description: 'Trend-driven hairdressing, colour and grooming in central London.', category: 'Beauty & Wellness', countryCode: 'GB', ownerId: '', address: { street: '9 Wardour Street', city: 'London', state: 'England', postalCode: 'W1D', countryCode: 'GB', formatted: '9 Wardour Street, London', geoPoint: { latitude: 51.513, longitude: -0.1326 } }, location: { latitude: 51.513, longitude: -0.1326 }, contact: { phone: '+44 20 5555 0177', email: 'book@sohostyle.co.uk' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 302, qrBookingUrl: '', tags: ['salon', 'hair', 'beauty'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  IN: [
    {
      id: 'in-1', name: 'Mumbai Digital Solutions', description: 'Web development, app development, and digital marketing.', category: 'Technology', countryCode: 'IN', ownerId: '', address: { street: '88 Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050', countryCode: 'IN', formatted: '88 Bandra West, Mumbai', geoPoint: { latitude: 19.076, longitude: 72.8777 } }, location: { latitude: 19.076, longitude: 72.8777 }, contact: { phone: '+91 22 5555 0100', email: 'hello@mumbaidigital.in' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.6, reviewCount: 345, qrBookingUrl: '', tags: ['tech', 'digital', 'marketing'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
    {
      id: 'in-2', name: 'Jaipur Heritage Spa', description: 'Ayurvedic spa and wellness treatments in the Pink City.', category: 'Beauty & Wellness', countryCode: 'IN', ownerId: '', address: { street: '22 MI Road', city: 'Jaipur', state: 'Rajasthan', postalCode: '302001', countryCode: 'IN', formatted: '22 MI Road, Jaipur', geoPoint: { latitude: 26.9124, longitude: 75.7873 } }, location: { latitude: 26.9124, longitude: 75.7873 }, contact: { phone: '+91 141 555 0202', email: 'namaste@jaipurspa.in' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 201, qrBookingUrl: '', tags: ['spa', 'ayurveda', 'wellness'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  AE: [
    {
      id: 'ae-1', name: 'Dubai Luxury Barbershop', description: 'Executive grooming lounge with VIP services.', category: 'Beauty & Wellness', countryCode: 'AE', ownerId: '', address: { street: 'Sheikh Zayed Road', city: 'Dubai', state: 'Dubai', postalCode: '', countryCode: 'AE', formatted: 'Sheikh Zayed Road, Dubai', geoPoint: { latitude: 25.2048, longitude: 55.2708 } }, location: { latitude: 25.2048, longitude: 55.2708 }, contact: { phone: '+971 4 555 0100', email: 'vip@dxbluxbarber.ae' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.8, reviewCount: 176, qrBookingUrl: '', tags: ['barber', 'grooming', 'luxury'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  FR: [
    {
      id: 'fr-1', name: 'Le Coiffeur Parisien', description: 'Parisian hair artistry and bridal styling.', category: 'Beauty & Wellness', countryCode: 'FR', ownerId: '', address: { street: '12 Rue de Rivoli', city: 'Paris', state: 'Île-de-France', postalCode: '75004', countryCode: 'FR', formatted: '12 Rue de Rivoli, Paris', geoPoint: { latitude: 48.8566, longitude: 2.3522 } }, location: { latitude: 48.8566, longitude: 2.3522 }, contact: { phone: '+33 1 5555 0100', email: 'bonjour@lecoiffeurparisien.fr' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 133, qrBookingUrl: '', tags: ['salon', 'hair', 'bridal'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  DE: [
    {
      id: 'de-1', name: 'Berlin Auto Werkstatt', description: 'Precision German auto repair and service.', category: 'Automotive', countryCode: 'DE', ownerId: '', address: { street: 'Karl-Marx-Allee 10', city: 'Berlin', state: 'Berlin', postalCode: '10178', countryCode: 'DE', formatted: 'Karl-Marx-Allee 10, Berlin', geoPoint: { latitude: 52.52, longitude: 13.405 } }, location: { latitude: 52.52, longitude: 13.405 }, contact: { phone: '+49 30 5555 0100', email: 'service@berlinwerkstatt.de' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.5, reviewCount: 98, qrBookingUrl: '', tags: ['auto', 'service', 'repair'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
  BR: [
    {
      id: 'br-1', name: 'Rio Viva Spa', description: 'Brazilian spa treatments, massages and wellness.', category: 'Beauty & Wellness', countryCode: 'BR', ownerId: '', address: { street: 'Av. Atlântica 500', city: 'Rio de Janeiro', state: 'RJ', postalCode: '22021', countryCode: 'BR', formatted: 'Av. Atlântica 500, Copacabana, Rio de Janeiro', geoPoint: { latitude: -22.9711, longitude: -43.1822 } }, location: { latitude: -22.9711, longitude: -43.1822 }, contact: { phone: '+55 21 5555 0100', email: 'oi@riovivaspa.br' }, media: { galleryUrls: [] }, hours: DEFAULT_HOURS, status: 'active', rating: 4.7, reviewCount: 245, qrBookingUrl: '', tags: ['spa', 'wellness', 'massage'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '',
    },
  ],
}

export const CURATED_SERVICES: Record<string, Service[]> = {
  NG: [
    { id: 'ng-s1', businessId: 'ng-1', name: 'Fresh Produce Box', description: 'Assorted seasonal fruits and vegetables', duration: 30, price: 3500, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 'ng-s2', businessId: 'ng-2', name: 'Hair Braiding', description: 'Professional braiding with extensions', duration: 120, price: 15000, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 'ng-s3', businessId: 'ng-2', name: 'Manicure & Pedicure', description: 'Full nail care treatment', duration: 60, price: 8000, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'ng-s4', businessId: 'ng-3', name: 'Computer Diagnostics', description: 'Full system diagnostic and report', duration: 45, price: 5000, currencyCode: 'NGN', category: 'Technology', available: true, maxCapacityPerSlot: 5, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 'ng-s5', businessId: 'ng-3', name: 'Website Development', description: 'Custom website design and development', duration: 0, price: 150000, currencyCode: 'NGN', category: 'Technology', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 'ng-s6', businessId: 'ng-4', name: 'Bespoke Tailoring', description: 'Custom-made traditional or modern attire', duration: 180, price: 45000, currencyCode: 'NGN', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 'ng-s7', businessId: 'ng-5', name: 'Classic Haircut', description: 'Signature cut with hot towel finish', duration: 45, price: 3000, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 4, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'ng-s8', businessId: 'ng-5', name: 'Beard Sculpt & Shave', description: 'Precision beard shaping with luxury shave', duration: 30, price: 2500, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 4, paddingMinutes: 5, createdAt: '', updatedAt: '' },
  ],
  KE: [
    { id: 'ke-s1', businessId: 'ke-1', name: 'Hair Braiding & Styling', description: 'Professional braiding, weaving, and styling', duration: 120, price: 2500, currencyCode: 'KES', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 'ke-s2', businessId: 'ke-1', name: 'Full-Body Massage', description: 'Relaxing Swedish and deep-tissue massage', duration: 60, price: 4000, currencyCode: 'KES', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 1, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'ke-s3', businessId: 'ke-2', name: 'Weekly Veggie Box', description: 'Assorted seasonal fruits and vegetables', duration: 30, price: 1500, currencyCode: 'KES', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 'ke-s4', businessId: 'ke-3', name: 'Fintech Consultation', description: 'Mobile money & payments integration advisory', duration: 60, price: 12000, currencyCode: 'KES', category: 'Technology', available: true, maxCapacityPerSlot: 1, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 'ke-s5', businessId: 'ke-4', name: 'Ocean View Massage', description: 'Relaxing massage with ocean views', duration: 60, price: 5000, currencyCode: 'KES', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  GH: [
    { id: 'gh-s1', businessId: 'gh-1', name: 'Bespoke Tailoring', description: 'Custom-made traditional or modern attire', duration: 180, price: 800, currencyCode: 'GHS', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 'gh-s2', businessId: 'gh-1', name: 'Ready-to-Wear Fitting', description: 'Off-the-rack sizing and alterations', duration: 45, price: 250, currencyCode: 'GHS', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'gh-s3', businessId: 'gh-2', name: 'Cocoa Bulk Order', description: 'Wholesale cocoa beans from Ashanti Region', duration: 0, price: 5000, currencyCode: 'GHS', category: 'Agriculture', available: true, maxCapacityPerSlot: 1, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 'gh-s4', businessId: 'gh-3', name: 'Beachfront Massage', description: 'Relaxing massage at Labadi Beach', duration: 60, price: 450, currencyCode: 'GHS', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
  ],
  ZA: [
    { id: 'za-s1', businessId: 'za-1', name: 'Full Service & Oil Change', description: 'Complete service and oil change', duration: 120, price: 1200, currencyCode: 'ZAR', category: 'Automotive', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 'za-s2', businessId: 'za-2', name: 'Hair Colour & Style', description: 'Premium colour and styling', duration: 90, price: 800, currencyCode: 'ZAR', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  TZ: [
    { id: 'tz-s1', businessId: 'tz-1', name: 'Serengeti Safari (Full Day)', description: 'Full-day guided safari experience', duration: 0, price: 250000, currencyCode: 'TZS', category: 'Tourism', available: true, maxCapacityPerSlot: 10, paddingMinutes: 30, createdAt: '', updatedAt: '' },
  ],
  UG: [
    { id: 'ug-s1', businessId: 'ug-1', name: 'Same-Day City Delivery', description: 'Door-to-door same-day courier', duration: 120, price: 15000, currencyCode: 'UGX', category: 'Transportation', available: true, maxCapacityPerSlot: 10, paddingMinutes: 5, createdAt: '', updatedAt: '' },
  ],
  MW: [
    { id: 'mw-s1', businessId: 'mw-1', name: 'Farm Advisory Visit', description: 'On-site crop advisory', duration: 120, price: 20000, currencyCode: 'MWK', category: 'Agriculture', available: true, maxCapacityPerSlot: 5, paddingMinutes: 10, createdAt: '', updatedAt: '' },
  ],
  EG: [
    { id: 'eg-s1', businessId: 'eg-1', name: 'Property Valuation', description: 'Full property valuation report', duration: 120, price: 1500, currencyCode: 'EGP', category: 'Real Estate', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  US: [
    { id: 'us-s1', businessId: 'us-1', name: 'Signature Fade & Beard', description: 'Premium fade with beard sculpt', duration: 60, price: 65, currencyCode: 'USD', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 4, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'us-s2', businessId: 'us-2', name: 'Luxury Couples Massage', description: 'Side-by-side massage experience', duration: 90, price: 240, currencyCode: 'USD', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 20, createdAt: '', updatedAt: '' },
    { id: 'us-s3', businessId: 'us-3', name: 'Chef\u2019s Tasting Menu', description: 'Multi-course tasting experience', duration: 120, price: 95, currencyCode: 'USD', category: 'Food & Dining', available: true, maxCapacityPerSlot: 20, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  GB: [
    { id: 'gb-s1', businessId: 'gb-1', name: 'Business Legal Consultation', description: '60-minute legal consultation', duration: 60, price: 250, currencyCode: 'GBP', category: 'Legal & Financial', available: true, maxCapacityPerSlot: 4, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'gb-s2', businessId: 'gb-2', name: 'Cut & Finish', description: 'Consultation, cut and finish', duration: 60, price: 55, currencyCode: 'GBP', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 4, paddingMinutes: 10, createdAt: '', updatedAt: '' },
  ],
  IN: [
    { id: 'in-s1', businessId: 'in-1', name: 'Web Development Package', description: 'Custom website build', duration: 0, price: 50000, currencyCode: 'INR', category: 'Technology', available: true, maxCapacityPerSlot: 2, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 'in-s2', businessId: 'in-2', name: 'Ayurvedic Massage', description: 'Traditional 60-min Ayurvedic massage', duration: 60, price: 2500, currencyCode: 'INR', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  AE: [
    { id: 'ae-s1', businessId: 'ae-1', name: 'Executive Grooming Package', description: 'Cut, facial, and grooming in VIP lounge', duration: 90, price: 250, currencyCode: 'AED', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  FR: [
    { id: 'fr-s1', businessId: 'fr-1', name: 'Coupe & Coiffage', description: 'Cut and styling by master stylist', duration: 60, price: 65, currencyCode: 'EUR', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 4, paddingMinutes: 10, createdAt: '', updatedAt: '' },
  ],
  DE: [
    { id: 'de-s1', businessId: 'de-1', name: 'Inspektion (HU/AU)', description: 'Full vehicle inspection', duration: 120, price: 120, currencyCode: 'EUR', category: 'Automotive', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  BR: [
    { id: 'br-s1', businessId: 'br-1', name: 'Massagem Relaxante', description: 'Relaxing massage treatment', duration: 60, price: 180, currencyCode: 'BRL', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
}
