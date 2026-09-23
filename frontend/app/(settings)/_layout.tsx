/**
 * nena-man · frontend/app/(settings)/_layout.tsx
 * Auth Guard: Redirects to login if user is not authenticated.
 * Protects the settings screen with a single check.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { ThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function SettingsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Render nothing while the auth state is loading or redirect is in progress
  if (isLoading || !isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: ThemeColors.background },
      }}
    />
  );
}
