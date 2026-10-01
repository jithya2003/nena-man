/**
 * nena-man · frontend/app/(settings)/_layout.tsx
 * Settings Stack Layout.
 * Accessible to both authenticated and unauthenticated users so language & font settings
 * can be configured from pre-login screens (Role Selection, Login, Register).
 */

import React from 'react';
import { Stack } from 'expo-router';
import { ThemeColors } from '@/constants/theme';

export default function SettingsLayout() {
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
