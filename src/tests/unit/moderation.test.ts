import { describe, it, expect } from 'vitest';
import {
  moderateText,
  moderateRegistration,
  moderateBusiness,
  moderateEvent,
  normalize,
  normalizeAggressive,
  getBlockMessage,
  ModerationResult,
} from '@/lib/moderation';
import { BUSINESS_CATEGORIES, EVENT_CATEGORIES, PROHIBITED_EVENT_CATEGORIES } from '@/lib/localization/categories';

describe('normalisation', () => {
  it('normalises casing and diacritics', () => {
    expect(normalize('  SÉX  Trafficking ')).toBe('sex trafficking');
  });

  it('strips non-alphanumerics aggressively', () => {
    expect(normalizeAggressive('s.e.x.t.r.a.f.f')).toBe('sextraff');
  });
});

describe('moderateText — prohibited content', () => {
  it('blocks sex trafficking phrasing', () => {
    const r = moderateText('we offer sex trafficking services');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('sexual_exploitation');
  });

  it('blocks obfuscated in-word separators', () => {
    const r = moderateText('discreet s.e.x for sale arrangements');
    expect(r.blocked).toBe(true);
  });

  it('blocks leetspeak', () => {
    const r = moderateText('c0caine for sale cheap');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('illegal_drugs');
  });

  it('blocks money laundering', () => {
    const r = moderateText('professional money laundering consultancy');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('financial_crime');
  });

  it('blocks gambling', () => {
    const r = moderateText('online casino and sports betting tips');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('gambling');
  });

  it('blocks slavery / forced labour', () => {
    const r = moderateText('supply chain uses forced labor');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('human_trafficking_slavery');
  });

  it('blocks innuendo phrases', () => {
    const r = moderateText('full service massage with happy ending');
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('sexual_exploitation');
  });

  it('does not block a legitimate beauty business', () => {
    const r = moderateText('Luxury Barber Shop offering haircuts and beard grooming');
    expect(r.blocked).toBe(false);
    expect(r.flagged).toBe(false);
  });

  it('does not block photography business', () => {
    const r = moderateText('Studio photographer for weddings and portraits');
    expect(r.blocked).toBe(false);
  });
});

describe('moderateRegistration', () => {
  it('blocks a prohibited business name', () => {
    const r = moderateRegistration({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      businessName: 'Elite Escort Agency',
      businessCategory: 'Beauty Salon',
    });
    expect(r.blocked).toBe(true);
  });

  it('blocks a prohibited business category', () => {
    const r = moderateRegistration({
      fullName: 'John Smith',
      email: 'john@example.com',
      businessName: 'Smith Co',
      businessCategory: 'Yoga',
    });
    expect(r.blocked).toBe(true);
    expect(r.reasons.join(' ')).toMatch(/not permitted/i);
  });

  it('allows a valid vendor registration', () => {
    const r = moderateRegistration({
      fullName: 'Ama Owusu',
      email: 'ama@example.com',
      businessName: 'Accra Spa & Wellness',
      businessCategory: 'Spa',
    });
    expect(r.blocked).toBe(false);
  });
});

describe('moderateBusiness', () => {
  it('blocks drugs in description', () => {
    const r = moderateBusiness({
      name: 'Relax Spa',
      description: 'we also sell cocaine for sale on the side',
      category: 'Spa',
    });
    expect(r.blocked).toBe(true);
  });

  it('allows a legitimate cosmetician', () => {
    const r = moderateBusiness({
      name: 'Glow Cosmetician',
      description: 'Bridal makeup and skincare consultations',
      category: 'Cosmetician',
    });
    expect(r.blocked).toBe(false);
  });
});

describe('moderateEvent', () => {
  it('blocks a prohibited event category', () => {
    const r = moderateEvent({
      title: 'Peace Yoga Retreat',
      description: 'A calming day',
      category: 'Yoga',
    });
    expect(r.blocked).toBe(true);
  });

  it('blocks New Age events', () => {
    const r = moderateEvent({
      title: 'Crystal Healing New Age Event',
      description: 'spiritual awakening',
      category: 'New Age',
    });
    expect(r.blocked).toBe(true);
  });

  it('blocks violent event content', () => {
    const r = moderateEvent({
      title: 'Underground Fight Club',
      description: 'no rules',
      category: 'Sports',
    });
    expect(r.blocked).toBe(true);
    expect(r.categories).toContain('violence');
  });

  it('allows a legitimate music event', () => {
    const r = moderateEvent({
      title: 'Afrobeats Night Concert',
      description: 'Live performances from top artists',
      category: 'Concert',
    });
    expect(r.blocked).toBe(false);
  });
});

describe('category taxonomy', () => {
  it('includes the requested provider categories', () => {
    for (const c of ['Barber', 'Spa', 'Photographer', 'Cosmetician', 'Beauty Salon']) {
      expect(BUSINESS_CATEGORIES.map((x) => x.toLowerCase())).toContain(c.toLowerCase());
    }
  });

  it('excludes Yoga / New Age from allowed event categories', () => {
    expect(PROHIBITED_EVENT_CATEGORIES).toContain('Yoga');
    expect(PROHIBITED_EVENT_CATEGORIES).toContain('New Age');
    expect(EVENT_CATEGORIES.map((x) => x.toLowerCase())).not.toContain('yoga');
  });
});

describe('getBlockMessage', () => {
  it('returns a message when blocked', () => {
    const r: ModerationResult = {
      blocked: true,
      flagged: true,
      matches: [{ categoryId: 'gambling', categoryLabel: 'Gambling products, services & events', term: 'online casino', severity: 'high' }],
      reasons: ['x'],
      categories: ['gambling'],
    };
    expect(getBlockMessage(r)).toMatch(/blocked/i);
  });
});
