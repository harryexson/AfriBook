import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveMarketContext } from '@/lib/localization/market-context';
import { getCurrencyForCountry } from '@/lib/money';

export async function GET(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';
    // Market precedence: explicit query param → x-country-code/cookie/IP
    // headers resolved by the central market-context service.
    const country =
      searchParams.get('country')?.trim().toUpperCase() ||
      resolveMarketContext(req).countryCode;
    const marketCurrency = getCurrencyForCountry(country);

    let query = supabase
      .from('products')
      .select(
        `id,
         business_id,
         name,
         description,
         price,
         compare_price,
         currency,
         stock,
         images,
         variants,
         category,
         tags,
         is_available,
         businesses!inner(
           id,
           name,
           country_code,
           status,
           rating,
           location
         )`,
      )
      .eq('is_available', true);

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query.order('name');

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 },
      );
    }

    let products = (data ?? []).map((row: any) => {
      const business = row.businesses;
      return {
        id: row.id,
        businessId: business.id,
        businessName: business.name,
        name: row.name,
        description: row.description ?? '',
        price: Number(row.price),
        comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
        currency: row.currency || marketCurrency,
        stock: Number(row.stock ?? 0),
        images: row.images ?? [],
        variants: row.variants ?? [],
        category: row.category ?? '',
        tags: row.tags ?? [],
        isAvailable: row.is_available === true,
        rating: Number(business.rating ?? 0),
        countryCode: business.country_code,
        location: String((business.location ?? '') as string).includes('POINT') ? business.location : null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.businessName.toLowerCase().includes(q),
      );
    }
    if (country) {
      products = products.filter((p: any) => p.countryCode === country);
    }
    products.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));

    return NextResponse.json({ success: true, data: { products } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
