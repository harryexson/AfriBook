// ─── Startup Validation ────────────────────────────────────────
// Next.js runs `register()` exactly once when the server starts, before
// any request is handled — the official hook for exactly this kind of
// check. https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
// This is what makes a missing STRIPE_SECRET_KEY (or any of the other 9
// providers') a loud, readable message in the deploy logs at boot time,
// instead of a customer hitting a cryptic SDK error mid-checkout.
// ──────────────────────────────────────────────────────────────

export async function register() {
  // Only run in the Node.js runtime (not edge) and not during the build
  // step itself — this is a runtime check, not a build-time one.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { checkPaymentProviderEnv, checkCoreEnv } = await import('./src/lib/payments/env-validation');

  const core = checkCoreEnv();
  if (core.missing.length > 0) {
    console.error(
      `\n[startup] Missing required core environment variables: ${core.missing.join(', ')}\n` +
      `The app will not function correctly until these are set. See .env.example.\n`,
    );
  }

  const providerReports = checkPaymentProviderEnv();
  const misconfigured = providerReports.filter((r) => r.status === 'misconfigured');
  const ready = providerReports.filter((r) => r.status === 'ready');

  if (misconfigured.length > 0) {
    for (const r of misconfigured) {
      console.error(
        `\n[startup] Payment provider "${r.provider}" is PARTIALLY configured — ` +
        `missing: ${r.missingRequired.join(', ')}. This almost always means a ` +
        `mistake (typo'd var name, incomplete .env copy) rather than an ` +
        `intentionally disabled provider. Payments through "${r.provider}" will fail.\n`,
      );
    }
  }

  if (ready.length === 0) {
    console.error(
      `\n[startup] No payment provider is fully configured. No payment can be ` +
      `processed anywhere on the platform until at least one provider's ` +
      `required environment variables are set. See .env.example.\n`,
    );
  } else {
    console.log(`[startup] Payment providers ready: ${ready.map((r) => r.provider).join(', ')}`);
  }
}
