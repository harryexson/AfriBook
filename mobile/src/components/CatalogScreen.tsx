import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Image, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useMarketStore } from '../stores/market-store';
import { imageSourceFor } from '../lib/images';
import { formatMoney } from '../lib/money';
import { colors } from '../theme';
import { ui, Feedback } from './Screen';

export type CatalogKind = 'services' | 'products' | 'stays' | 'events';
export interface CatalogItem { id: string; name: string; description: string; image?: string; rating?: number; price?: number; currency?: string; location?: string; }
export const catalogTitles: Record<CatalogKind, string> = { services: 'Local services', products: 'Local marketplace', stays: 'Find your stay', events: 'Out in your city' };
export default function CatalogScreen({ kind }: { kind: CatalogKind }) {
  const country = useMarketStore(s => s.countryCode); const router = useRouter(); const sequence = useRef(0);
  const [items, setItems] = useState<CatalogItem[]>([]); const [search, setSearch] = useState(''); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    const version = ++sequence.current; setBusy(true); setError('');
    try {
      const path = kind === 'services' ? `/api/mobile/businesses?country=${country}` : kind === 'stays' ? `/api/stays?countryCode=${country}&liveOnly=1` : `/api/${kind}?country=${country}`;
      const result = await api.get<any>(path); const rows = kind === 'products' ? result.data.products : result.data;
      const mapped = (Array.isArray(rows) ? rows : []).map((p: any) => ({ id: p.id, name: p.name || p.title, description: p.description || p.shortDescription || '',
        image: p.images?.[0]?.url || p.images?.[0] || p.media?.coverUrl || p.media?.cover_url || p.cover_image || p.imageUrl,
        rating: p.rating, price: p.price ?? p.priceFrom, currency: p.currency || p.currencyCode,
        location: p.city || p.venue_name || p.address?.city || p.category }));
      if (version === sequence.current) setItems(mapped);
    } catch (e) { if (version === sequence.current) setError((e as Error).message); }
    finally { if (version === sequence.current) setBusy(false); }
  }, [country, kind]);
  useEffect(() => { load(); return () => { sequence.current++; }; }, [load]);
  const filtered = items.filter(p => `${p.name} ${p.description} ${p.location}`.toLowerCase().includes(search.toLowerCase()));
  return <SafeAreaView style={ui.safe} edges={['top']}>
    <View style={ui.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" style={ui.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={ui.headerTitle}>{catalogTitles[kind]}</Text></View>
    <View style={styles.search}><Ionicons name="search-outline" size={20} color={colors.textSecondary} /><TextInput accessibilityLabel={`Search ${kind}`} placeholder={`Search ${kind} near you`} value={search} onChangeText={setSearch} style={{ flex: 1, padding: 10, color: colors.ink }} /></View>
    <FlatList data={filtered} keyExtractor={p => p.id} onRefresh={load} refreshing={busy} contentContainerStyle={styles.list}
      ListHeaderComponent={<Feedback error={error} />}
      ListEmptyComponent={!busy && !error ? <Feedback empty={search ? 'No matches. Try another search.' : 'There are no published listings in this market yet. Choose another country from Home or check back soon.'} /> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/marketplace/[kind]/[id]', params: { kind, id: item.id } })} style={styles.card}>
        <Image source={imageSourceFor(item.id, kind === 'stays' ? 'Hotels' : kind === 'events' ? 'Events' : kind === 'products' ? 'Fashion' : 'Beauty', typeof item.image === 'string' ? item.image : undefined)} style={styles.photo} accessibilityLabel={item.name} />
        <View style={styles.info}><View style={ui.row}><Text style={styles.name}>{item.name}</Text>{item.rating ? <Text style={styles.rating}>★ {Number(item.rating).toFixed(1)}</Text> : null}</View>
        {item.location ? <Text style={ui.body}>{item.location}</Text> : null}<Text numberOfLines={2} style={ui.body}>{item.description}</Text>
        {item.price != null && item.currency ? <Text style={styles.price}>{formatMoney(item.price, item.currency)}{kind === 'stays' ? ' / night' : ''}</Text> : null}</View>
      </Pressable>} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({ search: { margin: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.canvas }, list: { paddingHorizontal: 18, paddingBottom: 28, gap: 18, maxWidth: 680, width: '100%', alignSelf: 'center' }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 14, overflow: 'hidden' }, photo: { height: 190, width: '100%' }, info: { padding: 14, gap: 5 }, name: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink }, rating: { color: colors.primaryDark, fontWeight: '600' }, price: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 8 } });
