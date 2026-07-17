/**
 * Content-moderation engine for AfriBook.
 *
 * Provides normalisation + matching that is resilient to common obfuscation
 * (casing, diacritics, leetspeak, in-word separators) and a set of
 * domain-focused scan helpers used at registration, business onboarding and
 * event publishing. Any 'high' severity match BLOCKS the action; matches are
 * also returned so they can be logged to content_moderation_flags.
 *
 * The engine is provider-agnostic: a real LLM / content-safety classifier can
 * be plugged in by implementing ModerationProvider (see provider.ts). The
 * default LocalKeywordModerationProvider ships today and runs synchronously
 * with no external dependency.
 */
import {
  INNUENDO_PHRASES,
  INNUENDO_SEVERITY,
  PROHIBITED_CATEGORIES,
  Severity,
  buildTermIndex,
} from './taxonomy';
import { isAllowedBusinessCategory, isProhibitedEventCategory } from '@/lib/localization/categories';

export interface Match {
  categoryId: string;
  categoryLabel: string;
  term: string;
  severity: Severity;
}

export interface ModerationResult {
  /** True when at least one HIGH severity match was found → action blocked. */
  blocked: boolean;
  /** True when any match (high or medium) was found → flagged for review. */
  flagged: boolean;
  matches: Match[];
  /** Human readable reasons suitable for end-user / admin messaging. */
  reasons: string[];
  /** Distinct prohibited category ids matched. */
  categories: string[];
}

const EMPTY_RESULT: ModerationResult = {
  blocked: false,
  flagged: false,
  matches: [],
  reasons: [],
  categories: [],
};

// ─── Normalisation ──────────────────────────────────────────────

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 'l', '@': 'a', '$': 's', '!': 'i', '+': 't',
};

/** Strip diacritics and fold to lower case. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Leetspeak + diacritic decode, preserving word separators. */
export function decodeLeet(text: string): string {
  let out = '';
  for (const ch of text) {
    out += LEET_MAP[ch] ?? ch;
  }
  return out;
}

/**
 * Aggressive normalisation: lower-case, decode leet, strip EVERYTHING except
 * alphanumerics. Used to defeat in-word separators such as "s.e.x.t.r.a.f.f".
 */
export function normalizeAggressive(text: string): string {
  return decodeLeet(normalize(text)).replace(/[^a-z0-9]/g, '');
}

// ─── Matching ───────────────────────────────────────────────────

const TERM_INDEX = buildTermIndex();

function mergeMatches(acc: Map<string, Match>, m: Match) {
  const key = `${m.categoryId}:${m.term}`;
  if (!acc.has(key)) acc.set(key, m);
}

function scanText(text: string, acc: Map<string, Match>) {
  if (!text) return;
  const norm = normalize(text);
  const normDecoded = decodeLeet(norm);
  const aggro = normalizeAggressive(text);

  for (const t of TERM_INDEX) {
    const needle = t.term;
    if (
      normDecoded.includes(needle) ||
      // block obvious pluralisations / suffixes
      normDecoded.includes(`${needle}s`) ||
      aggro.includes(t.term.replace(/[^a-z0-9]/g, '')) ||
      t.term.includes(' ') === false && aggro.includes(t.term.replace(/[^a-z0-9]/g, ''))
    ) {
      const cat = PROHIBITED_CATEGORIES.find((c) => c.id === t.categoryId)!;
      mergeMatches(acc, {
        categoryId: cat.id,
        categoryLabel: cat.label,
        term: t.term,
        severity: t.severity,
      });
    }
  }

  // Innuendo / euphemism phrases (always checked on decoded + aggressive forms)
  for (const phrase of INNUENDO_PHRASES) {
    const p = phrase.toLowerCase();
    const pAggro = p.replace(/[^a-z0-9]/g, '');
    if (normDecoded.includes(p) || aggro.includes(pAggro)) {
      mergeMatches(acc, {
        categoryId: 'sexual_exploitation',
        categoryLabel: 'Sexual exploitation & sex sales',
        term: phrase,
        severity: INNUENDO_SEVERITY,
      });
    }
  }
}

function buildResult(acc: Map<string, Match>): ModerationResult {
  const matches = [...acc.values()];
  if (matches.length === 0) return { ...EMPTY_RESULT };

  const blocked = matches.some((m) => m.severity === 'high');
  const categories = [...new Set(matches.map((m) => m.categoryId))];
  const reasons = matches.map(
    (m) => `Prohibited content detected (${m.categoryLabel}): "${m.term}"`,
  );

  return {
    blocked,
    flagged: true,
    matches,
    reasons,
    categories,
  };
}

/**
 * Scan a single free-text field.
 */
export function moderateText(text: string | null | undefined): ModerationResult {
  const acc = new Map<string, Match>();
  scanText(text ?? '', acc);
  return buildResult(acc);
}

/**
 * Scan many named fields at once (e.g. name, description, category).
 */
export function moderateFields(
  fields: Record<string, string | null | undefined>,
): ModerationResult {
  const acc = new Map<string, Match>();
  for (const value of Object.values(fields)) {
    scanText(value ?? '', acc);
  }
  return buildResult(acc);
}

// ─── Domain helpers ─────────────────────────────────────────────

export interface RegistrationInput {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
  businessCategory?: string | null;
}

/**
 * Gate used at account sign-up. Scans the user's name, contact identifiers and
 * (for vendors) the business name / category. A prohibited category value also
 * blocks registration.
 */
export function moderateRegistration(input: RegistrationInput): ModerationResult {
  const acc = new Map<string, Match>();
  scanText(input.fullName ?? '', acc);
  scanText(input.email ?? '', acc);
  scanText(input.phone ?? '', acc);
  scanText(input.businessName ?? '', acc);

  const result = buildResult(acc);

  // Explicitly prohibited business category (e.g. none of the beauty trades,
  // but something outside the allowed taxonomy sneaking in).
  if (input.businessCategory && !isAllowedCategory(input.businessCategory)) {
    mergeMatches(acc, {
      categoryId: 'policy_violation',
      categoryLabel: 'Disallowed provider category',
      term: input.businessCategory,
      severity: 'high',
    });
    const r = buildResult(acc);
    r.blocked = true;
    r.flagged = true;
    r.categories.push('policy_violation');
    r.reasons.push(`Provider category "${input.businessCategory}" is not permitted on AfriBook`);
    return r;
  }

  return result;
}

export interface BusinessInput {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
}

/**
 * Gate used when a vendor creates / updates a business.
 */
export function moderateBusiness(input: BusinessInput): ModerationResult {
  const acc = new Map<string, Match>();
  scanText(input.name ?? '', acc);
  scanText(input.description ?? '', acc);
  scanText(input.subcategory ?? '', acc);

  const result = buildResult(acc);

  if (input.category && !isAllowedCategory(input.category)) {
    mergeMatches(acc, {
      categoryId: 'policy_violation',
      categoryLabel: 'Disallowed provider category',
      term: input.category,
      severity: 'high',
    });
    const r = buildResult(acc);
    r.blocked = true;
    r.flagged = true;
    r.categories.push('policy_violation');
    r.reasons.push(`Provider category "${input.category}" is not permitted on AfriBook`);
    return r;
  }

  return result;
}

export interface EventInput {
  title?: string | null;
  description?: string | null;
  category?: string | null;
}

/**
 * Gate used when publishing / creating an event. Prohibited event categories
 * (Yoga, New Age, violent, gambling, …) block the event outright.
 */
export function moderateEvent(input: EventInput): ModerationResult {
  const acc = new Map<string, Match>();
  scanText(input.title ?? '', acc);
  scanText(input.description ?? '', acc);

  const result = buildResult(acc);

  if (input.category && isProhibitedEventCategory(input.category)) {
    mergeMatches(acc, {
      categoryId: 'policy_violation',
      categoryLabel: 'Prohibited event category',
      term: input.category,
      severity: 'high',
    });
    const r = buildResult(acc);
    r.blocked = true;
    r.flagged = true;
    r.categories.push('policy_violation');
    r.reasons.push(`Event category "${input.category}" is not permitted on AfriBook`);
    return r;
  }

  return result;
}

// Re-export policy helpers so callers only need the moderation module.
function isAllowedCategory(category: string): boolean {
  return isAllowedBusinessCategory(category);
}

/**
 * Friendly, single-line message for end users when an action is blocked.
 */
export function getBlockMessage(result: ModerationResult): string {
  if (!result.blocked) return '';
  const label = result.matches[0]?.categoryLabel ?? 'prohibited content';
  return `Registration blocked: ${label} is strictly prohibited on AfriBook. If you believe this is a mistake, contact support.`;
}
