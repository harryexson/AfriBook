'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ConsentType } from '@/types';

export interface ConsentItem {
  type: ConsentType;
  title: string;
  description: React.ReactNode;
}

// Default consent/disclosure set used across signup and onboarding.
export const DEFAULT_CONSENTS: ConsentItem[] = [
  {
    type: 'terms_of_service',
    title: 'Terms of Service',
    description: (
      <>
        I have read and agree to the AfriBook{' '}
        <a href="/legal/terms" target="_blank" className="font-semibold text-amber-600 hover:text-amber-700">
          Terms of Service
        </a>
        , including the Limitation of Liability and Indemnification provisions.
      </>
    ),
  },
  {
    type: 'privacy_policy',
    title: 'Privacy Policy & Data Processing',
    description: (
      <>
        I have read and agree to the AfriBook{' '}
        <a href="/legal/privacy" target="_blank" className="font-semibold text-amber-600 hover:text-amber-700">
          Privacy Policy
        </a>
        , including how personal and payment data is collected, used, and disclosed to trusted payment processors.
      </>
    ),
  },
  {
    type: 'payment_authorization',
    title: 'Payment Authorization',
    description: (
      <>
        I authorise AfriBook to store my chosen payment methods and to charge them for purchases, bookings, and any applicable subscription fees. Card numbers are never stored directly, only tokenised references with masked identifiers.
      </>
    ),
  },
  {
    type: 'communications',
    title: 'Electronic Communications Consent',
    description: (
      <>
        I consent to receive transactional, service, and account-related communications by email, SMS, and push notification. I may also receive promotional communications, which I can opt out of at any time in my settings.
      </>
    ),
  },
  {
    type: 'hold_harmless_waiver',
    title: 'Waiver of Liability & Hold Harmless',
    description: (
      <>
        To the fullest extent permitted by law, I release and hold harmless AfriBook, its owners, shareholders, partners, directors, employees, and agents from any and all liability, claims, or damages arising out of the normal and acceptable use of the Platform, or from unforeseeable events, events beyond AfriBook&apos;s reasonable control, or acts of nature (including natural disasters). I accept that AfriBook acts as an intermediary and is not a party to transactions between users and independent vendors, drivers, or service providers.
      </>
    ),
  },
];

interface ConsentSectionProps {
  items?: ConsentItem[];
  onChange?: (grantedTypes: ConsentType[]) => void;
  compact?: boolean;
}

/**
 * Renders the disclosures/consents checkboxes (including the hold-harmless
 * waiver). Emits the set of accepted consent types via onChange. Callers are
 * responsible for persisting consent via POST /api/consents.
 */
export default function ConsentSection({ items = DEFAULT_CONSENTS, onChange, compact = false }: ConsentSectionProps) {
  const [granted, setGranted] = useState<Set<ConsentType>>(new Set());

  const toggle = (type: ConsentType) => {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      onChange?.(Array.from(next));
      return next;
    });
  };

  const allGranted = items.every((item) => granted.has(item.type));

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {items.map((item) => (
        <label key={item.type} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={granted.has(item.type)}
            onChange={() => toggle(item.type)}
            className={cn(
              'mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30 focus:ring-2',
            )}
          />
          <span className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{item.title}: </span>
            {item.description}
          </span>
        </label>
      ))}

      {/* Select all convenience toggle */}
      <label className={cn('flex items-start gap-3 cursor-pointer pt-1 border-t border-border', compact && 'pt-0')}>
        <input
          type="checkbox"
          checked={allGranted}
          onChange={() => {
            const next = allGranted ? new Set<ConsentType>() : new Set(items.map((i) => i.type));
            setGranted(next);
            onChange?.(Array.from(next));
          }}
          className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30 focus:ring-2"
        />
        <span className="text-xs font-medium text-text-secondary">
          {allGranted ? 'Deselect all disclosures' : 'I agree to all of the disclosures and waivers above'}
        </span>
      </label>
    </div>
  );
}