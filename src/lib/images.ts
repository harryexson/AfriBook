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

function bucketFor(category?: string): string {
  if (!category) return 'generic'
  const direct = category.toLowerCase().trim()
  if (CATEGORY_PHOTOS[direct]) return direct
  for (const [pattern, bucket] of CATEGORY_MATCHERS) {
    if (pattern.test(category)) return bucket
  }
  return 'generic'
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
  { width = 800, ratio = 0.66 }: { width?: number; ratio?: number } = {},
): string {
  if (existing) return existing

  const bundled = CUISINE_ASSETS.find(([pattern]) => category && pattern.test(category))
  if (bundled) return bundled[1]

  const pool = CATEGORY_PHOTOS[bucketFor(category)] ?? CATEGORY_PHOTOS.generic
  const photo = pool[hash(id) % pool.length]
  const w = Math.round(width * 2)
  const h = Math.round(width * ratio * 2)
  return `${UNSPLASH}${photo}?w=${w}&h=${h}&q=80&auto=format&fit=crop`
}
