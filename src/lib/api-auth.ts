import { query } from '@/lib/neon/admin';
import type { ApiKeyScope } from '@/types';

export interface ApiKeyAuth {
  hostId: string;
  apiKeyId: string;
  scopes: ApiKeyScope[];
}

export interface ApiAuthError {
  status: number;
  error: string;
}

interface RentalApiKeyRow {
  id: string;
  host_id: string;
  scopes: ApiKeyScope[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  is_active: boolean;
  expires_at: string | null;
}

/**
 * Authenticates a request from an external partner using a Bearer API key
 * (see src/components/vehicle-rental/ApiKeyManagement.tsx for key issuance).
 *
 * Uses the raw Neon admin connection (src/lib/neon/admin.ts) because
 * rental_api_keys/rental_api_key_usage_logs are scoped to the owning
 * host's own session, which external partner requests never have — same
 * reason the Supabase-era version of this file used the service-role
 * client instead of the per-request one.
 */
export async function authenticateApiRequest(
  request: Request,
  requiredScope?: ApiKeyScope,
): Promise<ApiKeyAuth | ApiAuthError> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>' };
  }

  const providedKey = authHeader.slice(7).trim();
  if (!providedKey) {
    return { status: 401, error: 'Missing API key' };
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(providedKey));
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const [apiKeyData] = await query<RentalApiKeyRow>(
    `SELECT id, host_id, scopes, rate_limit_per_minute, rate_limit_per_day, is_active, expires_at
     FROM rental_api_keys WHERE key_hash = $1`,
    [keyHash],
  );

  if (!apiKeyData) {
    return { status: 401, error: 'Invalid API key' };
  }

  if (!apiKeyData.is_active) {
    return { status: 401, error: 'API key has been revoked' };
  }

  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) <= new Date()) {
    return { status: 401, error: 'API key has expired' };
  }

  if (requiredScope && !apiKeyData.scopes.includes(requiredScope) && !apiKeyData.scopes.includes('admin')) {
    return { status: 403, error: `API key is missing required scope: ${requiredScope}` };
  }

  const [{ minute_count: minuteCount, day_count: dayCount }] = await query<{
    minute_count: string;
    day_count: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute') AS minute_count,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') AS day_count
     FROM rental_api_key_usage_logs WHERE api_key_id = $1`,
    [apiKeyData.id],
  );

  if (Number(minuteCount) >= apiKeyData.rate_limit_per_minute || Number(dayCount) >= apiKeyData.rate_limit_per_day) {
    return { status: 429, error: 'Rate limit exceeded' };
  }

  await query(`UPDATE rental_api_keys SET last_used_at = NOW() WHERE id = $1`, [apiKeyData.id]);

  return { hostId: apiKeyData.host_id, apiKeyId: apiKeyData.id, scopes: apiKeyData.scopes };
}

export function isApiAuthError(result: ApiKeyAuth | ApiAuthError): result is ApiAuthError {
  return 'error' in result;
}

export async function logApiKeyUsage(
  apiKeyId: string,
  request: Request,
  statusCode: number,
  startedAt: number,
): Promise<void> {
  await query(
    `INSERT INTO rental_api_key_usage_logs
       (api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      apiKeyId,
      new URL(request.url).pathname,
      request.method,
      statusCode,
      Date.now() - startedAt,
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      request.headers.get('user-agent') || null,
      crypto.randomUUID(),
    ],
  );
}
