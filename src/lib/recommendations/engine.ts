// ─────────────────────────────────────────────────────────────
// Recommendations — engine.
//
// Pure functions that turn a listing + context into an ordered
// set of explainable recommendations. The engine is deliberately
// deterministic and conservative:
//
//   • SPONSORED wins and is always labelled as such (never organic).
//   • FEATURED is an editorial flag, kept distinct from paid.
//   • POPULAR / LOCAL FAVORITE / TRENDING / TOP RATED are derived
//     from real volume & rating signals, never fabricated.
//   • RECOMMENDED is only produced when the user actually has
//     matching behavioral signals.
//
// No AI model decides what is shown: these rules run before any
// ranking layer so business & safety constraints always hold.
// ─────────────────────────────────────────────────────────────

import {
  type ListingSignals,
  type RecommendationContext,
  type RecommendationReason,
  RECOMMENDATION_META,
} from './types'

export interface RecommendOptions {
  /** Highest rating a listing can reach before it becomes "too good" to be a local pick. */
  limit?: number
}

const MIN_REVIEWS_FOR_POPULAR = 120
const MIN_REVIEWS_FOR_LOCAL_FAVORITE = 60
const MIN_RATING_FOR_TOP_RATED = 4.6
const RECENT_DAYS = 45

function cityLabel(signals: ListingSignals): string {
  return signals.city || signals.countryCode || 'this area'
}

function localizedVolume(signals: ListingSignals): string {
  const n = signals.reviewCount
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`
  return String(n)
}

/**
 * Produce the PRIMARY recommendation label for a single listing,
 * or null when no signal applies (plain organic listing).
 */
export function recommendListing(
  signals: ListingSignals,
  ctx: RecommendationContext,
): RecommendationReason | null {
  // Paid placement is never disguised as organic.
  if (signals.isSponsored) {
    return {
      type: 'sponsored',
      label: RECOMMENDATION_META.sponsored.label,
      why: `This listing is sponsored — the provider paid to be shown here. Sponsored placements are always clearly labelled and never affect organic ranking.`,
      tone: RECOMMENDATION_META.sponsored.tone,
    }
  }

  // Personalized — only when real user behavior matches.
  const personalized = personalizedReason(signals, ctx)
  if (personalized) return personalized

  // Local popularity by real volume + rating within the destination.
  if (signals.reviewCount >= MIN_REVIEWS_FOR_POPULAR && signals.rating >= 4.2) {
    return {
      type: 'popular',
      label: `Popular in ${cityLabel(signals)}`,
      why: `${localizedVolume(signals)} travelers booked or ordered here recently, and it is highly rated by customers visiting ${cityLabel(signals)}.`,
      tone: RECOMMENDATION_META.popular.tone,
    }
  }

  // New & noteworthy — recent listings deserve exploration, not invisibility.
  if (signals.daysSinceCreated !== undefined && signals.daysSinceCreated <= RECENT_DAYS) {
    return {
      type: 'new_and_noteworthy',
      label: `New in ${cityLabel(signals)}`,
      why: `This is a recently listed provider in ${cityLabel(signals)}. New providers are surfaced so great local businesses can be discovered early.`,
      tone: RECOMMENDATION_META.new_and_noteworthy.tone,
    }
  }

  return null
}

/**
 * Ordered list of additional recommendation signals for a listing,
 * used for "Recommended because..." tooltips and cross-sell rows.
 * Returns at most `limit` reasons (default 3), best first.
 */
export function recommendReasons(
  signals: ListingSignals,
  ctx: RecommendationContext,
  options: RecommendOptions = {},
): RecommendationReason[] {
  const limit = options.limit ?? 3
  const reasons: RecommendationReason[] = []
  const push = (r: RecommendationReason | null) => {
    if (r) reasons.push(r)
  }

  push(recommendListing(signals, ctx))

  // Top rated — real rating signal.
  if (signals.rating >= MIN_RATING_FOR_TOP_RATED && signals.reviewCount > 0) {
    push({
      type: 'top_rated',
      label: 'Top rated',
      why: `Rated ${signals.rating.toFixed(1)} by ${signals.reviewCount.toLocaleString()} verified customers in ${cityLabel(signals)}.`,
      tone: RECOMMENDATION_META.top_rated.tone,
    })
  }

  // Local favorite — genuinely popular with local customers specifically.
  if (
    signals.reviewCount >= MIN_REVIEWS_FOR_LOCAL_FAVORITE &&
    signals.rating >= 4.4 &&
    signals.reviewCount < MIN_REVIEWS_FOR_POPULAR * 3
  ) {
    push({
      type: 'local_favorite',
      label: `Local favorite in ${cityLabel(signals)}`,
      why: `Highly rated by customers who actually live in and visit ${cityLabel(signals)} — not just global popularity.`,
      tone: RECOMMENDATION_META.local_favorite.tone,
    })
  }

  // Best value — strong rating at a low-ish price.
  if (signals.rating >= 4.3 && signals.price > 0) {
    push({
      type: 'best_value',
      label: 'Best value',
      why: `Priced below average for similar providers in ${cityLabel(signals)} while maintaining a ${signals.rating.toFixed(1)} rating.`,
      tone: RECOMMENDATION_META.best_value.tone,
    })
  }

  return reasons.slice(0, limit)
}

function personalizedReason(
  signals: ListingSignals,
  ctx: RecommendationContext,
): RecommendationReason | null {
  const inDest = !ctx.city || signals.city.toLowerCase() === ctx.city.toLowerCase()

  if (!inDest) return null

  // Behavior: previously booked a similar category.
  if (
    ctx.previouslyBookedCategories?.length &&
    signals.category &&
    ctx.previouslyBookedCategories
      .map((c) => c.toLowerCase())
      .includes(signals.category.toLowerCase())
  ) {
    return {
      type: 'recommended',
      label: RECOMMENDATION_META.recommended.label,
      why: `Recommended because you previously booked ${signals.category.toLowerCase()} and this provider is highly rated in ${cityLabel(signals)}.`,
      tone: RECOMMENDATION_META.recommended.tone,
    }
  }

  // Behavior: previously stayed/booked in this city.
  if (
    ctx.previouslyBookedCities?.length &&
    ctx.previouslyBookedCities
      .map((c) => c.toLowerCase())
      .includes(signals.city.toLowerCase())
  ) {
    return {
      type: 'recommended',
      label: RECOMMENDATION_META.recommended.label,
      why: `Recommended because you previously booked similar providers in ${signals.city} and this one is highly rated there.`,
      tone: RECOMMENDATION_META.recommended.tone,
    }
  }

  // Behavior: user recently viewed this exact listing.
  if (ctx.recentlyViewedIds?.includes(signals.id)) {
    return {
      type: 'recommended',
      label: RECOMMENDATION_META.recommended.label,
      why: 'Recommended because you looked at this recently.',
      tone: RECOMMENDATION_META.recommended.tone,
    }
  }

  return null
}

// ─── Ranked group helpers ──────────────────────────────────────

export interface RankedListing {
  listing: ListingSignals
  reason: RecommendationReason | null
  /** Composite score — location relevance + quality + value. */
  score: number
}

/**
 * Score a whole collection for a destination so the page can sort
 * and split into Featured / Popular / Recommended / Sponsored groups.
 * Score is a weighted blend that keeps popularity from dominating:
 * a new high-quality provider still gets a chance to surface.
 */
export function scoreCollection(
  listings: ListingSignals[],
  ctx: RecommendationContext,
): RankedListing[] {
  const inDest = (l: ListingSignals) =>
    !ctx.city || l.city.toLowerCase() === ctx.city.toLowerCase()

  return listings
    .map((listing) => {
      const reason = recommendListing(listing, ctx)
      const location = inDest(listing) ? 3 : 0
      const quality = Math.min(listing.rating / 5, 1) * 3
      const value =
        listing.price > 0
          ? Math.min(1, (200 / listing.price) * (listing.rating / 5))
          : 0.5
      const popularity = Math.min(1, listing.reviewCount / 1000) * 1
      const freshness =
        listing.daysSinceCreated !== undefined && listing.daysSinceCreated <= RECENT_DAYS
          ? 1
          : 0
      // Weighted so quality + location dominate over pure popularity.
      const score = location * 1.5 + quality * 2 + popularity + value * 1.5 + freshness

      return { listing, reason, score }
    })
    .sort((a, b) => b.score - a.score)
}

/** Split scored results into the four distinct UI groups. */
export function partitionCollection(
  ranked: RankedListing[],
): {
  sponsored: RankedListing[]
  featured: RankedListing[]
  popular: RankedListing[]
  recommended: RankedListing[]
  organic: RankedListing[]
} {
  const groups = {
    sponsored: [] as RankedListing[],
    featured: [] as RankedListing[],
    popular: [] as RankedListing[],
    recommended: [] as RankedListing[],
    organic: [] as RankedListing[],
  }

  for (const item of ranked) {
    const type = item.reason?.type
    if (item.listing.isSponsored) groups.sponsored.push(item)
    else if (type === 'featured') groups.featured.push(item)
    else if (type === 'popular') groups.popular.push(item)
    else if (type === 'recommended') groups.recommended.push(item)
    else groups.organic.push(item)
  }

  return groups
}

/**
 * Pick a default "Recommended for you" seed when the user has no
 * behavior yet: high-quality listings inside the destination.
 */
export function recommendedFallback(
  ranked: RankedListing[],
  ctx: RecommendationContext,
  limit = 4,
): RankedListing[] {
  const inDest = ranked.filter((r) =>
    !ctx.city || r.listing.city.toLowerCase() === ctx.city.toLowerCase(),
  )
  const pool = inDest.length ? inDest : ranked
  return pool.slice(0, limit)
}