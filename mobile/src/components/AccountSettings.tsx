import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui } from './Screen';
import Button from './ui/Button';
import CountryPicker from './CountryPicker';
import { useMarketStore } from '../stores/market-store';
import { useAuth } from '../hooks/useAuth';
export default function Settings() {
  const router = useRouter(); const country = useMarketStore(s => s.countryCode); const setCountry = useMarketStore(s => s.setCountry); const { user, error, signOut } = useAuth();
  return <Screen title="Settings"><Text style={ui.title}>{"Make AfriBook\nyour own."}</Text><View style={ui.panel}><Text style={ui.label}>YOUR MARKET</Text><CountryPicker selectedCode={country} onSelect={country => setCountry(country.code)} /><Text style={ui.body}>Listings and currencies follow your selected country. Location permission stays under your device’s control.</Text></View>
    <Button title="Account, personal details & deletion" variant="outline" onPress={() => router.push('/profile/account')} /><Button title="View notifications" variant="outline" onPress={() => router.push('/profile/notifications')} /><Button title="Review the welcome guide" variant="outline" onPress={() => router.push('/onboarding')} /><Button title="Help & support" variant="outline" onPress={() => router.push('/profile/help')} />
    {error ? <Text style={ui.error}>{error}</Text> : null}{user ? <Button title="Sign out" variant="outline" onPress={signOut} /> : <Button title="Sign in" onPress={() => router.push('/(auth)/login')} />}
  </Screen>;
}
