/**
 * Prohibited-content taxonomy for AfriBook's trust & safety layer.
 *
 * AfriBook is a personal-care / lifestyle marketplace. The following classes of
 * activity, product or event are STRICTLY PROHIBITED and must be detected,
 * flagged and blocked at registration, business onboarding and event
 * publishing:
 *
 *   - Sexual exploitation & sex sales (sex trafficking, sex-for-sale, escort /
 *     brothel services, pornography)
 *   - Child exploitation & child trafficking
 *   - Slavery, forced / bonded labour and human trafficking
 *   - Illegal / illicit drugs and narcotics trafficking
 *   - Violence-for-hire, weapons / explosives trafficking, fight clubs
 *   - Financial crime: money laundering, racketeering, loan sharking
 *   - Gambling products, services and events
 *   - Harassment, blackmail, extortion and exploitation
 *
 * The lists below are intentionally precise (whole phrases / unambiguous
 * tokens) to keep false-positives low, and are matched against a normalised,
 * obfuscation-resistant form of the input text (see moderate.ts).
 *
 * Words are matched after normalisation, so casing, diacritics, leetspeak and
 * common separators (dots, spaces, slashes) inside a word are handled.
 */

export type Severity = 'high' | 'medium';

export interface ProhibitedCategory {
  /** Stable id, also persisted in content_moderation_flags.category */
  id: string;
  /** Human readable label used in audit logs / admin UI */
  label: string;
  /** 'high' matches block the action; 'medium' matches are flagged only */
  severity: Severity;
  /** Exact phrases / tokens matched against normalised text */
  terms: string[];
}

export const PROHIBITED_CATEGORIES: ProhibitedCategory[] = [
  {
    id: 'sexual_exploitation',
    label: 'Sexual exploitation & sex sales',
    severity: 'high',
    terms: [
      'sex trafficking',
      'sex for sale',
      'sex for cash',
      'sexual services',
      'escort service',
      'escort agency',
      'escort girl',
      'call girl',
      'prostitute',
      'prostitution',
      'brothel',
      'pimp',
      'pimping',
      'sex sale',
      'sex-sales',
      'erotic massage',
      'nude massage',
      'pornography',
      'porno',
      'porn site',
      'adult content',
      'adult film',
      'sex tape',
      'onlyfans',
      'cam girl',
      'webcam sex',
    ],
  },
  {
    id: 'child_exploitation',
    label: 'Child exploitation & child trafficking',
    severity: 'high',
    terms: [
      'child trafficking',
      'minor trafficking',
      'child sex',
      'child porn',
      'child pornography',
      'minor porn',
      'underage',
      'jailbait',
      'cp material',
    ],
  },
  {
    id: 'human_trafficking_slavery',
    label: 'Slavery, forced labour & human trafficking',
    severity: 'high',
    terms: [
      'human trafficking',
      'people trafficking',
      'modern slavery',
      'forced labor',
      'forced labour',
      'slave labor',
      'slave labour',
      'bonded labor',
      'indentured labor',
      'child labor',
      'child labour',
      'slavery',
    ],
  },
  {
    id: 'illegal_drugs',
    label: 'Illegal & illicit drugs / narcotics',
    severity: 'high',
    terms: [
      'illicit drugs',
      'illegal drugs',
      'drug trafficking',
      'narcotics trafficking',
      'drug dealer',
      'sell cocaine',
      'buy cocaine',
      'cocaine for sale',
      'heroin for sale',
      'meth for sale',
      'methamphetamine',
      'fentanyl',
      'ecstasy pill',
      'mdma pill',
      'lsd tab',
      'pill press',
      'synthetic drug',
      'designer drug',
      'cannabis trafficking',
    ],
  },
  {
    id: 'violence',
    label: 'Violence, weapons & fight clubs',
    severity: 'high',
    terms: [
      'hitman',
      'hit man',
      'murder for hire',
      'assassination service',
      'gun for hire',
      'weapon trafficking',
      'arms trafficking',
      'explosives for sale',
      'bomb making',
      'violent event',
      'fight club',
    ],
  },
  {
    id: 'financial_crime',
    label: 'Financial crime (laundering, racketeering)',
    severity: 'high',
    terms: [
      'money laundering',
      'launder money',
      'launder funds',
      'shell company',
      'racketeering',
      'racketeer',
      'loan shark',
      'loan sharking',
      'smurfing',
      'tax evasion scheme',
      'fraud scheme',
      'counterfeit money',
      'fake currency',
      'illegal enrichment',
    ],
  },
  {
    id: 'gambling',
    label: 'Gambling products, services & events',
    severity: 'high',
    terms: [
      'online casino',
      'gambling site',
      'gambling service',
      'betting site',
      'sports betting',
      'sportsbook',
      'bookie',
      'poker site',
      'crypto gambling',
      'illegal gambling',
    ],
  },
  {
    id: 'harassment_extortion',
    label: 'Harassment, blackmail & extortion',
    severity: 'high',
    terms: [
      'revenge porn',
      'blackmail service',
      'extortion service',
      'doxxing service',
      'harassment for hire',
      'harassment campaign',
      'cyber harassment',
      'stalker service',
    ],
  },
];

/**
 * Well-known insinuation / euphemism phrases. These are high-severity because
 * on a personal-care marketplace they are strongly associated with sexual
 * services being disguised as legitimate grooming/beauty offers.
 */
export const INNUENDO_PHRASES: string[] = [
  'happy ending',
  'full service',
  'extra service',
  'private dance',
  'rub and tug',
  'hand relief',
  'table shower',
  'monger service',
];

/** Severity assigned to matched innuendo phrases. */
export const INNUENDO_SEVERITY: Severity = 'high';

export const PROHIBITED_CATEGORY_IDS = PROHIBITED_CATEGORIES.map((c) => c.id);

/** Flatten every prohibited term into a category→term lookup (normalised). */
export function buildTermIndex(): { term: string; categoryId: string; severity: Severity }[] {
  const out: { term: string; categoryId: string; severity: Severity }[] = [];
  for (const cat of PROHIBITED_CATEGORIES) {
    for (const term of cat.terms) {
      out.push({ term: term.toLowerCase(), categoryId: cat.id, severity: cat.severity });
    }
  }
  return out;
}
