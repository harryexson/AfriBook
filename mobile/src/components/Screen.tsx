import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function Screen({ title, children, back = true }: { title: string; children: React.ReactNode; back?: boolean }) {
  const router = useRouter();
  return <SafeAreaView style={ui.safe} edges={['top', 'bottom']}>
    <View style={ui.header}>{back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={ui.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable> : null}<Text style={ui.headerTitle}>{title}</Text></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Feedback({ error, loading, empty }: { error?: string | null; loading?: boolean; empty?: string }) {
  if (loading) return <ActivityIndicator accessibilityLabel="Loading" color={colors.primary} style={{ margin: 32 }} />;
  if (error) return <Text accessibilityRole="alert" style={ui.error}>{error}</Text>;
  return empty ? <View style={ui.panel}><Ionicons name="leaf-outline" size={28} color={colors.primary} /><Text style={ui.body}>{empty}</Text></View> : null;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, minHeight: 60, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  back: { padding: 10, marginLeft: -10, minWidth: 44, minHeight: 44 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  content: { padding: 20, gap: 18, paddingBottom: 36, width: '100%', maxWidth: 680, alignSelf: 'center' },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -1, fontWeight: '700', color: colors.ink },
  label: { color: colors.primaryDark, letterSpacing: 1.8, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  body: { fontSize: 15, lineHeight: 23, color: colors.textSecondary },
  panel: { padding: 20, borderRadius: 16, backgroundColor: colors.canvas, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  error: { padding: 14, borderRadius: 10, backgroundColor: colors.errorLight, color: '#991B1B', lineHeight: 21 },
  success: { padding: 14, borderRadius: 10, backgroundColor: colors.successLight, color: colors.successDark, lineHeight: 21 },
  photo: { width: '100%', height: 230, borderRadius: 14, backgroundColor: colors.canvas },
});
