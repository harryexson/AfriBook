// ─── useRealtime Hook ────────────────────────────────────────
// Supabase Realtime subscriptions for mobile. Manages channel
// lifecycle, reconnection, and typing/presence indicators.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
  /** Table name to subscribe to. */
  table: string;
  /** Filter expression (e.g. 'ride_id=eq.xxx'). */
  filter?: string;
  /** Schema name. Default: 'public'. */
  schema?: string;
  /** Postgres event type(s) to listen for. */
  event?: PostgresEvent | PostgresEvent[];
  /** Whether to auto-subscribe. Default: true. */
  enabled?: boolean;
}

interface UseRealtimeReturn<T extends Record<string, any> = Record<string, any>> {
  /** Latest payload from the subscription. */
  payload: RealtimePostgresChangesPayload<T> | null;
  /** All payloads received since subscription started. */
  payloads: RealtimePostgresChangesPayload<T>[];
  /** Whether the channel is connected. */
  isConnected: boolean;
  /** Connection error if any. */
  error: string | null;
  /** Manually reconnect. */
  reconnect: () => void;
  /** Clear all received payloads. */
  clearPayloads: () => void;
}

export function useRealtime<T extends Record<string, any> = Record<string, any>>(
  options: UseRealtimeOptions,
): UseRealtimeReturn<T> {
  const {
    table,
    filter,
    schema = 'public',
    event = '*',
    enabled = true,
  } = options;

  const [payload, setPayload] = useState<RealtimePostgresChangesPayload<T> | null>(null);
  const [payloads, setPayloads] = useState<RealtimePostgresChangesPayload<T>[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subscribe = useCallback(() => {
    if (!enabled) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `realtime:${table}:${filter ?? 'all'}`;
    const channel = supabase.channel(channelName);

    const events = Array.isArray(event) ? event : [event];

    for (const e of events) {
      const config: any = {
        event: e,
        schema,
        table,
      };
      if (filter) {
        config.filter = filter;
      }

      channel.on(
        'postgres_changes',
        config,
        (payload: RealtimePostgresChangesPayload<T>) => {
          setPayload(payload);
          setPayloads((prev) => [...prev, payload]);
        },
      );
    }

    channel
      .on('system', {}, (payload: any) => {
        if (payload.status === 'ok') {
          setIsConnected(true);
          setError(null);
        } else if (payload.status === 'error') {
          setIsConnected(false);
          setError(payload.message ?? 'Connection error');
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [table, filter, schema, event, enabled]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      subscribe();
    }, 1000);
  }, [subscribe]);

  const clearPayloads = useCallback(() => {
    setPayloads([]);
    setPayload(null);
  }, []);

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [subscribe]);

  return {
    payload,
    payloads,
    isConnected,
    error,
    reconnect,
    clearPayloads,
  };
}
