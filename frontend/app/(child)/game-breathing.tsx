import React, { useState, useEffect, useRef } from 'react';
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

export default function GuidedBreathingScreen() {
  const router = useRouter();

  const [phase, setPhase] = useState<'exhale' | 'inhale' | 'hold'>('exhale');
  const [activeDot, setActiveDot] = useState(2); // 3rd dot active like mockup
  const [timeLeft, setTimeLeft] = useState(90); // 1:30

  const breatheAnim = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    // Timer
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    // Breathing Animation Cycle
    const cycle = () => {
      setPhase('inhale');
      setActiveDot(1);
      Animated.timing(breatheAnim, {
        toValue: 1.15,
        duration: 3500,
        useNativeDriver: true,
      }).start(() => {
        setPhase('hold');
        setActiveDot(2);
        setTimeout(() => {
          setPhase('exhale');
          setActiveDot(3);
          Animated.timing(breatheAnim, {
            toValue: 0.7,
            duration: 4000,
            useNativeDriver: true,
          }).start(() => {
            cycle();
          });
        }, 1500);
      });
    };

    cycle();

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    if (phase === 'inhale') return 'සෙමින් ආශ්වාස කරන්න';
    if (phase === 'hold') return 'හුස්ම රඳවා ගන්න';
    return 'සෙමින් පිට කරන්න';
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
              fill={ThemeColors.textPrimary}
            />
          </Svg>
        </TouchableOpacity>

        <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
          {formatTimer(timeLeft)}
        </AppText>

        <View style={{ width: 36 }} />
      </View>

      {/* Main Breathing Area */}
      <View style={styles.bodyWrap}>
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
        <AppText size="md" weight="bold" color={ThemeColors.primary} align="center" style={styles.phasePrompt}>
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
            ඔබ හොඳින් කරනවා.
          </AppText>
          <AppText size="xs" style={{ marginLeft: 4 }}>
            💚
          </AppText>
        </View>
      </View>

      {/* Bottom Finish Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <AppText size="md" weight="bold" color="#FFFFFF">
            අවසන් කරමු
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: 'transparent',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ThemeSpacing.lg,
  },
  circleOuterContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.xl,
  },
  whiteCircleBase: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.md,
  },
  breathingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#86EFAC',
    opacity: 0.85,
  },
  phasePrompt: {
    marginBottom: ThemeSpacing.lg,
  },
  dotStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: ThemeSpacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: ThemeColors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: '#CBD5E1',
  },
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.xl,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: ThemeRadius.md,
    height: 48,
  },
});
