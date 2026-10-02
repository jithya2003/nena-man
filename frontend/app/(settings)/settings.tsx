import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';
import { StudentAvatarPhoto } from '@/components/Illustrations';
import { useAuth } from '@/context/AuthContext';
<<<<<<< HEAD
import { useReminderSettings } from '@/hooks/useReminderSettings';
=======
import { useLanguage } from '@/context/LanguageContext';
import { useDyslexiaTheme } from '@/context/ThemeContext';
>>>>>>> develop

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const {
    fontSizeScale,
    setFontSizeScale,
    increasedSpacing,
    setIncreasedSpacing,
    audioAssistance,
    setAudioAssistance,
    soundFeedback,
    setSoundFeedback,
    readingSpeed,
    setReadingSpeed,
  } = useDyslexiaTheme();

<<<<<<< HEAD
  const {
    remindersEnabled,
    reminderTime,
    permissionBlocked,
    isTogglingReminder,
    toggleReminders,
    updateReminderTime,
  } = useReminderSettings();

  const [fontSizeChoice, setFontSizeChoice] = useState<'small' | 'medium' | 'large'>('medium');
  const [lineSpacingChoice, setLineSpacingChoice] = useState<'normal' | 'wide'>('normal');
  const [audioAssistance, setAudioAssistance] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState(1); // 0 = slow, 1 = normal, 2 = fast
=======
  const isParentOrTeacher = user?.role === 'parent' || user?.role === 'teacher';
>>>>>>> develop
  const [volumeLevel, setVolumeLevel] = useState(0.7);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (isParentOrTeacher ? router.replace('/(parent)/dashboard') : router.back())}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.textPrimary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText size="md">⚙️</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            {t('settings.title')}
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(child)/profile')}
          activeOpacity={0.8}
        >
          {isParentOrTeacher ? (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText size="sm">{user?.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}</AppText>
            </View>
          ) : (
            <StudentAvatarPhoto size={34} showEditBadge={false} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── SECTION 0: 🌐 භාෂාව (Language) ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🌐</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6, flexShrink: 1 }}>
              {t('settings.language.section')}
            </AppText>
          </View>

          <View style={styles.settingGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.settingLabel}>
              {t('settings.language.label')}
            </AppText>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[styles.pillOption, language === 'si' && styles.pillOptionActive]}
                onPress={() => setLanguage('si')}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={language === 'si' ? 'bold' : 'regular'}
                  color={language === 'si' ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.language.sinhala')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pillOption, language === 'en' && styles.pillOptionActive]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={language === 'en' ? 'bold' : 'regular'}
                  color={language === 'en' ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.language.english')}
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.langNoteBox}>
              <AppText size="xs" color="#166534" weight="medium" style={{ lineHeight: 18 }}>
                {t('settings.language.note')}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── SECTION 1: 👤 ගිණුම (Account) ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">👤</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6, flexShrink: 1 }}>
              {t('settings.account')}
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => router.push('/(child)/profile')}
            activeOpacity={0.8}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.menuRowText}>
              {t('settings.profile')}
            </AppText>
            <AppText size="xs" color={ThemeColors.textMuted}>
              ›
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRowItem, { marginBottom: 0 }]}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.8}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.menuRowText}>
              {t('settings.changePassword')}
            </AppText>
            <AppText size="xs" color={ThemeColors.textMuted}>
              ›
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: ♿ ඉගෙනුම් පහසුකම් (Learning Accessibility) ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">♿</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6, flexShrink: 1 }}>
              {t('settings.accessibility')}
            </AppText>
          </View>

          {/* 1. අකුරු ප්‍රමාණය (Font Size) */}
          <View style={styles.settingGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.settingLabel}>
              {t('settings.fontSize')}
            </AppText>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[styles.pillOption, fontSizeScale === 'normal' && styles.pillOptionActive]}
                onPress={() => setFontSizeScale('normal')}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={fontSizeScale === 'normal' ? 'bold' : 'regular'}
                  color={fontSizeScale === 'normal' ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.small')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pillOption, fontSizeScale === 'large' && styles.pillOptionActive]}
                onPress={() => setFontSizeScale('large')}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={fontSizeScale === 'large' ? 'bold' : 'regular'}
                  color={fontSizeScale === 'large' ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.medium')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pillOption, fontSizeScale === 'extra-large' && styles.pillOptionActive]}
                onPress={() => setFontSizeScale('extra-large')}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={fontSizeScale === 'extra-large' ? 'bold' : 'regular'}
                  color={fontSizeScale === 'extra-large' ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.large')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. පේළි පරතරය (Line Spacing) */}
          <View style={styles.settingGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.settingLabel}>
              {t('settings.lineSpacing')}
            </AppText>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[styles.pillOption, !increasedSpacing && styles.pillOptionActive]}
                onPress={() => setIncreasedSpacing(false)}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={!increasedSpacing ? 'bold' : 'regular'}
                  color={!increasedSpacing ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.normal')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pillOption, increasedSpacing && styles.pillOptionActive]}
                onPress={() => setIncreasedSpacing(true)}
                activeOpacity={0.8}
              >
                <AppText
                  size="xs"
                  weight={increasedSpacing ? 'bold' : 'regular'}
                  color={increasedSpacing ? '#FFFFFF' : ThemeColors.textPrimary}
                  numberOfLines={1}
                >
                  {t('settings.wide')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. ශබ්ද සහාය (Audio Assistance Toggle) */}
          <View style={styles.settingToggleCard}>
            <View style={styles.toggleLabelLeft}>
              <AppText size="sm">🔊</AppText>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8, flexShrink: 1 }}>
                {t('settings.audioAssistance')}
              </AppText>
            </View>
            <Switch
              value={audioAssistance}
              onValueChange={setAudioAssistance}
              trackColor={{ false: '#CBD5E1', true: ThemeColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* 4. කියවීමේ වේගය (Reading Speed) */}
          <View style={styles.settingGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={styles.settingLabel}>
              {t('settings.readingSpeed')}
            </AppText>
            {/* Custom Slider Simulation */}
            <View style={styles.sliderTrackWrap}>
              <View style={styles.sliderTrackLine}>
                <View style={[styles.sliderFillLine, { width: `${readingSpeed * 50}%` }]} />
              </View>
              {/* Slider Thumb */}
              <View style={[styles.sliderThumb, { left: `${readingSpeed * 46 + 4}%` }]} />
            </View>
            <View style={styles.sliderLabelsRow}>
              <TouchableOpacity onPress={() => setReadingSpeed(0)}>
                <AppText
                  size="xs"
                  color={readingSpeed === 0 ? ThemeColors.primary : ThemeColors.textMuted}
                  weight={readingSpeed === 0 ? 'bold' : 'regular'}
                >
                  {t('settings.slow')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReadingSpeed(1)}>
                <AppText
                  size="xs"
                  color={readingSpeed === 1 ? ThemeColors.primary : ThemeColors.textMuted}
                  weight={readingSpeed === 1 ? 'bold' : 'regular'}
                >
                  {t('settings.normal')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReadingSpeed(2)}>
                <AppText
                  size="xs"
                  color={readingSpeed === 2 ? ThemeColors.primary : ThemeColors.textMuted}
                  weight={readingSpeed === 2 ? 'bold' : 'regular'}
                >
                  {t('settings.fast')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SECTION 3: 🔊 ශබ්ද (Volume & Sound Effects) ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🔊</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6, flexShrink: 1 }}>
              {t('settings.sound')}
            </AppText>
          </View>

          {/* Volume Slider */}
          <View style={styles.volumeRow}>
            <AppText size="xs">🔈</AppText>
            <View style={styles.volumeTrackWrap}>
              <View style={styles.volumeTrackLine}>
                <View style={[styles.volumeFillLine, { width: '70%' }]} />
              </View>
              <View style={[styles.sliderThumb, { left: '68%' }]} />
            </View>
            <AppText size="xs">🔊</AppText>
          </View>

          {/* Sound Feedback Toggle */}
          <View style={styles.settingToggleCard}>
            <View style={styles.toggleLabelLeft}>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ flexShrink: 1 }}>
                {t('settings.soundFeedback')}
              </AppText>
            </View>
            <Switch
              value={soundFeedback}
              onValueChange={setSoundFeedback}
              trackColor={{ false: '#CBD5E1', true: ThemeColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── SECTION 4: 🔔 දෛනික මතක් කිරීම (Daily Reminders) ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🔔</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              දෛනික කියවීමේ මතක් කිරීම
            </AppText>
          </View>

          {/* Enable / Disable Toggle */}
          <View style={styles.settingToggleCard}>
            <View style={styles.toggleLabelLeft}>
              <AppText size="sm">{remindersEnabled ? '🔔' : '🔕'}</AppText>
              <View style={{ marginLeft: 8 }}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  {remindersEnabled ? 'මතක් කිරීම් සක්‍රීයයි' : 'මතක් කිරීම් අක්‍රීයයි'}
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  සෑම දිනකම කියවීමට මතක් කරයි
                </AppText>
              </View>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              disabled={isTogglingReminder}
              trackColor={{ false: '#CBD5E1', true: ThemeColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Permission Blocked Warning */}
          {permissionBlocked && (
            <View style={styles.permissionWarningBox}>
              <AppText size="xs" weight="bold" color="#B45309">
                ⚠️ දැනුම්දීම් අවසර නොමැත
              </AppText>
              <AppText size="xs" color="#92400E" style={{ marginTop: 4, lineHeight: 18 }}>
                දුරකතනයේ සැකසුම් (Settings) → යෙදුම් (Apps) → Nena Man → දැනුම්දීම් (Notifications) යටතේ සක්‍රීය කරන්න.
              </AppText>
            </View>
          )}

          {/* Time Picker — only show when reminders are enabled */}
          {remindersEnabled && (
            <View style={styles.timePickerSection}>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 8 }}>
                මතක් කිරීමේ වේලාව:
              </AppText>

              {/* Quick time selection buttons */}
              <View style={styles.timeButtonsGrid}>
                {[
                  { label: 'උදේ 7:00', value: '07:00' },
                  { label: 'දහවල් 12:00', value: '12:00' },
                  { label: 'හවස 5:00', value: '17:00' },
                  { label: 'රාත්‍රී 8:00', value: '20:00' },
                ].map((opt) => {
                  const isSelected = reminderTime === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.timeBtn,
                        isSelected && styles.timeBtnActive,
                      ]}
                      onPress={() => updateReminderTime(opt.value)}
                      activeOpacity={0.8}
                    >
                      <AppText
                        size="xs"
                        weight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? '#FFFFFF' : ThemeColors.textSecondary}
                      >
                        {opt.label}
                      </AppText>
                      {isSelected && (
                        <AppText size="xs" color="#FFFFFF" style={{ marginTop: 2 }}>
                          ✓
                        </AppText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
                📅 {reminderTime} ට සෑම දිනකම මතක් කිරීමක් ලැබේ
              </AppText>
            </View>
          )}
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 5-Tab Bottom Navigation for Child Only */}
      {!isParentOrTeacher && <BottomNav role="child" activeTab="settings" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  menuRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F1F8',
    borderRadius: 12,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.xs + 2,
  },
  menuRowText: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  settingGroup: {
    marginBottom: ThemeSpacing.md,
  },
  settingLabel: {
    marginBottom: ThemeSpacing.xs + 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#E8F1F8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionActive: {
    backgroundColor: ThemeColors.primary,
  },
  settingToggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F1F8',
    borderRadius: 14,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    marginVertical: ThemeSpacing.xs,
  },
  toggleLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  sliderTrackWrap: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  sliderTrackLine: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFillLine: {
    height: 6,
    backgroundColor: ThemeColors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ThemeColors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    top: 5,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: ThemeSpacing.md,
  },
  volumeTrackWrap: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  volumeTrackLine: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeFillLine: {
    height: 6,
    backgroundColor: ThemeColors.primary,
    borderRadius: 3,
  },
<<<<<<< HEAD
  permissionWarningBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: ThemeSpacing.sm + 4,
    marginTop: 10,
  },
  timePickerSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  timeButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  timeBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
=======
  langNoteBox: {
    marginTop: ThemeSpacing.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
>>>>>>> develop
  },
});
