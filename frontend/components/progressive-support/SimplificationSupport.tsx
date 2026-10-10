/**
 * nena-man · frontend/components/progressive-support/SimplificationSupport.tsx
 * Level 4 Support: AI Sinhala Text Simplification Card.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';

interface SimplificationSupportProps {
  originalText: string;
  simplifiedText?: string;
  simplificationNeeded: boolean;
}

export const SimplificationSupport: React.FC<SimplificationSupportProps> = ({
  originalText,
  simplifiedText,
  simplificationNeeded,
}) => {
  const { t } = useLanguage();

  if (!simplificationNeeded || !simplifiedText) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Pill */}
        <View style={styles.headerRow}>
          <View style={styles.pill}>
            <AppText size="xs" weight="extrabold" color="#047857">
              ✨ {t('progressiveSupport.simplerText')}
            </AppText>
          </View>
        </View>

        {/* Original Sentence (Striked / Muted) */}
        <View style={styles.originalSection}>
          <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
            📖 {t('progressiveSupport.original')}
          </AppText>
          <AppText
            size="lg"
            weight="medium"
            color={ThemeColors.textSecondary}
            style={styles.strikedText}
          >
            {originalText}
          </AppText>
        </View>

        {/* Arrow Divider */}
        <View style={styles.arrowRow}>
          <AppText size="sm" weight="extrabold" color="#059669">
            ⬇️
          </AppText>
        </View>

        {/* Simplified Sentence Highlight Box */}
        <View style={styles.simplifiedSection}>
          <AppText size="xs" weight="extrabold" color="#047857">
            🌟 {t('progressiveSupport.simplified')}
          </AppText>
          <AppText
            size="display"
            weight="extrabold"
            color={ThemeColors.textPrimary}
            style={styles.simplifiedText}
          >
            {simplifiedText}
          </AppText>
        </View>
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
  card: {
    padding: ThemeSpacing.md,
    backgroundColor: '#ECFDF5', // Soft emerald green background
    borderRadius: ThemeRadius.lg,
    borderWidth: 2,
    borderColor: '#34D399',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: ThemeSpacing.xs,
  },
  pill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs,
    borderRadius: ThemeRadius.full,
  },
  originalSection: {
    marginBottom: ThemeSpacing.xs,
  },
  strikedText: {
    textDecorationLine: 'line-through',
    marginTop: ThemeSpacing.xxs,
  },
  arrowRow: {
    alignItems: 'center',
    marginVertical: ThemeSpacing.xxs,
  },
  simplifiedSection: {
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    elevation: 2,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  simplifiedText: {
    marginTop: ThemeSpacing.xs,
    letterSpacing: 0.5,
  },
});

export default SimplificationSupport;
