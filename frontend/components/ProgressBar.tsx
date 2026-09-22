import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors, ThemeRadius } from '@/constants/theme';

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  trackColor?: string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function ProgressBar({
  value,
  color = ThemeColors.accent,
  trackColor = ThemeColors.surface,
  height = 8,
  borderRadius = ThemeRadius.full,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor, height, borderRadius },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: color, height, borderRadius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
