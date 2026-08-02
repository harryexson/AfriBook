import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBusinessDomain,
  getOrCreateBusinessDomain,
  regenerateBusinessDomain,
  removeBusinessDomain,
} from '@/lib/domains/domain-manager';

// The typed Database in @/types models businesses with the camelCase Business
// interface, but the real table uses snake_case columns (owner_id). Use a
// loosely-typed client for snake_case lookups, mirroring createPaymentDb.
type LooseDb = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
        single: () => Promise<{ data: Record<string, unknown> | null }>;
      };
    };
  };
};

async function getVendorBusinessId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, businessId: null, error: 'Unauthorized' };

  const db = supabase as unknown as LooseDb;
  const { data: business } = await db
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) return { supabase, businessId: null, error: 'No business found for this account' };

  return { supabase, businessId: business.id as string, error: null };
}

export async function GET() {
  const { supabase, businessId, error } = await getVendorBusinessId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const domain = await getBusinessDomain(supabase, businessId!);
    return NextResponse.json({ domain });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load domain';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const { supabase, businessId, error } = await getVendorBusinessId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { data: business } = (await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId!)
    .single()) as unknown as { data: { name: string } | null };

  const businessName = business?.name ?? 'Business';

  try {
    const { domain, created } = await getOrCreateBusinessDomain(supabase, businessId!, businessName);
    return NextResponse.json({ domain, created }, { status: created ? 201 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to provision domain';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH() {
  const { supabase, businessId, error } = await getVendorBusinessId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { data: business } = (await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId!)
    .single()) as unknown as { data: { name: string } | null };

  try {
    const domain = await regenerateBusinessDomain(supabase, businessId!, business?.name ?? 'Business');
    return NextResponse.json({ domain });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate domain';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const { supabase, businessId, error } = await getVendorBusinessId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    await removeBusinessDomain(supabase, businessId!);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove domain';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
