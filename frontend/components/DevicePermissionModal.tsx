/**
 * nena-man · frontend/components/DevicePermissionModal.tsx
 * Module 4: Under-Popup (Bottom Sheet) Permission Modal (Pushpakumara · IT23177246)
 *
 * Implements a native mobile-styled bottom sheet permission drawer:
 *  - Radio selection options:
 *      🔘 Allow only while using the app (යෙදුම භාවිත කරන අතරතුර පමණක්)
 *      🔘 Ask every time (සෑම විටම විමසන්න)
 *      🔘 Don't allow (අවසර නොදෙන්න)
 *  - Inline contextual warning card if permission is denied
 *  - Direct integration with useConsentPrivacy and cameraLandmarkService
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useConsentPrivacy, PermissionChoice } from '@/hooks/useConsentPrivacy';

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
  const { consentState, updateConsent } = useConsentPrivacy();

  // Selected radio option: 'while_using' | 'only_this_time' | 'denied'
  const [selectedChoice, setSelectedChoice] = useState<PermissionChoice>(
    consentState.permissionChoice || 'while_using'
  );

  // Controls whether the "If you deny this permission..." warning alert is displayed
  const [showDenyWarning, setShowDenyWarning] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedChoice(consentState.permissionChoice || 'while_using');
      setShowDenyWarning(false);
    }
  }, [visible, consentState.permissionChoice]);

  const handleSelect = (choice: PermissionChoice) => {
    setSelectedChoice(choice);
    if (choice === 'denied') {
      setShowDenyWarning(true);
    } else {
      setShowDenyWarning(false);
    }
  };

  const handleConfirm = async () => {
    if (selectedChoice === 'denied') {
      setShowDenyWarning(true);
      return;
    }

    const isGranted = selectedChoice === 'while_using' || selectedChoice === 'only_this_time';

    await updateConsent({
      cameraPermissionGranted: isGranted,
      touchTrackingConsent: true,
      hasParentalConsent: isGranted,
      parentPinVerified: true,
      permissionChoice: selectedChoice,
    });

    onClose();
    setTimeout(() => {
      if (isGranted) {
        onGranted();
      } else {
        onDenied?.();
      }
    }, 120);
  };

  const handleConfirmDenyAnyway = async () => {
    await updateConsent({
      cameraPermissionGranted: false,
      hasParentalConsent: false,
      permissionChoice: 'denied',
    });
    setShowDenyWarning(false);
    onClose();
    setTimeout(() => {
      onDenied?.();
    }, 120);
  };

  const handleCancelDenial = () => {
    setSelectedChoice('while_using');
    setShowDenyWarning(false);
  };

  const handleViewPrivacyPolicy = () => {
    onClose();
    router.push('/(child)/consent-privacy');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.bottomSheet, ThemeShadow.lg]}>
              {/* Drag Handle Indicator */}
              <View style={styles.dragHandleWrap}>
                <View style={styles.dragHandle} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetContent}
              >
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View style={styles.iconContainer}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                        stroke="#059669"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="#ECFDF5"
                      />
                      <Circle cx="12" cy="13.5" r="3.75" stroke="#059669" strokeWidth={1.8} fill="#FFFFFF" />
                      <Circle cx="12" cy="13.5" r="1.8" fill="#059669" />
                    </Svg>
                  </View>

                  <View style={styles.titleTextContainer}>
                    <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                      කැමරා අවසරය (Camera Permission)
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textSecondary}>
                      Camera access for Nena Man Reading Assistant
                    </AppText>
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                  >
                    <AppText size="md" weight="bold" color={ThemeColors.textMuted}>
                      ✕
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Subtitle / Purpose Explanation */}
                <View style={styles.purposeBox}>
                  <AppText size="xs" color="#065F46" style={{ lineHeight: 18 }}>
                    🎯 දරුවා කියවන අතරතුර අවධානය සහ වෙහෙස (Attention & Cognitive State) AI මඟින් හඳුනාගැනීමට පමණක් කැමරා ලක්ෂණ (Landmarks) යොදා ගැනේ. කිසිදු ඡායාරූපයක් හෝ වීඩියෝවක් සුරැකෙන්නේ නැත.
                  </AppText>
                </View>

                {/* Radio Options Card */}
                <View style={styles.radioListCard}>
                  {/* Option 1: Allow only while using the app */}
                  <TouchableOpacity
                    style={[
                      styles.radioRow,
                      selectedChoice === 'while_using' && styles.radioRowActive,
                    ]}
                    onPress={() => handleSelect('while_using')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.radioOuter}>
                      {selectedChoice === 'while_using' && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.radioTextWrap}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                        යෙදුම භාවිතයේදී පමණක් ඉඩ දෙන්න
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary}>
                        Allow only while using the app
                      </AppText>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Option 2: Ask every time */}
                  <TouchableOpacity
                    style={[
                      styles.radioRow,
                      selectedChoice === 'only_this_time' && styles.radioRowActive,
                    ]}
                    onPress={() => handleSelect('only_this_time')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.radioOuter}>
                      {selectedChoice === 'only_this_time' && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.radioTextWrap}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                        සෑම විටම විමසන්න
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary}>
                        Ask every time
                      </AppText>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Option 3: Don't allow */}
                  <TouchableOpacity
                    style={[
                      styles.radioRow,
                      selectedChoice === 'denied' && styles.radioRowDanger,
                    ]}
                    onPress={() => handleSelect('denied')}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioOuter, selectedChoice === 'denied' && styles.radioOuterDanger]}>
                      {selectedChoice === 'denied' && <View style={styles.radioInnerDanger} />}
                    </View>
                    <View style={styles.radioTextWrap}>
                      <AppText size="sm" weight="bold" color={selectedChoice === 'denied' ? '#DC2626' : ThemeColors.textPrimary}>
                        අවසර නොදෙන්න
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary}>
                        Don't allow
                      </AppText>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Warning Alert Card (Shown when Don't allow is picked) */}
                {showDenyWarning && (
                  <View style={[styles.warningCard, ThemeShadow.sm]}>
                    <View style={styles.warningHeader}>
                      <AppText size="xs" weight="extrabold" color="#991B1B">
                        ⚠️ අවධානය පිණිසයි
                      </AppText>
                    </View>
                    <AppText size="xs" color="#7F1D1D" style={{ marginTop: 3, lineHeight: 17 }}>
                      If you deny this permission, basic features of your device may no longer function as intended. (කැමරා මඟින් දරුවාගේ අවධානය සහ වෙහෙස හඳුනාගැනීම අක්‍රිය වනු ඇත).
                    </AppText>

                    <View style={styles.warningActionRow}>
                      <TouchableOpacity
                        style={styles.warningCancelBtn}
                        onPress={handleCancelDenial}
                        activeOpacity={0.7}
                      >
                        <AppText size="xs" weight="bold" color="#1E293B">
                          අවලංගු කරන්න (Cancel)
                        </AppText>
                      </TouchableOpacity>

                      <View style={styles.verticalSeparator} />

                      <TouchableOpacity
                        style={styles.warningDenyBtn}
                        onPress={handleConfirmDenyAnyway}
                        activeOpacity={0.7}
                      >
                        <AppText size="xs" weight="extrabold" color="#DC2626">
                          කමක් නෑ, අවසර නොදෙන්න (Don't allow anyway)
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Main Action Button */}
                {!showDenyWarning && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                  >
                    <AppText size="sm" weight="extrabold" color="#FFFFFF">
                      තහවුරු කර ඉදිරියට යන්න (Confirm & Continue)
                    </AppText>
                  </TouchableOpacity>
                )}

                {/* Privacy Policy Link */}
                <TouchableOpacity
                  style={styles.policyLink}
                  onPress={handleViewPrivacyPolicy}
                  activeOpacity={0.7}
                >
                  <AppText size="xs" color={ThemeColors.primary} weight="bold" align="center">
                    🛡️ See all Camera permissions & Privacy Policy →
                  </AppText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '88%',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  sheetContent: {
    paddingBottom: ThemeSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  titleTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: ThemeRadius.md,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  radioListCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  radioRowActive: {
    backgroundColor: '#EFF6FF',
  },
  radioRowDanger: {
    backgroundColor: '#FEF2F2',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterDanger: {
    borderColor: '#DC2626',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ThemeColors.primary,
  },
  radioInnerDanger: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  radioTextWrap: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    gap: 8,
  },
  warningCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verticalSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#FCA5A5',
  },
  warningDenyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confirmBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...ThemeShadow.sm,
  },
  policyLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
