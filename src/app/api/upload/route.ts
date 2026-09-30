import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { uploadToR2, isR2Configured } from '@/lib/storage/r2';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          'File uploads are not configured on this deployment (missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / NEXT_PUBLIC_R2_PUBLIC_URL).',
      },
      { status: 503 },
    );
  }

  let user;
  try {
    ({ user } = await requireAuthenticatedUser());
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const bucket = (formData.get('bucket') as string) ?? 'uploads';
  const folder = (formData.get('folder') as string) ?? `users/${user.id}`;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (!isImage && !isDocument) {
    return NextResponse.json(
      {
        error: 'Invalid file type. Allowed: images (jpeg, png, webp, avif, gif) and documents (pdf, doc, docx, txt, csv)',
      },
      { status: 400 },
    );
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    const maxMb = maxSize / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large. Maximum size for ${isImage ? 'images' : 'documents'} is ${maxMb}MB` },
      { status: 400 },
    );
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // bucket is kept as a logical prefix (mirrors the old Supabase bucket
  // name) since R2 itself only has the one physical bucket configured here.
  const filePath = `${bucket}/${folder}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  try {
    const { url } = await uploadToR2(filePath, buffer, file.type);

    return NextResponse.json({
      url,
      path: filePath,
      bucket,
      fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
