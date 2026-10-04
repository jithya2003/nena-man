import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '@/constants/theme';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useNetworkStatus } from '@/store/hooks';
import { syncReminderOnStartup } from '@/notifications/scheduler';
import OfflineBanner from '@/components/OfflineBanner';

/** Mounts the NetInfo / browser-event listener once for the app's lifetime. */
function NetworkListener() {
  useNetworkStatus();
  return null;
}

/**
 * Re-syncs the daily reading reminder on every app launch.
 * Covers cases where the OS cleared scheduled notifications (e.g. after reboot).
 */
function ReminderSyncListener() {
  useEffect(() => {
    syncReminderOnStartup();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <NetworkListener />
              <OfflineBanner />
              <ReminderSyncListener />
              <StatusBar style="dark" backgroundColor={ThemeColors.background} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  contentStyle: { backgroundColor: ThemeColors.background },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(child)" options={{ headerShown: false }} />
                <Stack.Screen name="(parent)" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)" options={{ headerShown: false }} />
              </Stack>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { height: '100vh' as any, minHeight: '100vh' as any } : {}),
  },
});
