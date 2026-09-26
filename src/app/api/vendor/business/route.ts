import { NextRequest, NextResponse } from 'next/server';
import { getVendorBusiness, updateVendorBusiness, type VendorBusinessPatch } from '@/lib/vendor/business';

function statusFor(error: string): number {
  if (error === 'unauthorized') return 401;
  if (error === 'not_found') return 404;
  return 500;
}

export async function GET() {
  const { business, error } = await getVendorBusiness();
  if (error) {
    return NextResponse.json(
      { error: error === 'not_found' ? 'No business found for this account' : error },
      { status: statusFor(error) },
    );
  }
  return NextResponse.json({ business });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<VendorBusinessPatch>;

  // Narrow, explicit allow-list — see lib/vendor/business.ts for why this
  // doesn't (yet) accept category/address/hours.
  const patch: VendorBusinessPatch = {};
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.description === 'string') patch.description = body.description;
  if (body.media && typeof body.media === 'object') {
    const { logoUrl, coverUrl, galleryUrls } = body.media;
    patch.media = {
      ...(typeof logoUrl === 'string' ? { logoUrl } : {}),
      ...(typeof coverUrl === 'string' ? { coverUrl } : {}),
      ...(Array.isArray(galleryUrls) ? { galleryUrls } : {}),
    };
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No recognized fields in request body' }, { status: 400 });
  }

  const { business, error } = await updateVendorBusiness(patch);
  if (error) {
    return NextResponse.json(
      { error: error === 'not_found' ? 'No business found for this account' : error },
      { status: statusFor(error) },
    );
  }
  return NextResponse.json({ business });
}
