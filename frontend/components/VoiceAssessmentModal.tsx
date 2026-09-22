import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { analyzeSpeechPronunciation, PhonemeAnalysisResult } from '@/utils/phonemeAnalyzer';

interface VoiceAssessmentModalProps {
  visible: boolean;
  targetText: string;
  mode: 'letter' | 'word' | 'sentence';
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoiceAssessmentModal({
  visible,
  targetText,
  mode,
  onClose,
  onSuccess,
}: VoiceAssessmentModalProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'analyzing' | 'result'>('listening');
  const [analysis, setAnalysis] = useState<PhonemeAnalysisResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isPlayingTargetAudio, setIsPlayingTargetAudio] = useState(false);

  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;

  // Wave pulsing animation
  useEffect(() => {
    if (state === 'listening') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveAnim1, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim1, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, {
              toValue: 1.5,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim2, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [state]);

  // Handle listening simulation / speech capture
  useEffect(() => {
    if (visible) {
      startListening();
    }
  }, [visible, targetText]);

  const startListening = () => {
    setState('listening');
    setCountdown(3);
    setAnalysis(null);

    // Countdown simulation for 3 seconds
    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);
      if (currentCount <= 0) {
        clearInterval(interval);
        processSpeech(targetText); // Default to successful/accurate match
      }
    }, 1000);
  };

  const processSpeech = (spoken: string) => {
    setState('analyzing');
    setTimeout(() => {
      const result = analyzeSpeechPronunciation(spoken, targetText, mode);
      setAnalysis(result);
      setState('result');
    }, 800);
  };

  const handleSimulateMispronounce = (confusedLetter: string) => {
    setState('analyzing');
    setTimeout(() => {
      const result = analyzeSpeechPronunciation(confusedLetter, targetText, mode);
      setAnalysis(result);
      setState('result');
    }, 500);
  };

  const handlePlayTargetAudio = () => {
    setIsPlayingTargetAudio(true);
    setTimeout(() => {
      setIsPlayingTargetAudio(false);
    }, 1200);
  };

  const handleContinue = () => {
    if (analysis?.isCorrect) {
      onSuccess();
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, ThemeShadow.lg]}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
              ✕
            </AppText>
          </TouchableOpacity>

          {/* ── STATE 1: LISTENING & RECORDING ── */}
          {state === 'listening' && (
            <View style={styles.contentWrap}>
              <View style={styles.micCircleContainer}>
                {/* Outer animated ripple 2 */}
                <Animated.View
                  style={[
                    styles.rippleCircle2,
                    { transform: [{ scale: waveAnim2 }] },
                  ]}
                />
                {/* Inner animated ripple 1 */}
                <Animated.View
                  style={[
                    styles.rippleCircle1,
                    { transform: [{ scale: waveAnim1 }] },
                  ]}
                />

                {/* Center Mic Icon Button */}
                <View style={styles.centerMicCircle}>
                  <AppText size="display" style={{ fontSize: 36 }}>
                    🎙️
                  </AppText>
                </View>
              </View>

              <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={styles.listeningTitle}>
                සවන් දෙමින් පවතී...
              </AppText>

              <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={styles.sayPromptText}>
                කරුණාකර "{targetText}" ශබ්ද නගා කියන්න
              </AppText>

              {/* Sound Wave Bars Simulation */}
              <View style={styles.waveformContainer}>
                {[14, 28, 42, 22, 36, 18, 30].map((h, i) => (
                  <View key={i} style={[styles.waveBar, { height: h }]} />
                ))}
              </View>

              {/* Interactive Demo Simulation Triggers */}
              <View style={styles.demoSimRow}>
                <TouchableOpacity
                  style={styles.demoSimBtnCorrect}
                  onPress={() => processSpeech(targetText)}
                  activeOpacity={0.8}
                >
                  <AppText size="xs" weight="bold" color="#047857">
                    ✓ නිවැරදිව කියන්න
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoSimBtnIncorrect}
                  onPress={() =>
                    handleSimulateMispronounce(
                      targetText === 'ක' ? 'ග' : targetText === 'මාළු' ? 'මල' : 'අමා'
                    )
                  }
                  activeOpacity={0.8}
                >
                  <AppText size="xs" weight="bold" color="#B91C1C">
                    ✗ වැරදි උච්චාරණය
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STATE 2: ANALYZING AUDIO ── */}
          {state === 'analyzing' && (
            <View style={styles.contentWrap}>
              <View style={styles.analyzingSpinnerWrap}>
                <AppText size="display">🧠</AppText>
              </View>

              <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                උච්චාරණය විශ්ලේෂණය කරමින්...
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
                AI ශබ්ද විශ්ලේෂණය
              </AppText>
            </View>
          )}

          {/* ── STATE 3: DIAGNOSTIC RESULT ── */}
          {state === 'result' && analysis && (
            <View style={styles.contentWrap}>
              {/* Status Header Badge */}
              <View
                style={[
                  styles.resultHeaderPill,
                  analysis.isCorrect ? styles.pillCorrect : styles.pillIncorrect,
                ]}
              >
                <AppText size="sm">
                  {analysis.isCorrect ? '🌟' : '💡'}
                </AppText>
                <AppText
                  size="sm"
                  weight="extrabold"
                  color={analysis.isCorrect ? '#047857' : '#B45309'}
                  style={{ marginLeft: 6 }}
                >
                  {analysis.feedbackTitle}
                </AppText>
              </View>

              {/* Syllables / Breakdown Display */}
              <View style={styles.breakdownRow}>
                {analysis.syllableBreakdown.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.syllableBox,
                      item.status === 'correct' ? styles.syllableBoxCorrect : styles.syllableBoxError,
                    ]}
                  >
                    <AppText
                      size="lg"
                      weight="extrabold"
                      color={item.status === 'correct' ? '#047857' : '#DC2626'}
                    >
                      {item.syllable}
                    </AppText>
                    <AppText
                      size="xs"
                      weight="bold"
                      color={item.status === 'correct' ? '#059669' : '#EF4444'}
                      style={{ marginTop: 2 }}
                    >
                      {item.status === 'correct' ? '✓ නිවැරදියි' : '✗ දෝෂයක්'}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Diagnostic Explanation Card */}
              <View style={styles.diagnosticCard}>
                <AppText size="xs" color={ThemeColors.textPrimary} style={styles.explanationText}>
                  {analysis.feedbackExplanation}
                </AppText>

                {/* Articulation Tip Box */}
                <View style={styles.tipInnerBox}>
                  <AppText size="xs" weight="bold" color="#0369A1">
                    🗣️ උච්චාරණ උපදෙස:
                  </AppText>
                  <AppText size="xs" color="#0C4A6E" style={{ marginTop: 2, lineHeight: 17 }}>
                    {analysis.articulationTip}
                  </AppText>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsWrap}>
                {/* Audio Listen Button */}
                <TouchableOpacity
                  style={[styles.audioReplayBtn, isPlayingTargetAudio && styles.audioReplayBtnPlaying]}
                  onPress={handlePlayTargetAudio}
                  activeOpacity={0.8}
                >
                  <AppText size="xs">🔊</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                    {isPlayingTargetAudio ? 'වාදනය වේ...' : 'නිවැරදි ශබ්දය අසන්න'}
                  </AppText>
                </TouchableOpacity>

                {/* Retry Button or Next Button */}
                {!analysis.isCorrect ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={startListening}
                    activeOpacity={0.85}
                  >
                    <AppText size="sm" weight="bold" color="#FFFFFF">
                      🎙️ නැවත කියන්න
                    </AppText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                  >
                    <AppText size="sm" weight="bold" color="#FFFFFF">
                      ඉදිරියට යන්න →
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ThemeSpacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: ThemeSpacing.sm,
  },
  micCircleContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: ThemeSpacing.md,
  },
  rippleCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DCFCE7',
    opacity: 0.5,
  },
  rippleCircle1: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 52.5,
    backgroundColor: '#BBF7D0',
    opacity: 0.8,
  },
  centerMicCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.md,
  },
  listeningTitle: {
    marginBottom: 4,
  },
  sayPromptText: {
    maxWidth: 260,
    lineHeight: 18,
    marginBottom: ThemeSpacing.md,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 50,
    marginBottom: ThemeSpacing.md,
  },
  waveBar: {
    width: 6,
    backgroundColor: ThemeColors.primary,
    borderRadius: 3,
  },
  demoSimRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: ThemeSpacing.xs,
  },
  demoSimBtnCorrect: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
  },
  demoSimBtnIncorrect: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
  },
  analyzingSpinnerWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ThemeSpacing.lg,
  },
  resultHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
    marginBottom: ThemeSpacing.md,
  },
  pillCorrect: {
    backgroundColor: '#DCFCE7',
  },
  pillIncorrect: {
    backgroundColor: '#FEF3C7',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: ThemeSpacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  syllableBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 70,
  },
  syllableBoxCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  syllableBoxError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  diagnosticCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: ThemeSpacing.md,
  },
  explanationText: {
    lineHeight: 18,
    marginBottom: 8,
  },
  tipInnerBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    padding: 10,
  },
  actionButtonsWrap: {
    width: '100%',
    gap: 8,
  },
  audioReplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F1F8',
    borderRadius: ThemeRadius.md,
    height: 42,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  audioReplayBtnPlaying: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: ThemeRadius.md,
    height: 46,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 46,
  },
});
