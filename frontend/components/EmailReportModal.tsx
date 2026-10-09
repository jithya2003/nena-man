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
          ? 'PDF වාර්තාව ඔබේ ඊමේල් ලිපිනයට යැවීමට පහත "ඊමේල් එකට යවන්න" බොත්තම ඔබන්න.'
          : 'Please tap "Email PDF Now" to receive this document directly in your inbox.'
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
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation?.()}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="xl">📧</AppText>
              <View style={{ marginLeft: 10 }}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {isSi ? 'PDF ප්‍රගති වාර්තාව ඊමේල් කිරීම' : 'Email PDF Progress Report'}
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  {childName} · {grade} {isSi ? 'ශ්‍රේණිය' : 'Grade'}
                </AppText>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <AppText size="md" weight="bold" color={ThemeColors.textSecondary}>
                ✕
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Frequency Toggle Pills */}
          <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginBottom: 6 }}>
            {isSi ? 'වාර්තා කාල සීමාව තෝරන්න (Select Frequency):' : 'Select Report Frequency:'}
          </AppText>
          <View style={styles.freqToggleRow}>
            <TouchableOpacity
              style={[styles.freqPill, frequency === 'weekly' && styles.freqPillActive]}
              onPress={() => setFrequency('weekly')}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={frequency === 'weekly' ? '#FFFFFF' : ThemeColors.textSecondary}>
                📅 {isSi ? 'සතිපතා (Weekly — දින 7)' : 'Weekly (Last 7 Days)'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.freqPill, frequency === 'monthly' && styles.freqPillActive]}
              onPress={() => setFrequency('monthly')}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={frequency === 'monthly' ? '#FFFFFF' : ThemeColors.textSecondary}>
                🗓️ {isSi ? 'මාසිකව (Monthly — දින 30)' : 'Monthly (Last 30 Days)'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Email Input Field */}
          <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 12, marginBottom: 4 }}>
            {isSi ? 'ලැබිය යුතු ඊමේල් ලිපිනය (Destination Email):' : 'Recipient Email Address:'}
          </AppText>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="parent@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Auto-schedule Toggle Row */}
          <TouchableOpacity
            style={styles.scheduleRow}
            onPress={() => setIsAutoSchedule(!isAutoSchedule)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, isAutoSchedule && styles.checkboxActive]}>
              {isAutoSchedule && (
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  ✓
                </AppText>
              )}
            </View>
            <View style={{ marginLeft: 8, flex: 1 }}>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                {isSi ? 'ස්වයංක්‍රීය සතිපතා/මාසික ඊමේල් ලැබීම සක්‍රීය කරන්න' : 'Auto-email report at the end of every period'}
              </AppText>
              <AppText size="xs" color={ThemeColors.textMuted} style={{ fontSize: 10 }}>
                {isSi ? 'සෑම ඉරිදා දිනකම රාත්‍රී දරුවාගේ ප්‍රගති වාර්තාව inbox එකට ලැබේ.' : 'Dispatched automatically every Sunday evening.'}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Status Feedback Message */}
          {statusMessage ? (
            <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
              <AppText size="xs" color={isSuccess ? '#047857' : '#DC2626'} weight="bold">
                {statusMessage}
              </AppText>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {/* Download/Print PDF Button */}
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handleDownloadPdf}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                📥 {isSi ? 'PDF මුද්‍රණය / බාගත කිරීම' : 'Download / Print PDF'}
              </AppText>
            </TouchableOpacity>

            {/* Send Email Now Button */}
            <TouchableOpacity
              style={[styles.sendBtn, isSending && { opacity: 0.7 }]}
              onPress={handleSendEmail}
              disabled={isSending}
              activeOpacity={0.85}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  ✉️ {isSi ? 'ඊමේල් එකට දැන්ම යවන්න' : 'Email PDF Now'}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.md,
  },
  closeBtn: {
    padding: 4,
  },
  freqToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ThemeRadius.md,
    padding: 3,
  },
  freqPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: ThemeRadius.sm,
  },
  freqPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  emailInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: ThemeColors.primary,
  },
  feedbackBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: ThemeRadius.sm,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: ThemeSpacing.md,
  },
  printBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryBorder,
    backgroundColor: '#F0FDF4',
  },
  sendBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: ThemeRadius.md,
    backgroundColor: ThemeColors.primary,
  },
});
