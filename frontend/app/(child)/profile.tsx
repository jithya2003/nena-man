import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';
import { StudentAvatarPhoto } from '@/components/Illustrations';

export default function StudentProfileScreen() {
  const router = useRouter();

  const [audioAssistance, setAudioAssistance] = useState(true);
  const [largeFont, setLargeFont] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
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

        <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
          මගේ ගිණුම
        </AppText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push('/(settings)/settings')}
            style={styles.navIconBtn}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 19.14 12.94 C 19.18 12.63 19.2 12.32 19.2 12 C 19.2 11.68 19.18 11.37 19.14 11.06 L 21.16 9.48 C 21.34 9.34 21.39 9.08 21.28 8.87 L 19.36 5.55 C 19.24 5.34 18.99 5.26 18.77 5.34 L 16.39 6.3 C 15.9 5.92 15.37 5.61 14.8 5.38 L 14.44 2.85 C 14.4 2.61 14.2 2.43 13.96 2.43 L 10.12 2.43 C 9.88 2.43 9.68 2.61 9.64 2.85 L 9.28 5.38 C 8.71 5.61 8.18 5.92 7.69 6.3 L 5.31 5.34 C 5.09 5.25 4.84 5.34 4.72 5.55 L 2.8 8.87 C 2.69 9.08 2.74 9.34 2.92 9.48 L 4.94 11.06 C 4.9 11.37 4.88 11.69 4.88 12 C 4.88 12.31 4.9 12.63 4.94 12.94 L 2.92 14.52 C 2.74 14.66 2.69 14.92 2.8 15.13 L 4.72 18.45 C 4.84 18.66 5.09 18.75 5.31 18.66 L 7.69 17.7 C 8.18 18.08 8.71 18.39 9.28 18.62 L 9.64 21.15 C 9.68 21.39 9.88 21.57 10.12 21.57 L 13.96 21.57 C 14.2 21.57 14.4 21.39 14.44 21.15 L 14.8 18.62 C 15.37 18.39 15.9 18.08 16.39 17.7 L 18.77 18.66 C 18.99 18.75 19.24 18.66 19.36 18.45 L 21.28 15.13 C 21.39 14.92 21.34 14.66 21.16 14.52 L 19.14 12.94 Z M 12 15.5 C 10.07 15.5 8.5 13.93 8.5 12 C 8.5 10.07 10.07 8.5 12 8.5 C 13.93 8.5 15.5 10.07 15.5 12 C 15.5 13.93 13.93 15.5 12 15.5 Z"
                fill={ThemeColors.textSecondary}
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutPillBtn}
            onPress={() => router.replace('/(auth)/role-select')}
            activeOpacity={0.75}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 9 21 H 5 C 3.89543 21 3 20.1046 3 19 V 5 C 3 3.89543 3.89543 3 5 3 H 9 M 16 17 L 21 12 M 21 12 L 16 7 M 21 12 H 9"
                stroke="#DC2626"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── PROFILE HEADER CARD ── */}
        <View style={[styles.profileCard, ThemeShadow.sm]}>
          <StudentAvatarPhoto size={76} showEditBadge={true} style={styles.avatarMargin} />

          <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={styles.studentName}>
            සෙනුලි පෙරේරා
          </AppText>

          <AppText size="xs" color={ThemeColors.textSecondary} style={styles.schoolSubtitle}>
            5 ශ්‍රේණිය • ශ්‍රී ලංකා පාසල
          </AppText>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/(settings)/settings')}
            activeOpacity={0.8}
          >
            <AppText size="xs">👤</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
              පැතිකඩ සංස්කරණය
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: මගේ ඉගෙනුම් පැතිකඩ ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">📚</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              මගේ ඉගෙනුම් පැතිකඩ
            </AppText>
          </View>

          {/* 4-Stat Metric Grid */}
          <View style={styles.statsGrid}>
            {/* Stat 1: මට්ටම */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">🎓</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  මට්ටම
                </AppText>
              </View>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                ආරම්භක
              </AppText>
            </View>

            {/* Stat 2: ප්‍රගතිය */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">📈</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  ප්‍රගතිය
                </AppText>
              </View>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                72 %
              </AppText>
              <View style={styles.statProgressTrack}>
                <View style={[styles.statProgressFill, { width: '72%' }]} />
              </View>
            </View>

            {/* Stat 3: ක්‍රියාකාරකම් */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">📇</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  ක්‍රියාකාරකම්
                </AppText>
              </View>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                38
              </AppText>
            </View>

            {/* Stat 4: දින ගණන */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">🔥</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  දින ගණන
                </AppText>
              </View>
              <View style={styles.streakValRow}>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                  5
                </AppText>
                <AppText size="md" style={{ marginLeft: 4 }}>
                  🔥
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: මගේ ඉලක්කය (My Goal) ── */}
        <View style={[styles.goalCard, ThemeShadow.sm]}>
          <View style={styles.goalHeaderRow}>
            <AppText size="sm">🎯</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 4 }}>
              මගේ ඉලක්කය
            </AppText>
          </View>
          <AppText size="xs" color={ThemeColors.textPrimary} style={styles.goalText}>
            වාක්‍ය කියවීමේ හැකියාව වැඩි දියුණු කරමු
          </AppText>
        </View>

        {/* ── SECTION 3: මගේ ශක්තීන් (My Strengths) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">⭐</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              මගේ ශක්තීන්
            </AppText>
          </View>

          {/* Strength Item 1 */}
          <View style={[styles.strengthCard, { borderLeftColor: ThemeColors.primary }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={styles.skillIconCircle}>
                <AppText size="sm">⛰️</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                අකුරු හඳුනාගැනීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              90%
            </AppText>
          </View>

          {/* Strength Item 2 */}
          <View style={[styles.strengthCard, { borderLeftColor: ThemeColors.primary }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={styles.skillIconCircle}>
                <AppText size="sm">🗣️</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                ශබ්ද හඳුනාගැනීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              82%
            </AppText>
          </View>
        </View>

        {/* ── SECTION 4: තව පුහුණු විය යුතු දේ (Areas to Practice More) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">🌱</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              තව පුහුණු විය යුතු දේ
            </AppText>
          </View>

          {/* Practice Item 1 (Blue accent) */}
          <View style={[styles.strengthCard, { borderLeftColor: '#3B82F6' }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={[styles.skillIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <AppText size="sm">📖</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                වචන කියවීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color="#2563EB">
              65%
            </AppText>
          </View>

          {/* Practice Item 2 (Orange/Amber accent) */}
          <View style={[styles.strengthCard, { borderLeftColor: '#F97316' }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={[styles.skillIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <AppText size="sm">👥</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                වාක්‍ය කියවීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color="#EA580C">
              48%
            </AppText>
          </View>
        </View>

        {/* ── SECTION 5: ඉගෙනුම් පහසුකම් (Learning Accessibility) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">♿</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              ඉගෙනුම් පහසුකම්
            </AppText>
          </View>

          <View style={[styles.accessibilityCard, ThemeShadow.sm]}>
            {/* Setting 1: අකුරු ප්‍රමාණය */}
            <View style={styles.accessRow}>
              <View style={styles.accessLeft}>
                <View style={styles.accessIconBox}>
                  <AppText size="sm">🔤</AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                  අකුරු ප්‍රමාණය
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.pillValueBadge}
                onPress={() => setLargeFont(!largeFont)}
                activeOpacity={0.7}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  {largeFont ? 'විශාල' : 'සාමාන්‍ය'}
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Setting 2: ශබ්ද සහාය */}
            <View style={styles.accessRow}>
              <View style={styles.accessLeft}>
                <View style={styles.accessIconBox}>
                  <AppText size="sm">🔊</AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                  ශබ්ද සහාය
                </AppText>
              </View>
              <Switch
                value={audioAssistance}
                onValueChange={setAudioAssistance}
                trackColor={{ false: '#D1D5DB', true: ThemeColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Big LogOut Button at bottom */}
        <TouchableOpacity
          style={[styles.fullLogoutBtn, ThemeShadow.sm]}
          onPress={() => router.replace('/(auth)/role-select')}
          activeOpacity={0.85}
        >
          <AppText size="md">🚪</AppText>
          <AppText size="sm" weight="bold" color="#DC2626" style={{ marginLeft: 8 }}>
            ගිණුමෙන් ඉවත්වන්න (Log Out)
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* 5-Tab Sinhala Bottom Navigation with Profile Active */}
      <BottomNav role="child" activeTab="profile" />
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
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  avatarMargin: {
    marginBottom: ThemeSpacing.sm,
  },
  studentName: {
    marginBottom: 2,
  },
  schoolSubtitle: {
    marginBottom: ThemeSpacing.md,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2ECF4',
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#D0E0EC',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    marginTop: 2,
  },
  statProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    marginTop: 6,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: 6,
    backgroundColor: ThemeColors.accent,
    borderRadius: ThemeRadius.full,
  },
  streakValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#C7EBD2',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalText: {
    lineHeight: 18,
  },
  strengthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  skillRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAF7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessibilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  accessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValueBadge: {
    backgroundColor: '#E8F1F8',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.borderLight,
    marginVertical: ThemeSpacing.sm,
  },
  logoutPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fullLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    paddingVertical: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginTop: ThemeSpacing.sm,
  },
});
