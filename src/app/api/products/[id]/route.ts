import { NextRequest, NextResponse } from 'next/server';
import { publicProducts } from '@/lib/public-products';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  try {
    const [product] = await publicProducts({ id });
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { product } });
  } catch {
    return NextResponse.json({ success: false, error: 'Product is temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
