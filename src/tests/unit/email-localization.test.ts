import { describe, it, expect } from 'vitest';

import {
  getEmailLocale,
  isRtlEmailLocale,
  tEmail,
  welcomeEmail,
} from '@/lib/localization/email';

describe('email localization', () => {
  it('resolves en for US country code', () => {
    expect(getEmailLocale('US')).toBe('en');
  });

  it('resolves fr for FR', () => {
    expect(getEmailLocale('FR')).toBe('fr');
  });

  it('resolves ar for EG', () => {
    expect(getEmailLocale('EG')).toBe('ar');
  });

  it('falls back to en for missing/empty country code', () => {
    expect(getEmailLocale(undefined)).toBe('en');
    expect(getEmailLocale(null)).toBe('en');
  });

  it('falls back to en for countries whose language is not covered', () => {
    expect(getEmailLocale('DE')).toBe('en');
    expect(getEmailLocale('ZZ')).toBe('en');
  });

  it('flags RTL locales', () => {
    expect(isRtlEmailLocale('ar')).toBe(true);
    expect(isRtlEmailLocale('en')).toBe(false);
    expect(isRtlEmailLocale('fr')).toBe(false);
  });

  it('interpolates params in template strings', () => {
    expect(tEmail('en', 'welcome.greeting', { name: 'Amara' })).toBe('Hi Amara,');
  });

  it('falls back to en string when a locale key is missing', () => {
    expect(tEmail('en', 'appName')).toBe('AfriBook');
    expect(tEmail('fr', 'appName')).toBe('AfriBook');
  });

  it('builds a localized welcome email for en', () => {
    const email = welcomeEmail({ name: 'Amara', countryCode: 'NG' });
    expect(email.subject).toContain('Welcome to AfriBook');
    expect(email.html).toContain('Hi Amara,');
    expect(email.html).toContain('dir="ltr"');
  });

  it('builds a localized welcome email for fr', () => {
    const email = welcomeEmail({ name: 'Amara', countryCode: 'FR' });
    expect(email.subject).toContain('Bienvenue');
    expect(email.html).toContain('Bonjour Amara,');
    expect(email.html).toContain('dir="ltr"');
  });

  it('builds an RTL welcome email for ar', () => {
    const email = welcomeEmail({ name: 'أميرة', countryCode: 'EG' });
    expect(email.subject).toContain('مرحباً');
    expect(email.html).toContain('dir="rtl"');
    expect(email.html).toContain('أميرة');
  });

  it('falls back to a default name when none is provided', () => {
    const email = welcomeEmail({ countryCode: 'US' });
    expect(email.html).toContain('Hi there,');
  });
});
