import React, { useState, useEffect } from 'react';
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

interface MemoryCard {
  id: number;
  pairId: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const INITIAL_PAIRS = ['🍎', '⭐', '🐟', '🌸', '🚗', '🎈'];

export default function MemoryMatchingGame() {
  const router = useRouter();

  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const cardList: MemoryCard[] = [];
    let id = 1;
    INITIAL_PAIRS.forEach((emoji, pairId) => {
      cardList.push({ id: id++, pairId, emoji, isFlipped: false, isMatched: false });
      cardList.push({ id: id++, pairId, emoji, isFlipped: false, isMatched: false });
    });
    // Set 2 pairs matched for instant mockup look
    cardList[1].isFlipped = true;
    cardList[4].isFlipped = true;
    return cardList;
  });

  const [moves, setMoves] = useState(5);
  const [matchedPairs, setMatchedPairs] = useState(2);
  const [seconds, setSeconds] = useState(45);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([1, 4]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCardPress = (index: number) => {
    const card = cards[index];
    if (card.isFlipped || card.isMatched || flippedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].pairId === cards[secondIdx].pairId) {
        // Matched
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setMatchedPairs((p) => p + 1);
          setFlippedIndices([]);
        }, 500);
      } else {
        // Not matched - flip back
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
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

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Subtitle */}
        <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.instructionText}>
          එකම රූප දෙක සොයා ගන්න.
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
              {matchedPairs} / 6
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
                  ThemeShadow.sm,
                ]}
                onPress={() => handleCardPress(idx)}
                activeOpacity={0.8}
              >
                {isRevealed ? (
                  <AppText size="display" style={{ fontSize: 32 }}>
                    {card.emoji}
                  </AppText>
                ) : (
                  <View style={styles.cardCoverContent}>
                    <View style={styles.coverInnerSquare}>
                      <AppText size="xs" color="#34D399" style={{ opacity: 0.6 }}>
                        නැණ
                      </AppText>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Good Effort Banner */}
        <View style={styles.goodEffortBanner}>
          <AppText size="xs" weight="bold" color={ThemeColors.accent}>
            හොඳ උත්සාහයක්! 🌟
          </AppText>
        </View>

        {/* Finish Button */}
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <AppText size="sm" weight="bold" color="#FFFFFF">
            🏁 අවසන් කරන්න
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>
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
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xl,
    alignItems: 'center',
  },
  instructionText: {
    marginBottom: ThemeSpacing.sm,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F1F8',
    borderRadius: ThemeRadius.full,
    paddingVertical: 6,
    paddingHorizontal: ThemeSpacing.md,
    marginBottom: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  statPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginBottom: ThemeSpacing.lg,
  },
  cardBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cardCovered: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  cardRevealed: {
    backgroundColor: '#FFFFFF',
    borderColor: '#059669',
  },
  cardCoverContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  coverInnerSquare: {
    width: '80%',
    height: '80%',
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodEffortBanner: {
    backgroundColor: '#FDF4E9',
    borderRadius: ThemeRadius.full,
    paddingVertical: 6,
    paddingHorizontal: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: '#FBE8D0',
    marginBottom: ThemeSpacing.md,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    width: '100%',
    maxWidth: 320,
    height: 48,
  },
});
