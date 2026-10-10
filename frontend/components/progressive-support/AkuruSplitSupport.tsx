/**
 * nena-man · frontend/components/progressive-support/AkuruSplitSupport.tsx
 * Level 2 Support: Akuru / Syllable Split display for phonetic decoding.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';

interface AkuruSplitSupportProps {
  originalText: string;
  splitParts?: string[];
}

interface WordSplitGroup {
  word: string;
  syllables: string[];
}

function groupSyllablesByWord(originalText: string, splitParts?: string[]): WordSplitGroup[] {
  const words = originalText.trim().split(/\s+/).filter(Boolean);
  const parts = splitParts && splitParts.length > 0 ? splitParts : [];

  if (words.length <= 1) {
    return [
      {
        word: originalText.trim(),
        syllables: parts.length > 0 ? parts : Array.from(originalText.trim()),
      },
    ];
  }

  // If no split parts, return each word as a single syllable
  if (parts.length === 0) {
    return words.map((w) => ({ word: w, syllables: [w] }));
  }

  // If split parts already equal word count, each part is a whole word
  if (parts.length === words.length) {
    return words.map((w, i) => ({ word: w, syllables: [parts[i]] }));
  }

  // Group syllables by matching against each word's accumulated characters
  const result: WordSplitGroup[] = [];
  let partIdx = 0;

  for (const word of words) {
    const currentWordSyllables: string[] = [];
    let accumulated = '';

    while (partIdx < parts.length) {
      const part = parts[partIdx];
      currentWordSyllables.push(part);
      accumulated += part;
      partIdx++;

      // When accumulated syllables cover this word
      if (accumulated === word || accumulated.length >= word.length) {
        break;
      }
    }

    result.push({
      word,
      syllables: currentWordSyllables.length > 0 ? currentWordSyllables : [word],
    });
  }

  // Append any leftover syllables to the last word
  if (partIdx < parts.length && result.length > 0) {
    result[result.length - 1].syllables.push(...parts.slice(partIdx));
  }

  return result;
}

export const AkuruSplitSupport: React.FC<AkuruSplitSupportProps> = ({
  originalText,
  splitParts = [],
}) => {
  const wordGroups = useMemo(
    () => groupSyllablesByWord(originalText, splitParts),
    [originalText, splitParts]
  );

  const isMultiWord = wordGroups.length > 1;

  return (
    <View style={styles.container}>
      <View style={styles.splitRow}>
        {wordGroups.map((group, gIdx) => (
          <View
            key={gIdx}
            style={[
              styles.wordCluster,
              isMultiWord && styles.multiWordCluster,
            ]}
          >
            {group.syllables.map((segment, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <View style={styles.dashDivider}>
                    <AppText size="md" weight="extrabold" color="#0284C7">
                      -
                    </AppText>
                  </View>
                )}
                <View style={styles.segmentCard}>
                  <AppText
                    size="xl"
                    weight="extrabold"
                    color={ThemeColors.textPrimary}
                    style={styles.segmentText}
                  >
                    {segment}
                  </AppText>
                </View>
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ThemeSpacing.md,
    width: '100%',
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.sm,
    padding: ThemeSpacing.md,
    backgroundColor: '#E0F2FE', // Soft sky blue background
    borderRadius: ThemeRadius.lg,
    borderWidth: 2,
    borderColor: '#38BDF8',
    width: '100%',
  },
  wordCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.xxs,
  },
  multiWordCluster: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: ThemeSpacing.xs,
    paddingVertical: ThemeSpacing.xxs + 2,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dashDivider: {
    marginHorizontal: 1,
  },
  segmentCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.sm + 2,
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  segmentText: {
    letterSpacing: 0.5,
  },
});

export default AkuruSplitSupport;
