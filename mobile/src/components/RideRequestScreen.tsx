import React, { useState } from 'react';
import { Text, Image, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from './Screen';
import AddressField, { type AddressPlace } from './AddressField';
import Button from './ui/Button';
import { useLocation } from '../hooks/useLocation';
import { geocodeAddress } from '../lib/geo';
import { api } from '../lib/api';
import { useMarketStore } from '../stores/market-store';
import { useAuthStore } from '../stores/auth-store';
import { colors } from '../theme';

export default function RideRequestScreen() {
  const router = useRouter(); const countryCode = useMarketStore(s => s.countryCode); const user = useAuthStore(s => s.user);
  const { location, startTracking, error: locationError } = useLocation({ highAccuracy: false });
  const [pickupPlace, setPickupPlace] = useState<AddressPlace | null>(null); const [destinationPlace, setDestinationPlace] = useState<AddressPlace | null>(null);
  const [pickup, setPickup] = useState(''); const [destination, setDestination] = useState(''); const [type, setType] = useState('economy');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function request() {
    if (!user) { router.push('/(auth)/login'); return; } if (busy) return; setBusy(true); setError('');
    try {
      const [from, to] = await Promise.all([pickupPlace ? Promise.resolve(pickupPlace) : pickup.trim() ? geocodeAddress(pickup, countryCode) : Promise.resolve(location), destinationPlace ? Promise.resolve(destinationPlace) : geocodeAddress(destination, countryCode)]);
      if (!from || !to) throw new Error('We could not locate these addresses. Include your city or use your current location.');
      const response = await api.post<{ data: { id: string } }>('/api/ridely/rides', {
        pickup: { lat: from.latitude, lng: from.longitude }, pickupAddress: pickup || 'Current location',
        destination: { lat: to.latitude, lng: to.longitude }, destinationAddress: destination,
        rideType: type, paymentType: 'cash', countryCode,
      });
      router.push({ pathname: '/ride/[id]', params: { id: response.data.id } });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Screen title="Request a ride"><Image source={require('../../assets/editorial/city-ride.jpg')} style={ui.photo} />
    <Text style={ui.label}>YOUR CITY, YOUR NEXT STOP</Text><Text style={ui.title}>{"Where are we\ngoing today?"}</Text>
    <AddressField label="Pickup" value={pickup} country={countryCode} onChangeText={value => { setPickup(value); setPickupPlace(null); }} onSelect={setPickupPlace} />
    <Button title={location ? 'Current location ready' : 'Use my current location'} variant="outline" onPress={startTracking} />
    <AddressField label="Destination" value={destination} country={countryCode} onChangeText={value => { setDestination(value); setDestinationPlace(null); }} onSelect={setDestinationPlace} />
    <View style={[ui.row, { flexWrap: 'wrap' }]}>{['economy', 'comfort', 'premium', 'xl', 'motorcycle'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: type === value }} onPress={() => setType(value)} style={{ backgroundColor: type === value ? colors.primarySurface : colors.canvas, padding: 12, borderRadius: 10 }}><Text style={{ color: colors.ink, textTransform: 'capitalize' }}>{value}</Text></Pressable>)}</View>
    <Text style={ui.body}>Cash payment. The server calculates your fare when you request a ride. Driver availability and trip pricing depend on your market.</Text>
    <Feedback error={error || locationError} /><Button title="Request ride" loading={busy} disabled={!destination.trim() || (!pickup.trim() && !location)} onPress={request} fullWidth />
    <Button title="My rides" variant="ghost" onPress={() => router.push('/ride/history')} fullWidth />
  </Screen>;
}
