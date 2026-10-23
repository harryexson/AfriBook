import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from '../src/components/Screen';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/stores/auth-store';
import { useMarketStore } from '../src/stores/market-store';

const steps = [
  { title: 'Let’s get to know you.', description: 'Use the details on your driving documents.', fields: [['fullName', 'Full name'], ['email', 'Email address'], ['phone', 'Phone number'], ['city', 'City']] },
  { title: 'Your vehicle,\nready for the road.', description: 'Tell us about the vehicle you’ll use.', fields: [['vehicleMake', 'Vehicle make'], ['vehicleModel', 'Model'], ['vehicleYear', 'Year'], ['vehicleColor', 'Colour'], ['licensePlate', 'Registration plate']] },
  { title: 'A little peace\nof mind.', description: 'Provide a secure HTTPS link to your driving licence document. Do not use public photo-sharing links. Your application cannot be reviewed without this document.', fields: [['driversLicense', 'Secure driving licence document URL'], ['vehicleRegistration', 'Registration document URL (optional)'], ['insuranceDocument', 'Insurance document URL (optional)']] },
  { title: 'Where your\nearnings go.', description: 'These details are submitted for review. No payout is initiated here.', fields: [['bankName', 'Bank name'], ['accountName', 'Account holder name'], ['accountNumber', 'Account number']] },
];
export default function DriverApply() {
  const user = useAuthStore(s => s.user); const countryCode = useMarketStore(s => s.countryCode); const router = useRouter();
  const [step, setStep] = useState(0); const [form, setForm] = useState<Record<string, string>>({ fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '', vehicleType: 'car' }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  async function next() {
    setError(''); const missing = steps[step].fields.find(([key, label]) => !label.includes('optional') && !form[key]?.trim());
    if (missing) { setError(`Enter ${missing[1].toLowerCase()}.`); return; }
    if (step === 1 && (!/^\d{4}$/.test(form.vehicleYear) || Number(form.vehicleYear) > new Date().getFullYear() + 1)) { setError('Enter a valid vehicle year.'); return; }
    if (step === 2 && !/^https:\/\//.test(form.driversLicense)) { setError('Use a secure HTTPS document URL.'); return; }
    if (step < 3) { setStep(step + 1); return; } if (busy) return; setBusy(true);
    try { await api.post('/api/driver/apply', { ...form, countryCode }); setDone(true); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!user) return <Screen title="Drive with AfriBook"><Text style={ui.title}>{"Let’s start\nwith your account."}</Text><Button title="Sign in" onPress={() => router.push('/(auth)/login')} /></Screen>;
  return <Screen title="Driver application">{done ? <><Text style={ui.success}>Application submitted for review.</Text><Text style={ui.title}>{"You’re on\nyour way."}</Text><Text style={ui.body}>Open your driver dashboard to check your application status. You can receive trips once your application is approved.</Text><Button title="Open driver dashboard" onPress={() => router.replace('/driver')} /></> : <>
    <Text style={ui.label}>STEP {step + 1} OF {steps.length}</Text><Text style={ui.title}>{steps[step].title}</Text><Text style={ui.body}>{steps[step].description}</Text><View style={ui.panel}>{steps[step].fields.map(([key, label]) => <Input key={key} label={label} value={form[key] || ''} onChangeText={value => setForm({ ...form, [key]: value })} autoCapitalize={key === 'email' || key.endsWith('Document') || key === 'driversLicense' ? 'none' : 'words'} secureTextEntry={key === 'accountNumber'} />)}</View>
    <Feedback error={error} /><Button title={step === 3 ? 'Submit application for review' : 'Continue'} onPress={next} loading={busy} fullWidth />{step > 0 ? <Button title="Previous step" variant="ghost" onPress={() => setStep(step - 1)} disabled={busy} /> : null}
  </>}</Screen>;
}
