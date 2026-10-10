/**
 * nena-man · frontend/app/(child)/game-memory.tsx
 * Module 4: Memory Matching Calming Game (Pushpakumara · IT23177246)
 *
 * Fully interactive 4x3 memory matching mini-game with card shuffle, flip logic,
 * move counter, timer, match detection, and completion reward celebration.
 */

import React, { useState, useEffect, useCallback } from 'react';
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

interface MemoryCard {
  id: number;
  pairId: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const INITIAL_PAIRS = ['🍎', '⭐', '🐟', '🌸', '🚗', '🎈'];

function createShuffledCards(): MemoryCard[] {
  const cardList: MemoryCard[] = [];
  let id = 1;
  INITIAL_PAIRS.forEach((emoji, pairId) => {
    cardList.push({ id: id++, pairId, emoji, isFlipped: false, isMatched: false });
    cardList.push({ id: id++, pairId, emoji, isFlipped: false, isMatched: false });
  });

  // Fisher-Yates Shuffle
  for (let i = cardList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cardList[i];
    cardList[i] = cardList[j];
    cardList[j] = temp;
  }
  return cardList;
}

export default function MemoryMatchingGame() {
  const router = useRouter();

  const [cards, setCards] = useState<MemoryCard[]>(() => createShuffledCards());
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  // Timer: active while playing
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResetGame = useCallback(() => {
    setCards(createShuffledCards());
    setMoves(0);
    setMatchedPairs(0);
    setSeconds(0);
    setFlippedIndices([]);
    setIsCompleted(false);
  }, []);

  const handleCardPress = (index: number) => {
    const card = cards[index];
    if (card.isFlipped || card.isMatched || flippedIndices.length >= 2) return;

    // Flip card
    const newCards = [...cards];
    newCards[index] = { ...card, isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newCards[firstIdx].pairId === newCards[secondIdx].pairId) {
        // MATCHED!
        setTimeout(() => {
          setCards((prev) => {
            const matchedCards = [...prev];
            matchedCards[firstIdx] = { ...matchedCards[firstIdx], isMatched: true };
            matchedCards[secondIdx] = { ...matchedCards[secondIdx], isMatched: true };
            return matchedCards;
          });
          setMatchedPairs((p) => {
            const nextCount = p + 1;
            if (nextCount === INITIAL_PAIRS.length) {
              setIsCompleted(true);
            }
            return nextCount;
          });
          setFlippedIndices([]);
        }, 350);
      } else {
        // NOT MATCHED - flip back after brief reveal
        setTimeout(() => {
          setCards((prev) => {
            const resetCards = [...prev];
            resetCards[firstIdx] = { ...resetCards[firstIdx], isFlipped: false };
            resetCards[secondIdx] = { ...resetCards[secondIdx], isFlipped: false };
            return resetCards;
          });
          setFlippedIndices([]);
        }, 750);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
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
          <AppText size="md">🧠</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            මතක ක්‍රීඩාව
          </AppText>
        </View>

        <TouchableOpacity
          onPress={handleResetGame}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <AppText size="sm">🔄</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Subtitle */}
        <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.instructionText}>
          එකම රූප දෙක සොයා කාඩ්පත් ගළපන්න!
        </AppText>

        {/* Stats Pill Row */}
        <View style={styles.statsPillRow}>
          <View style={styles.statPillItem}>
            <AppText size="xs">⏱️</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
              {formatTimer(seconds)}
            </AppText>
          </View>

          <View style={styles.statPillItem}>
            <AppText size="xs">🔲</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
              පියවර: {moves}
            </AppText>
          </View>

          <View style={styles.statPillItem}>
            <AppText size="xs">🏆</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
              {matchedPairs} / {INITIAL_PAIRS.length}
            </AppText>
          </View>
        </View>

        {/* 4x3 Card Grid */}
        <View style={styles.gridContainer}>
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardBox,
                  isRevealed ? styles.cardRevealed : styles.cardCovered,
                  card.isMatched && styles.cardMatched,
                  ThemeShadow.sm,
                ]}
                onPress={() => handleCardPress(idx)}
                activeOpacity={0.8}
              >
                {isRevealed ? (
                  <AppText size="display" style={{ fontSize: 34 }}>
                    {card.emoji}
                  </AppText>
                ) : (
                  <View style={styles.cardCoverContent}>
                    <View style={styles.coverInnerSquare}>
                      <AppText size="xs" color="#34D399" weight="bold">
                        නැණ
                      </AppText>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Encouraging Banner */}
        <View style={styles.goodEffortBanner}>
          <AppText size="xs" weight="bold" color={ThemeColors.accent}>
            {matchedPairs === INITIAL_PAIRS.length
              ? 'විශිෂ්ටයි! සියලුම රූප සාර්ථකව ගැළපුවා! 🎉'
              : matchedPairs > 0
              ? 'නියමයි! දිගටම ගළපන්න! 🌟'
              : 'කාඩ්පතක් ස්පර්ශ කර ආරම්භ කරන්න 🌱'}
          </AppText>
        </View>

        {/* Completion Card */}
        {isCompleted && (
          <View style={[styles.completedCard, ThemeShadow.md]}>
            <AppText size="display">🏆</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 4 }}>
              සුබ පැතුම්! මතක ක්‍රීඩාව ජයගත්තා!
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 4 }}>
              කාලය: {formatTimer(seconds)} · පියවර: {moves}
            </AppText>
            <View style={styles.completedButtonsRow}>
              <TouchableOpacity
                style={styles.completedActionBtn}
                onPress={() => setShowRewards(true)}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🏆 ජයග්‍රහණ බලන්න
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playAgainBtn}
                onPress={handleResetGame}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🔄 නැවත සෙල්ලම් කරමු
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Finish / Return Button */}
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <AppText size="sm" weight="bold" color="#FFFFFF">
            🏁 විවේක පිටුවට ආපසු යමු
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

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
  },
  instructionText: {
    marginVertical: ThemeSpacing.xs,
  },
  statsPillRow: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: ThemeRadius.full,
    paddingVertical: 6,
    paddingHorizontal: ThemeSpacing.md,
    marginVertical: ThemeSpacing.sm,
    gap: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 340,
    gap: 10,
    marginVertical: ThemeSpacing.sm,
  },
  cardBox: {
    width: 90,
    height: 96,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCovered: {
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardRevealed: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cardMatched: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  cardCoverContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  coverInnerSquare: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodEffortBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
    marginVertical: ThemeSpacing.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  completedCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    marginVertical: ThemeSpacing.sm,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  completedButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: ThemeSpacing.sm,
  },
  completedActionBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
  },
  playAgainBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
  },
  finishBtn: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ThemeSpacing.sm,
    ...ThemeShadow.sm,
  },
});
