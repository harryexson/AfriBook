import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Input from './ui/Input';
import { api } from '../lib/api';
import { ui } from './Screen';
export interface AddressPlace { latitude: number; longitude: number; displayName: string }
export default function AddressField({ label, value, onChangeText, country, onSelect }: {
  label: string; value: string; onChangeText: (value: string) => void; country: string;
  onSelect?: (place: AddressPlace) => void;
}) {
  const [results, setResults] = useState<AddressPlace[]>([]); const [message, setMessage] = useState('');
  const selected = useRef('');
  useEffect(() => {
    let stale = false; setResults([]); setMessage('');
    if (value.trim().length < 3 || value === selected.current) return;
    const timer = setTimeout(async () => {
      try {
        const body = await api.get<{ data: AddressPlace[] }>('/api/geo?' + new URLSearchParams({ q: value.trim(), country }));
        if (!stale) { setResults(body.data); setMessage(body.data.length ? '© OpenStreetMap contributors · Photon' : 'No matches. Add a street, landmark and city.'); }
      } catch (error) { if (!stale) setMessage((error as Error).message); }
    }, 500);
    return () => { stale = true; clearTimeout(timer); };
  }, [value, country]);
  return <View style={{ gap: 6 }}><Input label={label} value={value} onChangeText={onChangeText} placeholder="Street, landmark and city" />
    {results.map((place, index) => <Pressable key={`${place.latitude}:${place.longitude}:${index}`} accessibilityRole="button" accessibilityLabel={place.displayName}
      style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ecdfd5' }} onPress={() => { selected.current = place.displayName; onChangeText(place.displayName); onSelect?.(place); setResults([]); setMessage(''); }}>
      <Text style={ui.body}>{place.displayName}</Text></Pressable>)}
    {!!message && <Text style={[ui.body, { fontSize: 11 }]}>{message}</Text>}
  </View>;
}
