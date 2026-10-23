import React, { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, ui, Feedback } from '../../src/components/Screen';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { authAction } from '../../src/hooks/useNeonAuth';

export default function VerifyEmail() {
  const { email = '' } = useLocalSearchParams<{ email: string }>(); const router = useRouter();
  const [otp, setOtp] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function submit(resend = false) {
    if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      await authAction(resend ? 'email-otp/send-verification-otp' : 'email-otp/verify-email', resend ? { email, type: 'email-verification' } : { email, otp: otp.trim() });
      if (resend) setMessage('A new verification code has been requested. Check your inbox.');
      else router.replace('/(auth)/login');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <Screen title="Verify your email"><Text style={ui.label}>ONE MORE STEP</Text><Text style={ui.title}>{"Your account,\nconfirmed."}</Text><Text style={ui.body}>Enter the code sent to {email}. After verification, sign in with your password.</Text>
    <Input label="Verification code" value={otp} onChangeText={setOtp} keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} />
    <Feedback error={error} />{message ? <Text style={ui.success}>{message}</Text> : null}
    <Button title="Verify email" onPress={() => submit()} loading={busy} disabled={otp.trim().length < 6} fullWidth />
    <Button title="Send a new code" variant="outline" onPress={() => submit(true)} disabled={busy} fullWidth />
  </Screen>;
}
