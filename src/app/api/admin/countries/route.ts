import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { CURRENCIES } from '@/lib/localization/currencies';
import { LANGUAGES } from '@/lib/localization/languages';

// The `countries` table holds the admin-overridable operational fields
// (is_active, minimum_fee_floor, tax_rate, payment_methods) — display data
// like currency symbol/name and language name come from the static
// CURRENCIES/LANGUAGES config, same source the rest of the app already
// uses, rather than duplicating that data into the DB row.

function hydrate(row: any) {
  const currency = CURRENCIES[row.currency_code] ?? { code: row.currency_code, symbol: row.currency_code, name: row.currency_code, exchangeRate: 1 };
  const language = LANGUAGES[row.language_code] ?? { code: row.language_code, name: row.language_code, nativeName: row.language_code, isRTL: false };
  return {
    code: row.code,
    name: row.name,
    flag: row.flag_url ?? '',
    currency: { code: currency.code, symbol: currency.symbol, name: currency.name, exchangeRate: (currency as any).exchangeRate ?? 1 },
    language: { code: language.code, name: language.name, nativeName: (language as any).nativeName ?? language.name, isRTL: language.isRTL },
    timezone: row.timezone,
    phoneFormat: row.phone_format,
    paymentMethods: row.payment_methods ?? [],
    minimumFeeFloor: Number(row.minimum_fee_floor),
    taxRate: Number(row.tax_rate),
    legalTerms: row.legal_terms ?? '',
    isActive: row.is_active,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { data, error } = await (auth.ctx.supabase.from('countries') as any).select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ success: true, countries: (data ?? []).map(hydrate) });
  } catch (err) {
    return handleError(err, 'Failed to load countries');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { code, minimumFeeFloor, taxRate, paymentMethods, isActive, legalTerms } = body;
    if (!code) return NextResponse.json({ error: 'Missing country code' }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (minimumFeeFloor !== undefined) update.minimum_fee_floor = minimumFeeFloor;
    if (taxRate !== undefined) update.tax_rate = taxRate;
    if (paymentMethods !== undefined) update.payment_methods = paymentMethods;
    if (isActive !== undefined) update.is_active = isActive;
    if (legalTerms !== undefined) update.legal_terms = legalTerms;

    const { data, error } = await (auth.ctx.supabase.from('countries') as any)
      .update(update)
      .eq('code', code)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, country: hydrate(data) });
  } catch (err) {
    return handleError(err, 'Failed to update country');
  }
}
