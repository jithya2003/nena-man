import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors, ThemeRadius, ThemeShadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'tinted' | 'surface' | 'playful';
  padding?: number;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 18,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'tinted' && styles.tinted,
        variant === 'surface' && styles.surface,
        variant === 'playful' && styles.playful,
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
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.kidCard,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 3,
    borderBottomColor: '#D1E0D7',
    ...ThemeShadow.sm,
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4E5DB',
    borderBottomWidth: 4,
    borderBottomColor: '#BDD6C7',
    ...ThemeShadow.md,
  },
  tinted: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    borderBottomWidth: 3,
    borderBottomColor: '#FCD34D',
  },
  surface: {
    backgroundColor: '#F7FAF8',
    borderColor: '#E2ECE6',
    borderBottomWidth: 3,
    borderBottomColor: '#D1E0D7',
  },
  playful: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderBottomWidth: 3,
    borderBottomColor: '#FDA4AF',
  },
});
