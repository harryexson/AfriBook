import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { authAction } from '../../src/hooks/useNeonAuth';
import { clearSessionToken } from '../../src/lib/session';
import { useAuthStore } from '../../src/stores/auth-store';
import { api } from '../../src/lib/api';

export default function Account() {
  const { user, refreshProfile, signOut } = useAuth(); const router = useRouter();
  const [name, setName] = useState(user?.name || ''); const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function save() { setBusy(true); setError(''); try { await api.put('/api/mobile/profile', { name, phone }); await refreshProfile(); setMessage('Your profile has been saved.'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function remove() {
    if (busy || confirm !== 'DELETE' || !password) return; setBusy(true); setError('');
    try {
      const result = await authAction('delete-user', { password });
      if (result.data.status !== true) throw new Error('Deletion needs another verification step. Contact support to finish deleting your account.');
      await clearSessionToken(); useAuthStore.getState().reset(); router.replace('/onboarding');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!user) return <Screen title="Account"><Text style={ui.title}>Make yourself at home.</Text><Text style={ui.body}>Sign in to manage your account and privacy.</Text><Button title="Sign in" onPress={() => router.push('/(auth)/login')} /></Screen>;
  return <Screen title="Your account"><Text style={ui.label}>PERSONAL DETAILS</Text><Text style={ui.title}>A little more you.</Text>
    <Text style={ui.body}>{user.email}</Text><Input label="Full name" value={name} onChangeText={setName} autoComplete="name" /><Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <Feedback error={error} />{message ? <Text style={ui.success}>{message}</Text> : null}<Button title="Save changes" loading={busy} onPress={save} fullWidth />
    <Button title="Sign out" variant="outline" onPress={signOut} disabled={busy} fullWidth />
    <View style={ui.panel}><Text style={{ fontSize: 18, fontWeight: '700' }}>Privacy and account deletion</Text><Text style={ui.body}>Deleting your account removes your sign-in access. Transaction records may be retained where required. This action cannot be undone.</Text>
    {!deleting ? <Button title="Delete my account" variant="danger" onPress={() => setDeleting(true)} fullWidth /> : <>
      <Input label="Current password" value={password} onChangeText={setPassword} secureTextEntry />
      <Input label="Type DELETE to confirm" value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />
      <Button title="Permanently delete account" variant="danger" onPress={remove} loading={busy} disabled={confirm !== 'DELETE' || !password} fullWidth />
      <Button title="Keep my account" variant="ghost" onPress={() => setDeleting(false)} disabled={busy} />
    </>}</View>
  </Screen>;
}
