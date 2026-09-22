import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Button from '@/components/Button';

const { width } = Dimensions.get('window');

const AFFIRMATIONS = [
  'Breathe gently! 🌸',
  'You are brilliant! 🌟',
  'Calm and focused! 🍃',
  'Great progress! 🚀',
  'Shining bright! ✨',
];

interface StarItem {
  id: number;
  x: number;
  y: number;
  caught: boolean;
  color: string;
}

export default function StarGame({ onComplete }: { onComplete: () => void }) {
  const [stars, setStars] = useState<StarItem[]>([
    { id: 1, x: 30, y: 40, caught: false, color: '#E8A33D' },
    { id: 2, x: width - 120, y: 70, caught: false, color: '#3A7CA5' },
    { id: 3, x: width / 2 - 40, y: 140, caught: false, color: '#8D6B94' },
    { id: 4, x: 50, y: 220, caught: false, color: '#DCE8DD' },
    { id: 5, x: width - 130, y: 250, caught: false, color: '#E8A33D' },
  ]);

  const [caughtCount, setCaughtCount] = useState(0);
  const [affirmation, setAffirmation] = useState('Tap the glowing stars to catch calm energy!');
  const [isFinished, setIsFinished] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleCatchStar = (id: number) => {
    setStars((prev) =>
      prev.map((s) => (s.id === id ? { ...s, caught: true } : s))
    );
    const newCount = caughtCount + 1;
    setCaughtCount(newCount);
    setAffirmation(AFFIRMATIONS[(newCount - 1) % AFFIRMATIONS.length]);

    if (newCount === stars.length) {
      setIsFinished(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText size="md" weight="bold" color={ThemeColors.textPrimary} align="center">
          {affirmation}
        </AppText>
        <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 2 }}>
          Stars Caught: {caughtCount} / {stars.length} ⭐
        </AppText>
      </View>

      {/* Game Field */}
      <View style={styles.gameField}>
        {!isFinished ? (
          stars.map((star) => {
            if (star.caught) return null;
            return (
              <Animated.View
                key={star.id}
                style={[
                  styles.starWrap,
                  {
                    left: star.x,
                    top: star.y,
                    transform: [{ translateY: floatAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleCatchStar(star.id)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                >
                  <AppText size="display" style={{ fontSize: 44 }}>
                    ⭐
                  </AppText>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.finishedBox}>
            <AppText size="display" style={{ fontSize: 64, marginBottom: ThemeSpacing.sm }}>
              🎉
            </AppText>
            <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center">
              Calm Energy Collected!
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginVertical: ThemeSpacing.sm }}>
              You caught all 5 calming stars and earned +3 Bonus Stars! ⭐⭐⭐
            </AppText>
            <Button
              label="Return to Reading 📚"
              onPress={onComplete}
              fullWidth
              size="lg"
              style={{ marginTop: ThemeSpacing.md }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: ThemeSpacing.sm,
  },
  header: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.md,
  },
  gameField: {
    flex: 1,
    minHeight: 320,
    backgroundColor: ThemeColors.surfaceElevated,
    borderRadius: ThemeRadius.xl,
    borderWidth: 2,
    borderColor: ThemeColors.borderLight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starWrap: {
    position: 'absolute',
  },
  starTouch: {
    padding: 6,
  },
  finishedBox: {
    alignItems: 'center',
    padding: ThemeSpacing.lg,
    width: '100%',
  },
});
