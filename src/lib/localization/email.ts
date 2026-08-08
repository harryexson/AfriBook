import { getLocaleFromCountry } from './index';

// ─── Email localization ────────────────────────────────────────
// Lightweight template strings for transactional emails. Full UI i18n lives in
// `translations.ts`; emails keep their own small, focused dictionary here.
//
// Locale coverage today: en, fr, ar (launch language set). Anything else
// resolves to `en`. Strings support `{param}` interpolation.
// ───────────────────────────────────────────────────────────────

type EmailKey =
  | 'appName'
  | 'welcome.subject'
  | 'welcome.greeting'
  | 'welcome.intro'
  | 'welcome.agreements'
  | 'welcome.closing'
  | 'welcome.signoff';

const EMAIL_STRINGS: Record<string, Record<EmailKey, string>> = {
  en: {
    appName: 'AfriBook',
    'welcome.subject': 'Welcome to AfriBook — your account is ready',
    'welcome.greeting': 'Hi {name},',
    'welcome.intro': 'Welcome to AfriBook. Your account is ready.',
    'welcome.agreements': 'Your agreements have been recorded.',
    'welcome.closing': 'Happy booking!',
    'welcome.signoff': '— The AfriBook Team',
  },
  fr: {
    appName: 'AfriBook',
    'welcome.subject': 'Bienvenue sur AfriBook — votre compte est prêt',
    'welcome.greeting': 'Bonjour {name},',
    'welcome.intro': 'Bienvenue sur AfriBook. Votre compte est prêt.',
    'welcome.agreements': 'Vos accords ont bien été enregistrés.',
    'welcome.closing': 'Bonne réservation !',
    'welcome.signoff': '— L’équipe AfriBook',
  },
  ar: {
    appName: 'أفري بوك',
    'welcome.subject': 'مرحباً بك في أفري بوك — حسابك جاهز',
    'welcome.greeting': 'مرحباً {name}،',
    'welcome.intro': 'مرحباً بك في أفري بوك. حسابك جاهز.',
    'welcome.agreements': 'تم تسجيل موافقاتك بنجاح.',
    'welcome.closing': 'حجزاً موفقاً!',
    'welcome.signoff': '— فريق أفري بوك',
  },
};

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

const SUPPORTED_LOCALES = Object.keys(EMAIL_STRINGS);

export function getEmailLocale(countryCode?: string | null): string {
  if (!countryCode) return 'en';
  const locale = getLocaleFromCountry(countryCode);
  return SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
}

export function isRtlEmailLocale(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

export function tEmail(locale: string, key: EmailKey, params?: Record<string, string | number>): string {
  const table = EMAIL_STRINGS[locale] ?? EMAIL_STRINGS.en;
  let str = table[key] ?? EMAIL_STRINGS.en[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

export interface WelcomeEmail {
  subject: string;
  html: string;
}

export function welcomeEmail(opts: { name?: string; countryCode?: string | null }): WelcomeEmail {
  const locale = getEmailLocale(opts.countryCode);
  const dir = isRtlEmailLocale(locale) ? 'rtl' : 'ltr';
  const name = opts.name?.trim() || 'there';
  const appName = tEmail(locale, 'appName');

  const html =
    `<div dir="${dir}">` +
    `<p>${tEmail(locale, 'welcome.greeting', { name })}</p>` +
    `<p>${tEmail(locale, 'welcome.intro')}</p>` +
    `<p>${tEmail(locale, 'welcome.agreements')}</p>` +
    `<p>${tEmail(locale, 'welcome.closing')}</p>` +
    `<p>${tEmail(locale, 'welcome.signoff')}</p>` +
    `<p style="color:#64748b;font-size:12px;">© ${new Date().getFullYear()} ${appName}</p>` +
    `</div>`;

  return { subject: tEmail(locale, 'welcome.subject'), html };
}
