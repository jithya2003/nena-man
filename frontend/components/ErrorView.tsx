import React from 'react';
import {
  View,
  StyleSheet,
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
import Button from '@/components/Button';
import { CuteErrorBear } from '@/components/CuteCharacters';

import { useLanguage } from '@/context/LanguageContext';

export interface ErrorViewProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Render as an animated Pop-up Modal */
  asModal?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export default function ErrorView({
  title,
  message,
  icon,
  onRetry,
  retryLabel,
  secondaryLabel,
  onSecondaryAction,
  compact = false,
  style,
  asModal = false,
  visible = true,
  onClose,
}: ErrorViewProps) {
  const { t } = useLanguage();
  const displayTitle = title ?? t('state.error.title');
  const displayMessage = message ?? t('state.error.default');
  const displayRetryLabel = retryLabel ?? t('state.error.retry');
  const displaySecondaryLabel = secondaryLabel ?? t('state.error.close');

  const content = (
    <View style={compact ? styles.compactContent : styles.cardBox}>
      {/* Cute Illustration or Custom Icon */}
      {icon ? (
        <View style={styles.customIconWrapper}>{icon}</View>
      ) : (
        <CuteErrorBear size={compact ? 100 : 140} />
      )}

      {/* Title */}
      <AppText
        size={compact ? 'md' : 'xl'}
        weight="extrabold"
        align="center"
        color={ThemeColors.textPrimary}
        style={styles.titleText}
      >
        {displayTitle}
      </AppText>

      {/* Message */}
      <AppText
        size="sm"
        weight="medium"
        align="center"
        color={ThemeColors.textSecondary}
        style={styles.messageText}
      >
        {displayMessage}
      </AppText>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {onRetry ? (
          <Button
            label={displayRetryLabel}
            onPress={onRetry}
            variant="primary"
            size={compact ? 'sm' : 'md'}
            style={styles.retryButton}
          />
        ) : null}

        {onSecondaryAction && displaySecondaryLabel ? (
          <Button
            label={displaySecondaryLabel}
            onPress={onSecondaryAction}
            variant="ghost"
            size="sm"
            style={styles.secondaryButton}
          />
        ) : null}
      </View>
    </View>
  );

  // ── Modal Mode ───────────────────────────────────────────────────────────
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

  // ── Compact / Inline Card Mode ───────────────────────────────────────────
  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        {content}
      </View>
    );
  }

  // ── Fullscreen Mode ──────────────────────────────────────────────────────
  return (
    <View style={[styles.fullscreenContainer, style]}>
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
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECDD3',
    borderBottomWidth: 4,
    borderBottomColor: '#F43F5E',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECDD3',
    borderBottomWidth: 5,
    borderBottomColor: '#F43F5E',
    ...ThemeShadow.md,
    maxWidth: 400,
    width: '100%',
  },
  compactContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  customIconWrapper: {
    marginBottom: ThemeSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    marginTop: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.xs,
  },
  messageText: {
    marginBottom: ThemeSpacing.lg,
    lineHeight: 22,
    maxWidth: 310,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  retryButton: {
    minWidth: 190,
  },
  secondaryButton: {
    marginTop: 4,
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
    borderColor: '#FECDD3',
    borderBottomWidth: 6,
    borderBottomColor: '#F43F5E',
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
