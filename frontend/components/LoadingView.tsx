import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  ThemeColors,
  ThemeRadius,
  ThemeSpacing,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import SkeletonLoader from '@/components/SkeletonLoader';
import { CuteLoadingBunny, BouncingLoadingDots } from '@/components/CuteCharacters';

import { useLanguage } from '@/context/LanguageContext';

export interface LoadingViewProps {
  message?: string;
  subtitle?: string;
  variant?: 'fullscreen' | 'card' | 'inline' | 'skeleton';
  skeletonType?: 'text' | 'card' | 'avatar' | 'list';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: StyleProp<ViewStyle>;
  showCard?: boolean;
  /** Render as an animated Pop-up Modal */
  asModal?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export default function LoadingView({
  message,
  subtitle,
  variant = 'fullscreen',
  skeletonType = 'text',
  size = 'md',
  color = ThemeColors.primary,
  style,
  showCard = false,
  asModal = false,
  visible = true,
  onClose,
}: LoadingViewProps) {
  const { t } = useLanguage();
  const displayMessage = message ?? t('state.loading.default');
  // ── 1. Skeleton Variant ──────────────────────────────────────────────────
  if (variant === 'skeleton') {
    if (skeletonType === 'card') {
      return <SkeletonLoader.Card style={style} />;
    }
    if (skeletonType === 'avatar') {
      return <SkeletonLoader.Avatar style={style} />;
    }
    if (skeletonType === 'list') {
      return (
        <View style={style}>
          <SkeletonLoader.ListItem />
          <SkeletonLoader.ListItem />
          <SkeletonLoader.ListItem />
        </View>
      );
    }
    return <SkeletonLoader.Text style={style} />;
  }

  // ── 2. Inline Variant ────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]}>
        <ActivityIndicator size="small" color={color} />
        {displayMessage ? (
          <AppText
            size="sm"
            weight="medium"
            color={ThemeColors.textSecondary}
            style={styles.inlineText}
          >
            {displayMessage}
          </AppText>
        ) : null}
      </View>
    );
  }

  // ── 3. Main Content Card with Cute Animated Mascot ────────────────────────
  const mascotSize = size === 'sm' ? 110 : size === 'lg' ? 165 : 140;

  const content = (
    <View style={styles.centerContent}>
      {/* Cute Animated Reading Bunny Mascot */}
      <CuteLoadingBunny size={mascotSize} />

      {/* Bouncing colorful loading dots */}
      <View style={{ marginTop: 8 }}>
        <BouncingLoadingDots color={color} />
      </View>

      {/* Message */}
      <AppText
        size={size === 'sm' ? 'md' : 'lg'}
        weight="extrabold"
        align="center"
        color={ThemeColors.textPrimary}
        style={styles.messageText}
      >
        {displayMessage}
      </AppText>

      {subtitle ? (
        <AppText
          size="xs"
          weight="medium"
          align="center"
          color={ThemeColors.textMuted}
          style={styles.subtitleText}
        >
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );

  // ── 4. Modal Pop-up Mode ─────────────────────────────────────────────────
  if (asModal) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, ThemeShadow.lg]}>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <AppText size="sm" weight="bold" color={ThemeColors.textMuted}>
                  ✕
                </AppText>
              </TouchableOpacity>
            )}
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  // ── 5. Fullscreen Mode ───────────────────────────────────────────────────
  if (variant === 'fullscreen') {
    return (
      <View style={[styles.fullscreenContainer, style]}>
        {showCard ? (
          <View style={styles.cardBox}>
            {content}
          </View>
        ) : (
          content
        )}
      </View>
    );
  }

  // ── 6. Card Mode ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.cardContainer, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.background,
    padding: ThemeSpacing.lg,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#B2E2C3',
    borderBottomWidth: 5,
    borderBottomColor: '#059669',
    ...ThemeShadow.sm,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#B2E2C3',
    borderBottomWidth: 5,
    borderBottomColor: '#059669',
    ...ThemeShadow.md,
    maxWidth: 400,
    width: '100%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    marginTop: ThemeSpacing.sm,
    letterSpacing: 0.2,
    lineHeight: 26,
    maxWidth: 320,
  },
  subtitleText: {
    marginTop: ThemeSpacing.xs,
    maxWidth: 280,
    lineHeight: 18,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ThemeSpacing.xs,
  },
  inlineText: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 20, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#B2E2C3',
    borderBottomWidth: 6,
    borderBottomColor: '#059669',
    maxWidth: 380,
    width: '100%',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
