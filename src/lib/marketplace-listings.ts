export interface MarketplaceListing {
  id: string
  title: string
  business: string
  category: string
  location: string
  flag: string
  rating: number
  reviewCount: number
  price: string
  cover: 'cover-amber' | 'cover-gold'
  verified?: boolean
  likes: number
  description: string
  highlights: string[]
}

export const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    id: 'm1', title: 'Handwoven Kente throws & decor', business: 'Accra Looms',
    category: 'Fashion', location: 'Accra, Ghana', flag: '🇬🇭',
    rating: 4.9, reviewCount: 312, price: 'GH₵ 480',
    cover: 'cover-amber', verified: true, likes: 1280,
    description: 'Authentic handwoven Kente throws, wall art and home decor crafted by master weavers in the Volta region. Every piece tells a story through colour and pattern.',
    highlights: ['Handwoven by master artisans', '100% cotton, chemical-free dyes', 'Ships across West Africa', 'Each piece is unique'],
  },
  {
    id: 'm2', title: 'Private dhow sunset cruise', business: 'Zanzibar Sails',
    category: 'Experiences', location: 'Zanzibar, TZ', flag: '🇹🇿',
    rating: 4.8, reviewCount: 204, price: '$62',
    cover: 'cover-gold', verified: true, likes: 890,
    description: 'Sail into the sunset aboard a traditional dhow, complete with Swahili tapas, fresh tropical fruit and live taarab music. Perfect for couples and small groups.',
    highlights: ['2.5 hour private cruise', 'Fresh seafood & fruit platter', 'Live taarab musicians', 'Sunset over Stone Town'],
  },
  {
    id: 'm3', title: 'Jollof catering for 50 guests', business: 'Lagos Kitchen',
    category: 'Food', location: 'Lagos, Nigeria', flag: '🇳🇬',
    rating: 4.7, reviewCount: 521, price: '₦ 85,000',
    cover: 'cover-amber', likes: 2103,
    description: 'Legendary party jollof, slow-cooked over wood fire, plus small chops, grilled chicken and drinks service for up to 50 guests. The highlight of any Lagos celebration.',
    highlights: ['Serves up to 50 guests', 'Wood-fired party jollof', 'Includes serving staff', 'Event setup & cleanup'],
  },
  {
    id: 'm4', title: 'Safari & lodge booking concierge', business: 'Savanna Stays',
    category: 'Travel', location: 'Nairobi, Kenya', flag: '🇰🇪',
    rating: 4.9, reviewCount: 178, price: 'KSh 24,000',
    cover: 'cover-gold', verified: true, likes: 1540,
    description: 'End-to-end safari planning across the Maasai Mara, Amboseli and Tsavo — lodge bookings, park permits, transfers and an expert guide who knows every watering hole.',
    highlights: ['Bespoke itinerary planning', 'All park fees included', '4x4 safari transfers', '24/7 concierge support'],
  },
  {
    id: 'm5', title: 'Bespoke Ankara suits', business: 'Dakar Atelier',
    category: 'Fashion', location: 'Dakar, Senegal', flag: '🇸🇳',
    rating: 4.8, reviewCount: 96, price: 'CFA 95,000',
    cover: 'cover-amber', likes: 640,
    description: 'Tailored Ankara suits and three-piece outfits cut to your measurements in Dakar. Two fittings, four-day turnaround, and finishing that rivals Savile Row.',
    highlights: ['Made to measure', '4-day turnaround', 'Two fittings included', 'Free alterations within 30 days'],
  },
  {
    id: 'm6', title: 'Smartphone repair & unlocking', business: 'Cairo Fix',
    category: 'Electronics', location: 'Cairo, Egypt', flag: '🇪🇬',
    rating: 4.6, reviewCount: 410, price: 'EGP 450',
    cover: 'cover-gold', verified: true, likes: 1120,
    description: 'Same-day screen replacement, battery swaps, water-damage recovery and carrier unlocking for all major brands — carried out by certified technicians with a 90-day warranty.',
    highlights: ['Same-day service', '90-day repair warranty', 'Original & high-grade parts', 'Pickup and drop-off available'],
  },
  {
    id: 'm7', title: 'Organic coffee bean subscription', business: 'Addis Roasters',
    category: 'Food', location: 'Addis Ababa, ET', flag: '🇪🇹',
    rating: 4.9, reviewCount: 264, price: 'Br 1,200',
    cover: 'cover-amber', likes: 980,
    description: 'Single-origin Ethiopian Yirgacheffe and Sidamo beans, roasted to order in small batches and delivered monthly. Choose whole bean or ground, light or dark roast.',
    highlights: ['Single-origin, shade-grown', 'Roasted to order', 'Flexible weekly/monthly plans', 'Free delivery nationwide'],
  },
  {
    id: 'm8', title: 'Braids & locs home studio', business: 'Joburg Glow',
    category: 'Beauty', location: 'Johannesburg, SA', flag: '🇿🇦',
    rating: 4.8, reviewCount: 333, price: 'R 650',
    cover: 'cover-gold', verified: true, likes: 1760,
    description: 'Box braids, knotless braids, crochet locs and protective styling from a private, fully-kitted home studio in Sandton. Premium hair included, gentle on your edges.',
    highlights: ['Knotless & classic box braids', 'Premium hair included', 'Private studio appointments', 'Style removal & care guidance'],
  },
]

export function getMarketplaceListing(id: string): MarketplaceListing | undefined {
  return MARKETPLACE_LISTINGS.find((l) => l.id === id)
}

/** All curated cross-border listings. This is intentionally a small,
 *  hand-curated showcase (not the per-country generated business/service
 *  system in countries-data.ts) — it has no countryCode/currency fields,
 *  so it isn't country-scoped the way search/business pages are. */
export function getAllListings(): MarketplaceListing[] {
  return MARKETPLACE_LISTINGS
}

export function getListingCategories(): string[] {
  return Array.from(new Set(MARKETPLACE_LISTINGS.map((l) => l.category))).sort()
}
