/**
 * nena-man · frontend/components/progressive-support/HighlightSupport.tsx
 * Level 1 Support: Visual text highlight with soft contrast for dyslexia accessibility.
 * For single/short words, highlights each letter/akuru individually.
 * For sentences, highlights each word.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';

interface HighlightSupportProps {
  text: string;
  splitParts?: string[];
}

function getHighlightSegments(text: string, splitParts?: string[]): { segments: string[]; isLetterLevel: boolean } {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);

  // If it's a multi-word sentence, highlight word-by-word
  if (words.length > 1) {
    return { segments: words, isLetterLevel: false };
  }

  // If it's a single/short word (e.g. "ගස", "පොත"):
  // 1. Use splitParts if provided
  if (splitParts && splitParts.length > 0) {
    return { segments: splitParts, isLetterLevel: true };
  }

  // 2. Intl.Segmenter for grapheme cluster splitting (preserves pillam with base consonants)
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('si', { granularity: 'grapheme' });
      const clusters = Array.from(segmenter.segment(trimmed), (s: any) => s.segment);
      if (clusters.length > 0) {
        return { segments: clusters, isLetterLevel: true };
      }
    } catch {
      // Fallback below
    }
  }

  // 3. Fallback regex for Sinhala consonant + optional virama / vowel signs
  const sinhalaGraphemes = trimmed.match(/[\u0D80-\u0DFF][\u0DCA-\u0DF3\u200D]*/g);
  if (sinhalaGraphemes && sinhalaGraphemes.length > 0) {
    return { segments: sinhalaGraphemes, isLetterLevel: true };
  }

  return { segments: Array.from(trimmed), isLetterLevel: true };
}

export const HighlightSupport: React.FC<HighlightSupportProps> = ({ text, splitParts }) => {
  const { segments, isLetterLevel } = useMemo(
    () => getHighlightSegments(text, splitParts),
    [text, splitParts]
  );

  return (
    <View style={styles.container}>
      <View style={styles.highlightBanner}>
        {segments.map((segment, idx) => (
          <View
            key={idx}
            style={[
              styles.chip,
              isLetterLevel ? styles.letterChip : styles.wordChip,
            ]}
          >
            <AppText
              size="display"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              style={styles.segmentText}
            >
              {segment}
            </AppText>
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
  highlightBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.sm,
    padding: ThemeSpacing.md,
    backgroundColor: '#FEF3C7', // Soft amber highlight box
    borderRadius: ThemeRadius.lg,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    elevation: 2,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterChip: {
    minWidth: 54,
    height: 64,
    paddingHorizontal: ThemeSpacing.md,
  },
  wordChip: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
  },
  segmentText: {
    letterSpacing: 0.5,
  },
});

export default HighlightSupport;
