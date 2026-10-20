
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';

export interface BottomNavProps {
  role?: 'child' | 'parent';
  activeTab?: string;
}

export default function BottomNav({
  role = 'child',
  activeTab,
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const isSi = language === 'si';

  const childTabs = [
    {
      key: 'home',
      label: t('nav.home'),
      route: '/(child)/home',
      emoji: '🏠',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 3 9.5 L 12 3 L 21 9.5 L 21 20 C 21 20.55 20.55 21 20 21 L 14 21 L 14 14 L 10 14 L 10 21 L 4 21 C 3.45 21 3 20.55 3 20 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
    {
      key: 'learning',
      label: t('nav.learning'),
      route: '/(child)/reading',
      emoji: '📚',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 12 3 L 1 9 L 12 15 L 21 10.09 L 21 17 L 23 17 L 23 9 L 12 3 Z M 5 13.18 L 5 17.18 C 5 19.5 8.13 21 12 21 C 15.87 21 19 19.5 19 17.18 L 19 13.18 L 12 17 L 5 13.18 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
    {
      key: 'games',
      label: t('nav.games'),
      route: '/(child)/cooldown',
      emoji: '🎮',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="4"
            stroke={active ? ThemeColors.primary : '#64748B'}
            strokeWidth="2.2"
            fill={active ? '#EAF7EE' : 'none'}
          />
          <Circle cx="8" cy="12" r="1.5" fill={active ? ThemeColors.primary : '#64748B'} />
          <Circle cx="16" cy="12" r="1.5" fill={active ? ThemeColors.primary : '#64748B'} />
          <Path
            d="M 10 9 L 14 9 M 12 7 L 12 11"
            stroke={active ? ThemeColors.primary : '#64748B'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      key: 'progress',
      label: t('nav.progress'),
      route: '/(child)/progress',
      emoji: '⭐',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 3.5 18.5 L 9.5 12.5 L 13.5 16.5 L 20.5 7.5 M 20.5 7.5 L 15.5 7.5 M 20.5 7.5 L 20.5 12.5"
            stroke={active ? ThemeColors.primary : '#64748B'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      key: 'profile',
      label: t('nav.profile'),
      route: '/(child)/profile',
      emoji: '👤',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 12 12 C 14.21 12 16 10.21 16 8 C 16 5.79 14.21 4 12 4 C 9.79 4 8 5.79 8 8 C 8 10.21 9.79 12 12 12 Z M 12 14 C 9.33 14 4 15.34 4 18 L 4 20 L 20 20 L 20 18 C 20 15.34 14.67 14 12 14 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
  ];

  const parentTabs = [
    {
      key: 'dashboard',
      label: isSi ? 'පුවරුව' : 'Dashboard',
      route: '/(parent)/dashboard',
      emoji: '📊',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="3"
            width="7"
            height="8"
            rx="2"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
          <Rect
            x="14"
            y="3"
            width="7"
            height="5"
            rx="2"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
          <Rect
            x="14"
            y="12"
            width="7"
            height="9"
            rx="2"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
          <Rect
            x="3"
            y="15"
            width="7"
            height="6"
            rx="2"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
    {
      key: 'connect',
      label: isSi ? 'සම්බන්ධ කිරීම' : 'Connect',
      route: '/(parent)/connect-student',
      emoji: '👥',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 16 11 C 17.66 11 18.99 9.66 18.99 8 C 18.99 6.34 17.66 5 16 5 C 14.34 5 13 6.34 13 8 C 13 9.66 14.34 11 16 11 Z M 8 11 C 9.66 11 10.99 9.66 10.99 8 C 10.99 6.34 9.66 5 8 5 C 6.34 5 5 6.34 5 8 C 5 9.66 6.34 11 8 11 Z M 8 13 C 5.67 13 1 14.17 1 16.5 V 19 H 15 V 16.5 C 15 14.17 10.33 13 8 13 Z M 16 13 C 15.71 13 15.38 13.02 15.03 13.05 C 16.19 13.89 17 15.02 17 16.5 V 19 H 23 V 16.5 C 23 14.17 18.33 13 16 13 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
    {
      key: 'reports',
      label: isSi ? 'වාර්තා' : 'Reports',
      route: '/(parent)/reports',
      emoji: '📄',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 14 2 H 6 C 4.9 2 4.01 2.9 4.01 4 L 4 20 C 4 21.1 4.89 22 5.99 22 H 18 C 19.1 22 20 21.1 20 20 V 8 L 14 2 Z M 16 18 H 8 V 16 H 16 V 18 Z M 16 14 H 8 V 12 H 16 V 14 Z M 13 9 V 3.5 L 18.5 9 H 13 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
    {
      key: 'recommendations',
      label: isSi ? 'නිර්දේශ' : 'Plan',
      route: '/(parent)/recommendations',
      emoji: '💡',
      renderIcon: (active: boolean) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 9 21 C 9 21.55 9.45 22 10 22 H 14 C 14.55 22 15 21.55 15 21 V 20 H 9 V 21 Z M 12 2 C 8.14 2 5 5.14 5 9 C 5 11.38 6.19 13.47 8 14.74 V 17 C 8 17.55 8.45 18 9 18 H 15 C 15.55 18 16 17.55 16 17 V 14.74 C 17.81 13.47 19 11.38 19 9 C 19 5.14 15.86 2 12 2 Z"
            fill={active ? ThemeColors.primary : '#64748B'}
          />
        </Svg>
      ),
    },
  ];

  const currentTabs = role === 'parent' ? parentTabs : childTabs;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {currentTabs.map((tab) => {
          const isExplicitActive = activeTab === tab.key;
          const isRouteActive = pathname === tab.route || (tab.key === 'home' && pathname === '/(child)/home');
          const isProfileActive = (tab.key === 'profile' && (pathname === '/(child)/profile' || activeTab === 'profile'));
          const isActive = isExplicitActive || (activeTab ? isExplicitActive : isRouteActive || isProfileActive);

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && styles.tabBtnActive,
              ]}
              onPress={() => {
                if (!isActive) {
                  router.push(tab.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                {tab.renderIcon(isActive)}
              </View>
              <AppText
                size="xs"
                weight={isActive ? 'extrabold' : 'medium'}
                color={isActive ? ThemeColors.primary : '#64748B'}
                style={[styles.tabLabel, isActive ? styles.activeTabLabel : undefined]}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderTopColor: '#E2ECE6',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#E2ECE6',
    borderRightColor: '#E2ECE6',
    paddingBottom: Platform.OS === 'ios' ? ThemeSpacing.md + 4 : ThemeSpacing.xs + 4,
    paddingTop: ThemeSpacing.xs + 4,
    shadowColor: '#0B381E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: ThemeSpacing.xs,
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: ThemeRadius.md,
  },
  tabBtnActive: {
    transform: [{ scale: 1.04 }],
  },
  iconWrap: {
    width: 38,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: '#EAF7EE',
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: ThemeColors.primary,
    fontWeight: '800',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ThemeColors.primary,
    marginTop: 2,
  },
});
