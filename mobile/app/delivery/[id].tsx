import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, AppState } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Button from '../../src/components/ui/Button';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme';
export default function TrackDelivery() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [data, setData] = useState<any>(null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { const r = await api.get<any>(`/api/ridely/deliveries/${id}`); setData(r.data); setError(''); } catch (e) { setError((e as Error).message); } }, [id]);
  useEffect(() => { load(); const timer = setInterval(() => { if (AppState.currentState === 'active') load(); }, 8000); return () => clearInterval(timer); }, [load]);
  const steps = [['requesting', 'Request received'], ['accepted', 'Courier assigned'], ['picked_up', 'Package picked up'], ['in_transit', 'On the way'], ['delivered', 'Delivered']];
  const statusIndex: Record<string, number> = { requesting: 0, searching: 0, matched: 1, accepted: 1, en_route_to_pickup: 1, at_pickup: 1, picked_up: 2, in_transit: 3, at_dropoff: 3, delivered: 4 };
  return <Screen title="Track package"><Text style={ui.title}>{"A little closer\nwith every step."}</Text><Feedback loading={!data && !error} error={error} />{data ? <>
    <View style={ui.panel}><Text style={ui.label}>{data.status.replaceAll('_', ' ')}</Text><Text style={ui.body}>From · {data.pickup_address}</Text><Text style={ui.body}>To · {data.destination_address}</Text><Text selectable style={ui.body}>Reference: {data.id}</Text></View>
    {data.status !== 'cancelled' ? steps.map(([key, title], i) => <View key={key} style={ui.row}><Ionicons name={i <= (statusIndex[data.status] ?? -1) ? 'checkmark-circle' : 'ellipse-outline'} size={25} color={i <= (statusIndex[data.status] ?? -1) ? colors.successDark : colors.border} /><Text style={[ui.body, { flex: 1 }]}>{title}</Text></View>) : <Text style={ui.body}>This delivery was cancelled.</Text>}
    {data.driver ? <View style={ui.panel}><Text style={ui.label}>YOUR COURIER</Text><Text style={ui.body}>{data.driver.name || 'Courier assigned'}</Text></View> : null}
  </> : null}<Button title="Refresh tracking" variant="outline" onPress={load} /></Screen>;
}
