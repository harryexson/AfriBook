import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../src/hooks/useAuth';
import { useMarketStore } from '../src/stores/market-store';
import { colors } from '../src/theme';

export default function RootLayout() {
  const { initialize } = useAuth();
  const hydrateMarket = useMarketStore((s) => s.hydrate);

  useEffect(() => {
    initialize();
    // Restores the stored market and resolves the device's country. Async and
    // non-blocking: the app renders its stored (or fallback) market first and
    // corrects itself only if detection disagrees and the user never chose.
    hydrateMarket();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="business/[id]" />
          <Stack.Screen name="book/[businessId]/[serviceId]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="stays" />
          <Stack.Screen name="food" />
          <Stack.Screen name="vendor" />
          <Stack.Screen name="driver" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
