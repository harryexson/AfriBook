import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from './Screen';
import Button from './ui/Button';
import { api } from '../lib/api';
import { formatMoney } from '../lib/money';
import { colors } from '../theme';
export default function ActivityScreen({ notifications = false }: { notifications?: boolean }) {
  const [kind, setKind] = useState(notifications ? 'notifications' : 'bookings'); const [rows, setRows] = useState<any[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(true); const router = useRouter();
  const load = useCallback(async () => { setBusy(true); setError(''); setRows([]); try { const r = await api.get<any>(kind === 'stays' ? '/api/stays/bookings' : `/api/mobile/activity?kind=${kind}`); setRows(r.data || []); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }, [kind]);
  useEffect(() => { load(); }, [load]);
  async function cancel(id: string) { setBusy(true); try { await api.delete(`/api/booking?id=${id}`); await load(); } catch (e) { setError((e as Error).message); setBusy(false); } }
  return <Screen title={notifications ? 'Notifications' : 'Your activity'} back={notifications}>
    <Text style={ui.title}>{notifications ? 'A little update.' : 'Your plans,\nbeautifully together.'}</Text>
    {!notifications ? <><View style={[ui.row, { flexWrap: 'wrap' }]}>{['bookings', 'orders', 'stays', 'deliveries'].map(k => <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: k === kind }} onPress={() => setKind(k)} style={{ backgroundColor: kind === k ? colors.primarySurface : colors.canvas, padding: 12, borderRadius: 10 }}><Text style={{ textTransform: 'capitalize' }}>{k}</Text></Pressable>)}</View><Button title="My rides" variant="outline" onPress={() => router.push('/ride/history')} /></> : null}
    <Feedback loading={busy} error={error} empty={!busy && !error && !rows.length ? 'Nothing here yet. Your updates will appear when you use AfriBook.' : undefined} />
    {rows.map(r => <View key={r.id} style={ui.panel}><Text style={ui.label}>{r.status || 'AFRIBOOK'}</Text><Text style={{ fontSize: 18, fontWeight: '700' }}>{r.title || (kind === 'stays' ? r.hotel?.name || 'Stay booking' : `${kind === 'orders' ? 'Order' : kind === 'deliveries' ? 'Delivery' : 'Booking'} ${String(r.id).slice(0, 8)}`)}</Text>
      {r.body ? <Text style={ui.body}>{r.body}</Text> : null}{r.start_time || r.created_at ? <Text style={ui.body}>{new Date(r.start_time || r.created_at).toLocaleString()}</Text> : null}
      {r.total != null || r.amount != null ? <Text style={{ fontWeight: '700' }}>{formatMoney(Number(r.total ?? r.amount), r.currency || r.currencyCode)}</Text> : null}
      {kind === 'deliveries' ? <Button title="Track package" variant="outline" onPress={() => router.push({ pathname: '/delivery/[id]', params: { id: r.id } })} /> : null}
      {r.payment_status ? <Text style={ui.body}>Payment · {r.payment_status}</Text> : null}
      {kind === 'bookings' && ['pending', 'confirmed'].includes(r.status) ? <Button title="Cancel booking" variant="outline" onPress={() => cancel(r.id)} disabled={busy} /> : null}
    </View>)}<Button title="Refresh" variant="ghost" onPress={load} disabled={busy} />
  </Screen>;
}
