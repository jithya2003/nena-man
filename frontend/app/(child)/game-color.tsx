/**
 * nena-man · frontend/app/(child)/game-color.tsx
 * Module 4: Color Matching Calming Game (Pushpakumara · IT23177246)
 *
 * Soothing, stress-free color matching activity for mindfulness and cognitive relaxation.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import RewardsModal from '@/components/RewardsModal';

interface ColorChoice {
  id: string;
  name: string;
  colorHex: string;
  emoji: string;
}

const COLOR_PALETTE: ColorChoice[] = [
  { id: 'blue', name: 'නිල් පාට', colorHex: '#3B82F6', emoji: '🔵' },
  { id: 'green', name: 'කොළ පාට', colorHex: '#10B981', emoji: '🟢' },
  { id: 'yellow', name: 'කහ පාට', colorHex: '#F59E0B', emoji: '🟡' },
  { id: 'pink', name: 'රෝස පාට', colorHex: '#EC4899', emoji: '🌸' },
];

export default function ColorMatchScreen() {
  const router = useRouter();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  const targetColor = COLOR_PALETTE[round % COLOR_PALETTE.length];

  const handleColorPress = (chosen: ColorChoice) => {
    if (isCompleted) return;

    if (chosen.id === targetColor.id) {
      setFeedback('නිවැරදියි! ඉතා විශිෂ්ටයි 🌟');
      const nextScore = score + 1;
      setScore(nextScore);

      if (nextScore >= 5) {
        setIsCompleted(true);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          setFeedback(null);
        }, 600);
      }
    } else {
      setFeedback('නැවත උත්සාහ කරන්න! ඔබට පුළුවන් 🌱');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const handleReset = () => {
    setRound(0);
    setScore(0);
    setFeedback(null);
    setIsCompleted(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
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

        <View style={styles.titleRow}>
          <AppText size="md">🎨</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            වර්ණ ගළපමු
          </AppText>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.navIconBtn} activeOpacity={0.7}>
          <AppText size="sm">🔄</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Prompt Card */}
        <View style={[styles.targetCard, ThemeShadow.sm]}>
          <AppText size="sm" color={ThemeColors.textSecondary} align="center">
            පහත වර්ණය තෝරන්න:
          </AppText>
          <AppText
            size="xl"
            weight="extrabold"
            color={targetColor.colorHex}
            align="center"
            style={{ marginVertical: 6 }}
          >
            {targetColor.name} {targetColor.emoji}
          </AppText>
          <AppText size="xs" color={ThemeColors.textMuted} align="center">
            ලකුණු: {score} / 5 ⭐
          </AppText>
        </View>

        {/* Feedback message */}
        {feedback && (
          <View style={styles.feedbackBanner}>
            <AppText size="xs" weight="bold" color={ThemeColors.primary} align="center">
              {feedback}
            </AppText>
          </View>
        )}

        {/* 2x2 Color Tiles Grid */}
        <View style={styles.colorGrid}>
          {COLOR_PALETTE.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.colorTile,
                { backgroundColor: item.colorHex },
                ThemeShadow.md,
              ]}
              onPress={() => handleColorPress(item)}
              activeOpacity={0.8}
            >
              <AppText size="display" style={{ fontSize: 40 }}>
                {item.emoji}
              </AppText>
              <AppText size="xs" weight="extrabold" color="#FFFFFF" style={{ marginTop: 4 }}>
                {item.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Completion Celebration Card */}
        {isCompleted && (
          <View style={[styles.completedCard, ThemeShadow.md]}>
            <AppText size="display">🎉</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 4 }}>
              විශිෂ්ටයි! ඔබ වර්ණ සියල්ල නිවැරදිව ගැළපුවා!
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 4 }}>
              සන්සුන් මනසකින් සියලු වර්ණ හඳුනා ගන්නා ලදී.
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
                style={styles.againActionBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🔄 නැවත කරමු
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Return Button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <AppText size="sm" weight="bold" color="#FFFFFF">
            🌿 විවේක පිටුවට ආපසු යමු
          </AppText>
        </TouchableOpacity>
      </ScrollView>

      <RewardsModal visible={showRewards} onClose={() => setShowRewards(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB',
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
    padding: ThemeSpacing.md,
    alignItems: 'center',
  },
  targetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: ThemeSpacing.sm,
  },
  feedbackBanner: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
    marginBottom: ThemeSpacing.sm,
  },
  colorGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: ThemeSpacing.sm,
  },
  colorTile: {
    width: '47%',
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  completedCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCD34D',
    marginVertical: ThemeSpacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: ThemeSpacing.md,
  },
  rewardActionBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
  },
  againActionBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
  },
  returnBtn: {
    width: '100%',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.md,
    alignItems: 'center',
    marginTop: ThemeSpacing.sm,
  },
});
