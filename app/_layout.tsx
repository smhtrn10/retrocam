import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PurchasesProvider, usePurchases } from '@/hooks/usePurchases';
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import '@/i18n';

// LY-3: splash screen'i otomatik gizlenmesini engelle
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PurchasesProvider>
          <RootContent />
        </PurchasesProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { isOnboardingComplete, isLoading } = usePurchases();

  useEffect(() => {
    // LY-3: yükleme tamamlanınca splash screen'i gizle
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
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
