import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export interface NavBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  fallbackRoute?: string;
  showHome?: boolean;
  homeRoute?: string;
  showLanguagePill?: boolean;
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
  showLanguagePill = true,
  showSettings = false,
  showLogout = false,
  rightElement,
  backgroundColor = ThemeColors.surface,
}: NavBarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('[NavBar] Logout error:', err);
    }
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

        {showLanguagePill && (
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLanguage(language === 'si' ? 'en' : 'si')}
            activeOpacity={0.8}
            accessibilityLabel="Toggle language"
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 12 2 C 6.48 2 2 6.48 2 12 C 2 17.52 6.48 22 12 22 C 17.52 22 22 17.52 22 12 C 22 6.48 17.52 2 12 2 Z M 11 19.93 C 7.05 19.44 4 16.08 4 12 C 4 11.38 4.08 10.79 4.21 10.21 L 9 15 L 9 16 C 9 17.1 9.9 18 11 18 L 11 19.93 Z M 17.9 17.39 C 17.64 16.58 16.9 16 16 16 L 15 16 L 15 13 C 15 12.45 14.55 12 14 12 L 8 12 L 8 10 L 10 10 C 10.55 10 11 9.55 11 9 L 11 7 L 13 7 C 14.1 7 15 6.1 15 5 L 15 4.59 C 17.93 5.78 20 8.65 20 12 C 20 14.08 19.2 15.97 17.9 17.39 Z"
                fill={ThemeColors.textPrimary}
              />
            </Svg>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              {language === 'si' ? 'සිංහල' : 'English'}
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
              {t('common.exit')}
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
    minWidth: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ThemeColors.border,
    paddingHorizontal: ThemeSpacing.sm + 4,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    ...ThemeShadow.sm,
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
    flexShrink: 0,
  },
});
