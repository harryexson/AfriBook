import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessDomain, DomainStatus } from '@/types';
import {
  buildDnsRecords,
  buildFullDomain,
  slugifySubdomain,
} from './subdomain';

// ─── Row mapping ─────────────────────────────────────────────

function mapDomainRow(row: Record<string, unknown>): BusinessDomain {
  return {
    id: (row.id as string) ?? '',
    businessId: (row.business_id as string) ?? '',
    subdomain: (row.subdomain as string) ?? '',
    rootDomain: (row.root_domain as string) ?? '',
    fullDomain: (row.full_domain as string) ?? '',
    status: (row.status as DomainStatus) ?? 'pending',
    dnsRecords: (row.dns_records as Record<string, unknown>) ?? {},
    verifiedAt: (row.verified_at as string | null) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

interface RowResult<T> {
  data: T | null;
  error: unknown;
}

// ─── Queries ─────────────────────────────────────────────────

export async function getBusinessDomain(
  sb: SupabaseClient,
  businessId: string,
): Promise<BusinessDomain | null> {
  const { data } = (await sb
    .from('business_domains')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()) as unknown as RowResult<Record<string, unknown>>;

  return data ? mapDomainRow(data) : null;
}

export async function listBusinessDomains(
  sb: SupabaseClient,
  ownerId: string,
): Promise<BusinessDomain[]> {
  const { data: businesses } = (await sb
    .from('businesses')
    .select('id')
    .eq('owner_id', ownerId)) as unknown as RowResult<{ id: string }[]>;

  const businessIds = (businesses ?? []).map((b) => b.id);
  if (businessIds.length === 0) return [];

  const { data } = (await sb
    .from('business_domains')
    .select('*')
    .in('business_id', businessIds)
    .order('created_at', { ascending: true })) as unknown as RowResult<Record<string, unknown>[]>;

  return (data ?? []).map(mapDomainRow);
}

/**
 * Ensures a business has a subdomain, creating one if missing.
 * The subdomain is derived from the business name and deduplicated against
 * existing rows; the full domain and its DNS reference records are stored
 * alongside it.
 */
export async function getOrCreateBusinessDomain(
  sb: SupabaseClient,
  businessId: string,
  businessName: string,
): Promise<{ domain: BusinessDomain; created: boolean }> {
  const existing = await getBusinessDomain(sb, businessId);
  if (existing) return { domain: existing, created: false };

  const baseSlug = slugifySubdomain(businessName);

  for (let attempt = 0; attempt < 20; attempt++) {
    const subdomain =
      attempt === 0 ? baseSlug : `${baseSlug.slice(0, 50)}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = (await sb
      .from('business_domains')
      .insert({
        business_id: businessId,
        subdomain,
        root_domain: 'afribook.xyz',
        full_domain: buildFullDomain(subdomain),
        status: 'active' as DomainStatus,
        dns_records: buildDnsRecords(subdomain),
        verified_at: new Date().toISOString(),
      })
      .select()
      .single()) as unknown as RowResult<Record<string, unknown>>;

    if (!error && data) return { domain: mapDomainRow(data), created: true };
    if ((error as { code?: string })?.code !== '23505') throw error;
  }

  throw new Error('Could not allocate a unique subdomain for this business');
}

/**
 * Re-provisions an existing subdomain (e.g. after a business rename),
 * preserving DNS records for the new host and resetting status to active.
 */
export async function regenerateBusinessDomain(
  sb: SupabaseClient,
  businessId: string,
  businessName: string,
): Promise<BusinessDomain> {
  const { data, error } = (await sb
    .from('business_domains')
    .update({
      subdomain: slugifySubdomain(businessName),
      full_domain: buildFullDomain(slugifySubdomain(businessName)),
      status: 'active' as DomainStatus,
      dns_records: buildDnsRecords(slugifySubdomain(businessName)),
      verified_at: new Date().toISOString(),
    })
    .eq('business_id', businessId)
    .select()
    .single()) as unknown as RowResult<Record<string, unknown>>;

  if (error || !data) throw error ?? new Error('Domain not found');
  return mapDomainRow(data);
}

export async function removeBusinessDomain(
  sb: SupabaseClient,
  businessId: string,
): Promise<void> {
  const { error } = await sb.from('business_domains').delete().eq('business_id', businessId);
  if (error) throw error;
}
