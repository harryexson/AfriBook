import React, { useState } from 'react';
import { Text, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui } from './Screen';
import Input from './ui/Input';
import Button from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../lib/api';
export default function LoginScreen() {
  const router = useRouter(); const { signIn, loading, error } = useAuth(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [localError, setLocalError] = useState('');
  async function submit() {
    if (!email.trim().includes('@') || !password) { setLocalError('Enter your email address and password.'); return; }
    setLocalError(''); const result = await signIn(email.trim(), password); if (!('error' in result)) router.replace('/(tabs)');
  }
  return <Screen title="Welcome back"><Image source={require('../../assets/editorial/city-life.jpg')} style={[ui.photo, { height: 190 }]} /><Text style={ui.label}>YOUR CITY, YOUR AFRIBOOK</Text><Text style={ui.title}>{"Good to have\nyou here."}</Text><Text style={ui.body}>Sign in to keep your rides, orders and plans together.</Text>
    <Input label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /><Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
    {localError || error ? <Text accessibilityRole="alert" style={ui.error}>{localError || error}</Text> : null}
    <Button title="Sign in" onPress={submit} loading={loading} fullWidth />
    <Button title="Verify email or request a new code" variant="outline" disabled={!email.includes('@') || loading} onPress={() => router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } })} fullWidth />
    <Button title="Forgot your password?" variant="ghost" onPress={() => Linking.openURL(`${API_BASE}/forgot-password`)} />
    <Button title="Create an account" variant="outline" onPress={() => router.push('/(auth)/register')} fullWidth />
  </Screen>;
}
