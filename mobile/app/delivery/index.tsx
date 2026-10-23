import React, { useState } from 'react';
import { Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { api } from '../../src/lib/api';
import { geocodeAddress } from '../../src/lib/geo';
import { useMarketStore } from '../../src/stores/market-store';
import { useAuthStore } from '../../src/stores/auth-store';
export default function Delivery() {
  const router = useRouter(); const countryCode = useMarketStore(s => s.countryCode); const user = useAuthStore(s => s.user);
  const [pickup, setPickup] = useState(''); const [destination, setDestination] = useState(''); const [description, setDescription] = useState(''); const [recipient, setRecipient] = useState(''); const [phone, setPhone] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function request() {
    if (!user) { router.push('/(auth)/login'); return; } if (busy) return; setBusy(true); setError('');
    try {
      const [from, to] = await Promise.all([geocodeAddress(pickup, countryCode), geocodeAddress(destination, countryCode)]);
      if (!from || !to) throw new Error('We could not find both addresses. Include the street and city.');
      const r = await api.post<any>('/api/ridely/deliveries', { deliveryType: 'package', pickup: { lat: from.latitude, lng: from.longitude }, pickupAddress: pickup, destination: { lat: to.latitude, lng: to.longitude }, destinationAddress: destination, packageDetails: { description, recipientName: recipient, recipientPhone: phone }, paymentType: 'cash', countryCode });
      router.push({ pathname: '/delivery/[id]', params: { id: r.data.id } });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Screen title="Send a package"><Image source={require('../../assets/people/logistics.jpg')} style={ui.photo} /><Text style={ui.label}>A PARCEL. A PERSON. A CONNECTION.</Text><Text style={ui.title}>{"From your door\nto theirs."}</Text>
    <Input label="Pickup address" value={pickup} onChangeText={setPickup} /><Input label="Delivery address" value={destination} onChangeText={setDestination} /><Input label="What are you sending?" value={description} onChangeText={setDescription} /><Input label="Recipient name" value={recipient} onChangeText={setRecipient} /><Input label="Recipient phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <Text style={ui.body}>Cash payment. Your request is saved before a courier is assigned. Delivery availability depends on your market.</Text><Feedback error={error} /><Button title="Request delivery" onPress={request} loading={busy} disabled={!pickup.trim() || !destination.trim() || !description.trim() || !recipient.trim() || !phone.trim()} fullWidth />
  </Screen>;
}
