import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const country = req.nextUrl.searchParams.get('country');
    if (id && !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid business' }, { status: 400 });
    if (country && !/^[A-Z]{2}$/.test(country)) return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
    // Public catalog: explicit public fields, parameterized filters, active listings only.
    const data = await query(`SELECT id,name,description,category,country_code,address,media,rating,hours
      FROM businesses WHERE status = 'active' AND ($1::uuid IS NULL OR id = $1::uuid)
      AND ($2::text IS NULL OR country_code = $2) ORDER BY name LIMIT 50`, [id, country]);
    if (id) {
      if (!data?.length) return NextResponse.json({ error: 'Business is unavailable' }, { status: 404 });
      const services = await query(`SELECT id,name,description,price,currency,duration_minutes,is_available
        FROM services WHERE business_id = $1 AND is_available = true ORDER BY name`, [id]);
      return NextResponse.json({ data: { ...data[0], services: services || [] } });
    }
    return NextResponse.json({ data: data || [] });
  } catch { return NextResponse.json({ error: 'Could not load businesses. Please retry.' }, { status: 500 }); }
}
