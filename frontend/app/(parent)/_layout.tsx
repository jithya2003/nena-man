/**
 * nena-man · frontend/app/(parent)/_layout.tsx
 * Auth Guard: Redirects to login if user is not authenticated.
 * Protects ALL 6 parent/teacher screens with a single check.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { ThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function ParentLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else if (
        user &&
        (user.role === 'parent' || user.role === 'teacher') &&
        !user.emailVerified
      ) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: user.email, unverified: 'true' },
        });
      }
    }
  }, [isAuthenticated, isLoading, user]);

  // Render nothing while the auth state is loading or redirect is in progress
  if (
    isLoading ||
    !isAuthenticated ||
    (user && (user.role === 'parent' || user.role === 'teacher') && !user.emailVerified)
  ) {
    return null;
  }

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
