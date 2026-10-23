import React, { useCallback, useEffect, useState } from 'react';
import { Text, Image, View, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ui, Feedback } from '../../../src/components/Screen';
import Button from '../../../src/components/ui/Button';
import Input from '../../../src/components/ui/Input';
import { api, API_BASE } from '../../../src/lib/api';
import { imageSourceFor } from '../../../src/lib/images';
import { formatMoney } from '../../../src/lib/money';
import { useAuthStore } from '../../../src/stores/auth-store';
import { colors } from '../../../src/theme';

export default function ListingDetail() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>(); const router = useRouter(); const user = useAuthStore(s => s.user);
  const [data, setData] = useState<any>(null); const [rooms, setRooms] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null);
  const [date, setDate] = useState(''); const [endDate, setEndDate] = useState(''); const [time, setTime] = useState('10:00'); const [notes, setNotes] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [receipt, setReceipt] = useState<any>(null);
  const load = useCallback(async () => {
    try {
      const path = kind === 'services' ? `/api/mobile/businesses?id=${id}` : `/api/${kind}/${id}`;
      const response = await api.get<any>(path); const p = response.data;
      setData(kind === 'stays' ? p.hotel : kind === 'products' ? p.product : p); setRooms(p.rooms || []);
    } catch (e) { setError((e as Error).message); }
  }, [id, kind]);
  useEffect(() => { load(); }, [load]);
  async function submit() {
    if (!user) { router.push('/(auth)/login'); return; } if (busy) return; setBusy(true); setError('');
    try {
      if (kind === 'services') {
        const start = new Date(`${date}T${time}:00`); if (!selected || !Number.isFinite(start.getTime()) || start <= new Date()) throw new Error('Choose a service and a future date and time.');
        const result = await api.post<any>('/api/booking', { businessId: id, serviceId: selected.id, startTime: start.toISOString(), endTime: new Date(start.getTime() + Number(selected.duration_minutes || 30) * 60000).toISOString(), notes });
        setReceipt(result);
      } else if (kind === 'stays') {
        if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(date) || endDate <= date) throw new Error('Select a room and valid check-in and check-out dates.');
        const result = await api.post<any>('/api/stays/bookings', { hotelId: id, roomId: selected.id, checkInDate: date, checkOutDate: endDate, guestName: user.name, guestEmail: user.email, guestPhone: user.phone, guests: 1, specialRequests: notes, liveOnly: true });
        if (result.persisted !== true) throw new Error('Your booking was not saved. Please contact support.');
        setReceipt(result.data);
      } else if (kind === 'products') {
        const result = await api.post<any>('/api/order', { businessId: data.businessId, items: [{ productId: id, quantity: 1 }], notes }); setReceipt(result);
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (receipt) return <Screen title="Request received"><View style={[ui.panel, { alignItems: 'center', paddingVertical: 36 }]}><Ionicons name="checkmark-circle" size={64} color={colors.successDark} /><Text style={ui.title}>All in one place.</Text><Text style={ui.body}>Your {kind === 'products' ? 'order' : 'booking request'} has been saved.</Text><Text style={ui.label}>{receipt.status || 'PENDING'}</Text><Text selectable style={ui.body}>Reference: {receipt.bookingCode || receipt.id}</Text><Text style={ui.body}>Payment status: {receipt.paymentStatus || receipt.payment_status || 'pending'}. Confirmation and payment updates appear in your activity.</Text></View><Button title="View my activity" onPress={() => router.replace('/(tabs)/bookings')} fullWidth /></Screen>;
  const image = data?.galleryImages?.[0] || data?.images?.[0] || data?.cover_image_url || data?.media?.coverUrl || data?.media?.cover_url;
  return <Screen title={kind === 'services' ? 'Services' : kind === 'stays' ? 'Your stay' : kind === 'products' ? 'Local marketplace' : 'Events'}>
    <Feedback error={error} loading={!data && !error} />{data ? <>
      <Image source={imageSourceFor(id, kind === 'stays' ? 'Hotels' : kind === 'events' ? 'Events' : kind === 'products' ? 'Fashion' : 'Beauty', typeof image === 'string' ? image : null)} style={ui.photo} accessibilityLabel={data.name || data.title} />
      <Text style={ui.title}>{data.name || data.title}</Text><Text style={ui.body}>{data.description || data.shortDescription}</Text>
      {data.rating ? <Text style={ui.label}>★ {Number(data.rating).toFixed(1)}</Text> : null}
      {kind === 'services' ? <><Text style={[ui.title, { fontSize: 22 }]}>Make time for you.</Text>{!(data.services || []).length ? <Feedback empty="This business has not published bookable services yet." /> : data.services.map((s: any) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected?.id === s.id }} key={s.id} style={[ui.panel, selected?.id === s.id && { backgroundColor: colors.primarySurface }]} onPress={() => setSelected(s)}><View style={ui.row}><Text style={{ flex: 1, fontWeight: '700' }}>{s.name}</Text><Text>{formatMoney(Number(s.price), s.currency)}</Text></View><Text style={ui.body}>{s.duration_minutes} min</Text></Pressable>)}</> : null}
      {kind === 'stays' ? <><Text style={ui.body}>{data.address} · {data.city}</Text><Text style={ui.body}>{(data.amenities || []).join(' · ')}</Text>{rooms.map(r => <Pressable accessibilityRole="button" key={r.id} style={[ui.panel, selected?.id === r.id && { backgroundColor: colors.primarySurface }]} onPress={() => setSelected(r)}><Text style={{ fontWeight: '700', fontSize: 18 }}>{r.name}</Text><Text style={ui.body}>{r.maxOccupancy} guests · {formatMoney(r.pricePerNight, r.currencyCode)} / night</Text></Pressable>)}</> : null}
      {kind === 'services' || kind === 'stays' ? <><Input label={kind === 'stays' ? 'Check-in date (YYYY-MM-DD)' : 'Requested date (YYYY-MM-DD)'} value={date} onChangeText={setDate} placeholder="2026-11-15" />{kind === 'services' ? <><Input label="Requested local time (HH:MM)" value={time} onChangeText={setTime} /><Text style={ui.body}>This is a booking request, subject to the provider’s availability and confirmation.</Text></> : <Input label="Check-out date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />}</> : null}
      {kind === 'products' ? <View style={ui.panel}><Text style={ui.title}>{formatMoney(data.price, data.currency)}</Text><Text style={ui.body}>{data.stock > 0 ? `${data.stock} in stock` : 'Currently out of stock'} · {data.businessName}</Text><Text style={ui.body}>Submit an order for one item. The business confirms pickup or delivery and payment arrangements.</Text></View> : null}
      {kind !== 'events' ? <><Input label="Notes or special requests (optional)" value={notes} onChangeText={setNotes} multiline /><Button title={kind === 'products' ? 'Submit order' : 'Request booking'} onPress={submit} loading={busy} disabled={kind === 'products' ? !data.isAvailable || data.stock < 1 : !selected} fullWidth /></> : <><Text style={ui.body}>{data.venue_name} · {new Date(data.start_date).toLocaleString()}</Text><Text style={ui.body}>Ticket checkout is handled by the event’s secure web checkout.</Text><Button title="Open event ticket checkout" onPress={async () => { await Linking.openURL(`${API_BASE}/events/${data.slug || id}`); }} fullWidth /></>}
    </> : null}
  </Screen>;
}
