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

export default function TeacherDashboardScreen() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState('dashboard');

  const students = [
    {
      id: 1,
      name: 'සෙනුලි',
      grade: 5,
      progress: 78,
      status: 'හොඳයි',
      statusType: 'good',
    },
    {
      id: 2,
      name: 'කවිඳු',
      grade: 5,
      progress: 62,
      status: 'අවධානය',
      statusType: 'attention',
    },
    {
      id: 3,
      name: 'සහන්',
      grade: 4,
      progress: 44,
      status: 'සහාය අවශ්‍යයි',
      statusType: 'help',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layoutWrapper}>
        {/* Left Sidebar (Desktop / Tablet Navigation) */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoWrap}>
            <NenaManLogo size="sm" showText={true} />
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity
              style={[styles.menuItem, activeMenu === 'dashboard' && styles.menuItemActive]}
              onPress={() => setActiveMenu('dashboard')}
              activeOpacity={0.8}
            >
              <AppText size="xs">🎛️</AppText>
              <AppText
                size="xs"
                weight="bold"
                color={activeMenu === 'dashboard' ? '#FFFFFF' : ThemeColors.textPrimary}
                style={{ marginLeft: 8 }}
              >
                උපකරණ පුවරුව
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeMenu === 'students' && styles.menuItemActive]}
              onPress={() => setActiveMenu('students')}
              activeOpacity={0.8}
            >
              <AppText size="xs">👥</AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8 }}>
                සිසුන්
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeMenu === 'activities' && styles.menuItemActive]}
              onPress={() => router.push('/(parent)/recommendations')}
              activeOpacity={0.8}
            >
              <AppText size="xs">📖</AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8 }}>
                ක්‍රියාකාරකම්
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeMenu === 'reports' && styles.menuItemActive]}
              onPress={() => router.push('/(parent)/reports')}
              activeOpacity={0.8}
            >
              <AppText size="xs">📊</AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8 }}>
                වාර්තා
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Settings at Bottom */}
          <TouchableOpacity
            style={styles.sidebarSettingsBtn}
            onPress={() => router.push('/(settings)/settings')}
            activeOpacity={0.8}
          >
            <AppText size="xs">⚙️</AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 6 }}>
              සැකසුම්
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainScroll}
        >
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View>
              <View style={styles.greetingTitleRow}>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                  සුභ උදෑසනක්, ගුරුතුමියනි
                </AppText>
                <AppText size="lg" style={{ marginLeft: 6 }}>
                  👏
                </AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                අද ඔබගේ සිසුන්ගේ ප්‍රගතිය බලමු.
              </AppText>
            </View>

            <View style={styles.topRightHeader}>
              <View style={styles.bellBtn}>
                <AppText size="sm">🔔</AppText>
                <View style={styles.redDot} />
              </View>
              <View style={styles.teacherAvatarWrap}>
                <AppText size="sm">👩‍🏫</AppText>
              </View>

              {/* Logout Button (Exit Icon Only) */}
              <TouchableOpacity
                style={styles.logoutBtn}
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

          {/* 4 Summary Metric Cards */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: සිසුන් */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <AppText size="md">👥</AppText>
              </View>
              <View style={{ marginLeft: 8 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  සිසුන්
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  24
                </AppText>
              </View>
            </View>

            {/* Metric 2: සම්පූර්ණ කළ ක්‍රියාකාරකම් */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <AppText size="md" color="#10B981">
                  ✓
                </AppText>
              </View>
              <View style={{ marginLeft: 8 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  සම්පූර්ණ කළ
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  156
                </AppText>
              </View>
            </View>

            {/* Metric 3: සාමාන්‍ය ප්‍රගතිය */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <AppText size="md">📈</AppText>
              </View>
              <View style={{ marginLeft: 8 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  සාමාන්‍ය ප්‍රගතිය
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  72%
                </AppText>
              </View>
            </View>

            {/* Metric 4: අවධානය අවශ්‍ය සිසුන් */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <AppText size="md">⚠️</AppText>
              </View>
              <View style={{ marginLeft: 8 }}>
                <AppText size="xs" color="#DC2626">
                  අවධානය අවශ්‍ය
                </AppText>
                <AppText size="xl" weight="extrabold" color="#DC2626">
                  5
                </AppText>
              </View>
            </View>
          </View>

          {/* Main Dashboard Columns (Students Progress Table + Right Adaptive Panel) */}
          <View style={styles.dashboardSplitWrap}>
            {/* Left Column: සිසුන්ගේ ප්‍රගතිය Table */}
            <View style={[styles.tableCard, ThemeShadow.sm]}>
              <View style={styles.tableHeaderRow}>
                <View style={styles.tableTitleWrap}>
                  <AppText size="sm">📊</AppText>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    සිසුන්ගේ ප්‍රගතිය
                  </AppText>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                  <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                    සියල්ල බලන්න
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Table Column Titles */}
              <View style={styles.columnHeaderRow}>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ flex: 2 }}>
                  නම
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ flex: 1 }}>
                  ශ්‍රේණිය
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ flex: 3 }}>
                  ප්‍රගතිය
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ flex: 2, textAlign: 'center' }}>
                  තත්වය
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ flex: 1.5, textAlign: 'right' }}>
                  ක්‍රියාව
                </AppText>
              </View>

              {/* Student Rows */}
              {students.map((st) => (
                <View key={st.id} style={styles.studentTableRow}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ flex: 2 }}>
                    {st.name}
                  </AppText>

                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1 }}>
                    {st.grade}
                  </AppText>

                  {/* Progress Bar & percentage */}
                  <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.studentTrack}>
                      <View
                        style={[
                          styles.studentFill,
                          {
                            width: `${st.progress}%`,
                            backgroundColor:
                              st.statusType === 'good'
                                ? ThemeColors.primary
                                : st.statusType === 'attention'
                                ? ThemeColors.accent
                                : '#EF4444',
                          },
                        ]}
                      />
                    </View>
                    <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                      {st.progress}%
                    </AppText>
                  </View>

                  {/* Status Badge */}
                  <View style={{ flex: 2, alignItems: 'center' }}>
                    <View
                      style={[
                        styles.statusBadgePill,
                        st.statusType === 'good' && { backgroundColor: '#DCFCE7' },
                        st.statusType === 'attention' && { backgroundColor: '#FEF3C7' },
                        st.statusType === 'help' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <AppText
                        size="xs"
                        weight="bold"
                        color={
                          st.statusType === 'good'
                            ? '#16A34A'
                            : st.statusType === 'attention'
                            ? '#D97706'
                            : '#DC2626'
                        }
                      >
                        • {st.status}
                      </AppText>
                    </View>
                  </View>

                  {/* Action Button */}
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <TouchableOpacity
                      style={[
                        styles.viewBtn,
                        st.statusType === 'good' && { backgroundColor: ThemeColors.primary },
                        st.statusType === 'attention' && { backgroundColor: '#E0F2FE' },
                        st.statusType === 'help' && { backgroundColor: '#FFEDD5' },
                      ]}
                      onPress={() => router.push('/(parent)/student-details')}
                      activeOpacity={0.8}
                    >
                      <AppText
                        size="xs"
                        weight="bold"
                        color={st.statusType === 'good' ? '#FFFFFF' : ThemeColors.textPrimary}
                      >
                        බලන්න
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Right Column: Adaptive Insights & New Activity Card */}
            <View style={styles.rightSideCol}>
              {/* Adaptive Insights Card */}
              <View style={[styles.adaptiveInsightsCard, ThemeShadow.sm]}>
                <View style={styles.insightHeaderRow}>
                  <AppText size="sm">🤖</AppText>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    Adaptive Insights
                  </AppText>
                </View>

                <View style={styles.insightInnerBox}>
                  <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                    සිසුන් 8 දෙනෙකු සඳහා නව ක්‍රියාකාරකම් නිර්දේශ කර ඇත.
                  </AppText>
                </View>

                <TouchableOpacity
                  style={styles.viewRecsBtn}
                  onPress={() => router.push('/(parent)/recommendations')}
                  activeOpacity={0.8}
                >
                  <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                    නිර්දේශ බලන්න
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* New Activity Green Card */}
              <View style={[styles.newActivityCard, ThemeShadow.sm]}>
                <View style={styles.newActHeader}>
                  <AppText size="md">📑</AppText>
                  <AppText size="sm" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 6 }}>
                    නව ක්‍රියාකාරකමක්
                  </AppText>
                </View>

                <AppText size="xs" color="#E6F4EA" style={styles.newActDesc}>
                  පන්තිය සඳහා නව පාඩමක් යොදවන්න.
                </AppText>

                <TouchableOpacity
                  style={styles.startNewActBtn}
                  onPress={() => router.push('/(parent)/recommendations')}
                  activeOpacity={0.85}
                >
                  <AppText size="xs" weight="bold" color="#FFFFFF">
                    ආරම්භ කරන්න
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ height: ThemeSpacing.xl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  layoutWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: ThemeColors.borderLight,
    padding: ThemeSpacing.md,
    justifyContent: 'space-between',
    ...(Platform.OS !== 'web' ? { display: 'none' } : {}),
  },
  sidebarLogoWrap: {
    marginBottom: ThemeSpacing.lg,
  },
  sidebarMenu: {
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: ThemeRadius.md,
  },
  menuItemActive: {
    backgroundColor: ThemeColors.primary,
  },
  sidebarSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mainScroll: {
    flex: 1,
    padding: ThemeSpacing.lg,
    gap: ThemeSpacing.md,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  teacherAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
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
  dashboardSplitWrap: {
    flexDirection: 'row',
    gap: ThemeSpacing.md,
    flexWrap: 'wrap',
  },
  tableCard: {
    flex: 2,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  tableTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    marginBottom: 8,
  },
  studentTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentTrack: {
    width: 70,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  studentFill: {
    height: 6,
    borderRadius: ThemeRadius.full,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rightSideCol: {
    flex: 1,
    minWidth: 220,
    gap: ThemeSpacing.md,
  },
  adaptiveInsightsCard: {
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
    backgroundColor: '#EBF5FA',
    borderRadius: 12,
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.sm,
  },
  viewRecsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  newActivityCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: ThemeSpacing.md,
  },
  newActHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  newActDesc: {
    marginBottom: ThemeSpacing.md,
    lineHeight: 16,
  },
  startNewActBtn: {
    backgroundColor: '#065F46',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
