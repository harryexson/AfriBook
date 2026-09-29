/**
 * Category-representative placeholder photography — web counterpart of
 * mobile/src/lib/images.ts. Same bundled assets (public/food, public/people,
 * mirrored from mobile/assets), same Unsplash stock pool, same deterministic
 * hash-on-id selection, so a given restaurant/business shows the same photo
 * on web and mobile. Kept in sync deliberately; port changes to both.
 *
 * Always prefer a real uploaded asset (`existing`), then a bundled
 * cuisine/people photo, then hashed stock. These are placeholders, not
 * claims about a specific venue — replace them as vendors upload real media.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-'

/** Bundled cuisine photography in public/food, shared with the mobile app. */
const CUISINE_ASSETS: Array<[RegExp, string]> = [
  [/local|jollof|nigerian|african|traditional/i, '/food/local.jpg'],
  [/grill|bbq|suya|skewer|barbec/i, '/food/grill.jpg'],
  [/street/i, '/food/streetfood.jpg'],
  [/seafood|fish/i, '/food/seafood.jpg'],
  [/caf|coffee|breakfast|bakery|dessert/i, '/food/cafe.jpg'],
  [/continental|european|fine/i, '/food/continental.jpg'],
]

export function cuisineAsset(cuisine?: string): string | null {
  if (!cuisine) return null
  const match = CUISINE_ASSETS.find(([pattern]) => pattern.test(cuisine))
  return match ? match[1] : null
}

/** Bundled people photography in public/people, shared with the mobile app. */
const PEOPLE_ASSETS: Record<string, string[]> = {
  beauty: ['/people/barber.jpg', '/people/salon.jpg', '/people/spa.jpg'],
  home: ['/people/cleaning.jpg'],
  events: ['/people/photography.jpg'],
  rides: ['/people/rides.jpg'],
  fashion: ['/people/tailoring.jpg'],
  automotive: ['/people/automotive.jpg'],
  logistics: ['/people/logistics.jpg'],
  generic: ['/people/community.jpg'],
}

const PEOPLE_SUBJECTS: Array<[RegExp, string]> = [
  [/barber|fade|grooming|shave/i, '/people/barber.jpg'],
  [/salon|hair|braid|nail|lash|makeup|cosmet|stylist|beauty/i, '/people/salon.jpg'],
  [/spa|massage|wellness|therap|skin/i, '/people/spa.jpg'],
]

export function peopleAsset(id: string, category?: string, subject?: string): string | null {
  const pool = PEOPLE_ASSETS[bucketFor(category)]
  if (!pool) return null
  const matched = matchSubject(subject, pool) ?? matchSubject(category, pool)
  return matched ?? pool[hash(id) % pool.length]
}

// Curated per category. Multiple options per bucket so a list of same-category
// businesses doesn't render as a wall of identical photos.
const CATEGORY_PHOTOS: Record<string, string[]> = {
  food: [
    '1504674900247-0877df9cc836',
    '1546069901-ba9599a7e63c',
    '1565299624946-b28f40a0ae38',
    '1568901346375-23c9450c58cd',
    '1555939594-58d7cb561ad1',
    '1512621776951-a57141f2eefd',
  ],
  restaurant: [
    '1414235077428-338989a2e8c0',
    '1517248135467-4c7edcad34c4',
    '1552566626-52f8b828add9',
  ],
  stays: ['1566073771259-6a8506099945', '1571003123894-1f0594d2b5d9', '1618773928121-c32242e63f39'],
  beauty: [
    '1503951914875-452162b0f3f1',
    '1560066984-138dadb4c035',
    '1522337360788-8b13dee7a37e',
    '1540555700478-4be289fbecef',
  ],
  home: ['1581578731548-c64695cc6952', '1504148455328-c376907d081c', '1621905251189-08b45d6a269e'],
  automotive: ['1487754180451-c456f719a1fc', '1492144534655-ae79c964c9d7'],
  technology: ['1519389950473-47ba0277781c', '1518770660439-4636190af475'],
  education: ['1503676260728-1c00da094a0b'],
  healthcare: ['1576091160399-112ba8d25d1d'],
  events: ['1511795409834-ef04bbd61622', '1464366400600-7168b8af9bc3'],
  rides: ['1449965408869-eaa3f722e40d'],
  fashion: ['1556905055-8f358a7a47b2'],
  agriculture: ['1500382017468-9049fed747ef'],
  realestate: ['1560518883-ce09059eeffa'],
  legal: ['1589829545856-d10d557cf95f'],
  logistics: ['1566576912321-d58ddd7a6088'],
  generic: ['1441986300917-64674bd600d8', '1556742049-0cfed4f6a45d'],
}

// Free-text category/cuisine values are matched by substring, since the
// catalogue's category strings are not a closed enum.
const CATEGORY_MATCHERS: Array<[RegExp, string]> = [
  [/pizza|burger|grill|bbq|kitchen|street food|local|cuisine|dining|bistro|caf|coffee|bakery|dessert/i, 'food'],
  [/restaurant|seafood|continental|asian|chinese|italian|indian/i, 'restaurant'],
  [/hotel|stay|lodge|resort|apartment|guest/i, 'stays'],
  [/beauty|salon|spa|barber|wellness|cosmetic|nail|hair|massage/i, 'beauty'],
  [/home|clean|repair|plumb|electric|handy|carpent|paint/i, 'home'],
  [/auto|car|vehicle|mechanic|carwash/i, 'automotive'],
  [/tech|software|it |computer|digital|web/i, 'technology'],
  [/education|tutor|school|learn|training|class/i, 'education'],
  [/health|medical|clinic|doctor|dental|pharmac/i, 'healthcare'],
  [/event|party|wedding|celebrat|entertain|music|photograph|video/i, 'events'],
  [/ride|taxi|transport|driver/i, 'rides'],
  [/fashion|tailor|cloth|apparel|style/i, 'fashion'],
  [/agricultur|farm|produce/i, 'agriculture'],
  [/real estate|property|housing/i, 'realestate'],
  [/legal|financ|law|account|insur/i, 'legal'],
  [/logistic|delivery|freight|courier|shipping/i, 'logistics'],
]

function bucketFor(category?: string): string {
  if (!category) return 'generic'
  const direct = category.toLowerCase().trim()
  if (CATEGORY_PHOTOS[direct]) return direct
  for (const [pattern, bucket] of CATEGORY_MATCHERS) {
    if (pattern.test(category)) return bucket
  }
  return 'generic'
}

function matchSubject(text: string | undefined, pool: string[]): string | undefined {
  if (!text) return undefined
  return PEOPLE_SUBJECTS.find(([pattern, asset]) => pool.includes(asset) && pattern.test(text))?.[1]
}

/** Small stable string hash — keeps a given id on a given photo. */
function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export interface PhotoOptions {
  /** Rendered width in px; the CDN resizes and we request 2x for retina. */
  width?: number
  /** Aspect ratio as height/width. 1 for square thumbnails. */
  ratio?: number
  /** Free text (usually the business name), used to pick among
   *  subject-specific bundled photos — see PEOPLE_SUBJECTS. */
  subject?: string
}

/** Resolve a stock Unsplash URL for an entity (never bundled assets). */
export function photoFor(
  id: string,
  category?: string,
  existing?: string | null,
  options: PhotoOptions = {},
): string {
  if (existing) return existing
  const { width = 800, ratio = 0.66 } = options
  const pool = CATEGORY_PHOTOS[bucketFor(category)] ?? CATEGORY_PHOTOS.generic
  const photo = pool[hash(id) % pool.length]
  const w = Math.round(width * 2)
  const h = Math.round(width * ratio * 2)
  return `${UNSPLASH}${photo}?w=${w}&h=${h}&q=80&auto=format&fit=crop`
}

/**
 * The one thing callers should use for a photo: prefers a real uploaded
 * asset, then the bundled cuisine set, then bundled people photography,
 * then hashed stock.
 */
export function imageSourceFor(
  id: string,
  category?: string,
  existing?: string | null,
  options: PhotoOptions = {},
): string {
  if (existing) return existing
  const bundled = cuisineAsset(category)
  if (bundled) return bundled
  const people = peopleAsset(id, category, options.subject)
  if (people) return people
  return photoFor(id, category, null, options)
}

/** Square crop, for circular category/dish thumbnails. */
export function squarePhotoFor(
  id: string,
  category?: string,
  existing?: string | null,
  size = 160,
): string {
  return photoFor(id, category, existing, { width: size, ratio: 1 })
}

// Menu items are always food, but their *menu category* ("Mains", "Small
// Plates") carries no visual meaning — match on the dish name instead so a
// veggie bowl looks like a veggie bowl.
const DISH_MATCHERS: Array<[RegExp, string]> = [
  [/salad|veg|bowl|greens/i, '1512621776951-a57141f2eefd'],
  [/pizza/i, '1565299624946-b28f40a0ae38'],
  // Fish before burger: "Fish & Chips" would otherwise match on "chips".
  [/fish|seafood|prawn|shrimp|tilapia/i, '1504674900247-0877df9cc836'],
  [/burger|sandwich|chips|fries/i, '1568901346375-23c9450c58cd'],
  [/grill|bbq|skewer|suya|chicken|beef|steak|meat|kebab/i, '1555939594-58d7cb561ad1'],
  [/soup|stew|curry|rice|ugali|jollof|noodle|pasta/i, '1504674900247-0877df9cc836'],
  [/tea|water|juice|coffee|drink|soda|smoothie/i, '1546069901-ba9599a7e63c'],
]

/** Square thumbnail for a menu item, chosen from the dish name. */
export function dishPhotoFor(id: string, dishName: string, existing?: string | null, size = 160): string {
  if (existing) return existing
  const match = DISH_MATCHERS.find(([pattern]) => pattern.test(dishName))
  const photo = match ? match[1] : CATEGORY_PHOTOS.food[hash(id) % CATEGORY_PHOTOS.food.length]
  const px = Math.round(size * 2)
  return `${UNSPLASH}${photo}?w=${px}&h=${px}&q=80&auto=format&fit=crop`
}

/**
 * Direct Unsplash photo by id, for small hand-curated datasets (see
 * marketplace-listings.ts) whose subjects are too specific for the fixed
 * category pool above — a dhow cruise and a safari lodge are both "Travel",
 * but need different photos. `photoId` is the bare Unsplash id (the part
 * after "photo-" in the CDN URL).
 */
export function curatedPhotoFor(photoId: string, width = 800, height = 520): string {
  const w = width * 2
  const h = height * 2
  return `${UNSPLASH}${photoId}?w=${w}&h=${h}&q=80&auto=format&fit=crop`
}
