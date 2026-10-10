/**
 * nena-man · frontend/components/progressive-support/SupportStepIndicator.tsx
 * Child-friendly visual indicator showing the current progressive support stage
 * with option icons and names underneath each step.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';
import { SupportLevel } from '@/types/progressiveSupport';

interface SupportStepIndicatorProps {
  currentLevel: SupportLevel;
  maxSupportLevel: SupportLevel;
  splitNeeded: boolean;
  simplificationNeeded: boolean;
}

interface LevelMetadata {
  level: SupportLevel;
  translationKey: string;
  shortLabelKey: string;
  icon: string;
  color: string;
  bg: string;
}

const LEVEL_CONFIGS: LevelMetadata[] = [
  {
    level: 0,
    translationKey: 'progressiveSupport.independent',
    shortLabelKey: 'progressiveSupport.stepL0',
    icon: '🌟',
    color: ThemeColors.primary,
    bg: ThemeColors.primaryLight,
  },
  {
    level: 1,
    translationKey: 'progressiveSupport.hint',
    shortLabelKey: 'progressiveSupport.stepL1',
    icon: '💡',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    level: 2,
    translationKey: 'progressiveSupport.breakDown',
    shortLabelKey: 'progressiveSupport.stepL2',
    icon: '🔤',
    color: '#0284C7',
    bg: '#E0F2FE',
  },
  {
    level: 3,
    translationKey: 'progressiveSupport.listen',
    shortLabelKey: 'progressiveSupport.stepL3',
    icon: '🔊',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    level: 4,
    translationKey: 'progressiveSupport.simplerText',
    shortLabelKey: 'progressiveSupport.stepL4',
    icon: '✨',
    color: '#059669',
    bg: '#ECFDF5',
  },
];

export const SupportStepIndicator: React.FC<SupportStepIndicatorProps> = ({
  currentLevel,
  maxSupportLevel,
  splitNeeded,
  simplificationNeeded,
}) => {
  const { t } = useLanguage();

  // Filter valid steps for this reading item
  const validSteps = LEVEL_CONFIGS.filter((step) => {
    if (step.level === 0) return true;
    if (step.level > maxSupportLevel) return false;
    if (step.level === 2 && !splitNeeded) return false;
    if (step.level === 4 && !simplificationNeeded) return false;
    return true;
  });

  const activeStep = LEVEL_CONFIGS.find((s) => s.level === currentLevel) || LEVEL_CONFIGS[0];

  return (
    <View style={styles.container}>
      {/* Top Badge showing current stage */}
      <View style={[styles.activeBadge, { backgroundColor: activeStep.bg, borderColor: activeStep.color }]}>
        <AppText size="sm" weight="extrabold" color={activeStep.color}>
          {activeStep.icon} {t(activeStep.translationKey)}
        </AppText>
      </View>

      {/* Progress Dots Bar with Names underneath */}
      <View style={styles.stepsContainer}>
        {validSteps.map((step, index) => {
          const isActive = step.level === currentLevel;
          const isPassed = step.level < currentLevel;

          return (
            <React.Fragment key={step.level}>
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isPassed || isActive ? { backgroundColor: activeStep.color } : styles.inactiveLine,
                  ]}
                />
              )}
              <View style={styles.stepColumn}>
                <View
                  style={[
                    styles.dot,
                    isActive && [styles.activeDot, { backgroundColor: step.color, borderColor: step.bg }],
                    isPassed && [styles.passedDot, { backgroundColor: step.color }],
                  ]}
                >
                  <AppText
                    size="xs"
                    weight="extrabold"
                    color={isActive || isPassed ? '#FFFFFF' : ThemeColors.textMuted}
                  >
                    {step.icon}
                  </AppText>
                </View>

                {/* Option Name Underneath the Icon */}
                <AppText
                  size="xs"
                  weight={isActive ? 'extrabold' : 'medium'}
                  color={isActive ? step.color : ThemeColors.textSecondary}
                  style={styles.stepLabel}
                  numberOfLines={2}
                >
                  {t(step.shortLabelKey)}
                </AppText>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: ThemeSpacing.sm,
  },
  activeBadge: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    marginBottom: ThemeSpacing.xs,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: ThemeSpacing.xs,
    marginTop: ThemeSpacing.xs,
  },
  stepColumn: {
    alignItems: 'center',
    width: 64,
  },
  connectorLine: {
    height: 3,
    width: 16,
    borderRadius: 2,
    marginTop: 15,
  },
  inactiveLine: {
    backgroundColor: ThemeColors.borderLight,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ThemeColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  activeDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  passedDot: {
    borderColor: 'transparent',
  },
  stepLabel: {
    marginTop: ThemeSpacing.xxs + 2,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
    minHeight: 26,
  },
});

export default SupportStepIndicator;
