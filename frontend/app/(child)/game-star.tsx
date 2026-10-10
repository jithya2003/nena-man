/**
 * nena-man · frontend/app/(child)/game-star.tsx
 * Module 4: Motivational Star Catching Calming Game (Pushpakumara · IT23177246)
 *
 * Screen wrapper for the interactive StarGame component.
 * Allows child to catch stars for mindfulness, affirmations, and calm energy.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
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
import StarGame from '@/components/StarGame';
import RewardsModal from '@/components/RewardsModal';

export default function GameStarScreen() {
  const router = useRouter();
  const [showRewards, setShowRewards] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const handleGameComplete = () => {
    setGameCompleted(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push('/(child)/cooldown'))}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.primary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            තරු අල්ලමු (Catch Calm Stars)
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            සන්සුන් මනසක් සඳහා තරු එකතු කරන්න 🌟
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.trophyBtn}
          onPress={() => setShowRewards(true)}
          activeOpacity={0.8}
        >
          <AppText size="sm">🏆</AppText>
        </TouchableOpacity>
      </View>

      {/* ── Interactive Game Field ─────────────────────────────────────────── */}
      <View style={styles.content}>
        <StarGame onComplete={handleGameComplete} />

        {/* Completion Celebration Overlay */}
        {gameCompleted && (
          <View style={[styles.completionCard, ThemeShadow.md]}>
            <AppText size="display">🎉</AppText>
            <AppText size="xl" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 6 }}>
              විශිෂ්ටයි! ඔබ සන්සුන් ශක්තිය ලබා ගත්තා!
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 4 }}>
              සියලුම තරු සාර්ථකව අල්ලා ගන්නා ලදී. දැන් ඔබට නැවත කියවීමට සූදානම් විය හැක.
            </AppText>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rewardActionBtn}
                onPress={() => setShowRewards(true)}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🏆 ජයග්‍රහණ බලන්න
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backActionBtn}
                onPress={() => router.push('/(child)/cooldown')}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🌿 විවේක පිටුවට
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Rewards & Badges Modal */}
      <RewardsModal
        visible={showRewards}
        onClose={() => setShowRewards(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FF',
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
  titleBlock: {
    flex: 1,
    marginLeft: ThemeSpacing.xs,
  },
  trophyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: ThemeSpacing.md,
  },
  completionCard: {
    position: 'absolute',
    bottom: ThemeSpacing.xl,
    left: ThemeSpacing.md,
    right: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: ThemeSpacing.md,
  },
  rewardActionBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
  },
  backActionBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
  },
});
