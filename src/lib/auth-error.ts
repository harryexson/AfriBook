/**
 * Turns a Supabase Auth error/exception into copy a user can act on.
 *
 * The specific case this exists for: a plain browser `TypeError: Failed to
 * fetch` — thrown for anything from no internet to a misconfigured or
 * unreachable auth backend (NEXT_PUBLIC_SUPABASE_URL not resolving, DNS,
 * CORS) — was surfacing verbatim as the on-screen error message. That string
 * means nothing to a user and is exactly what got reported as a bug. We can't
 * tell those causes apart client-side, so we say what we do know for certain
 * (we couldn't reach the server) instead of parroting the exception text.
 */
export function describeAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message = err instanceof Error ? err.message : undefined

  // Matched on message text, not `instanceof TypeError` — Supabase's auth-js
  // catches the raw fetch TypeError and re-throws it wrapped in its own error
  // class (AuthRetryableFetchError and friends), which preserves `.message`
  // but isn't itself a TypeError. Checking instanceof missed every real case
  // and let the raw 'Failed to fetch' string straight through to the screen.
  if (message === 'Failed to fetch') {
    console.error('Auth request failed: could not reach the auth service.', err)
    return (
      "We couldn't reach AfriBook's servers. Check your connection and try again — " +
      'if this keeps happening, our systems may be temporarily unavailable.'
    )
  }

  if (!message) return fallback

  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (message.includes('Password should')) {
    return 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.'
  }
  if (message.includes('Invalid login')) {
    return 'Invalid email or password. Please try again.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in.'
  }

  return message || fallback
}
