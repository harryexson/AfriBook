import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Screen, ui } from '../src/components/Screen';
import Button from '../src/components/ui/Button';
import CountryPicker from '../src/components/CountryPicker';
import { colors } from '../src/theme';
import { useMarketStore } from '../src/stores/market-store';

const slides = [
  { label: 'WELCOME TO AFRIBOOK', title: 'Your city.\nYour kind of life.', body: 'Find a meal, a place to stay, a trusted professional, or your next ride. Your local marketplace starts here.', image: require('../assets/editorial/city-life.jpg') },
  { label: 'MAKE EVERY DAY EASIER', title: 'A little closer\nto everything.', body: 'Book services, explore local shops, discover events and keep your orders together in one account.', image: require('../assets/people/community.jpg') },
  { label: 'MOVE WITH CONFIDENCE', title: 'Your next stop\nstarts here.', body: 'Request a ride, follow your trip and access driver tools. Location is requested only when you choose to use it.', image: require('../assets/editorial/city-ride.jpg') },
];
export default function Onboarding() {
  const [step, setStep] = useState(0); const [busy, setBusy] = useState(false); const router = useRouter(); const slide = slides[step];
  const countryCode = useMarketStore(s => s.countryCode); const setCountry = useMarketStore(s => s.setCountry);
  async function finish(register: boolean) { setBusy(true); await AsyncStorage.setItem('afribook-onboarding-v1', 'done'); router.replace(register ? '/(auth)/register' : '/(tabs)'); }
  return <Screen title="AfriBook" back={false}>
    <Image source={slide.image} style={styles.hero} accessibilityLabel={slide.title.replace('\n', ' ')} />
    <View style={ui.row}><Text style={ui.label}>{slide.label}</Text><Text style={ui.body}>{step + 1} / {slides.length}</Text></View>
    <Text style={ui.title}>{slide.title}</Text><Text style={ui.body}>{slide.body}</Text>
    <View style={styles.dots}>{slides.map((_, i) => <View key={i} style={[styles.dot, i === step && styles.active]} />)}</View>
    {step === 2 ? <View style={ui.panel}><Text style={ui.body}>Choose where you’ll explore. You can change this later.</Text><CountryPicker selectedCode={countryCode} onSelect={country => setCountry(country.code)} /></View> : null}
    <Button title={step === 2 ? 'Create my account' : 'Continue'} loading={busy} onPress={() => step === 2 ? finish(true) : setStep(step + 1)} fullWidth />
    <Button title="Explore first" variant="ghost" onPress={() => finish(false)} disabled={busy} fullWidth />
    <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')} style={{ padding: 12 }}><Text style={[ui.body, { textAlign: 'center' }]}>Already a member? Sign in</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({ hero: { height: 310, width: '100%', borderRadius: 22 }, dots: { flexDirection: 'row', gap: 6, marginVertical: 4 }, dot: { height: 5, width: 18, borderRadius: 3, backgroundColor: colors.border }, active: { width: 38, backgroundColor: colors.primary } });
