import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, AppState, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from './Screen';
import Button from './ui/Button';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth-store';
import { useLocation } from '../hooks/useLocation';
import { formatMoney } from '../lib/money';

export default function DriverDashboard() {
  const router = useRouter(); const user = useAuthStore(s => s.user); const { location, startTracking, stopTracking, isTracking, error: locationError } = useLocation();
  const [data, setData] = useState<any>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData(await api.get('/api/mobile/driver')); setError(''); } catch (e) { setError((e as Error).message); } }, []);
  useEffect(() => { if (!user) return; load(); const t = setInterval(() => { if (AppState.currentState === 'active') load(); }, 10000); return () => clearInterval(t); }, [load, user?.id]);
  useEffect(() => { if (!location || !data?.driver?.id || !isTracking || !['online', 'on_trip'].includes(data.driver.status)) return;
    api.post('/api/ridely/location', { driverId: data.driver.id, lat: location.latitude, lng: location.longitude, heading: location.heading, accuracy: location.accuracy, speed: location.speed }).catch(e => setError(e.message));
  }, [location, isTracking, data?.driver?.id, data?.driver?.status]);
  async function toggle() {
    if (busy) return; setBusy(true); setError('');
    try { const online = ['online', 'on_trip'].includes(data?.driver?.status); await api.post('/api/driver/status', { action: online ? 'offline' : 'online' }); if (online && data.driver.status !== 'on_trip') stopTracking(); else if (!online) await startTracking(); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function offerAction(offer: any, accept: boolean) {
    if (busy) return; setBusy(true); setError('');
    try {
      if (accept) { await api.post(`/api/ridely/rides/${offer.ride_id}/accept`, { driverId: data.driver.id }); router.push({ pathname: '/ride/[id]', params: { id: offer.ride_id, mode: 'driver' } }); }
      else await api.post('/api/mobile/driver', { offerId: offer.id });
      await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Screen title="AfriBook Driver" back={false}><Button title="Back to marketplace" variant="ghost" onPress={() => router.replace('/(tabs)')} />
    <Image source={require('../../assets/editorial/city-ride.jpg')} style={ui.photo} /><Text style={ui.label}>YOUR CITY. YOUR OPPORTUNITY.</Text><Text style={ui.title}>{user?.name ? `Hello, ${user.name.split(' ')[0]}.` : 'Your day,\non the move.'}</Text><Feedback error={error || locationError} />
    {!user ? <><Text style={ui.body}>Sign in to apply, receive trip offers and manage your driver account.</Text><Button title="Sign in" onPress={() => router.push('/(auth)/login')} /></> : !data ? <Button title="Load my driver account" onPress={load} /> : !data.driver ? <View style={ui.panel}><Text style={ui.body}>Start your application. Your identity, vehicle and payout details are reviewed before you can receive trips.</Text><Button title="Apply to drive" onPress={() => router.push('/driver-apply')} /></View> : <>
      <View style={ui.panel}><Text style={ui.label}>{String(data.driver.status).replaceAll('_', ' ')}</Text><Text style={ui.body}>{data.driver.status === 'pending_review' ? 'Your application is being reviewed.' : 'Your availability is saved to your driver account.'}</Text>
      {data.driver.status !== 'pending_review' ? <Button title={['online', 'on_trip'].includes(data.driver.status) ? 'Go offline after this trip' : 'Go online'} onPress={toggle} loading={busy} /> : null}
      {!isTracking && ['online', 'on_trip'].includes(data.driver.status) ? <Button title="Enable live location for this session" variant="outline" onPress={startTracking} /> : null}</View>
      {data.activeRide ? <View style={ui.panel}><Text style={ui.label}>ACTIVE TRIP</Text><Text style={ui.body}>{data.activeRide.pickup_address} → {data.activeRide.destination_address}</Text><Button title="Open trip" onPress={() => router.push({ pathname: '/ride/[id]', params: { id: data.activeRide.id, mode: 'driver' } })} /></View> : null}
      <Text style={[ui.title, { fontSize: 23 }]}>Trip offers</Text>
      {!data.offers.length ? <Feedback empty="No offers right now. Stay online and check that location sharing is enabled." /> : data.offers.map((o: any) => <View key={o.id} style={ui.panel}><Text style={ui.body}>Pickup · {o.pickup_address}</Text><Text style={ui.body}>Drop-off · {o.destination_address}</Text>{o.pricing?.currencyCode ? <Text style={{ fontWeight: '700', fontSize: 22 }}>{formatMoney(Number(o.estimated_fare), o.pricing.currencyCode)}</Text> : null}<Button title="Accept trip" onPress={() => offerAction(o, true)} disabled={busy} /><Button title="Decline" variant="outline" onPress={() => offerAction(o, false)} disabled={busy} /></View>)}
      <Button title="Earnings & trip history" variant="outline" onPress={() => router.push('/driver/earnings')} />
    </>}
  </Screen>;
}
