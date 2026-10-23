import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, ui, Feedback } from './Screen';
import Button from './ui/Button';
import { api } from '../lib/api';
import { formatMoney } from '../lib/money';
export default function DriverEarnings() {
  const [data, setData] = useState<any>(null); const [trips, setTrips] = useState<any[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(true);
  async function load() { setBusy(true); setError(''); try { const [earnings, history] = await Promise.all([api.get<any>('/api/ridely/earnings'), api.get<any>('/api/driver/trips')]); setData(earnings); setTrips(history.trips || []); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  useEffect(() => { load(); }, []);
  return <Screen title="Your earnings"><Text style={ui.label}>THE WORK YOU DO, RECOGNISED</Text><Text style={ui.title}>{"Every trip\nadds up."}</Text><Feedback loading={busy} error={error} />
    {data ? <>{['week', 'month', 'all'].map(period => <View key={period} style={ui.panel}><Text style={ui.label}>{period === 'all' ? 'ALL TIME' : `THIS ${period.toUpperCase()}`}</Text><Text style={ui.title}>{formatMoney(Number(data.summaries[period]?.totalEarnings || 0), data.balance.currencyCode)}</Text><Text style={ui.body}>{data.summaries[period]?.tripCount || 0} trips</Text></View>)}
    <Text style={[ui.title, { fontSize: 22 }]}>Trip history</Text>{!trips.length ? <Feedback empty="Your completed trips and deliveries will appear here." /> : trips.map(t => <View key={t.id} style={ui.panel}><Text style={ui.label}>{t.kind} · {t.status}</Text><Text style={ui.body}>{t.pickup} → {t.dropoff}</Text><Text style={{ fontWeight: '700' }}>{formatMoney(t.earnings, data.balance.currencyCode)}</Text></View>)}</> : null}
    <Button title="Refresh" variant="outline" onPress={load} disabled={busy} />
  </Screen>;
}
