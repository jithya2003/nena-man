import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors, ThemeRadius, ThemeShadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'tinted' | 'surface';
  padding?: number;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 16,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'tinted' && styles.tinted,
        variant === 'surface' && styles.surface,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: ThemeColors.surface, // 30% soft sage surface (never #FFFFFF)
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    ...ThemeShadow.sm,
  },
  elevated: {
    backgroundColor: ThemeColors.surfaceElevated,
    borderColor: ThemeColors.border,
    ...ThemeShadow.md,
  },
  tinted: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.warningBorder,
  },
  surface: {
    backgroundColor: ThemeColors.surfaceMuted,
    borderColor: ThemeColors.borderLight,
  },
});
