import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
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
import NenaManLogo from '@/components/NenaManLogo';
import { StudentAvatarPhoto } from '@/components/Illustrations';
import { useAuth } from '@/context/AuthContext';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'insights'>('overview');

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  const students = [
    {
      id: 1,
      name: 'සෙනුලි පෙරේරා',
      grade: 5,
      progress: 78,
      status: 'හොඳයි',
      statusType: 'good',
      avatarBg: '#DCFCE7',
      errorPattern: 'ස්වර දිගුකිරීම් (Vowel Length)',
    },
    {
      id: 2,
      name: 'කවිඳු සිල්වා',
      grade: 5,
      progress: 62,
      status: 'අවධානය',
      statusType: 'attention',
      avatarBg: '#FEF3C7',
      errorPattern: 'ර/ල අකුරු මාරුව (Liquid Confusion)',
    },
    {
      id: 3,
      name: 'සහන් ප්‍රනාන්දු',
      grade: 4,
      progress: 44,
      status: 'සහාය අවශ්‍යයි',
      statusType: 'help',
      avatarBg: '#FEE2E2',
      errorPattern: 'පිල්ලම් මඟහැරීම (Pillam Omission)',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP MOBILE HEADER ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/(auth)/role-select')} activeOpacity={0.7}>
            <NenaManLogo size="sm" showText={false} />
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              දෙමාපිය & ගුරු පුවරුව
            </AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              {user?.displayName || 'සුභ උදෑසනක්!'} 👏
            </AppText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/(parent)/reports')}
            activeOpacity={0.7}
          >
            <AppText size="sm">🔔</AppText>
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Teacher / Parent Avatar Photo */}
          <TouchableOpacity
            style={styles.teacherAvatarWrap}
            onPress={() => router.push('/(parent)/student-details')}
            activeOpacity={0.8}
          >
            <AppText size="md">👩‍🏫</AppText>
          </TouchableOpacity>

          {/* Log Out Button (Exit Icon Only) */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── TOP CATEGORY PILLS ── */}
        <View style={styles.tabPillsRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'overview' && styles.tabPillActive]}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.8}
          >
            <AppText size="xs">📊</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'overview' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              සාරාංශය
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'students' && styles.tabPillActive]}
            onPress={() => setActiveTab('students')}
            activeOpacity={0.8}
          >
            <AppText size="xs">👥</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'students' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              සිසුන් (24)
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'insights' && styles.tabPillActive]}
            onPress={() => router.push('/(parent)/recommendations')}
            activeOpacity={0.8}
          >
            <AppText size="xs">🧠</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'insights' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              AI නිර්දේශ
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── 4 SUMMARY METRIC CARDS (2x2 Clean Mobile Grid) ── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: සිසුන් */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <AppText size="md">👥</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                මුළු සිසුන්
              </AppText>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                24
              </AppText>
            </View>
          </View>

          {/* Card 2: සම්පූර්ණ කළ */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <AppText size="md">✓</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                සම්පූර්ණ සැසි
              </AppText>
              <AppText size="xl" weight="extrabold" color="#047857">
                156
              </AppText>
            </View>
          </View>

          {/* Card 3: සාමාන්‍ය ප්‍රගතිය */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <AppText size="md">📈</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                සාමාන්‍ය ප්‍රගතිය
              </AppText>
              <AppText size="xl" weight="extrabold" color="#B45309">
                72%
              </AppText>
            </View>
          </View>

          {/* Card 4: අවධානය අවශ්‍යයි */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <AppText size="md">⚠️</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                අවධානය අවශ්‍ය
              </AppText>
              <AppText size="xl" weight="extrabold" color="#DC2626">
                5
              </AppText>
            </View>
          </View>
        </View>

        {/* ── CARD 2: සිසුන්ගේ ප්‍රගතිය (STUDENT PROGRESS LIST) ── */}
        <View style={[styles.progressCard, ThemeShadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="sm">📊</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                සිසුන්ගේ දෛනික ප්‍රගතිය
              </AppText>
            </View>

            <TouchableOpacity onPress={() => router.push('/(parent)/reports')} activeOpacity={0.7}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                වාර්තා →
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Student Rows */}
          <View style={styles.studentsListWrap}>
            {students.map((stu) => (
              <View key={stu.id} style={styles.studentItemCard}>
                <View style={styles.studentTopLine}>
                  <View style={styles.studentNameWrap}>
                    <View style={[styles.miniAvatarCircle, { backgroundColor: stu.avatarBg }]}>
                      <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                        {stu.name.charAt(0)}
                      </AppText>
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                        {stu.name}
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary}>
                        ශ්‍රේණිය {stu.grade} · {stu.errorPattern}
                      </AppText>
                    </View>
                  </View>

                  {/* Status Tag */}
                  <View
                    style={[
                      styles.statusPillBadge,
                      stu.statusType === 'good' && styles.statusGood,
                      stu.statusType === 'attention' && styles.statusAttention,
                      stu.statusType === 'help' && styles.statusHelp,
                    ]}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={
                        stu.statusType === 'good'
                          ? '#047857'
                          : stu.statusType === 'attention'
                          ? '#B45309'
                          : '#DC2626'
                      }
                    >
                      {stu.status}
                    </AppText>
                  </View>
                </View>

                {/* Progress Bar & Percentage Line */}
                <View style={styles.studentProgressBarRow}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stu.progress}%`,
                          backgroundColor:
                            stu.progress >= 70
                              ? '#10B981'
                              : stu.progress >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                        },
                      ]}
                    />
                  </View>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                    {stu.progress}%
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── CARD 3: AI නිර්දේශ සහ මගපෙන්වීම් (ADAPTIVE INSIGHTS) ── */}
        <View style={[styles.insightsCard, ThemeShadow.sm]}>
          <View style={styles.insightHeaderRow}>
            <AppText size="sm">🧠</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              AI ස්මාර්ට් ඉගෙනුම් නිර්දේශ
            </AppText>
          </View>

          <View style={styles.insightInnerBox}>
            <AppText size="xs" weight="bold" color="#0369A1">
              • සිසුන් 8 දෙනෙකු සඳහා නව කථන අභ්‍යාස නිර්දේශ කර ඇත.
            </AppText>
            <AppText size="xs" color="#0C4A6E" style={{ marginTop: 4, lineHeight: 18 }}>
              ර/ල අකුරු මාරුව සහ ස්වර දිගුකිරීම් ආශ්‍රිත දෝෂ සහිත සිසුන්ට පියවරෙන් පියවර සහාය ලබාදෙන්න.
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.viewRecsBtn}
            onPress={() => router.push('/(parent)/recommendations')}
            activeOpacity={0.85}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.primary}>
              සම්පූර්ණ AI නිර්දේශ විමසන්න →
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── CARD 4: ඉක්මන් පුහුණු සැසියක් (QUICK LAUNCHER) ── */}
        <View style={[styles.quickLauncherCard, ThemeShadow.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText size="md">📋</AppText>
            <AppText size="md" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 8 }}>
              විස්තරාත්මක වාර්තා සහ නිර්දේශ
            </AppText>
          </View>
          <AppText size="xs" color="rgba(255,255,255,0.9)" style={{ marginTop: 4, lineHeight: 18 }}>
            සිසුවාගේ උච්චාරණ දෝෂ විශ්ලේෂණය සහ ඉදිරි ඉගෙනුම් මාර්ගය පරිශීලනය කරන්න.
          </AppText>

          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => router.push('/(parent)/reports')}
            activeOpacity={0.85}
          >
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
              සම්පූර්ණ වාර්තාව බලන්න →
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  teacherAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxl,
  },
  tabPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  tabPillActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  studentsListWrap: {
    gap: 10,
  },
  studentItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  statusGood: {
    backgroundColor: '#DCFCE7',
  },
  statusAttention: {
    backgroundColor: '#FEF3C7',
  },
  statusHelp: {
    backgroundColor: '#FEE2E2',
  },
  studentProgressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: ThemeRadius.full,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  insightInnerBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.sm,
  },
  viewRecsBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: ThemeRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  quickLauncherCard: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 20,
    padding: ThemeSpacing.md,
  },
  launchBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: ThemeSpacing.md,
    ...ThemeShadow.sm,
  },
});
