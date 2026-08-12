import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = (await createClient()) as any;

    const { data: product, error } = await supabase
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
         metadata,
         businesses!inner(
           id,
           name,
           country_code,
           status,
           rating,
           location,
           address
         )`,
      )
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      );
    }

    const business = product.businesses;
    const address = (business.address as Record<string, unknown> | null) ?? {};

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          businessId: business.id,
          businessName: business.name,
          name: product.name,
          description: product.description ?? '',
          price: Number(product.price),
          comparePrice: product.compare_price != null ? Number(product.compare_price) : null,
          currency: product.currency ?? 'USD',
          stock: Number(product.stock ?? 0),
          images: product.images ?? [],
          variants: product.variants ?? [],
          category: product.category ?? '',
          tags: product.tags ?? [],
          isAvailable: product.is_available === true,
          rating: Number(business.rating ?? 0),
          countryCode: business.country_code,
          location: String(address.formatted ?? business.name),
          metadata: product.metadata ?? {},
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
