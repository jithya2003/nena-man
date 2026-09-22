import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';

export interface NavBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  fallbackRoute?: string;
  showHome?: boolean;
  homeRoute?: string;
  showSettings?: boolean;
  showLogout?: boolean;
  rightElement?: React.ReactNode;
  backgroundColor?: string;
}

export default function NavBar({
  title,
  subtitle,
  showBack = true,
  onBack,
  fallbackRoute,
  showHome = false,
  homeRoute = '/(child)/home',
  showSettings = true,
  showLogout = false,
  rightElement,
  backgroundColor = ThemeColors.surface,
}: NavBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    } else {
      router.replace('/(auth)/role-select');
    }
  };

  const handleHome = () => {
    router.replace(homeRoute as any);
  };

  const handleSettings = () => {
    router.push('/(settings)/settings');
  };

  const handleLogout = () => {
    router.replace('/(auth)/role-select');
  };

  return (
    <View style={[styles.container, { backgroundColor }, ThemeShadow.sm]}>
      <View style={styles.leftGroup}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconBtn}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <AppText size="lg" weight="bold" color={ThemeColors.textPrimary}>
              ←
            </AppText>
          </TouchableOpacity>
        )}
        {showHome && (
          <TouchableOpacity
            onPress={handleHome}
            style={styles.iconBtn}
            accessibilityLabel="Home"
            activeOpacity={0.7}
          >
            <AppText size="sm">🏠</AppText>
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          {title && (
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} numberOfLines={1}>
              {title}
            </AppText>
          )}
          {subtitle && (
            <AppText size="xs" color={ThemeColors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.rightGroup}>
        {rightElement}
        {showSettings && (
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.actionChip}
            accessibilityLabel="Font and accessibility settings"
            activeOpacity={0.7}
          >
            <AppText size="xs">⚙️</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              Font
            </AppText>
          </TouchableOpacity>
        )}
        {showLogout && (
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.actionChip, { backgroundColor: ThemeColors.errorSurface, borderColor: ThemeColors.errorBorder }]}
            accessibilityLabel="Switch role or logout"
            activeOpacity={0.7}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.error}>
              Exit
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    minHeight: 56,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs + 2,
    flex: 1,
  },
  titleWrap: {
    flex: 1,
    marginLeft: ThemeSpacing.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: ThemeRadius.sm,
    backgroundColor: ThemeColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ThemeColors.surfaceElevated,
    borderRadius: ThemeRadius.full,
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.xs,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
});
