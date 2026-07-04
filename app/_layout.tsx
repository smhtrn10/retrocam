import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePurchases } from '@/hooks/usePurchases';
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import '@/i18n';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// LY-3: splash screen'i otomatik gizlenmesini engelle
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootContent />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootContent() {
  const { isOnboardingComplete, isLoading, initialize } = usePurchases();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // LY-3: loading tamamlanınca splash screen'i gizle
    // iPadOS beta kilitlenme riskine karşı safety timeout ekle
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('Splash screen safety timeout reached. Hiding splash screen regardless of isLoading state.');
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 5000);

    if (!isLoading) {
      clearTimeout(safetyTimer);
      SplashScreen.hideAsync().catch((e) => {
        console.error('Failed to hide splash screen:', e);
      });
    }

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  useEffect(() => {
    // LY-2: prevent race condition with onboarding.tsx routing.
    // If true, do nothing and let other components handle navigation.
    if (isLoading || isOnboardingComplete === null) return;

    if (isOnboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [isLoading, isOnboardingComplete]);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="preview"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="video"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="video-preview"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
