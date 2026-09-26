/**
 * Category-representative placeholder photography.
 *
 * The design direction is photography-led: colour in the UI comes from images,
 * not from tinted surfaces (see design-system/afribook/MASTER.md). Most
 * businesses in the catalogue have no uploaded imagery yet, and the previous
 * fallback — a grey box with an initial — is what made the app read as an
 * unfinished MVP.
 *
 * So: always prefer a real uploaded asset, and fall back to an art-directed
 * stock photo chosen by category. Selection is deterministic (hashed on the
 * entity id) so a given business keeps the same image between renders and
 * sessions rather than flickering to a new one on every list refresh.
 *
 * These are placeholders, not claims about a specific venue. Replace them as
 * vendors upload real media.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-';

/**
 * Bundled cuisine photography, generated for AfriBook and committed to the
 * repo (mobile/assets/food, mirrored into the web app's public/food).
 *
 * These exist because the stock fallback below is overwhelmingly Western —
 * a Nigerian grill house was rendering a steak-and-avocado flat lay. These
 * are the actual cuisines the catalogue reports, shot consistently: same
 * top-down framing, daylight and warm neutral surface, so a list of them
 * reads as one set rather than scraped stock.
 *
 * Bundled rather than hotlinked so they survive independently of the
 * service that produced them, and load with no network round trip.
 */
const CUISINE_ASSETS: Array<[RegExp, number]> = [
  [/local|jollof|nigerian|african|traditional/i, require('../../assets/food/local.jpg')],
  [/grill|bbq|suya|skewer|barbec/i, require('../../assets/food/grill.jpg')],
  [/street/i, require('../../assets/food/streetfood.jpg')],
  [/seafood|fish/i, require('../../assets/food/seafood.jpg')],
  [/caf|coffee|breakfast|bakery|dessert/i, require('../../assets/food/cafe.jpg')],
  [/continental|european|fine/i, require('../../assets/food/continental.jpg')],
];

/**
 * Bundled asset for a cuisine, or null to fall through to stock. Returns a
 * module id, so callers pass it straight to <Image source={...}> rather than
 * wrapping it in a uri object.
 */
export function cuisineAsset(cuisine?: string): number | null {
  if (!cuisine) return null;
  const match = CUISINE_ASSETS.find(([pattern]) => pattern.test(cuisine));
  return match ? match[1] : null;
}

/**
 * Bundled people photography, mirrored into the web app's public/people.
 *
 * Same reasoning as the cuisine set, applied to the service verticals where
 * the person doing the work *is* the product: choosing a barber means choosing
 * a person, and the stock pools resolve those to airbrushed studio work that
 * looks nothing like the shops in this catalogue. Shot to one brief — a real
 * working moment, in the room the work happens in, lit by a window.
 *
 * They depict no real or identifiable individual, and are art direction rather
 * than evidence about any particular vendor. A vendor's upload always wins.
 */
const PEOPLE_ASSETS: Record<string, number[]> = {
  beauty: [
    require('../../assets/people/barber.jpg'),
    require('../../assets/people/salon.jpg'),
    require('../../assets/people/spa.jpg'),
  ],
  home: [require('../../assets/people/cleaning.jpg')],
  events: [require('../../assets/people/photography.jpg')],
  rides: [require('../../assets/people/rides.jpg')],
  fashion: [require('../../assets/people/tailoring.jpg')],
  automotive: [require('../../assets/people/automotive.jpg')],
  logistics: [require('../../assets/people/logistics.jpg')],
  generic: [require('../../assets/people/community.jpg')],
};

/**
 * Subject matchers, checked before the hash.
 *
 * The stock pools are interchangeable within a bucket, so hashing across them
 * is fine. These are not: a barbershop, a braiding salon and a massage room
 * are three different rooms, and `beauty` holds one photo of each. Hashing
 * alone put a spa treatment table on a barbershop. So read whatever text we
 * have — usually the business name, since the category is often just
 * "Beauty & Wellness" and the actual trade shows up in the name — and fall
 * back to the hash only when it says nothing useful.
 */
const PEOPLE_SUBJECTS: Array<[RegExp, number]> = [
  [/barber|fade|grooming|shave/i, require('../../assets/people/barber.jpg')],
  [/salon|hair|braid|nail|lash|makeup|cosmet|stylist|beauty/i, require('../../assets/people/salon.jpg')],
  [/spa|massage|wellness|therap|skin/i, require('../../assets/people/spa.jpg')],
];

/**
 * Bundled people photo for a category, or null to fall through to stock.
 * Prefers a subject match on `subject` (the business name); otherwise hashes
 * on the entity id, which keeps a business on one photo across renders.
 */
export function peopleAsset(
  id: string,
  category?: string,
  subject?: string,
): number | null {
  const pool = PEOPLE_ASSETS[bucketFor(category)];
  if (!pool) return null;

  // Name before category, and deliberately so: 'Beauty & Wellness' is the
  // category on barbershops, salons and spas alike, so letting it match would
  // drag every one of them onto the same photo. The name is the specific
  // signal; the category is only a last resort before the hash.
  const matched = matchSubject(subject, pool) ?? matchSubject(category, pool);
  return matched ?? pool[hash(id) % pool.length];
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
  stays: [
    '1566073771259-6a8506099945',
    '1571003123894-1f0594d2b5d9',
    '1618773928121-c32242e63f39',
  ],
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
};

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
];

function bucketFor(category?: string): string {
  if (!category) return 'generic';
  // A caller may pass a bucket name directly (the home screen names its
  // verticals 'food', 'rides', 'stays'…). Honour that before falling back to
  // fuzzy matching, or 'food' misses every pattern and lands on 'generic'.
  const direct = category.toLowerCase().trim();
  if (CATEGORY_PHOTOS[direct]) return direct;

  for (const [pattern, bucket] of CATEGORY_MATCHERS) {
    if (pattern.test(category)) return bucket;
  }
  return 'generic';
}

function matchSubject(text: string | undefined, pool: number[]): number | undefined {
  if (!text) return undefined;
  return PEOPLE_SUBJECTS.find(
    ([pattern, asset]) => pool.includes(asset) && pattern.test(text),
  )?.[1];
}
/** Small stable string hash — keeps a given id on a given photo. */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface PhotoOptions {
  /** Rendered width in px; the CDN resizes and we request 2x for retina. */
  width?: number;
  /** Aspect ratio as height/width. 1 for the circular thumbnails. */
  ratio?: number;
  /** Free text (usually the business name) used to pick among
   *  subject-specific bundled photos — see PEOPLE_SUBJECTS. */
  subject?: string;
}

/**
 * Resolve an image for an entity. `existing` wins whenever a vendor has
 * actually uploaded something.
 */
export function photoFor(
  id: string,
  category?: string,
  existing?: string | null,
  options: PhotoOptions = {},
): string {
  if (existing) return existing;

  const { width = 800, ratio = 0.66 } = options;
  const pool = CATEGORY_PHOTOS[bucketFor(category)] ?? CATEGORY_PHOTOS.generic;
  const photo = pool[hash(id) % pool.length];
  const w = Math.round(width * 2);
  const h = Math.round(width * ratio * 2);

  return `${UNSPLASH}${photo}?w=${w}&h=${h}&q=80&auto=format&fit=crop`;
}

/**
 * The one thing screens should call for a photo: prefers a real uploaded
 * asset, then the bundled cuisine set, then stock. Returns something you can
 * hand straight to <Image source={...}>.
 */
export function imageSourceFor(
  id: string,
  category?: string,
  existing?: string | null,
  options: PhotoOptions = {},
): { uri: string } | number {
  if (existing) return { uri: existing };
  const bundled = cuisineAsset(category);
  if (bundled) return bundled;
  const people = peopleAsset(id, category, options.subject);
  if (people) return people;
  return { uri: photoFor(id, category, null, options) };
}

/** Square crop, for the circular category and dish thumbnails. */
export function squarePhotoFor(
  id: string,
  category?: string,
  existing?: string | null,
  size = 160,
): string {
  return photoFor(id, category, existing, { width: size, ratio: 1 });
}

// Menu items are always food, but their *menu category* ("Mains", "Small
// Plates") carries no visual meaning — matching on it lands everything in the
// generic pool. Match on the dish name instead so a veggie bowl looks like a
// veggie bowl.
const DISH_MATCHERS: Array<[RegExp, string]> = [
  [/salad|veg|bowl|greens/i, '1512621776951-a57141f2eefd'],
  [/pizza/i, '1565299624946-b28f40a0ae38'],
  // Fish before burger: "Fish & Chips" would otherwise match on "chips".
  [/fish|seafood|prawn|shrimp|tilapia/i, '1504674900247-0877df9cc836'],
  [/burger|sandwich|chips|fries/i, '1568901346375-23c9450c58cd'],
  [/grill|bbq|skewer|suya|chicken|beef|steak|meat|kebab/i, '1555939594-58d7cb561ad1'],
  [/soup|stew|curry|rice|ugali|jollof|noodle|pasta/i, '1504674900247-0877df9cc836'],
  [/tea|water|juice|coffee|drink|soda|smoothie/i, '1546069901-ba9599a7e63c'],
];

/** Square thumbnail for a menu item, chosen from the dish name. */
export function dishPhotoFor(
  id: string,
  dishName: string,
  existing?: string | null,
  size = 160,
): string {
  if (existing) return existing;

  const match = DISH_MATCHERS.find(([pattern]) => pattern.test(dishName));
  const photo = match
    ? match[1]
    : CATEGORY_PHOTOS.food[hash(id) % CATEGORY_PHOTOS.food.length];
  const px = Math.round(size * 2);

  return `${UNSPLASH}${photo}?w=${px}&h=${px}&q=80&auto=format&fit=crop`;
}
