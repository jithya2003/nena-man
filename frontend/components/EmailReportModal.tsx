import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  reportService,
  ReportSchedulePreferences,
  ReportGenerationData,
} from '@/services/reportService';
import type { ReadingSessionRecord, M3Response } from '@/types';

interface EmailReportModalProps {
  visible: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  grade: number;
  sessions: ReadingSessionRecord[];
  m3Recommendation?: M3Response;
}

export default function EmailReportModal({
  visible,
  onClose,
  childId,
  childName,
  grade,
  sessions,
  m3Recommendation,
}: EmailReportModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isSi = language !== 'en';

  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [email, setEmail] = useState(user?.email || '');
  const [isAutoSchedule, setIsAutoSchedule] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      if (user?.uid) {
        const prefs = await reportService.getSchedulePreferences(user.uid);
        if (prefs) {
          setFrequency(prefs.frequency || 'weekly');
          setIsAutoSchedule(Boolean(prefs.enabled));
          if (prefs.email) {
            setEmail(prefs.email);
          } else if (user.email) {
            setEmail(user.email);
          }
        }
      }
    }
    if (visible) {
      setStatusMessage('');
      loadPrefs();
    }
  }, [visible, user?.uid, user?.email]);

  const getReportData = (): ReportGenerationData => ({
    childId,
    childName,
    grade,
    frequency,
    recipientEmail: email.trim() || user?.email || 'parent@example.com',
    sessions,
    m3Recommendation,
    language: isSi ? 'si' : 'en',
  });

  const handleDownloadPdf = async () => {
    setStatusMessage('');
    const data = getReportData();
    const ok = await reportService.downloadOrPrintPdf(data);
    if (!ok && Platform.OS !== 'web') {
      Alert.alert(
        isSi ? 'PDF මුද්‍රණය' : 'PDF Export',
        isSi
          ? 'PDF වාර්තාව ඔබේ ඊමේල් ලිපිනයට යැවීමට පහත "ඊමේල් කරන්න" බොත්තම ඔබන්න.'
          : 'Please tap "Email Report" to receive this document directly in your inbox.'
      );
    }
  };

  const handleSendEmail = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setStatusMessage(
        isSi
          ? 'කරුණාකර වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.'
          : 'Please enter a valid email address.'
      );
      setIsSuccess(false);
      return;
    }

    try {
      setIsSending(true);
      setStatusMessage('');

      // Save user schedule preferences
      if (user?.uid) {
        await reportService.saveSchedulePreferences(user.uid, {
          enabled: isAutoSchedule,
          frequency,
          email: targetEmail,
          lastSentAt: new Date().toISOString(),
        });
      }

      const res = await reportService.sendEmailReport(getReportData());
      setStatusMessage(res.message);
      setIsSuccess(true);
    } catch (err: any) {
      setStatusMessage(
        isSi
          ? 'ඊමේල් පණිවිඩය යැවීමේදී දෝෂයක් සිදු විය.'
          : 'Failed to dispatch email. Please try again.'
      );
      setIsSuccess(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modalCard, ThemeShadow.sm]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation?.()}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconWrap}>
                  <AppText size="lg">📊</AppText>
                </View>
                <View style={styles.headerTextWrap}>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.headerTitle}>
                    {isSi ? 'PDF ප්‍රගති වාර්තාව' : 'Progress Report PDF'}
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textSecondary} style={styles.headerSubtitle}>
                    {childName} · {grade} {isSi ? 'ශ්‍රේණිය' : 'Grade'}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Frequency Selector Section */}
            <View style={styles.sectionWrap}>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionLabel}>
                {isSi ? 'වාර්තා කාල සීමාව (Report Frequency)' : 'Select Report Frequency'}
              </AppText>
              <View style={styles.frequencyGrid}>
                {/* Weekly Option */}
                <TouchableOpacity
                  style={[
                    styles.frequencyCard,
                    frequency === 'weekly' ? styles.frequencyCardActive : styles.frequencyCardInactive,
                  ]}
                  onPress={() => setFrequency('weekly')}
                  activeOpacity={0.8}
                >
                  <View style={styles.frequencyCardHeader}>
                    <AppText size="sm">📅</AppText>
                    <AppText
                      size="xs"
                      weight="extrabold"
                      color={frequency === 'weekly' ? ThemeColors.primaryDark : ThemeColors.textPrimary}
                      style={{ marginLeft: 6 }}
                    >
                      {isSi ? 'සතිපතා' : 'Weekly'}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.frequencyBadge,
                      frequency === 'weekly' ? styles.frequencyBadgeActive : styles.frequencyBadgeInactive,
                    ]}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={frequency === 'weekly' ? ThemeColors.primary : ThemeColors.textMuted}
                      style={{ fontSize: 11 }}
                    >
                      {isSi ? 'දින 7' : '7 Days'}
                    </AppText>
                  </View>
                </TouchableOpacity>

                {/* Monthly Option */}
                <TouchableOpacity
                  style={[
                    styles.frequencyCard,
                    frequency === 'monthly' ? styles.frequencyCardActive : styles.frequencyCardInactive,
                  ]}
                  onPress={() => setFrequency('monthly')}
                  activeOpacity={0.8}
                >
                  <View style={styles.frequencyCardHeader}>
                    <AppText size="sm">🗓️</AppText>
                    <AppText
                      size="xs"
                      weight="extrabold"
                      color={frequency === 'monthly' ? ThemeColors.primaryDark : ThemeColors.textPrimary}
                      style={{ marginLeft: 6 }}
                    >
                      {isSi ? 'මාසිකව' : 'Monthly'}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.frequencyBadge,
                      frequency === 'monthly' ? styles.frequencyBadgeActive : styles.frequencyBadgeInactive,
                    ]}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={frequency === 'monthly' ? ThemeColors.primary : ThemeColors.textMuted}
                      style={{ fontSize: 11 }}
                    >
                      {isSi ? 'දින 30' : '30 Days'}
                    </AppText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Input Field */}
            <View style={styles.sectionWrap}>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionLabel}>
                {isSi ? 'ලැබිය යුතු ඊමේල් ලිපිනය (Recipient Email)' : 'Recipient Email Address'}
              </AppText>
              <TextInput
                style={[
                  styles.emailInput,
                  isEmailFocused && styles.emailInputFocused,
                ]}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (statusMessage) setStatusMessage('');
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                placeholder="parent@example.com"
                placeholderTextColor={ThemeColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Auto-schedule Interactive Card */}
            <TouchableOpacity
              style={[
                styles.scheduleCard,
                isAutoSchedule ? styles.scheduleCardActive : styles.scheduleCardInactive,
              ]}
              onPress={() => setIsAutoSchedule(!isAutoSchedule)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  isAutoSchedule ? styles.checkboxActive : styles.checkboxInactive,
                ]}
              >
                {isAutoSchedule && (
                  <AppText size="xs" weight="extrabold" color="#FFFFFF" style={{ lineHeight: 14 }}>
                    ✓
                  </AppText>
                )}
              </View>
              <View style={styles.scheduleTextWrap}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.scheduleTitle}>
                  {isSi
                    ? 'ස්වයංක්‍රීය කාලසටහන සක්‍රීය කරන්න'
                    : 'Enable automatic progress reports'}
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={styles.scheduleSubtitle}>
                  {isSi
                    ? 'සෑම ඉරිදා දිනකම රාත්‍රී දරුවාගේ ප්‍රගති වාර්තාව ඊමේල් මඟින් ලැබෙනු ඇත.'
                    : 'Automatically emailed to your inbox every Sunday evening.'}
                </AppText>
              </View>
            </TouchableOpacity>

            {/* Status Feedback Message */}
            {!!statusMessage && (
              <View
                style={[
                  styles.feedbackBox,
                  isSuccess ? styles.feedbackSuccess : styles.feedbackError,
                ]}
              >
                <AppText
                  size="xs"
                  color={isSuccess ? ThemeColors.success : ThemeColors.error}
                  weight="bold"
                  style={{ lineHeight: 18 }}
                >
                  {isSuccess ? '✓ ' : '⚠️ '}
                  {statusMessage}
                </AppText>
              </View>
            )}

            {/* Primary & Secondary Action Buttons */}
            <View style={styles.actionRow}>
              {/* Secondary: Download / Print PDF */}
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={handleDownloadPdf}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  📥 {isSi ? 'PDF බාගන්න' : 'Download PDF'}
                </AppText>
              </TouchableOpacity>

              {/* Primary: Send Email Now */}
              <TouchableOpacity
                style={[styles.sendBtn, isSending && { opacity: 0.75 }]}
                onPress={handleSendEmail}
                disabled={isSending}
                activeOpacity={0.85}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText size="xs" weight="extrabold" color="#FFFFFF">
                    ✉️ {isSi ? 'ඊමේල් කරන්න' : 'Email Report'}
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: ThemeColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: ThemeRadius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.divider,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: ThemeRadius.sm,
    backgroundColor: ThemeColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  headerTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    lineHeight: 22,
  },
  headerSubtitle: {
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ThemeColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionLabel: {
    marginBottom: 8,
    lineHeight: 18,
  },
  frequencyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyCard: {
    flex: 1,
    borderRadius: ThemeRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyCardActive: {
    backgroundColor: ThemeColors.primaryLight,
    borderColor: ThemeColors.primary,
  },
  frequencyCardInactive: {
    backgroundColor: '#FAFCFA',
    borderColor: ThemeColors.border,
  },
  frequencyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  frequencyBadgeActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  frequencyBadgeInactive: {
    backgroundColor: ThemeColors.surfaceMuted,
  },
  emailInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: ThemeColors.textPrimary,
    backgroundColor: '#FAFCFA',
  },
  emailInputFocused: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#FFFFFF',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  scheduleCardActive: {
    backgroundColor: ThemeColors.primarySurface,
    borderColor: ThemeColors.primaryBorder,
  },
  scheduleCardInactive: {
    backgroundColor: ThemeColors.surfaceMuted,
    borderColor: ThemeColors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  checkboxInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: ThemeColors.textMuted,
  },
  scheduleTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  scheduleTitle: {
    lineHeight: 18,
  },
  scheduleSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
  },
  feedbackBox: {
    marginBottom: 14,
    padding: 10,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: ThemeColors.successSurface,
    borderColor: ThemeColors.successBorder,
  },
  feedbackError: {
    backgroundColor: ThemeColors.errorSurface,
    borderColor: ThemeColors.errorBorder,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  downloadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryBorder,
    backgroundColor: ThemeColors.primaryLight,
  },
  sendBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: ThemeRadius.md,
    backgroundColor: ThemeColors.primary,
  },
});
