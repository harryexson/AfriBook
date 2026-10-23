import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
export default function Entry() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => { AsyncStorage.getItem('afribook-onboarding-v1').then(v => setDone(v === 'done')).catch(() => setDone(false)); }, []);
  if (done === null) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  return <Redirect href={done ? '/(tabs)' : '/onboarding'} />;
}
