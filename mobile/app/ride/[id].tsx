import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, Linking, Share, AppState } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import MapView from '../../src/components/MapView';
import { api } from '../../src/lib/api';
import { formatMoney } from '../../src/lib/money';
import { colors } from '../../src/theme';

export default function RideDetail() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>(); const driving = mode === 'driver';
  const [ride, setRide] = useState<any>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [pin, setPin] = useState('');
  const load = useCallback(async () => { try { const r = await api.get<any>(`/api/ridely/rides/${id}`); setRide(r.data); setError(''); } catch (e) { setError((e as Error).message); } }, [id]);
  useEffect(() => { let active = true; load(); const timer = setInterval(() => { if (active && AppState.currentState === 'active') load(); }, 5000); return () => { active = false; clearInterval(timer); }; }, [load]);
  async function action(status: string) {
    if (busy) return; setBusy(true); setError('');
    try {
      if (status === 'cancelled') await api.delete(`/api/ridely/rides/${id}`, { reason: driving ? 'Driver cancelled' : 'Rider cancelled' });
      else {
        if (status === 'in_progress') { const check = await api.post<{ matched: boolean }>(`/api/ridely/rides/${id}/pin/verify`, { pin }); if (!check.matched) throw new Error('That PIN does not match. Ask the rider to check it.'); }
        await api.patch(`/api/ridely/rides/${id}`, { status });
      }
      await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function showPin() { try { const result = await api.get<any>(`/api/ridely/rides/${id}/pin`); setPin(result.pin || result.data?.pin || ''); } catch (e) { setError((e as Error).message); } }
  async function share() { try { const result = await api.post<any>(`/api/rides/${id}/share`); const url = result.shareUrl || result.url || result.data?.shareUrl; if (!url) throw new Error('Trip sharing is unavailable'); await Share.share({ message: url }); } catch (e) { setError((e as Error).message); } }
  const finished = ['completed', 'cancelled'].includes(ride?.status);
  const next: Record<string, [string, string]> = { accepted: ['en_route', 'On my way'], en_route: ['arrived', 'I have arrived'], arrived: ['in_progress', 'Verify PIN & start trip'], in_progress: ['completed', 'Complete trip'] };
  return <Screen title={driving ? 'Your active trip' : 'Your ride'}><Feedback error={error} loading={!ride && !error} />{ride ? <>
    {ride.driverLocation ? <MapView region={{ latitude: Number(ride.driverLocation.lat), longitude: Number(ride.driverLocation.lng), latitudeDelta: 0.04, longitudeDelta: 0.04 }} markers={[{ id: 'driver', coordinate: { latitude: Number(ride.driverLocation.lat), longitude: Number(ride.driverLocation.lng) }, title: 'Driver' }]} style={{ height: 230, borderRadius: 16 }} /> : null}
    <View style={ui.panel}><Text style={ui.label}>{String(ride.status).replaceAll('_', ' ')}</Text><Text style={ui.title}>{finished ? (ride.status === 'completed' ? 'You’ve arrived.' : 'Ride cancelled.') : 'Your journey,\nall in one place.'}</Text><Text style={ui.body}>From · {ride.pickup_address}</Text><Text style={ui.body}>To · {ride.destination_address}</Text>
    {ride.pricing?.currencyCode ? <Text style={{ fontWeight: '700', fontSize: 24, color: colors.ink }}>{formatMoney(Number(ride.actual_fare ?? ride.estimated_fare ?? ride.pricing.estimatedFare), ride.pricing.currencyCode)}</Text> : null}</View>
    {ride.driver && !driving ? <View style={ui.panel}><Text style={{ fontWeight: '700', fontSize: 18 }}>{ride.driver.name || 'Your driver'}</Text><Text style={ui.body}>{[ride.driver.vehicle_color, ride.driver.vehicle_make, ride.driver.vehicle_model, ride.driver.license_plate].filter(Boolean).join(' · ')}</Text>{ride.driver.phone ? <Button title="Call driver" variant="outline" onPress={() => Linking.openURL(`tel:${ride.driver.phone}`)} /> : null}</View> : null}
    {!finished && !driving ? <><Button title="Show my trip PIN" variant="outline" onPress={showPin} />{pin ? <Text style={[ui.title, { textAlign: 'center', letterSpacing: 10 }]}>{pin}</Text> : null}<Button title="Share trip" variant="outline" onPress={share} /></> : null}
    {driving && ride.status === 'arrived' ? <Input label="Rider’s 4-digit PIN" keyboardType="number-pad" maxLength={4} value={pin} onChangeText={setPin} /> : null}
    {driving && next[ride.status] ? <Button title={next[ride.status][1]} loading={busy} onPress={() => action(next[ride.status][0])} fullWidth /> : null}
    {!finished && ride.status !== 'in_progress' ? <Button title="Cancel this ride" variant="outline" disabled={busy} onPress={() => action('cancelled')} /> : null}
  </> : null}</Screen>;
}
