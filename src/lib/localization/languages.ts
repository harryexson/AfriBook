export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  countries: string[];
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
    countries: ['US', 'GB', 'NG', 'KE', 'MW', 'ZA', 'GH', 'TZ', 'UG', 'AE'],
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    isRTL: false,
    countries: ['FR', 'CA'],
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    isRTL: false,
    countries: [],
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    isRTL: false,
    countries: [],
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
    countries: ['EG', 'AE'],
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    isRTL: false,
    countries: ['IN'],
  },
  sw: {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    isRTL: false,
    countries: ['KE', 'TZ', 'UG'],
  },
  yo: {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    isRTL: false,
    countries: ['NG'],
  },
  ha: {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    isRTL: false,
    countries: ['NG'],
  },
  zu: {
    code: 'zu',
    name: 'Zulu',
    nativeName: 'isiZulu',
    isRTL: false,
    countries: ['ZA'],
  },
  af: {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    isRTL: false,
    countries: ['ZA'],
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    isRTL: false,
    countries: ['DE'],
  },
};
