import { NextRequest, NextResponse } from 'next/server';
import { publicProducts } from '@/lib/public-products';
import { resolveMarketContext } from '@/lib/localization/market-context';
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const country = params.get('country')?.trim().toUpperCase() || resolveMarketContext(req).countryCode;
  if (!/^[A-Z]{2}$/.test(country)) return NextResponse.json({ error: 'Invalid market' }, { status: 400 });
  try {
    const products = await publicProducts({ country, search: params.get('search')?.trim().slice(0, 200), category: params.get('category')?.trim().slice(0, 100) });
    return NextResponse.json({ success: true, data: { products } });
  } catch {
    return NextResponse.json({ success: false, error: 'Products are temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
