import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';
import { RelaxTreeIllustration } from '@/components/Illustrations';

export default function CoolDownGamesScreen() {
  const router = useRouter();

  const games = [
    {
      id: 'letter-puzzle',
      icon: '🧩',
      title: 'අකුරු ගළපමු',
      desc: 'Short puzzle game',
      duration: 'මිනිත්තු 2',
      bgColor: '#DBEAFE',
      iconColor: '#3B82F6',
    },
    {
      id: 'color-match',
      icon: '🎨',
      title: 'වර්ණ ගළපමු',
      desc: 'Simple color matching',
      duration: 'මිනිත්තු 2',
      bgColor: '#FFEDD5',
      iconColor: '#F97316',
    },
    {
      id: 'memory-game',
      icon: '🧠',
      title: 'මතක ක්‍රීඩාව',
      desc: 'Memory matching',
      duration: 'මිනිත්තු 3',
      bgColor: '#DCFCE7',
      iconColor: '#10B981',
      route: '/(child)/game-memory',
    },
    {
      id: 'bubble-calm',
      icon: '🫧',
      title: 'බුබුළු සන්සුන් කිරීම',
      desc: 'Relaxing interaction',
      duration: 'මිනිත්තු 2',
      bgColor: '#E0E7FF',
      iconColor: '#6366F1',
      route: '/(child)/game-breathing',
    },
    {
      id: 'guided-breathing',
      icon: '🌬️',
      title: 'හුස්ම ගනිමු',
      desc: 'Guided breathing',
      duration: 'මිනිත්තු 2',
      bgColor: '#E0F2FE',
      iconColor: '#0284C7',
      route: '/(child)/game-breathing',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/home')}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.textPrimary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            විවේකයක් ගමු
          </AppText>
          <AppText size="md" style={{ marginLeft: 4 }}>
            🌿
          </AppText>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Intro Subtitle */}
        <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.introSubtitle}>
          ටිකක් විවේක ගන්න. කැමති ක්‍රියාකාරකමක් තෝරන්න.
        </AppText>

        {/* Relax Tree Illustration in Soft Circle */}
        <View style={[styles.treeCircleWrap, ThemeShadow.sm]}>
          <RelaxTreeIllustration size={150} />
        </View>

        {/* 5 Calming Game Cards */}
        <View style={styles.gamesListWrap}>
          {games.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.gameCard, ThemeShadow.sm]}
              onPress={() => {
                if (g.route) {
                  router.push(g.route as any);
                }
              }}
              activeOpacity={0.8}
            >
              {/* Left Circle Icon */}
              <View style={[styles.gameIconBox, { backgroundColor: g.bgColor }]}>
                <AppText size="lg">{g.icon}</AppText>
              </View>

              {/* Game Title & English Description */}
              <View style={{ flex: 1 }}>
                <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                  {g.title}
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 1 }}>
                  {g.desc}
                </AppText>
              </View>

              {/* Duration Info */}
              <View style={styles.durationWrap}>
                <AppText size="xs">⏱️</AppText>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ marginLeft: 3 }}>
                  {g.duration}
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Return to learning banner */}
        <TouchableOpacity
          style={[styles.returnBanner, ThemeShadow.sm]}
          onPress={() => router.push('/(child)/reading')}
          activeOpacity={0.85}
        >
          <AppText size="sm" weight="extrabold" color={ThemeColors.primary} align="center">
            විවේකයෙන් පසු නැවත ඉගෙනුමට යමු! 🌱
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 5-Tab Bottom Navigation with Games active */}
      <BottomNav role="child" activeTab="games" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xl,
    alignItems: 'center',
    gap: ThemeSpacing.md,
  },
  introSubtitle: {
    maxWidth: 280,
    lineHeight: 18,
  },
  treeCircleWrap: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ThemeSpacing.xs,
  },
  gamesListWrap: {
    width: '100%',
    gap: ThemeSpacing.sm,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    gap: 12,
  },
  gameIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnBanner: {
    width: '100%',
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    paddingVertical: ThemeSpacing.md,
    paddingHorizontal: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#C7EBD2',
    marginTop: ThemeSpacing.xs,
  },
});
