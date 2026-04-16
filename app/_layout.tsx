import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppProvider } from '@/context/AppContext';
import { UserActivityProvider } from '@/context/UserActivityContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { HistoryProvider } from '@/context/HistoryContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { OfflineNotice } from '@/components/OfflineNotice';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['[Reanimated] Reduced motion setting is enabled on this device.']);

import { registerForPushNotificationsAsync } from '@/utils/push-notifications';

export default function RootLayout() {
  useEffect(() => {
    // Request permission immediately on app startup
    // Fixed: Wrapped in a safe check to prevent emulator crashes
    registerForPushNotificationsAsync().then(token => {
      if(token) console.log('Push Notifications Active');
    });
  }, []);

  return (
    <ErrorBoundary>
      <SubscriptionProvider>
        <OfflineNotice />
        <AppProvider>
          <UserActivityProvider>
            <HistoryProvider>
              <SafeAreaProvider>
              <ThemeProvider>
                <LanguageProvider>
                  <ToastProvider>
                     <Stack screenOptions={{ headerShown: false }}>
                       <Stack.Screen name="index" />
                       <Stack.Screen name="login" />
                       <Stack.Screen name="register" />
                       <Stack.Screen name="onboarding" />
                       <Stack.Screen name="(tabs)" />
                     </Stack>
                  </ToastProvider>
                </LanguageProvider>
              </ThemeProvider>
            </SafeAreaProvider>
            </HistoryProvider>
          </UserActivityProvider>
        </AppProvider>
      </SubscriptionProvider>
    </ErrorBoundary>
  );
}
