/**
 * nena-man · frontend/app/(child)/game-puzzle.tsx
 * Module 4: Letter Match Puzzle Calming Game (Pushpakumara · IT23177246)
 *
 * Interactive puzzle where dyslexic children match Sinhala letters to corresponding visual icons.
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

interface PuzzlePair {
  id: string;
  letter: string;
  word: string;
  emoji: string;
  color: string;
}

const PUZZLE_DATA: PuzzlePair[] = [
  { id: '1', letter: 'අ', word: 'අලියා', emoji: '🐘', color: '#DBEAFE' },
  { id: '2', letter: 'ක', word: 'කෙසෙල්', emoji: '🍌', color: '#FEF3C7' },
  { id: '3', letter: 'ම', word: 'මල', emoji: '🌸', color: '#FCE7F3' },
  { id: '4', letter: 'ර', word: 'රවුම', emoji: '⭕', color: '#DCFCE7' },
];

export default function LetterPuzzleScreen() {
  const router = useRouter();
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const isCompleted = matchedIds.length === PUZZLE_DATA.length;

  const handleSelectLetter = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedLetterId(id);
  };

  const handleSelectPicture = (id: string) => {
    if (matchedIds.includes(id)) return;

    if (!selectedLetterId) {
      return;
    }

    if (selectedLetterId === id) {
      // MATCH!
      setMatchedIds((prev) => [...prev, id]);
      setSelectedLetterId(null);
    } else {
      // WRONG
      setWrongFlash(id);
      setTimeout(() => setWrongFlash(null), 600);
    }
  };

  const handleReset = () => {
    setMatchedIds([]);
    setSelectedLetterId(null);
    setWrongFlash(null);
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
          <AppText size="md">🧩</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            අකුරු ගළපමු
          </AppText>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.navIconBtn} activeOpacity={0.7}>
          <AppText size="sm">🔄</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Instruction Header */}
        <View style={[styles.instructionCard, ThemeShadow.sm]}>
          <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} align="center">
            {isCompleted ? 'විශිෂ්ටයි! සියලුම අකුරු ගැළපුවා! 🎉' : 'අකුරක් තෝරා ගැළපෙන රූපය ස්පර්ශ කරන්න!'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 2 }}>
            ගැළපූ අකුරු: {matchedIds.length} / {PUZZLE_DATA.length} ⭐
          </AppText>
        </View>

        {/* Puzzle Columns */}
        <View style={styles.puzzleField}>
          {/* Left Column: Letters */}
          <View style={styles.column}>
            <AppText size="xs" weight="extrabold" color={ThemeColors.textSecondary} style={styles.colTitle}>
              අකුරු (Letters)
            </AppText>
            {PUZZLE_DATA.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedLetterId === item.id;

              return (
                <TouchableOpacity
                  key={`letter-${item.id}`}
                  style={[
                    styles.card,
                    { backgroundColor: item.color },
                    isSelected && styles.cardSelected,
                    isMatched && styles.cardMatched,
                    ThemeShadow.sm,
                  ]}
                  onPress={() => handleSelectLetter(item.id)}
                  disabled={isMatched}
                  activeOpacity={0.75}
                >
                  <AppText size="display" weight="extrabold" color={isMatched ? '#059669' : ThemeColors.textPrimary}>
                    {item.letter}
                  </AppText>
                  {isMatched && (
                    <View style={styles.checkBadge}>
                      <AppText size="xs" weight="bold" color="#FFFFFF">
                        ✓
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right Column: Pictures */}
          <View style={styles.column}>
            <AppText size="xs" weight="extrabold" color={ThemeColors.textSecondary} style={styles.colTitle}>
              රූප (Pictures)
            </AppText>
            {PUZZLE_DATA.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isFlashWrong = wrongFlash === item.id;

              return (
                <TouchableOpacity
                  key={`pic-${item.id}`}
                  style={[
                    styles.card,
                    { backgroundColor: '#FFFFFF' },
                    isFlashWrong && styles.cardWrong,
                    isMatched && styles.cardMatched,
                    ThemeShadow.sm,
                  ]}
                  onPress={() => handleSelectPicture(item.id)}
                  disabled={isMatched}
                  activeOpacity={0.75}
                >
                  <AppText size="display">{item.emoji}</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                    {item.word}
                  </AppText>
                  {isMatched && (
                    <View style={styles.checkBadge}>
                      <AppText size="xs" weight="bold" color="#FFFFFF">
                        ✓
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Completion Celebration Card */}
        {isCompleted && (
          <View style={[styles.completedCard, ThemeShadow.md]}>
            <AppText size="display">🏆</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 4 }}>
              සුබ පැතුම්! ඔබ අකුරු ගළපා අවසන්!
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 4 }}>
              සියලුම අකුරු සහ රූප නිවැරදිව හඳුනා ගන්නා ලදී.
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
    backgroundColor: '#F8FAFC',
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
  instructionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  puzzleField: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: ThemeSpacing.md,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  colTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    height: 84,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  cardSelected: {
    borderColor: ThemeColors.primary,
    borderWidth: 3,
  },
  cardMatched: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    opacity: 0.9,
  },
  cardWrong: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A7F3D0',
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
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.md,
    alignItems: 'center',
    marginTop: ThemeSpacing.xs,
  },
});
