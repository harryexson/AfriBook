// ─── Payment Provider Environment Validation ──────────────────
// Before this file, none of the 10 payment provider integrations
// validated their required environment variables anywhere — a missing
// STRIPE_SECRET_KEY or PAYSTACK_SECRET_KEY would only surface as a
// cryptic SDK error the moment a real customer tried to pay, not at
// deploy/startup time. This is the single validation source both
// instrumentation.ts (fails loud at boot) and the admin health endpoint
// (fails loud on demand) read from — one definition of "what does each
// provider need", not one copy per call site.
// ──────────────────────────────────────────────────────────────

export interface ProviderEnvSpec {
  provider: string;
  /** Vars that MUST all be present for this provider to work at all. */
  required: string[];
  /** Vars that are optional but commonly expected (e.g. webhook secrets
   *  for providers with multiple webhook types). Missing these degrades
   *  functionality (e.g. can't verify webhooks) without fully breaking
   *  the provider. */
  recommended?: string[];
}

export const PROVIDER_ENV_SPECS: ProviderEnvSpec[] = [
  {
    provider: 'stripe',
    required: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    recommended: ['STRIPE_WEBHOOK_SECRET'],
  },
  {
    provider: 'paystack',
    required: ['PAYSTACK_SECRET_KEY'],
    recommended: ['PAYSTACK_WEBHOOK_SECRET'],
  },
  {
    provider: 'flutterwave',
    required: ['FLUTTERWAVE_SECRET_KEY'],
    recommended: ['FLUTTERWAVE_WEBHOOK_SECRET', 'FLUTTERWAVE_WEBHOOK_HASH'],
  },
  {
    provider: 'mpesa',
    required: ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET'],
    recommended: ['MPESA_SHORTCODE_KE', 'MPESA_SHORTCODE_TZ', 'MPESA_SHORTCODE_UG', 'MPESA_PASSKEY_KE'],
  },
  {
    provider: 'pawapay',
    required: ['PAWAPAY_API_KEY'],
    recommended: ['PAWAPAY_WEBHOOK_SECRET'],
  },
  {
    provider: 'paychangu',
    required: ['PAYCHANGU_SECRET_KEY'],
    recommended: ['PAYCHANGU_WEBHOOK_SECRET'],
  },
  {
    provider: 'razorpay',
    required: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    recommended: ['RAZORPAY_WEBHOOK_SECRET'],
  },
  {
    provider: 'adyen',
    required: ['ADYEN_API_KEY', 'ADYEN_MERCHANT_ACCOUNT'],
    recommended: ['ADYEN_WEBHOOK_HMAC'],
  },
  {
    provider: 'airwallex',
    required: ['AIRWALLEX_CLIENT_ID', 'AIRWALLEX_CLIENT_SECRET'],
    recommended: ['AIRWALLEX_WEBHOOK_SECRET'],
  },
  {
    provider: 'dlocal',
    required: ['DLOCAL_LOGIN', 'DLOCAL_TRANS_KEY'],
    recommended: ['DLOCAL_WEBHOOK_SECRET'],
  },
];

export type ProviderStatus = 'ready' | 'misconfigured' | 'not_configured';

export interface ProviderEnvReport {
  provider: string;
  status: ProviderStatus;
  missingRequired: string[];
  missingRecommended: string[];
}

function isSet(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks every provider's env vars against what's actually set.
 * - "not_configured": none of the required vars are set — this provider
 *   is intentionally disabled for this environment (e.g. a country market
 *   not yet launched). Not an error.
 * - "misconfigured": SOME but not all required vars are set — almost
 *   always a real mistake (a partially-copied .env, a typo'd var name)
 *   and the loudest signal this module exists to catch.
 * - "ready": all required vars present.
 */
export function checkPaymentProviderEnv(): ProviderEnvReport[] {
  return PROVIDER_ENV_SPECS.map((spec) => {
    const missingRequired = spec.required.filter((name) => !isSet(name));
    const missingRecommended = (spec.recommended ?? []).filter((name) => !isSet(name));
    const setCount = spec.required.length - missingRequired.length;

    let status: ProviderStatus;
    if (missingRequired.length === 0) status = 'ready';
    else if (setCount === 0) status = 'not_configured';
    else status = 'misconfigured';

    return { provider: spec.provider, status, missingRequired, missingRecommended };
  });
}

/** True if at least one provider is fully configured — the app can take
 *  payment through *something*, even if it's not every provider. */
export function hasAnyPaymentProviderConfigured(): boolean {
  return checkPaymentProviderEnv().some((r) => r.status === 'ready');
}

// ─── Core Infrastructure Env Vars ──────────────────────────────
// Not payment-specific, but the same class of problem (missing = cryptic
// runtime failure instead of a clear boot-time error), and cheap to check
// alongside the payment providers in the same startup pass.

export interface CoreEnvReport {
  missing: string[];
}

const CORE_REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export function checkCoreEnv(): CoreEnvReport {
  return { missing: CORE_REQUIRED_ENV.filter((name) => !isSet(name)) };
}
