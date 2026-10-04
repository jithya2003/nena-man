/**
 * nena-man · frontend/app/(child)/_layout.tsx
 * Auth Guard: Redirects to login if user is not authenticated.
 * Protects ALL 15 child screens with a single check.
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { ThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { connectionService } from '@/services/connectionService';

export default function ChildLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      } else if (user && (user.role === 'parent' || user.role === 'teacher')) {
        // Parents/teachers can always access their account profile & settings
        if (!pathname?.includes('profile') && !pathname?.includes('settings')) {
          connectionService.getLinkedChildren(user.uid, user.email).then((linked) => {
            if (!linked || linked.length === 0) {
              router.replace('/(parent)/dashboard');
            }
          });
        }
      }
    }
  }, [isAuthenticated, isLoading, user, pathname]);

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
