import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrencyConfig, getCurrencyForCountry } from '@/lib/money';
import { DEFAULT_COUNTRY } from '@/lib/localization/market-context';
import {
  getCelebrationPlans,
  resolvePlannerMarket,
} from '@/lib/celebrations/service';

// Service-role client: the plan catalog is public data, but localization needs
// the planner's market which is resolved from the authenticated profile.
const admin = createAdminClient() as any;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryOverride = searchParams.get('country');

    let market;
    try {
      const { user } = await requireAuthenticatedUser();
      market = await resolvePlannerMarket(admin, user.id);
      if (countryOverride) {
        market = {
          countryCode: countryOverride.toUpperCase(),
          currencyCode: getCurrencyForCountry(countryOverride.toUpperCase()),
          exchangeRate: 1,
        };
        market.exchangeRate = getCurrencyConfig(market.currencyCode)?.exchangeRate ?? 1;
      }
    } catch {
      // Public pricing page fallback: localize to the requested country or USD.
      const countryCode = (countryOverride ?? DEFAULT_COUNTRY).toUpperCase();
      market = {
        countryCode,
        currencyCode: getCurrencyForCountry(countryCode),
        exchangeRate: getCurrencyConfig(getCurrencyForCountry(countryCode))?.exchangeRate ?? 1,
      };
    }

    const plans = await getCelebrationPlans(admin, market);

    return NextResponse.json({
      success: true,
      data: { plans, market },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
