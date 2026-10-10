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
import { useLocalSearchParams } from 'expo-router';
import RewardsModal from '@/components/RewardsModal';

export default function CoolDownGamesScreen() {
  const router = useRouter();
  const { mode, intervention } = useLocalSearchParams<{ mode?: string; intervention?: string }>();
  const [showRewards, setShowRewards] = useState(false);

  const games = [
    {
      id: 'star-catch',
      icon: '⭐',
      title: 'තරු අල්ලමු',
      desc: 'Catch calm stars & affirmations',
      duration: 'මිනිත්තු 2',
      bgColor: '#FEF3C7',
      iconColor: '#F59E0B',
      route: '/(child)/game-star',
      badge: '✨ ජනප්‍රියයි',
    },
    {
      id: 'guided-breathing',
      icon: '🌬️',
      title: 'හුස්ම ගනිමු',
      desc: 'Guided breathing relaxation',
      duration: 'මිනිත්තු 2',
      bgColor: '#E0F2FE',
      iconColor: '#0284C7',
      route: '/(child)/game-breathing',
      badge: intervention === 'cooldown_activity' || mode === 'calm' ? '🌿 නිර්දේශිතයි' : undefined,
    },
    {
      id: 'memory-game',
      icon: '🧠',
      title: 'මතක ක්‍රීඩාව',
      desc: 'Memory card matching',
      duration: 'මිනිත්තු 3',
      bgColor: '#DCFCE7',
      iconColor: '#10B981',
      route: '/(child)/game-memory',
      badge: intervention === 'focus_game' || mode === 'focus' ? '🎯 අවධානය' : undefined,
    },
    {
      id: 'bubble-calm',
      icon: '🫧',
      title: 'බුබුළු සන්සුන් කිරීම',
      desc: 'Relaxing interactive bubbles',
      duration: 'මිනිත්තු 2',
      bgColor: '#E0E7FF',
      iconColor: '#6366F1',
      route: '/(child)/game-bubble',
    },
    {
      id: 'letter-puzzle',
      icon: '🧩',
      title: 'අකුරු ගළපමු',
      desc: 'Short puzzle game',
      duration: 'මිනිත්තු 2',
      bgColor: '#DBEAFE',
      iconColor: '#3B82F6',
      route: '/(child)/game-puzzle',
    },
    {
      id: 'color-match',
      icon: '🎨',
      title: 'වර්ණ ගළපමු',
      desc: 'Simple color matching',
      duration: 'මිනිත්තු 2',
      bgColor: '#FFEDD5',
      iconColor: '#F97316',
      route: '/(child)/game-color',
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => router.push('/(child)/consent-privacy')}
            activeOpacity={0.7}
          >
            <AppText size="md">🛡️</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => setShowRewards(true)}
            activeOpacity={0.7}
          >
            <AppText size="md">🏆</AppText>
          </TouchableOpacity>
        </View>
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



        {/* 6 Calming Game Cards */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                    {g.title}
                  </AppText>
                  {g.badge && (
                    <View style={styles.cardBadge}>
                      <AppText size="xs" weight="bold" color="#B45309">
                        {g.badge}
                      </AppText>
                    </View>
                  )}
                </View>
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

      {/* Rewards & Badges Modal */}
      <RewardsModal
        visible={showRewards}
        onClose={() => setShowRewards(false)}
      />

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
  privacyCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 10,
    marginVertical: ThemeSpacing.xs,
  },
  privacyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
