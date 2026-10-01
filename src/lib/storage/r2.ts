import 'server-only'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Object storage — replaces src/app/api/upload/route.ts's use of
// supabase.storage. Neon has no object-storage product of its own, so this
// uses Cloudflare R2 via its S3-compatible API (the same @aws-sdk/client-s3
// client works against R2 unmodified, pointed at R2's endpoint).
//
// Required env vars (set in .env.local for dev, and in the deployment
// platform's project settings for prod):
//   R2_ACCOUNT_ID          — Cloudflare account ID
//   R2_ACCESS_KEY_ID       — from an R2 API token (Cloudflare dashboard ->
//                             R2 -> Manage API tokens -> Create API token;
//                             needs Object Read & Write on the bucket below)
//   R2_SECRET_ACCESS_KEY   — paired secret for the token above
//   R2_BUCKET_NAME         — defaults to 'afribook-uploads' (already created)
//   NEXT_PUBLIC_R2_PUBLIC_URL — the bucket's public base URL: either R2's
//                             own r2.dev subdomain (enable "Public Access"
//                             on the bucket) or a custom domain mapped to it.
//                             Uploaded files are served from here, not from
//                             the S3 API endpoint.
//
// None of these are secret-sharable by this migration pass — an R2 API
// token has to be minted by a human with Cloudflare dashboard access.

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'afribook-uploads'
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && PUBLIC_URL)
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error(
      'R2 is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY',
    )
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  })
  return client
}

export async function uploadToR2(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<{ url: string; key: string }> {
  if (!PUBLIC_URL) {
    throw new Error('R2 is not configured: set NEXT_PUBLIC_R2_PUBLIC_URL')
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  const base = PUBLIC_URL.replace(/\/$/, '')
  return { url: `${base}/${key}`, key }
}
