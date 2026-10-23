import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
const KEY = 'afribook-neon-session';
export async function getSessionToken(): Promise<string | null> {
  return Platform.OS === 'web' ? globalThis.sessionStorage?.getItem(KEY) ?? null : SecureStore.getItemAsync(KEY);
}
export async function saveSessionToken(token: string): Promise<void> {
  if (Platform.OS === 'web') globalThis.sessionStorage.setItem(KEY, token);
  else await SecureStore.setItemAsync(KEY, token);
}
export async function clearSessionToken(): Promise<void> {
  if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY);
}
