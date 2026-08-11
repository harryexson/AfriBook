import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/theme';

export default function RootLayout() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
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
          <Stack.Screen name="vendor" />
          <Stack.Screen name="driver" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
