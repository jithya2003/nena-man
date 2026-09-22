import React from 'react';
import { Stack } from 'expo-router';
import { ThemeColors } from '@/constants/theme';

export default function ParentLayout() {
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
