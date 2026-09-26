import { query } from '@/lib/neon/admin';
import type { EventPhoto, ShareChannel } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PhotoGalleryStats {
  totalPhotos: number;
  approvedPhotos: number;
  pendingPhotos: number;
  totalDownloads: number;
  totalShares: number;
  topPhotos: { id: string; url: string; likes: number; shares: number }[];
}

// The real `event_photos` table (status enum pending/approved/rejected,
// is_cover, download_count, share_count) has no `tags`/`likes` columns —
// those are dropped rather than faked. `uploaded_by`/`url`/`is_approved`
// map to `user_id`/`image_url`/`status = 'approved'`.
interface EventPhotoRow {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string | null;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_cover: boolean | null;
  download_count: number | null;
  share_count: number | null;
  created_at: string;
}

// ─── Upload Photo ─────────────────────────────────────────────

export async function uploadPhoto(
  eventId: string,
  userId: string,
  imageUrl: string,
  caption?: string,
): Promise<EventPhoto> {
  const now = new Date().toISOString();

  // Get user profile info
  const profileRows = await query<{ full_name: string | null }>(
    `SELECT full_name FROM profiles WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const profile = profileRows[0];

  const rows = await query<EventPhotoRow>(
    `INSERT INTO event_photos (event_id, user_id, user_name, image_url, thumbnail_url, caption, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [eventId, userId, profile?.full_name ?? 'Anonymous', imageUrl, imageUrl, caption ?? null, 'pending', now],
  );

  const data = rows[0];
  if (!data) throw new Error('Failed to upload photo');
  return mapPhoto(data);
}

// ─── Get Event Photos ─────────────────────────────────────────

export async function getEventPhotos(
  eventId: string,
  page: number = 1,
  limit: number = 20,
  filter?: 'all' | 'approved' | 'pending',
): Promise<PaginatedResult<EventPhoto>> {
  const offset = (page - 1) * limit;

  const conditions = ['event_id = $1'];
  const values: unknown[] = [eventId];

  if (filter === 'approved') conditions.push(`status = 'approved'`);
  if (filter === 'pending') conditions.push(`status = 'pending'`);

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM event_photos ${whereClause}`,
    values,
  );
  const total = Number(countRows[0]?.count ?? 0);

  const dataRows = await query<EventPhotoRow>(
    `SELECT * FROM event_photos ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return {
    data: dataRows.map(mapPhoto),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Delete Photo ─────────────────────────────────────────────

export async function deletePhoto(
  photoId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const photoRows = await query<{ user_id: string }>(
    `SELECT user_id FROM event_photos WHERE id = $1 LIMIT 1`,
    [photoId],
  );
  const photo = photoRows[0];

  if (!photo) {
    return { success: false, error: 'Photo not found' };
  }

  // Check if user is the uploader or an admin
  const profileRows = await query<{ role: string | null }>(
    `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const profile = profileRows[0];

  if (photo.user_id !== userId && profile?.role !== 'admin') {
    return { success: false, error: 'Not authorized to delete this photo' };
  }

  await query(`DELETE FROM event_photos WHERE id = $1`, [photoId]);

  return { success: true };
}

// ─── Approve Photo ────────────────────────────────────────────

export async function approvePhoto(photoId: string): Promise<EventPhoto> {
  const rows = await query<EventPhotoRow>(
    `UPDATE event_photos SET status = 'approved' WHERE id = $1 RETURNING *`,
    [photoId],
  );
  const data = rows[0];
  if (!data) throw new Error('Failed to approve photo');
  return mapPhoto(data);
}

// ─── Get Photo Gallery (approved only) ────────────────────────

export async function getPhotoGallery(eventId: string): Promise<EventPhoto[]> {
  const rows = await query<EventPhotoRow>(
    `SELECT * FROM event_photos WHERE event_id = $1 AND status = 'approved' ORDER BY created_at DESC`,
    [eventId],
  );
  return rows.map(mapPhoto);
}

// ─── Generate Share Link ──────────────────────────────────────

export async function generateShareLink(photoId: string, platform: ShareChannel): Promise<string> {
  const rows = await query<{ image_url: string; event_id: string; slug: string; title: string }>(
    `SELECT p.image_url, p.event_id, e.slug, e.title
     FROM event_photos p JOIN events e ON e.id = p.event_id
     WHERE p.id = $1 LIMIT 1`,
    [photoId],
  );
  const photo = rows[0];

  if (!photo) throw new Error('Photo not found');

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${photo.slug}/gallery`;
  const photoUrl = `${eventUrl}#photo-${photoId}`;
  const text = `Check out this photo from "${photo.title}" on AfriBook`;

  // Track the share
  await trackPhotoShare(photoId, platform);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}&quote=${encodeURIComponent(text)}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(photoUrl)}&text=${encodeURIComponent(text)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${photoUrl}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(photoUrl)}`;
    case 'sms':
      return `sms:?body=${encodeURIComponent(`${text}\n${photoUrl}`)}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(photoUrl)}`;
    case 'copy_link':
      return photoUrl;
    default:
      return photoUrl;
  }
}

// ─── Track Photo Share ────────────────────────────────────────

// `photo_shares` does not exist. The closest real equivalent is
// `event_shares`, which has no photo_id column, so the photo id is
// encoded into `share_url` as `photo:<photoId>` and event_photos'
// own share_count/download_count counters are bumped directly.
export async function trackPhotoShare(photoId: string, platform: ShareChannel): Promise<void> {
  const photoRows = await query<{ event_id: string }>(
    `SELECT event_id FROM event_photos WHERE id = $1 LIMIT 1`,
    [photoId],
  );
  const photo = photoRows[0];
  if (!photo) return;

  await query(
    `INSERT INTO event_shares (event_id, platform, share_url, clicked, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [photo.event_id, platform, `photo:${photoId}`, false, new Date().toISOString()],
  );

  await query(
    `UPDATE event_photos SET share_count = COALESCE(share_count, 0) + 1 WHERE id = $1`,
    [photoId],
  );
}

// ─── Photo Stats ──────────────────────────────────────────────

export async function getPhotoStats(eventId: string): Promise<PhotoGalleryStats> {
  const photos = await query<{ id: string; image_url: string; share_count: number | null; status: string }>(
    `SELECT id, image_url, share_count, status FROM event_photos WHERE event_id = $1`,
    [eventId],
  );

  const allPhotos = photos;
  const approvedPhotos = allPhotos.filter((p) => p.status === 'approved');
  const pendingPhotos = allPhotos.filter((p) => p.status === 'pending');

  const topPhotos = approvedPhotos
    .map((p) => ({
      id: p.id,
      url: p.image_url,
      likes: 0, // event_photos has no likes column
      shares: p.share_count ?? 0,
    }))
    .sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares))
    .slice(0, 10);

  return {
    totalPhotos: allPhotos.length,
    approvedPhotos: approvedPhotos.length,
    pendingPhotos: pendingPhotos.length,
    totalDownloads: 0, // Would need a downloads table
    totalShares: allPhotos.reduce((sum, p) => sum + (p.share_count ?? 0), 0),
    topPhotos,
  };
}

// ─── Pre-Event Photos ─────────────────────────────────────────

export async function getPreEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const eventRows = await query<{ start_date: string }>(`SELECT start_date FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const event = eventRows[0];

  if (!event) throw new Error('Event not found');

  const rows = await query<EventPhotoRow>(
    `SELECT * FROM event_photos WHERE event_id = $1 AND status = 'approved' AND created_at < $2 ORDER BY created_at DESC`,
    [eventId, event.start_date],
  );

  return rows.map(mapPhoto);
}

// ─── Post-Event Photos ────────────────────────────────────────

export async function getPostEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const eventRows = await query<{ start_date: string }>(`SELECT start_date FROM events WHERE id = $1 LIMIT 1`, [eventId]);
  const event = eventRows[0];

  if (!event) throw new Error('Event not found');

  const rows = await query<EventPhotoRow>(
    `SELECT * FROM event_photos WHERE event_id = $1 AND status = 'approved' AND created_at >= $2 ORDER BY created_at DESC`,
    [eventId, event.start_date],
  );

  return rows.map(mapPhoto);
}

// ─── Mark as Cover Photo ──────────────────────────────────────

export async function markAsCover(
  photoId: string,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  // Unset any existing cover
  await query(
    `UPDATE event_photos SET is_cover = false WHERE event_id = $1 AND is_cover = true`,
    [eventId],
  );

  // Set new cover
  await query(`UPDATE event_photos SET is_cover = true WHERE id = $1`, [photoId]);

  // Also update event cover image
  const photoRows = await query<{ image_url: string }>(
    `SELECT image_url FROM event_photos WHERE id = $1 LIMIT 1`,
    [photoId],
  );
  const photo = photoRows[0];

  if (photo) {
    await query(`UPDATE events SET cover_image_url = $1 WHERE id = $2`, [photo.image_url, eventId]);
  }

  return { success: true };
}

// ─── Mapper ───────────────────────────────────────────────────

function mapPhoto(row: EventPhotoRow): EventPhoto {
  return {
    id: row.id,
    eventId: row.event_id,
    uploadedBy: row.user_id,
    uploaderName: row.user_name ?? 'Anonymous',
    uploaderAvatar: undefined,
    url: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? row.image_url,
    caption: row.caption ?? undefined,
    tags: [],
    likes: 0,
    isApproved: row.status === 'approved',
    createdAt: row.created_at,
  };
}
