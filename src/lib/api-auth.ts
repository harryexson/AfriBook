import { createAdminClient } from '@/lib/supabase/admin';
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

/**
 * Authenticates a request from an external partner using a Bearer API key
 * (see src/components/vehicle-rental/ApiKeyManagement.tsx for key issuance).
 *
 * Uses the service-role client because api_keys/api_key_usage_logs are
 * RLS-scoped to the owning host's Supabase session, which external
 * partner requests never have.
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

  const admin = createAdminClient() as any;

  const { data: apiKeyData, error: keyError } = await admin
    .from('api_keys')
    .select('id, host_id, scopes, rate_limit_per_minute, rate_limit_per_day, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !apiKeyData) {
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

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86_400_000).toISOString();

  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    admin
      .from('api_key_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyData.id)
      .gt('created_at', oneMinuteAgo),
    admin
      .from('api_key_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyData.id)
      .gt('created_at', oneDayAgo),
  ]);

  if ((minuteCount ?? 0) >= apiKeyData.rate_limit_per_minute || (dayCount ?? 0) >= apiKeyData.rate_limit_per_day) {
    return { status: 429, error: 'Rate limit exceeded' };
  }

  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKeyData.id);

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
  const admin = createAdminClient() as any;
  await admin.from('api_key_usage_logs').insert({
    api_key_id: apiKeyId,
    endpoint: new URL(request.url).pathname,
    method: request.method,
    status_code: statusCode,
    response_time_ms: Date.now() - startedAt,
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: request.headers.get('user-agent') || null,
    request_id: crypto.randomUUID(),
  });
}
