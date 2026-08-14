// ─────────────────────────────────────────────────────────────
// Recommendations — core types.
//
// Featured, Popular, Recommended and Sponsored are FOUR DISTINCT
// concepts. A listing may carry several, but they are never
// conflated:
//
//   • FEATURED    — editorial/organic selection (quality signals)
//   • POPULAR     — derived from real booking/order/review volume
//   • RECOMMENDED — personalized from the user's own behavior
//   • SPONSORED   — paid placement, always labelled as such
//
// Every recommendation carries an explainable reason so the UI
// can answer "Why am I seeing this?" without exposing personal
// data or fabricating social proof.
// ─────────────────────────────────────────────────────────────

export type RecommendationType =
  | 'featured'
  | 'popular'
  | 'recommended'
  | 'sponsored'
  | 'top_rated'
  | 'local_favorite'
  | 'trending'
  | 'new_and_noteworthy'
  | 'best_value'

export type RecommendationTone =
  | 'amber'
  | 'emerald'
  | 'blue'
  | 'purple'
  | 'neutral'

export interface RecommendationReason {
  type: RecommendationType
  /** Short badge text, e.g. "Popular in Nairobi". */
  label: string
  /** Long explanation for the "Why am I seeing this?" popover. */
  why: string
  tone: RecommendationTone
}

/** Signals used by the engine to rank a single listing. */
export interface ListingSignals {
  id: string
  name: string
  city: string
  countryCode: string
  rating: number
  reviewCount: number
  /** Lowest available price, in the listing's currency. */
  price: number
  /** Editorial / organic quality pick. */
  isFeatured?: boolean
  /** Paid placement. Must always be surfaced as SPONSORED. */
  isSponsored?: boolean
  /** Rough age of the listing; recent listings can be NEW & NOTEWORTHY. */
  daysSinceCreated?: number
  category?: string
  tags?: string[]
}

/** Per-user, per-context signals for personalization. */
export interface RecommendationContext {
  countryCode: string
  city?: string
  userId?: string
  /** Cities the user previously booked/stayed in. */
  previouslyBookedCities?: string[]
  /** Categories the user previously booked/ordered. */
  previouslyBookedCategories?: string[]
  /** IDs the user has viewed recently. */
  recentlyViewedIds?: string[]
  /** Budget buckets the user typically picks. */
  pricePreference?: 'budget' | 'mid' | 'premium'
}

/** Statically define the display metadata for each type. */
export const RECOMMENDATION_META: Record<
  RecommendationType,
  { label: string; tone: RecommendationTone }
> = {
  featured: { label: 'Featured', tone: 'amber' },
  popular: { label: 'Popular', tone: 'emerald' },
  recommended: { label: 'Recommended for you', tone: 'blue' },
  sponsored: { label: 'Sponsored', tone: 'neutral' },
  top_rated: { label: 'Top rated', tone: 'emerald' },
  local_favorite: { label: 'Local favorite', tone: 'emerald' },
  trending: { label: 'Trending', tone: 'purple' },
  new_and_noteworthy: { label: 'New & noteworthy', tone: 'blue' },
  best_value: { label: 'Best value', tone: 'emerald' },
}
