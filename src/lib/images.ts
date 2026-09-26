/**
 * Web counterpart to mobile/src/lib/images.ts.
 *
 * Same resolution order, same category matching, same deterministic choice —
 * so a business that shows a given photo in the app shows a comparable one on
 * the site instead of the two platforms drifting apart. The generated cuisine
 * set is the one committed under public/food, mirrored from the app's bundled
 * assets.
 *
 * These are art-directed placeholders, not claims about a specific venue. A
 * real uploaded asset always wins.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-'

/** Generated set, served from public/. Mirrors mobile's bundled assets. */
const CUISINE_ASSETS: Array<[RegExp, string]> = [
  [/local|jollof|nigerian|african|traditional/i, '/food/local.jpg'],
  [/grill|bbq|suya|skewer|barbec/i, '/food/grill.jpg'],
  [/street/i, '/food/streetfood.jpg'],
  [/seafood|fish/i, '/food/seafood.jpg'],
  [/caf|coffee|breakfast|bakery|dessert/i, '/food/cafe.jpg'],
  [/continental|european|fine/i, '/food/continental.jpg'],
]

/**
 * Committed people photography, served from public/. Mirrors mobile's bundled
 * set, and takes priority over the stock pools below.
 *
 * These are the service verticals where the person doing the work *is* the
 * product — someone choosing a barber is choosing a person, not a storefront —
 * so they get art-directed assets rather than stock that drifts toward
 * airbrushed studio work. The direction is candid and in-context: a real
 * working moment, in the kind of room the work actually happens in, lit by a
 * window rather than a softbox.
 *
 * They depict no real or identifiable individual, and are art direction rather
 * than evidence about any particular vendor — a vendor's own upload always wins.
 */
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

/**
 * Subject matchers, checked before the hash.
 *
 * The stock pools are interchangeable within a bucket, so hashing across them
 * is fine. These are not: a barbershop, a braiding salon and a massage room
 * are three different rooms, and `beauty` holds one photo of each. Hashing
 * alone put a spa treatment table on "Victory Barbers". So read whatever text
 * we have — usually the business name, since the category is often just
 * "Beauty & Wellness" and the actual trade shows up in the name — and fall
 * back to the hash only when it says nothing useful.
 */
const PEOPLE_SUBJECTS: Array<[RegExp, string]> = [
  [/barber|fade|grooming|shave/i, '/people/barber.jpg'],
  [/salon|hair|braid|nail|lash|makeup|cosmet|stylist|beauty/i, '/people/salon.jpg'],
  [/spa|massage|wellness|therap|skin/i, '/people/spa.jpg'],
]

const CATEGORY_PHOTOS: Record<string, string[]> = {
  food: [
    '1504674900247-0877df9cc836',
    '1546069901-ba9599a7e63c',
    '1565299624946-b28f40a0ae38',
    '1568901346375-23c9450c58cd',
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

const CATEGORY_MATCHERS: Array<[RegExp, string]> = [
  [/food|dining|restaurant|kitchen|cuisine|bistro/i, 'food'],
  [/hotel|stay|lodge|resort|apartment|guest/i, 'stays'],
  [/beauty|salon|spa|barber|wellness|cosmetic|nail|hair|massage/i, 'beauty'],
  [/home|clean|repair|plumb|electric|handy|carpent|paint/i, 'home'],
  [/auto|car|vehicle|mechanic|carwash/i, 'automotive'],
  [/tech|software|computer|digital|web/i, 'technology'],
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

/**
 * Which vertical a free-text category string belongs to. Exported because
 * it doubles as the one classifier other business-type-aware UI (which tabs
 * a business page shows, what its accent treatment looks like) should read
 * from, rather than each surface inventing its own category matching.
 */
export function bucketFor(category?: string): string {
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
/** Stable hash so a record keeps its photo instead of reshuffling per render. */
function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * Resolve an image URL: real uploaded asset, then the generated cuisine set,
 * then category stock.
 */
export function imageFor(
  id: string,
  category?: string,
  existing?: string | null,
  {
    width = 800,
    ratio = 0.66,
    subject,
  }: { width?: number; ratio?: number; subject?: string } = {},
): string {
  if (existing) return existing

  const bundled = CUISINE_ASSETS.find(([pattern]) => category && pattern.test(category))
  if (bundled) return bundled[1]

  const bucket = bucketFor(category)

  // Committed people photography beats stock for the service verticals it
  // covers. Prefer a subject match on the caller-supplied text (the business
  // name), then fall back to the hash, which keeps a business on one photo
  // across renders instead of reshuffling per list refresh.
  const people = PEOPLE_ASSETS[bucket]
  if (people) {
    // Name before category, and deliberately so: 'Beauty & Wellness' is the
    // category on barbershops, salons and spas alike, so letting it match
    // would drag every one of them onto the same photo. The name is the
    // specific signal; the category is only a last resort before the hash.
    const matched = matchSubject(subject, people) ?? matchSubject(category, people)
    return matched ?? people[hash(id) % people.length]
  }

  const pool = CATEGORY_PHOTOS[bucket] ?? CATEGORY_PHOTOS.generic
  const photo = pool[hash(id) % pool.length]
  const w = Math.round(width * 2)
  const h = Math.round(width * ratio * 2)
  return `${UNSPLASH}${photo}?w=${w}&h=${h}&q=80&auto=format&fit=crop`
}

/**
 * A small gallery for a business: real uploaded photos first, otherwise a
 * category-appropriate set from the same pools `imageFor` draws from.
 *
 * This exists because the business detail page's hero carousel used to keep
 * its own separate, hand-maintained category → photo map — incomplete (no
 * entry for Automotive, Logistics, Fashion, Agriculture, Legal, Real Estate,
 * Rides...) and its "fallback" for anything missing was, verbatim, the Food &
 * Dining photo set. An automotive shop with no exact category match rendered
 * a hero banner of vegetables. Routing the gallery through the one resolver
 * everything else already uses closes that gap and keeps every surface
 * (cards, dialogs, hero galleries) agreeing on what a category looks like.
 */
export function galleryFor(
  id: string,
  category: string | undefined,
  existingUrls: string[] | undefined,
  count = 4,
): string[] {
  if (existingUrls && existingUrls.length > 0) return existingUrls

  const bundled = CUISINE_ASSETS.find(([pattern]) => category && pattern.test(category))
  if (bundled) return [bundled[1]]

  const bucket = bucketFor(category)

  const people = PEOPLE_ASSETS[bucket]
  if (people) return people

  const pool = CATEGORY_PHOTOS[bucket] ?? CATEGORY_PHOTOS.generic
  // Rotate the pool by id so different businesses in the same category don't
  // all open on the same lead photo, same trick imageFor uses via hash().
  const offset = hash(id) % pool.length
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, count)
  return rotated.map(
    (photo) => `${UNSPLASH}${photo}?w=1600&h=1056&q=80&auto=format&fit=crop`,
  )
}
