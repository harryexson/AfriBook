import type { SupabaseClient } from '@supabase/supabase-js';
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

// ─── Upload Photo ─────────────────────────────────────────────

export async function uploadPhoto(
  sb: SupabaseClient,
  eventId: string,
  userId: string,
  imageUrl: string,
  caption?: string,
): Promise<EventPhoto> {
  const now = new Date().toISOString();

  // Get user profile info
  const { data: profile } = await sb
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  const photo = {
    event_id: eventId,
    uploaded_by: userId,
    uploader_name: profile?.full_name ?? 'Anonymous',
    uploader_avatar: profile?.avatar_url ?? null,
    url: imageUrl,
    thumbnail_url: imageUrl,
    caption: caption ?? null,
    tags: [],
    likes: 0,
    is_approved: false,
    created_at: now,
  };

  const { data, error } = await sb
    .from('event_photos')
    .insert(photo)
    .select()
    .single();

  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  return mapPhoto(data);
}

// ─── Get Event Photos ─────────────────────────────────────────

export async function getEventPhotos(
  sb: SupabaseClient,
  eventId: string,
  page: number = 1,
  limit: number = 20,
  filter?: 'all' | 'approved' | 'pending',
): Promise<PaginatedResult<EventPhoto>> {
  const offset = (page - 1) * limit;

  let query = sb
    .from('event_photos')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId);

  if (filter === 'approved') query = query.eq('is_approved', true);
  if (filter === 'pending') query = query.eq('is_approved', false);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to get photos: ${error.message}`);

  return {
    data: (data ?? []).map(mapPhoto),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ─── Delete Photo ─────────────────────────────────────────────

export async function deletePhoto(
  sb: SupabaseClient,
  photoId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: photo, error: fetchError } = await sb
    .from('event_photos')
    .select('uploaded_by')
    .eq('id', photoId)
    .single();

  if (fetchError || !photo) {
    return { success: false, error: 'Photo not found' };
  }

  // Check if user is the uploader or an admin
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (photo.uploaded_by !== userId && profile?.role !== 'admin') {
    return { success: false, error: 'Not authorized to delete this photo' };
  }

  const { error: deleteError } = await sb
    .from('event_photos')
    .delete()
    .eq('id', photoId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  return { success: true };
}

// ─── Approve Photo ────────────────────────────────────────────

export async function approvePhoto(
  sb: SupabaseClient,
  photoId: string,
): Promise<EventPhoto> {
  const { data, error } = await sb
    .from('event_photos')
    .update({ is_approved: true })
    .eq('id', photoId)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve photo: ${error.message}`);
  return mapPhoto(data);
}

// ─── Get Photo Gallery (approved only) ────────────────────────

export async function getPhotoGallery(
  sb: SupabaseClient,
  eventId: string,
): Promise<EventPhoto[]> {
  const { data, error } = await sb
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_approved', true)
    .order('likes', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get gallery: ${error.message}`);
  return (data ?? []).map(mapPhoto);
}

// ─── Generate Share Link ──────────────────────────────────────

export async function generateShareLink(
  sb: SupabaseClient,
  photoId: string,
  platform: ShareChannel,
): Promise<string> {
  const { data: photo } = await sb
    .from('event_photos')
    .select('url, event_id, events!inner(slug, title)')
    .eq('id', photoId)
    .single();

  if (!photo) throw new Error('Photo not found');

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afribook.app';
  const eventUrl = `${origin}/events/${photo.events.slug}/gallery`;
  const photoUrl = `${eventUrl}#photo-${photoId}`;
  const text = `Check out this photo from "${photo.events.title}" on AfriBook`;

  // Track the share
  await trackPhotoShare(sb, photoId, platform);

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

export async function trackPhotoShare(
  sb: SupabaseClient,
  photoId: string,
  platform: ShareChannel,
): Promise<void> {
  // Log share event
  await sb.from('photo_shares').insert({
    photo_id: photoId,
    channel: platform,
    created_at: new Date().toISOString(),
  });
}

// ─── Photo Stats ──────────────────────────────────────────────

export async function getPhotoStats(
  sb: SupabaseClient,
  eventId: string,
): Promise<PhotoGalleryStats> {
  const { data: photos, error } = await sb
    .from('event_photos')
    .select('id, url, likes, is_approved')
    .eq('event_id', eventId);

  if (error) throw new Error(`Failed to get photo stats: ${error.message}`);

  const allPhotos = photos ?? [];
  const approvedPhotos = allPhotos.filter((p) => p.is_approved);
  const pendingPhotos = allPhotos.filter((p) => !p.is_approved);

  // Get share counts
  const { data: shares } = await sb
    .from('photo_shares')
    .select('photo_id')
    .in('photo_id', allPhotos.map((p) => p.id));

  const shareCounts: Record<string, number> = {};
  for (const share of shares ?? []) {
    shareCounts[share.photo_id] = (shareCounts[share.photo_id] ?? 0) + 1;
  }

  const topPhotos = approvedPhotos
    .map((p) => ({
      id: p.id,
      url: p.url,
      likes: p.likes ?? 0,
      shares: shareCounts[p.id] ?? 0,
    }))
    .sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares))
    .slice(0, 10);

  return {
    totalPhotos: allPhotos.length,
    approvedPhotos: approvedPhotos.length,
    pendingPhotos: pendingPhotos.length,
    totalDownloads: 0, // Would need a downloads table
    totalShares: Object.values(shareCounts).reduce((sum, c) => sum + c, 0),
    topPhotos,
  };
}

// ─── Pre-Event Photos ─────────────────────────────────────────

export async function getPreEventPhotos(
  sb: SupabaseClient,
  eventId: string,
): Promise<EventPhoto[]> {
  const { data: event } = await sb
    .from('events')
    .select('start_date')
    .eq('id', eventId)
    .single();

  if (!event) throw new Error('Event not found');

  const { data, error } = await sb
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_approved', true)
    .lt('created_at', event.start_date)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get pre-event photos: ${error.message}`);
  return (data ?? []).map(mapPhoto);
}

// ─── Post-Event Photos ────────────────────────────────────────

export async function getPostEventPhotos(
  sb: SupabaseClient,
  eventId: string,
): Promise<EventPhoto[]> {
  const { data: event } = await sb
    .from('events')
    .select('start_date')
    .eq('id', eventId)
    .single();

  if (!event) throw new Error('Event not found');

  const { data, error } = await sb
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_approved', true)
    .gte('created_at', event.start_date)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get post-event photos: ${error.message}`);
  return (data ?? []).map(mapPhoto);
}

// ─── Mark as Cover Photo ──────────────────────────────────────

export async function markAsCover(
  sb: SupabaseClient,
  photoId: string,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  // Unset any existing cover
  await sb
    .from('event_photos')
    .update({ is_featured: false })
    .eq('event_id', eventId)
    .eq('is_featured', true);

  // Set new cover
  const { error } = await sb
    .from('event_photos')
    .update({ is_featured: true })
    .eq('id', photoId);

  if (error) return { success: false, error: error.message };

  // Also update event cover image
  const { data: photo } = await sb
    .from('event_photos')
    .select('url')
    .eq('id', photoId)
    .single();

  if (photo) {
    await sb
      .from('events')
      .update({ cover_image_url: photo.url })
      .eq('id', eventId);
  }

  return { success: true };
}

// ─── Mapper ───────────────────────────────────────────────────

function mapPhoto(row: Record<string, unknown>): EventPhoto {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    uploadedBy: row.uploaded_by as string,
    uploaderName: (row.uploader_name as string) ?? 'Anonymous',
    uploaderAvatar: (row.uploader_avatar as string) ?? undefined,
    url: row.url as string,
    thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
    caption: (row.caption as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    likes: (row.likes as number) ?? 0,
    isApproved: (row.is_approved as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}
