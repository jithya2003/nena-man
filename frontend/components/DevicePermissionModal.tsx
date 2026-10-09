/**
 * nena-man · frontend/components/DevicePermissionModal.tsx
 * Child & Parental Permission Dialog for Camera & Microphone Telemetry.
 *
 * Provides standard mobile OS style permission prompt:
 *  - While using the app (ඇප් එක භාවිතා කරන අතරතුර පමණක්)
 *  - Only this time (මෙම වතාවේ පමණක්)
 *  - Don't allow (අවසර නොදෙන්න)
 * Linked to parental consent storage via useConsentPrivacy.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useConsentPrivacy } from '@/hooks/useConsentPrivacy';

interface DevicePermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onGranted: () => void;
  onDenied?: () => void;
}

export default function DevicePermissionModal({
  visible,
  onClose,
  onGranted,
  onDenied,
}: DevicePermissionModalProps) {
  const router = useRouter();
  const { updateConsent } = useConsentPrivacy();

  const handleAllowWhileUsing = async () => {
    onClose();
    await updateConsent({
      cameraPermissionGranted: true,
      touchTrackingConsent: true,
      hasParentalConsent: true,
      parentPinVerified: true,
      permissionChoice: 'while_using',
    });
    setTimeout(() => {
      onGranted();
    }, 120);
  };

  const handleAllowOnlyThisTime = async () => {
    onClose();
    await updateConsent({
      cameraPermissionGranted: true,
      touchTrackingConsent: true,
      hasParentalConsent: true,
      parentPinVerified: true,
      permissionChoice: 'only_this_time',
    });
    setTimeout(() => {
      onGranted();
    }, 120);
  };

  const handleDontAllow = async () => {
    onClose();
    await updateConsent({
      cameraPermissionGranted: false,
      hasParentalConsent: false,
      permissionChoice: 'denied',
    });
    setTimeout(() => {
      onDenied?.();
    }, 120);
  };

  const handleViewPrivacyPolicy = () => {
    onClose();
    router.push('/(child)/consent-privacy');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialogCard, ThemeShadow.lg]}>
          {/* Top Hardware Icons Badge */}
          <View style={styles.iconCircle}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                stroke="#0284C7"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#E0F2FE"
              />
              <Circle cx="12" cy="13.5" r="3.75" stroke="#0284C7" strokeWidth={1.8} fill="#FFFFFF" />
              <Circle cx="12" cy="13.5" r="1.8" fill="#0284C7" />
            </Svg>
          </View>

          {/* Heading */}
          <AppText
            size="md"
            weight="extrabold"
            color={ThemeColors.textPrimary}
            align="center"
            style={styles.title}
          >
            කැමරාව සහ මයික්‍රෆෝනය භාවිතයට අවසර ලබා දෙන්නද?
          </AppText>

          {/* Explanation */}
          <AppText
            size="xs"
            color={ThemeColors.textSecondary}
            align="center"
            style={styles.desc}
          >
            දරුවාගේ කියවීමේ උච්චාරණය සහ මුහුණේ ඉරියව් (Attention & Speech) AI මගින් විශ්ලේෂණය කිරීමට කැමරාව සහ මයික්‍රෆෝනය භාවිතයට අවසර දෙන්න.
          </AppText>

          {/* Parental Privacy Guarantee Tag */}
          <View style={styles.privacyTag}>
            <AppText size="xs" color="#047857" weight="bold">
              🔒 දෙමාපිය එකඟතාවය සහ ළමා ආරක්ෂණ සහතිකය
            </AppText>
          </View>

          {/* Option Buttons (Phone OS Style) */}
          <View style={styles.buttonList}>
            {/* Option 1: While using the app */}
            <TouchableOpacity
              style={[styles.optionBtn, styles.primaryOptionBtn]}
              onPress={handleAllowWhileUsing}
              activeOpacity={0.85}
            >
              <AppText size="sm" weight="extrabold" color="#FFFFFF" align="center">
                ඇප් එක භාවිතයේදී පමණක් අවසර දෙන්න
              </AppText>
              <AppText size="xs" color="#E0F2FE" align="center" style={{ marginTop: 1 }}>
                (While using the app)
              </AppText>
            </TouchableOpacity>

            {/* Option 2: Only this time */}
            <TouchableOpacity
              style={[styles.optionBtn, styles.secondaryOptionBtn]}
              onPress={handleAllowOnlyThisTime}
              activeOpacity={0.8}
            >
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} align="center">
                මෙම වතාවේ පමණක් අවසර දෙන්න
              </AppText>
              <AppText size="xs" color={ThemeColors.textMuted} align="center" style={{ marginTop: 1 }}>
                (Only this time)
              </AppText>
            </TouchableOpacity>

            {/* Option 3: Don't allow */}
            <TouchableOpacity
              style={[styles.optionBtn, styles.dangerOptionBtn]}
              onPress={handleDontAllow}
              activeOpacity={0.8}
            >
              <AppText size="sm" weight="bold" color="#DC2626" align="center">
                අවසර නොදෙන්න (Don't allow)
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Parental Privacy Policy Link */}
          <TouchableOpacity
            style={styles.policyLink}
            onPress={handleViewPrivacyPolicy}
            activeOpacity={0.7}
          >
            <AppText size="xs" color={ThemeColors.primary} weight="bold" align="center">
              🛡️ දෙමාපිය පෞද්ගලිකත්ව ප්‍රතිපත්තිය බලන්න →
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: ThemeSpacing.sm,
  },
  title: {
    lineHeight: 22,
    marginBottom: 6,
  },
  desc: {
    lineHeight: 18,
    paddingHorizontal: 4,
    marginBottom: ThemeSpacing.sm,
  },
  privacyTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: ThemeSpacing.md,
  },
  buttonList: {
    width: '100%',
    gap: 8,
  },
  optionBtn: {
    width: '100%',
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOptionBtn: {
    backgroundColor: ThemeColors.primary,
    ...ThemeShadow.sm,
  },
  secondaryOptionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dangerOptionBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  policyLink: {
    marginTop: ThemeSpacing.md,
    paddingVertical: 4,
  },
});
