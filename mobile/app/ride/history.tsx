import React, { useCallback, useEffect, useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Button from '../../src/components/ui/Button';
import { api } from '../../src/lib/api';
export default function RideHistory() {
  const router = useRouter(); const [rides, setRides] = useState<any[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(true);
  const load = useCallback(async () => { setBusy(true); setError(''); try { const r = await api.get<any>('/api/ridely/rides'); setRides(r.data.rides || []); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <Screen title="My rides"><Text style={ui.title}>{"Every journey,\nright here."}</Text><Feedback loading={busy} error={error} empty={!rides.length && !busy ? 'Your rides will appear here after your first request.' : undefined} />
    {rides.map(r => <Pressable key={r.id} style={ui.panel} onPress={() => router.push({ pathname: '/ride/[id]', params: { id: r.id } })}><Text style={ui.label}>{String(r.status).replaceAll('_', ' ')}</Text><Text style={ui.body}>{r.pickup_address} → {r.destination_address}</Text></Pressable>)}<Button title="Refresh" variant="outline" onPress={load} disabled={busy} />
  </Screen>;
}
