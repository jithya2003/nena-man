import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  ThemeColors,
  ThemeFontSize,
  ThemeRadius,
  ThemeSpacing,
  ThemeShadow,
} from '@/constants/theme';
import AppText, { TextSize } from '@/components/AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: ThemeSpacing.xs + 2, paddingHorizontal: ThemeSpacing.md, textSize: 'sm' as TextSize },
    md: { paddingVertical: ThemeSpacing.sm + 4, paddingHorizontal: ThemeSpacing.lg, textSize: 'md' as TextSize },
    lg: { paddingVertical: ThemeSpacing.md, paddingHorizontal: ThemeSpacing.xl, textSize: 'lg' as TextSize },
  }[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[
          styles.base,
          styles.primary,
          disabled && styles.disabled,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={ThemeColors.textPrimary} size="small" />
        ) : (
          <AppText
            size={sizeStyles.textSize}
            weight="bold"
            color={disabled ? ThemeColors.textMuted : ThemeColors.textPrimary}
            align="center"
            style={textStyle}
          >
            {label}
          </AppText>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[
          styles.base,
          styles.secondary,
          disabled && styles.disabled,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={ThemeColors.textPrimary} size="small" />
        ) : (
          <AppText
            size={sizeStyles.textSize}
            weight="bold"
            color={disabled ? ThemeColors.textMuted : ThemeColors.textPrimary}
            align="center"
            style={textStyle}
          >
            {label}
          </AppText>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.ghost,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <AppText
          size={sizeStyles.textSize}
          weight="medium"
          color={disabled ? ThemeColors.textMuted : ThemeColors.textPrimary}
          align="center"
          style={textStyle}
        >
          {label}
        </AppText>
      </TouchableOpacity>
    );
  }

  // danger
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        styles.danger,
        disabled && styles.disabled,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      <AppText
        size={sizeStyles.textSize}
        weight="bold"
        color={ThemeColors.background}
        align="center"
        style={textStyle}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: ThemeRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Touch target guideline
  },
  primary: {
    backgroundColor: ThemeColors.accent, // 10% golden amber
    borderWidth: 1.5,
    borderColor: ThemeColors.accentDark,
    ...ThemeShadow.sm,
  },
  secondary: {
    backgroundColor: ThemeColors.surface, // 30% sage surface
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: ThemeColors.error,
    borderWidth: 1.5,
    borderColor: ThemeColors.errorBorder,
  },
  disabled: {
    backgroundColor: ThemeColors.borderLight,
    borderColor: ThemeColors.border,
    opacity: 0.6,
  },
});
