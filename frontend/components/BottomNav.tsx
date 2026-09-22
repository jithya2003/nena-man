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

  const childTabs = [
    {
      key: 'home',
      label: 'මුල් පිටුව',
      route: '/(child)/home',
      renderIcon: (active: boolean) => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 3 9.5 L 12 3 L 21 9.5 L 21 20 C 21 20.55 20.55 21 20 21 L 14 21 L 14 14 L 10 14 L 10 21 L 4 21 C 3.45 21 3 20.55 3 20 Z"
            fill={active ? '#FFFFFF' : ThemeColors.textSecondary}
          />
        </Svg>
      ),
    },
    {
      key: 'learning',
      label: 'ඉගෙනුම',
      route: '/(child)/reading',
      renderIcon: (active: boolean) => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 12 3 L 1 9 L 12 15 L 21 10.09 L 21 17 L 23 17 L 23 9 L 12 3 Z M 5 13.18 L 5 17.18 C 5 19.5 8.13 21 12 21 C 15.87 21 19 19.5 19 17.18 L 19 13.18 L 12 17 L 5 13.18 Z"
            fill={active ? '#FFFFFF' : ThemeColors.textSecondary}
          />
        </Svg>
      ),
    },
    {
      key: 'games',
      label: 'ක්‍රීඩා',
      route: '/(child)/cooldown',
      renderIcon: (active: boolean) => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="3"
            stroke={active ? '#FFFFFF' : ThemeColors.textSecondary}
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="8" cy="12" r="1.5" fill={active ? '#FFFFFF' : ThemeColors.textSecondary} />
          <Circle cx="16" cy="12" r="1.5" fill={active ? '#FFFFFF' : ThemeColors.textSecondary} />
          <Path
            d="M 10 9 L 14 9 M 12 7 L 12 11"
            stroke={active ? '#FFFFFF' : ThemeColors.textSecondary}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      key: 'progress',
      label: 'ප්‍රගතිය',
      route: '/(child)/progress',
      renderIcon: (active: boolean) => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 3.5 18.5 L 9.5 12.5 L 13.5 16.5 L 20.5 7.5 M 20.5 7.5 L 15.5 7.5 M 20.5 7.5 L 20.5 12.5"
            stroke={active ? '#FFFFFF' : ThemeColors.textSecondary}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      key: 'profile',
      label: 'මගේ ගිණුම',
      route: '/(child)/profile',
      renderIcon: (active: boolean) => (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 12 12 C 14.21 12 16 10.21 16 8 C 16 5.79 14.21 4 12 4 C 9.79 4 8 5.79 8 8 C 8 10.21 9.79 12 12 12 Z M 12 14 C 9.33 14 4 15.34 4 18 L 4 20 L 20 20 L 20 18 C 20 15.34 14.67 14 12 14 Z"
            fill={active ? '#FFFFFF' : ThemeColors.textSecondary}
          />
        </Svg>
      ),
    },
  ];

  return (
    <View style={[styles.wrapper, ThemeShadow.md]}>
      <View style={styles.container}>
        {childTabs.map((tab) => {
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
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                {tab.renderIcon(isActive)}
              </View>
              <AppText
                size="xs"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? '#FFFFFF' : ThemeColors.textSecondary}
                style={[styles.tabLabel, isActive ? styles.activeTabLabel : undefined]}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
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
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    paddingBottom: Platform.OS === 'ios' ? ThemeSpacing.md : ThemeSpacing.xs + 2,
    paddingTop: ThemeSpacing.xs + 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: ThemeSpacing.xs,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 58,
    borderRadius: ThemeRadius.md,
  },
  tabBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 64,
  },
  iconWrap: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
