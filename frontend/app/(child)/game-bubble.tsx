/**
 * nena-man · frontend/app/(child)/game-bubble.tsx
 * Module 4: Bubble Popping Calming Game (Pushpakumara · IT23177246)
 *
 * Highly engaging, soothing bubble-popping interaction designed for sensory reset,
 * reducing anxiety, and resetting cognitive attention.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
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

const { width } = Dimensions.get('window');

interface BubbleItem {
  id: number;
  size: number;
  color: string;
  popped: boolean;
  emoji: string;
}

const BUBBLE_COLORS = [
  '#93C5FD',
  '#A7F3D0',
  '#DDD6FE',
  '#FDE68A',
  '#FBCFE8',
  '#BAE6FD',
  '#C7D2FE',
  '#FED7AA',
];
const BUBBLE_ICONS = ['🫧', '✨', '🌸', '🍃', '⭐', '🎈', '💖', '🌼'];
const TOTAL_BUBBLES = 18;

function generateBubbles(): BubbleItem[] {
  return Array.from({ length: TOTAL_BUBBLES }, (_, i) => ({
    id: i + 1,
    size: 68 + (i % 3) * 10,
    color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    popped: false,
    emoji: BUBBLE_ICONS[i % BUBBLE_ICONS.length],
  }));
}

export default function BubbleCalmScreen() {
  const router = useRouter();
  const [bubbles, setBubbles] = useState<BubbleItem[]>(() => generateBubbles());
  const [poppedCount, setPoppedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;

  // Floating ambient animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePopBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    const newCount = poppedCount + 1;
    setPoppedCount(newCount);

    if (newCount >= TOTAL_BUBBLES) {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setBubbles(generateBubbles());
    setPoppedCount(0);
    setIsCompleted(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/cooldown')}
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
          <AppText size="md">🫧</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            බුබුළු සන්සුන් කිරීම
          </AppText>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.navIconBtn} activeOpacity={0.7}>
          <AppText size="sm">🔄</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Instruction */}
        <View style={[styles.headerBanner, ThemeShadow.sm]}>
          <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} align="center">
            {isCompleted ? 'සියලුම බුබුළු පිපිරුවා! මනස සැහැල්ලුයි 🌸' : 'බුබුළු ස්පර්ශ කර සැහැල්ලු වන්න! 🍃'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 2 }}>
            පුපුරුවා ඇති බුබුළු: {poppedCount} / {TOTAL_BUBBLES} 🫧
          </AppText>
        </View>

        {/* Completion Card */}
        {isCompleted && (
          <View style={[styles.completedCard, ThemeShadow.md]}>
            <AppText size="display">🎉</AppText>
            <AppText size="xl" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 6 }}>
              විශිෂ්ටයි! මනස සන්සුන් විය!
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 4 }}>
              ඔබ සාර්ථකව බුබුළු {TOTAL_BUBBLES} ම පුපුරුවා සන්සුන් බව ලබා ගත්තා.
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
                  🔄 තව බුබුළු පුපුරුවමු
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bubbles Multi-Grid Field */}
        <Animated.View
          style={[
            styles.bubblesGrid,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          {bubbles.map((b) => (
            <View key={b.id} style={styles.bubbleCell}>
              {!b.popped ? (
                <TouchableOpacity
                  style={[
                    styles.bubbleCircle,
                    {
                      width: b.size,
                      height: b.size,
                      borderRadius: b.size / 2,
                      backgroundColor: b.color,
                    },
                    ThemeShadow.sm,
                  ]}
                  onPress={() => handlePopBubble(b.id)}
                  activeOpacity={0.5}
                >
                  <AppText size="lg">{b.emoji}</AppText>
                </TouchableOpacity>
              ) : (
                <View style={[styles.poppedPlaceholder, { width: b.size, height: b.size }]}>
                  <AppText size="xs" color="#94A3B8">
                    ✨
                  </AppText>
                </View>
              )}
            </View>
          ))}
        </Animated.View>

        {/* Return to Cooldown button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <AppText size="sm" weight="bold" color={ThemeColors.primary}>
            🌿 විවේක පිටුවට ආපසු යමු
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      <RewardsModal visible={showRewards} onClose={() => setShowRewards(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
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
  headerBanner: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: ThemeSpacing.md,
  },
  bubblesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: ThemeSpacing.sm,
  },
  bubbleCell: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  bubbleCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  poppedPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.lg,
    borderRadius: ThemeRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
    marginBottom: ThemeSpacing.md,
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
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: ThemeSpacing.md,
  },
});
