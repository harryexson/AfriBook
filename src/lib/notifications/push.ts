// ─── Push Notification Service ───────────────────────────────
// Server-side push notification delivery via Expo Push API.
// Supports both Expo (iOS/Android) and FCM (Android).
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';

// ─── Types ───────────────────────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  channelId?: string;
}

// ─── Send Push to User ───────────────────────────────────────

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const supabase = await createClient();

  const { data: tokens } = (await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId)
    .eq('is_active', true)) as { data: { token: string; platform?: string }[] | null };

  if (!tokens?.length) return { sent: 0, failed: 0 };

  // Also store in notifications table for in-app display
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'booking',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    read: false,
  });

  // Send via Expo Push API
  const expoMessages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: payload.sound ?? 'default',
    badge: payload.badge,
  }));

  let sent = 0;
  let failed = 0;

  // Batch send in chunks of 100 (Expo limit)
  for (let i = 0; i < expoMessages.length; i += 100) {
    const batch = expoMessages.slice(i, i + 100);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        const result = await response.json() as { data?: Array<{ status: string }> };
        if (result.data) {
          for (const item of result.data) {
            if (item.status === 'ok') sent++;
            else failed++;
          }
        } else {
          sent += batch.length;
        }
      } else {
        failed += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed };
}

// ─── Send Push to Multiple Users ─────────────────────────────

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const supabase = await createClient();

  const { data: tokens } = (await supabase
    .from('push_tokens')
    .select('token, platform, user_id')
    .in('user_id', userIds)
    .eq('is_active', true)) as { data: { token: string; platform?: string; user_id?: string }[] | null };

  if (!tokens?.length) return { sent: 0, failed: 0 };

  const expoMessages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: payload.sound ?? 'default',
  }));

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < expoMessages.length; i += 100) {
    const batch = expoMessages.slice(i, i + 100);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        const result = await response.json() as { data?: Array<{ status: string }> };
        if (result.data) {
          for (const item of result.data) {
            if (item.status === 'ok') sent++;
            else failed++;
          }
        } else {
          sent += batch.length;
        }
      } else {
        failed += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed };
}

// ─── Send Ride Offer Notifications ───────────────────────────

export async function sendRideOfferNotification(
  driverId: string,
  rideId: string,
  pickupAddress: string,
  estimatedEarnings: number,
  rideType: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: driver } = await supabase
    .from('drivers')
    .select('userId')
    .eq('id', driverId)
    .single();

  if (!driver) return;

  await sendPushToUser(driver.userId, {
    title: 'New Ride Request',
    body: `Pickup: ${pickupAddress} — Est. earnings: $${estimatedEarnings.toFixed(2)}`,
    data: { rideId, type: 'ride_offer', rideType },
    sound: 'default',
  });
}

// ─── Send Ride Status Notifications ──────────────────────────

export async function sendRideStatusNotification(
  userId: string,
  rideId: string,
  status: string,
  message: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: 'Ride Update',
    body: message,
    data: { rideId, type: 'ride_status', status },
  });
}
