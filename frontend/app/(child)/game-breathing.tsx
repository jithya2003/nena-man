/**
 * nena-man · frontend/app/(child)/game-breathing.tsx
 * Module 4: Guided Breathing Calming Activity (Pushpakumara · IT23177246)
 *
 * Visual animated guided breathing cycle (Inhale / Hold / Exhale).
 * Includes countdown timer, session completion card with restart & route to cooldown games.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
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

const SESSION_DURATION = 60; // 60 seconds (1 minute default)

export default function GuidedBreathingScreen() {
  const router = useRouter();

  const [phase, setPhase] = useState<'exhale' | 'inhale' | 'hold'>('inhale');
  const [activeDot, setActiveDot] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [isFinished, setIsFinished] = useState(false);

  const breatheAnim = useRef(new Animated.Value(0.75)).current;
  const isRunningRef = useRef(true);

  // Breathing animation cycle
  const runBreathingCycle = useCallback(() => {
    if (!isRunningRef.current) return;

    setPhase('inhale');
    setActiveDot(1);
    Animated.timing(breatheAnim, {
      toValue: 1.15,
      duration: 3500,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || !isRunningRef.current) return;
      setPhase('hold');
      setActiveDot(2);
      setTimeout(() => {
        if (!isRunningRef.current) return;
        setPhase('exhale');
        setActiveDot(3);
        Animated.timing(breatheAnim, {
          toValue: 0.7,
          duration: 3800,
          useNativeDriver: true,
        }).start(({ finished: finishExhale }) => {
          if (finishExhale && isRunningRef.current) {
            runBreathingCycle();
          }
        });
      }, 1500);
    });
  }, [breatheAnim]);

  // Countdown timer
  useEffect(() => {
    isRunningRef.current = true;
    runBreathingCycle();

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          isRunningRef.current = false;
          setIsFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      isRunningRef.current = false;
      clearInterval(timer);
    };
  }, [runBreathingCycle]);

  const handleRestart = () => {
    setIsFinished(false);
    setTimeLeft(SESSION_DURATION);
    isRunningRef.current = true;
    runBreathingCycle();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    if (phase === 'inhale') return 'සෙමින් ආශ්වාස කරන්න 🍃';
    if (phase === 'hold') return 'හුස්ම රඳවා ගන්න 🌸';
    return 'සෙමින් ප්‍රාශ්වාස කරන්න 💨';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/cooldown')}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.textPrimary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <AppText size="xs">⏱️</AppText>
          <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 4 }}>
            {formatTimer(timeLeft)}
          </AppText>
        </View>

        <TouchableOpacity onPress={handleRestart} style={styles.navIconBtn} activeOpacity={0.7}>
          <AppText size="sm">🔄</AppText>
        </TouchableOpacity>
      </View>

      {/* ── Main Breathing Area ─────────────────────────────────────────────── */}
      <View style={styles.bodyWrap}>
        {!isFinished ? (
          <>
            {/* Pulsing Soothing Breathing Circle */}
            <View style={styles.circleOuterContainer}>
              <View style={styles.whiteCircleBase}>
                <Animated.View
                  style={[
                    styles.breathingCircle,
                    {
                      transform: [{ scale: breatheAnim }],
                    },
                  ]}
                />
              </View>
            </View>

            {/* Phase Prompt Text */}
            <AppText size="lg" weight="extrabold" color={ThemeColors.primary} align="center" style={styles.phasePrompt}>
              {getPhaseText()}
            </AppText>

            {/* 4-Dot Stepper */}
            <View style={styles.dotStepperRow}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeDot === idx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Encouraging Footer Note */}
            <View style={styles.encouragementRow}>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                ඔබ ඉතා හොඳින් හුස්ම ගන්නවා
              </AppText>
              <AppText size="xs" style={{ marginLeft: 4 }}>
                💚
              </AppText>
            </View>
          </>
        ) : (
          /* Session Completed Celebration Card */
          <View style={[styles.finishedCard, ThemeShadow.md]}>
            <AppText size="display">🌸</AppText>
            <AppText size="xl" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 8 }}>
              විශිෂ්ටයි! සැසිය අවසන්!
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 6, lineHeight: 20 }}>
              ඔබගේ මනස දැන් සැහැල්ලු සහ සන්සුන් වී ඇත. ඔබට නැවත හුස්ම ගැනීමේ අභ්‍යාසය කළ හැක හෝ ක්‍රීඩා පිටුවට යා හැක.
            </AppText>

            <View style={styles.finishedActionsRow}>
              <TouchableOpacity
                style={styles.restartActionBtn}
                onPress={handleRestart}
                activeOpacity={0.85}
              >
                <AppText size="sm" weight="bold" color="#FFFFFF">
                  🔄 නැවත ආරම්භ කරමු
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gamesActionBtn}
                onPress={() => router.push('/(child)/cooldown')}
                activeOpacity={0.85}
              >
                <AppText size="sm" weight="bold" color="#FFFFFF">
                  🎮 ක්‍රීඩා පිටුවට යමු
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── Bottom Bar ──────────────────────────────────────────────────────── */}
      {!isFinished && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => router.push('/(child)/cooldown')}
            activeOpacity={0.85}
          >
            <AppText size="md" weight="bold" color="#FFFFFF">
              🎮 ක්‍රීඩා පිටුවට යමු
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    justifyContent: 'space-between',
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bodyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ThemeSpacing.lg,
  },
  circleOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.lg,
  },
  whiteCircleBase: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  breathingCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#6EE7B7',
  },
  phasePrompt: {
    marginBottom: ThemeSpacing.md,
  },
  dotStepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: ThemeSpacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: ThemeColors.primary,
  },
  dotInactive: {
    backgroundColor: '#CBD5E1',
  },
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finishedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
    maxWidth: 340,
  },
  finishedActionsRow: {
    width: '100%',
    gap: 10,
    marginTop: ThemeSpacing.lg,
  },
  restartActionBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamesActionBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.lg,
  },
  finishBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.sm,
  },
});
