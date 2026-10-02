import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {
  ThemeColors,
  ThemeFontSize,
  ThemeRadius,
  ThemeSpacing,
  ThemeShadow,
} from '@/constants/theme';
import AppText, { TextSize } from '@/components/AppText';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
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
  icon,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: ThemeSpacing.xs + 4, paddingHorizontal: ThemeSpacing.md, minHeight: 44, textSize: 'sm' as TextSize },
    md: { paddingVertical: ThemeSpacing.sm + 4, paddingHorizontal: ThemeSpacing.lg, minHeight: 50, textSize: 'md' as TextSize },
    lg: { paddingVertical: ThemeSpacing.md + 2, paddingHorizontal: ThemeSpacing.xl, minHeight: 56, textSize: 'lg' as TextSize },
  }[size];

  const renderContent = (textColor: string) => {
    if (loading) {
      return <ActivityIndicator color={textColor} size="small" />;
    }
    return (
      <View style={styles.contentRow}>
        {icon ? <View style={styles.iconBox}>{icon}</View> : null}
        <AppText
          size={sizeStyles.textSize}
          weight="extrabold"
          color={textColor}
          align="center"
          style={textStyle}
        >
          {label}
        </AppText>
      </View>
    );
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.base,
          styles.primary,
          disabled && styles.disabled,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {renderContent(disabled ? ThemeColors.textMuted : '#FFFFFF')}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.base,
          styles.secondary,
          disabled && styles.disabled,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            minHeight: sizeStyles.minHeight,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {renderContent(disabled ? ThemeColors.textMuted : ThemeColors.primary)}
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
            minHeight: sizeStyles.minHeight,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {renderContent(disabled ? ThemeColors.textMuted : ThemeColors.textPrimary)}
      </TouchableOpacity>
    );
  }

  // danger
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles.danger,
        disabled && styles.disabled,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          minHeight: sizeStyles.minHeight,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {renderContent(disabled ? ThemeColors.textMuted : '#FFFFFF')}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: ThemeRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // 3D tactile button depth for 7-8 year old kids
    borderWidth: 1.5,
    borderBottomWidth: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
    borderBottomColor: '#064E2A',
    ...ThemeShadow.sm,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1E7DD',
    borderBottomColor: '#B2D8C7',
    ...ThemeShadow.sm,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: ThemeRadius.full,
  },
  danger: {
    backgroundColor: ThemeColors.error,
    borderColor: '#991B1B',
    borderBottomColor: '#7F1D1D',
    ...ThemeShadow.sm,
  },
  disabled: {
    backgroundColor: ThemeColors.borderLight,
    borderColor: ThemeColors.border,
    borderBottomColor: '#CBD5E1',
    opacity: 0.6,
  },
});
