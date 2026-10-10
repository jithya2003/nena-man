/**
 * nena-man · frontend/components/progressive-support/ProgressiveSupportCard.tsx
 * Reusable master card integrating progressive support levels, step indicator,
 * live reading/recording indicator, contextual instructions, and simulation controls.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors, ThemeSpacing, ThemeRadius, ThemeShadow } from '@/constants/theme';
import { ReadingSupportItem } from '@/types/progressiveSupport';
import { useProgressiveSupport } from '@/hooks/useProgressiveSupport';
import SupportStepIndicator from './SupportStepIndicator';
import HighlightSupport from './HighlightSupport';
import AkuruSplitSupport from './AkuruSplitSupport';
import AudioSupport from './AudioSupport';
import SimplificationSupport from './SimplificationSupport';

interface ProgressiveSupportCardProps {
  item: ReadingSupportItem;
  onComplete?: () => void;
}

export const ProgressiveSupportCard: React.FC<ProgressiveSupportCardProps> = ({
  item,
  onComplete,
}) => {
  const { t } = useLanguage();
  const {
    currentSupportLevel,
    retryCount,
    completed,
    lastAttemptCorrect,
    handleAttemptResult,
    resetProgressiveState,
    attemptsRemainingInLevel,
  } = useProgressiveSupport(item);

  // Live Reading / Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [showDevControls, setShowDevControls] = useState<boolean>(true);

  // Pulsing animation for microphone listening indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Start duration counter
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      return () => {
        pulseLoop.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording, pulseAnim]);

  const handleStartRecording = () => {
    if (isAnalyzing) return;
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsAnalyzing(true);

    // Analyze for 1 second, then return to ready state
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  const handleSimulateCorrect = () => {
    handleAttemptResult(true);
    if (onComplete) onComplete();
  };

  const handleSimulateIncorrect = () => {
    handleAttemptResult(false);
  };

  const handleReset = () => {
    resetProgressiveState();
  };

  // Format seconds to mm:ss
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <Card style={styles.card}>
      {/* 1. Header Row: Difficulty Badge & Grade */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.difficultyBadge, styles[`diff_${item.difficultyLevel}`]]}>
            <AppText size="xs" weight="extrabold" color="#FFFFFF">
              {t(`progressiveSupport.${item.difficultyLevel}Scenario`)}
            </AppText>
          </View>
          <View style={styles.gradeBadge}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              Grade {item.gradeLevel}
            </AppText>
          </View>
        </View>

        {/* Attempt Counter Badge placed on top right */}
        {!completed && (
          <View style={styles.attemptPill}>
            <AppText size="xs" weight="extrabold" color="#92400E">
              🎯 {t('progressiveSupport.attemptProgress', {
                current: Math.min(retryCount + 1, item.maxRetriesPerLevel).toString(),
                max: item.maxRetriesPerLevel.toString(),
              })}
            </AppText>
          </View>
        )}
      </View>

      {/* 2. Support Step Indicator Bar */}
      <SupportStepIndicator
        currentLevel={currentSupportLevel}
        maxSupportLevel={item.maxSupportLevel}
        splitNeeded={item.splitNeeded}
        simplificationNeeded={item.simplificationNeeded}
      />

      {/* 3. Contextual Encouragement Banner based on Support Level */}
      <View style={styles.instructionBanner}>
        <AppText size="sm" weight="extrabold" color="#047857" align="center">
          {t(`progressiveSupport.instructionL${currentSupportLevel}`)}
        </AppText>
      </View>

      {/* 4. Main Educational Reading Display Area */}
      <View style={styles.displayArea}>
        <AppText size="xs" weight="extrabold" color={ThemeColors.textMuted} align="center">
          {t('progressiveSupport.readThis')}
        </AppText>

        {/* Level 0: Independent Attempt */}
        {currentSupportLevel === 0 && (
          <View style={styles.independentBox}>
            <AppText
              size="display"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              align="center"
              style={styles.mainText}
            >
              {item.originalText}
            </AppText>
          </View>
        )}

        {/* Level 1: Highlight Support */}
        {currentSupportLevel === 1 && (
          <HighlightSupport
            text={item.originalText}
            splitParts={item.splitParts}
          />
        )}

        {/* Level 2: Akuru / Syllable Split Support */}
        {currentSupportLevel === 2 && (
          <AkuruSplitSupport
            originalText={item.originalText}
            splitParts={item.splitParts}
          />
        )}

        {/* Level 3: Audio Support */}
        {currentSupportLevel === 3 && (
          <View style={styles.level3Container}>
            <View style={styles.independentBox}>
              <AppText
                size="display"
                weight="extrabold"
                color={ThemeColors.textPrimary}
                align="center"
                style={styles.mainText}
              >
                {item.originalText}
              </AppText>
            </View>
            <AudioSupport audioUri={item.audioUri} text={item.originalText} />
          </View>
        )}

        {/* Level 4: Text Simplification Support */}
        {currentSupportLevel === 4 && (
          <SimplificationSupport
            originalText={item.originalText}
            simplifiedText={item.simplifiedText}
            simplificationNeeded={item.simplificationNeeded}
          />
        )}
      </View>

      {/* 5. Live Reading Indicator & Microphone Action Button */}
      {!completed ? (
        <View style={styles.readingInteractionArea}>
          {isRecording ? (
            /* Active Listening / Recording State */
            <View style={styles.listeningActiveBox}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <View style={styles.activeMicIcon}>
                  <AppText size="xl">🎙️</AppText>
                </View>
              </Animated.View>

              <AppText size="sm" weight="extrabold" color="#DC2626" style={styles.listeningText}>
                {t('progressiveSupport.listening')}
              </AppText>

              <View style={styles.waveformRow}>
                <View style={[styles.waveBar, styles.waveBar1]} />
                <View style={[styles.waveBar, styles.waveBar2]} />
                <View style={[styles.waveBar, styles.waveBar3]} />
                <View style={[styles.waveBar, styles.waveBar2]} />
                <View style={[styles.waveBar, styles.waveBar1]} />
                <AppText size="sm" weight="bold" color="#64748B" style={styles.timerText}>
                  ⏱️ {formatTimer(recordingSeconds)}
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.stopReadingBtn}
                onPress={handleStopRecording}
                activeOpacity={0.8}
              >
                <AppText size="sm" weight="extrabold" color="#FFFFFF">
                  {t('progressiveSupport.doneReading')}
                </AppText>
              </TouchableOpacity>
            </View>
          ) : isAnalyzing ? (
            /* AI Processing / Analyzing State */
            <View style={styles.analyzingBox}>
              <ActivityIndicator size="small" color={ThemeColors.primary} />
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={styles.analyzingText}>
                {t('progressiveSupport.analyzing')}
              </AppText>
            </View>
          ) : (
            /* Idle Ready-to-Read Microphone CTA */
            <TouchableOpacity
              style={styles.tapToReadBtn}
              onPress={handleStartRecording}
              activeOpacity={0.85}
            >
              <View style={styles.micCircle}>
                <AppText size="lg">🎙️</AppText>
              </View>
              <AppText size="md" weight="extrabold" color="#FFFFFF" style={styles.tapToReadText}>
                {t('progressiveSupport.tapToRead')}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* 6. Success / Feedback Banner */}
      {completed ? (
        <View style={styles.successBanner}>
          <AppText size="lg" weight="extrabold" color={ThemeColors.success} align="center">
            {t('progressiveSupport.correct')}
          </AppText>
          <TouchableOpacity
            style={styles.readAgainBtn}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <AppText size="xs" weight="extrabold" color={ThemeColors.success}>
              {t('progressiveSupport.readAgain')}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : lastAttemptCorrect === false ? (
        <View style={styles.retryBanner}>
          <AppText size="sm" weight="extrabold" color={ThemeColors.error} align="center">
            {t('progressiveSupport.incorrect')}{' '}
            {t('progressiveSupport.attemptsRemaining', {
              count: attemptsRemainingInLevel.toString(),
            })}
          </AppText>
        </View>
      ) : null}

      {/* 7. Simulation & Dev Action Controls */}
      <View style={styles.actionsArea}>
        <TouchableOpacity
          style={styles.devHeaderToggle}
          onPress={() => setShowDevControls(!showDevControls)}
          activeOpacity={0.7}
        >
          <AppText size="xs" weight="extrabold" color={ThemeColors.textSecondary}>
            {t('progressiveSupport.devControls')} {showDevControls ? '▲' : '▼'}
          </AppText>
        </TouchableOpacity>

        {showDevControls && (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.simButton, styles.simCorrectBtn]}
                onPress={handleSimulateCorrect}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF" align="center">
                  {t('progressiveSupport.simulateCorrect')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simButton, styles.simIncorrectBtn]}
                onPress={handleSimulateIncorrect}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF" align="center">
                  {t('progressiveSupport.simulateIncorrect')}
                </AppText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} align="center">
                {t('progressiveSupport.reset')}
              </AppText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginVertical: ThemeSpacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    ...ThemeShadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs,
    borderRadius: ThemeRadius.sm,
  },
  diff_easy: { backgroundColor: '#059669' },
  diff_medium: { backgroundColor: '#D97706' },
  diff_hard: { backgroundColor: '#C14343' },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs,
    borderRadius: ThemeRadius.sm,
  },
  attemptPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pictureCueBadge: {
    backgroundColor: '#F8FAFC',
    padding: ThemeSpacing.xs,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionBanner: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginVertical: ThemeSpacing.xs,
  },
  displayArea: {
    marginVertical: ThemeSpacing.sm,
    padding: ThemeSpacing.md,
    backgroundColor: '#FAFDFB',
    borderRadius: ThemeRadius.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  independentBox: {
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    letterSpacing: 0.5,
  },
  level3Container: {
    alignItems: 'center',
    width: '100%',
  },
  readingInteractionArea: {
    marginVertical: ThemeSpacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  tapToReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B7A44',
    paddingVertical: ThemeSpacing.sm + 4,
    paddingHorizontal: ThemeSpacing.xl,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#064E2A',
    borderBottomWidth: 4,
    borderBottomColor: '#064E2A',
    gap: ThemeSpacing.sm,
    width: '90%',
    ...ThemeShadow.sm,
  },
  micCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToReadText: {
    letterSpacing: 0.5,
  },
  listeningActiveBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    width: '100%',
  },
  pulseRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  activeMicIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    marginVertical: ThemeSpacing.xs,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: ThemeSpacing.xs,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  waveBar1: { height: 12 },
  waveBar2: { height: 20 },
  waveBar3: { height: 28 },
  timerText: {
    marginLeft: ThemeSpacing.sm,
  },
  stopReadingBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: ThemeSpacing.xs + 3,
    paddingHorizontal: ThemeSpacing.lg,
    borderRadius: ThemeRadius.full,
    marginTop: ThemeSpacing.xs,
  },
  analyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EE',
    borderWidth: 1.5,
    borderColor: '#BCE6CB',
    borderRadius: ThemeRadius.full,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: ThemeSpacing.lg,
    gap: ThemeSpacing.sm,
    width: '90%',
  },
  analyzingText: {
    marginLeft: ThemeSpacing.xs,
  },
  successBanner: {
    backgroundColor: '#EAF7EE',
    borderColor: '#BCE6CB',
    borderWidth: 2,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    marginVertical: ThemeSpacing.xs,
  },
  evalChoiceCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    width: '100%',
    ...ThemeShadow.sm,
  },
  evalChoiceRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.sm,
    width: '100%',
  },
  evalChoiceBtn: {
    flex: 1,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: ThemeSpacing.md,
    borderRadius: ThemeRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  evalPassBtn: {
    backgroundColor: '#059669',
  },
  evalFailBtn: {
    backgroundColor: '#DC2626',
  },
  readAgainBtn: {
    marginTop: ThemeSpacing.xs + 2,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: ThemeSpacing.xs + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#BCE6CB',
  },
  retryBanner: {
    backgroundColor: '#FDECEC',
    borderColor: '#F6BEBE',
    borderWidth: 1.5,
    padding: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.md,
    marginVertical: ThemeSpacing.xs,
  },
  actionsArea: {
    marginTop: ThemeSpacing.sm,
    paddingTop: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    gap: ThemeSpacing.xs,
  },
  devHeaderToggle: {
    alignSelf: 'center',
    paddingVertical: ThemeSpacing.xs,
    paddingHorizontal: ThemeSpacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: ThemeSpacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.xxs,
  },
  simButton: {
    flex: 1,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    justifyContent: 'center',
  },
  simCorrectBtn: {
    backgroundColor: '#059669',
  },
  simIncorrectBtn: {
    backgroundColor: '#DC2626',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: ThemeSpacing.xs,
    paddingHorizontal: ThemeSpacing.md,
  },
});

export default ProgressiveSupportCard;
