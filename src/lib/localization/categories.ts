/**
 * Canonical AfriBook category taxonomy.
 *
 * This module is the single source of truth for:
 *  - Business / provider categories offered during registration & onboarding
 *  - Event categories allowed on the platform
 *  - Categories that are explicitly PROHIBITED (e.g. Yoga / New Age / violent events)
 *
 * Both the UI (registration, event creation) and the content-moderation layer
 * read from here so the allowed surface stays consistent and auditable.
 */

// ─── Business / Provider Categories ─────────────────────────────
//
// The platform is a personal-care & lifestyle marketplace. The following
// provider categories are explicitly supported, including the beauty &
// grooming trades requested by the business:
//   Barber, Spa, Photographer, Cosmetician, Beauty Salon.
//
// NOTE: Yoga, New Age / spirituality services and any "wellness" practices
// marketed as such are intentionally NOT offered as provider categories.

export const BUSINESS_CATEGORIES: string[] = [
  'Home Services',
  'Healthcare',
  'Education',
  'Technology',
  'Food & Dining',
  'Beauty & Wellness',
  'Automotive',
  'Legal & Financial',
  'Real Estate',
  'Entertainment',
  // ── Explicitly supported personal-care / grooming providers ──
  'Barber',
  'Spa',
  'Photographer',
  'Cosmetician',
  'Beauty Salon',
  // ── Phase 2 mobile & media providers ──
  'Videographer',
  'Mobile Carwash',
  'Mobile Barber',
];

/** Grooming & beauty providers explicitly called out in the product spec. */
export const BEAUTY_PROVIDER_SUBCATEGORIES: string[] = [
  'Barber',
  'Spa',
  'Photographer',
  'Cosmetician',
  'Beauty Salon',
  'Videographer',
  'Mobile Carwash',
  'Mobile Barber',
];

// ─── Event Categories ───────────────────────────────────────────
//
// Events that may be organised on AfriBook. Yoga, New Age and violent events
// are deliberately excluded (see PROHIBITED_EVENT_CATEGORIES).

export const EVENT_CATEGORIES: string[] = [
  'Conference',
  'Concert',
  'Festival',
  'Workshop',
  'Seminar',
  'Wedding',
  'Birthday',
  'Party',
  'Corporate',
  'Charity',
  'Sports',
  'Networking',
  'Food & Drink',
  'Arts',
  'Technology',
  'Music',
  'Fashion',
  'Health',
  'Education',
  'Other',
];

/**
 * Categories that must NEVER be permitted on the platform. Any attempt to
 * register a business or publish an event under one of these is blocked by the
 * moderation layer.
 */
export const PROHIBITED_EVENT_CATEGORIES: string[] = [
  'Yoga',
  'New Age',
  'New Age Event',
  'Violence',
  'Fight Club',
  'Gambling',
];

// ─── Validation helpers ─────────────────────────────────────────

export function isAllowedBusinessCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return BUSINESS_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase());
}

export function isAllowedEventCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  if (PROHIBITED_EVENT_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase())) {
    return false;
  }
  return EVENT_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase());
}

export function isProhibitedEventCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return PROHIBITED_EVENT_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase());
}
