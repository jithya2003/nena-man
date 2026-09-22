import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  ThemeColors,
  ThemeRadius,
  ThemeSpacing,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import type { ErrorType, BehaviorState, DifficultyLevel } from '@/types';

// ── Error Type Badge (Colorblind-safe with distinct icons & shapes) ─────────

const ERROR_META: Record<
  ErrorType,
  { label: string; color: string; bg: string; icon: string; border: string }
> = {
  substitution: {
    label: 'Substitution',
    color: ThemeColors.m1,
    bg: ThemeColors.m1Surface,
    border: ThemeColors.border,
    icon: '🔄',
  },
  omission: {
    label: 'Omission',
    color: ThemeColors.error,
    bg: ThemeColors.errorSurface,
    border: ThemeColors.errorBorder,
    icon: '❌',
  },
  reversal: {
    label: 'Reversal',
    color: ThemeColors.warning,
    bg: ThemeColors.warningSurface,
    border: ThemeColors.warningBorder,
    icon: '↩️',
  },
  hesitation: {
    label: 'Hesitation',
    color: ThemeColors.info,
    bg: ThemeColors.infoSurface,
    border: ThemeColors.infoBorder,
    icon: '⏸️',
  },
};

interface ErrorBadgeProps {
  type: ErrorType;
  compact?: boolean;
  style?: ViewStyle;
}

export function ErrorBadge({ type, compact = false, style }: ErrorBadgeProps) {
  const meta = ERROR_META[type];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bg, borderColor: meta.border },
        style,
      ]}
    >
      <AppText size="sm">{meta.icon}</AppText>
      {!compact && (
        <AppText size="xs" weight="bold" color={meta.color}>
          {meta.label}
        </AppText>
      )}
    </View>
  );
}

// ── Behavior State Badge ───────────────────────────────────────────────────

const BEHAVIOR_META: Record<
  BehaviorState,
  { label: string; color: string; bg: string; icon: string; border: string }
> = {
  focused: {
    label: 'Focused',
    color: ThemeColors.success,
    bg: ThemeColors.successSurface,
    border: ThemeColors.successBorder,
    icon: '🎯',
  },
  engaged: {
    label: 'Engaged',
    color: ThemeColors.accentDark,
    bg: ThemeColors.accentLight,
    border: ThemeColors.warningBorder,
    icon: '⭐',
  },
  frustrated: {
    label: 'Frustrated',
    color: ThemeColors.error,
    bg: ThemeColors.errorSurface,
    border: ThemeColors.errorBorder,
    icon: '😤',
  },
  distracted: {
    label: 'Distracted',
    color: ThemeColors.warning,
    bg: ThemeColors.warningSurface,
    border: ThemeColors.warningBorder,
    icon: '💭',
  },
  tired: {
    label: 'Tired',
    color: ThemeColors.textSecondary,
    bg: ThemeColors.surface,
    border: ThemeColors.border,
    icon: '😴',
  },
};

interface BehaviorBadgeProps {
  state: BehaviorState;
  style?: ViewStyle;
}

export function BehaviorBadge({ state, style }: BehaviorBadgeProps) {
  const meta = BEHAVIOR_META[state];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bg, borderColor: meta.border },
        style,
      ]}
    >
      <AppText size="sm">{meta.icon}</AppText>
      <AppText size="xs" weight="bold" color={meta.color}>
        {meta.label}
      </AppText>
    </View>
  );
}

// ── Difficulty Badge ───────────────────────────────────────────────────────

const DIFFICULTY_META: Record<
  DifficultyLevel,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  easy: {
    label: 'Easy',
    color: ThemeColors.success,
    bg: ThemeColors.successSurface,
    border: ThemeColors.successBorder,
    icon: '●',
  },
  medium: {
    label: 'Medium',
    color: ThemeColors.warning,
    bg: ThemeColors.warningSurface,
    border: ThemeColors.warningBorder,
    icon: '▲',
  },
  hard: {
    label: 'Hard',
    color: ThemeColors.error,
    bg: ThemeColors.errorSurface,
    border: ThemeColors.errorBorder,
    icon: '■',
  },
};

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  style?: ViewStyle;
}

export function DifficultyBadge({ level, style }: DifficultyBadgeProps) {
  const meta = DIFFICULTY_META[level];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bg, borderColor: meta.border },
        style,
      ]}
    >
      <AppText size="xs" color={meta.color}>
        {meta.icon}
      </AppText>
      <AppText size="xs" weight="bold" color={meta.color}>
        {meta.label}
      </AppText>
    </View>
  );
}

// ── Generic Pill ───────────────────────────────────────────────────────────

interface PillProps {
  label: string;
  color?: string;
  bg?: string;
  border?: string;
  style?: ViewStyle;
}

export function Pill({
  label,
  color = ThemeColors.textPrimary,
  bg = ThemeColors.surface,
  border = ThemeColors.borderLight,
  style,
}: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      <AppText size="xs" weight="medium" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    gap: ThemeSpacing.xs,
  },
  pill: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
  },
});
