import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
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
import { useAuth } from '@/context/AuthContext';
import { useChildStoreBase } from '@/store/childStore';
import { connectionService } from '@/services/connectionService';
import { sessionService } from '@/services/sessionService';
import { LinkedPerson, ReadingSessionRecord, Child } from '@/types';
import { EmptyView, ErrorView } from '@/components/shared-states';

interface StudentMetricSummary {
  totalSessions: number;
  avgAccuracy: number | null;
  hasEnoughData: boolean;
  statusText: string;
  statusType: 'good' | 'attention' | 'help' | 'no_data';
}

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  // Phones / narrow windows: stack the student table row instead of 5 cramped columns
  const isNarrow = screenWidth < 520;

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [linkedStudents, setLinkedStudents] = useState<LinkedPerson[]>([]);
  const [studentStatsMap, setStudentStatsMap] = useState<Record<string, StudentMetricSummary>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Enforce teacher role at route boundary
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      if (user.role === 'parent') {
        router.replace('/(parent)/dashboard');
      } else {
        router.replace('/(child)/home');
      }
    }
  }, [user]);

  const loadTeacherDashboard = useCallback(async () => {
    if (!user?.uid || user.role !== 'teacher') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);

      // 1. Fetch real linked children for this teacher
      const students = await connectionService.getLinkedChildren(user.uid, user.email);
      setLinkedStudents(students || []);

      // 2. Fetch session history for each student in parallel
      const statsMap: Record<string, StudentMetricSummary> = {};

      await Promise.all(
        (students || []).map(async (st) => {
          try {
            const sessions: ReadingSessionRecord[] = await sessionService.getChildSessions(st.uid, 20);
            const validSessions = sessions.filter(
              (s): s is ReadingSessionRecord & { overallAccuracy: number } =>
                typeof s.overallAccuracy === 'number' && s.overallAccuracy >= 0
            );

            const hasEnoughData = validSessions.length > 0;
            const avgAccuracy = hasEnoughData
              ? Math.round(
                  validSessions.reduce((sum, s) => sum + s.overallAccuracy, 0) / validSessions.length
                )
              : null;

            let statusText = 'දත්ත ප්‍රමාණවත් නැත';
            let statusType: 'good' | 'attention' | 'help' | 'no_data' = 'no_data';

            if (hasEnoughData && avgAccuracy !== null) {
              if (avgAccuracy >= 75) {
                statusText = 'හොඳයි';
                statusType = 'good';
              } else if (avgAccuracy >= 60) {
                statusText = 'අවධානය';
                statusType = 'attention';
              } else {
                statusText = 'සහාය අවශ්‍යයි';
                statusType = 'help';
              }
            }

            statsMap[st.uid] = {
              totalSessions: sessions.length,
              avgAccuracy,
              hasEnoughData,
              statusText,
              statusType,
            };
          } catch (stErr) {
            console.warn(`[TeacherDashboard] Error fetching sessions for student ${st.uid}:`, stErr);
            statsMap[st.uid] = {
              totalSessions: 0,
              avgAccuracy: null,
              hasEnoughData: false,
              statusText: 'දත්ත ප්‍රමාණවත් නැත',
              statusType: 'no_data',
            };
          }
        })
      );

      setStudentStatsMap(statsMap);
    } catch (err) {
      console.warn('[TeacherDashboard] loadTeacherDashboard failed:', err);
      setFetchError('ශිෂ්‍ය දත්ත ලබාගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    loadTeacherDashboard();
  }, [loadTeacherDashboard]);

  // ── Calculate Classroom Summary Metrics ──────────────────────────────────────
  const totalStudents = linkedStudents.length;

  const totalCompletedSessions = Object.values(studentStatsMap).reduce(
    (sum, st) => sum + st.totalSessions,
    0
  );

  const studentsWithData = Object.values(studentStatsMap).filter(
    (st) => st.hasEnoughData && st.avgAccuracy !== null
  );

  const averageClassAccuracy =
    studentsWithData.length > 0
      ? Math.round(
          studentsWithData.reduce((sum, st) => sum + (st.avgAccuracy || 0), 0) /
            studentsWithData.length
        )
      : null;

  // Needs Attention: Only students with sufficient valid data and avgAccuracy < 60%
  const needsAttentionCount = studentsWithData.filter(
    (st) => (st.avgAccuracy || 0) < 60
  ).length;

  // ── Handle Student Row Selection ───────────────────────────────────────────
  const handleSelectStudent = (st: LinkedPerson) => {
    const stats = studentStatsMap[st.uid];
    const readingLvl: 'easy' | 'medium' | 'hard' =
      stats?.hasEnoughData && stats.avgAccuracy !== null
        ? stats.avgAccuracy >= 75
          ? 'hard'
          : stats.avgAccuracy >= 60
          ? 'medium'
          : 'easy'
        : 'easy';

    const childStoreState = useChildStoreBase.getState();
    const existingChild = childStoreState.children.find((c) => c.id === st.uid);
    const currentMatching = childStoreState.currentChild?.id === st.uid ? childStoreState.currentChild : null;

    const childData: Child = {
      id: st.uid,
      name: st.name || 'ශිෂ්‍යයා',
      age: existingChild?.age || currentMatching?.age || 0,
      grade: st.grade || existingChild?.grade || currentMatching?.grade || 2,
      readingLevel: readingLvl,
      streak: 0,
      stars: 0,
      totalSessions: stats?.totalSessions || 0,
      avatarColor: existingChild?.avatarColor || currentMatching?.avatarColor || '#4F46E5',
      avatar: existingChild?.avatar || currentMatching?.avatar,
    };

    useChildStoreBase.getState().setCurrentChild(childData);
    router.push('/(parent)/student-details');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('[TeacherDashboard] Logout error:', e);
    }
    router.replace('/(auth)/role-select');
  };

  if (!user || user.role !== 'teacher') {
    return null;
  }

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
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <View style={styles.greetingTitleRow}>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                  සුභ උදෑසනක්, {user?.displayName || 'ගුරුතුමියනි'}
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
              <TouchableOpacity
                style={styles.switchParentBtn}
                onPress={() => router.push('/(parent)/dashboard')}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  👨‍👩‍👧 දෙමාපිය පුවරුව
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => router.push('/(child)/notifications')}
                activeOpacity={0.7}
              >
                <AppText size="sm">🔔</AppText>
                <View style={styles.redDot} />
              </TouchableOpacity>

              <View style={styles.teacherAvatarWrap}>
                <AppText size="sm">👩‍🏫</AppText>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.75}
                accessibilityLabel="Log Out"
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
            {/* Metric 1: සිසුන් (Total Students) */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <AppText size="md">👥</AppText>
              </View>
              <View style={{ marginLeft: 8, flexShrink: 1 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  සිසුන්
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  {totalStudents}
                </AppText>
              </View>
            </View>

            {/* Metric 2: සම්පූර්ණ කළ ක්‍රියාකාරකම් (Completed Sessions) */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <AppText size="md" color="#10B981">
                  ✓
                </AppText>
              </View>
              <View style={{ marginLeft: 8, flexShrink: 1 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  මෑත සැසි (උපරිම 20)
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  {totalCompletedSessions}
                </AppText>
              </View>
            </View>

            {/* Metric 3: සාමාන්‍ය ප්‍රගතිය (Average Accuracy) */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <AppText size="md">📈</AppText>
              </View>
              <View style={{ marginLeft: 8, flexShrink: 1 }}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  සාමාන්‍ය ප්‍රගතිය
                </AppText>
                <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                  {averageClassAccuracy !== null ? `${averageClassAccuracy}%` : '—'}
                </AppText>
              </View>
            </View>

            {/* Metric 4: අවධානය අවශ්‍ය සිසුන් (Needs Attention) */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <AppText size="md">⚠️</AppText>
              </View>
              <View style={{ marginLeft: 8, flexShrink: 1 }}>
                <AppText size="xs" color="#DC2626">
                  අවධානය අවශ්‍ය
                </AppText>
                <AppText size="xl" weight="extrabold" color="#DC2626">
                  {needsAttentionCount}
                </AppText>
              </View>
            </View>
          </View>

          {/* Main Dashboard Columns */}
          <View style={styles.dashboardSplitWrap}>
            {/* Left Column: සිසුන්ගේ ප්‍රගතිය Table */}
            <View style={[styles.tableCard, ThemeShadow.sm]}>
              <View style={styles.tableHeaderRow}>
                <View style={styles.tableTitleWrap}>
                  <AppText size="sm">📊</AppText>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    සිසුන්ගේ ප්‍රගතිය ({linkedStudents.length})
                  </AppText>
                </View>
                <TouchableOpacity
                  style={styles.addStudentLink}
                  onPress={() => router.push('/(parent)/connect-student')}
                  activeOpacity={0.7}
                >
                  <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                    + අලුතින් එක්කරන්න
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* State handling: Loading, Error, Empty, or Table */}
              {isLoading ? (
                <View style={styles.stateCenterWrap}>
                  <ActivityIndicator size="large" color={ThemeColors.primary} />
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 8 }}>
                    ශිෂ්‍ය දත්ත සහ සැසි වාර්තා පූරණය වෙමින් පවතී...
                  </AppText>
                </View>
              ) : fetchError ? (
                <ErrorView
                  title="දත්ත ලබාගැනීම අසාර්ථකයි"
                  message={fetchError}
                  onRetry={loadTeacherDashboard}
                  retryLabel="නැවත උත්සාහ කරන්න"
                  compact={true}
                />
              ) : linkedStudents.length === 0 ? (
                <EmptyView
                  title="තවමත් කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත"
                  message="ඔබගේ පන්තියේ සිසුන් සම්බන්ධ කර ගැනීම සඳහා ශිෂ්‍ය කේතය (Student Code) හෝ විද්‍යුත් තැපෑල භාවිතයෙන් සම්බන්ධතා ඉල්ලීමක් යොමු කරන්න."
                  actionLabel="+ ශිෂ්‍යයෙකු සම්බන්ධ කරන්න"
                  onAction={() => router.push('/(parent)/connect-student')}
                  compact={true}
                />
              ) : (
                <>
                  {/* Table Column Titles (hidden on narrow screens; rows are self-labelled) */}
                  {!isNarrow && (<View style={styles.columnHeaderRow}>
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
                  </View>)}

                  {/* Real Student Rows */}
                  {linkedStudents.map((st) => {
                    const stats = studentStatsMap[st.uid] || {
                      totalSessions: 0,
                      avgAccuracy: null,
                      hasEnoughData: false,
                      statusText: 'දත්ත ප්‍රමාණවත් නැත',
                      statusType: 'no_data',
                    };

                    const isGood = stats.statusType === 'good';
                    const isAttention = stats.statusType === 'attention';
                    const isHelp = stats.statusType === 'help';
                    const isNoData = stats.statusType === 'no_data';

                    return (
                      <View key={st.uid || st.email} style={[styles.studentTableRow, isNarrow && styles.studentTableRowNarrow]}>
                        <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={isNarrow ? { flexBasis: '70%', flexGrow: 1, minWidth: 0 } : { flex: 2 }} numberOfLines={1}>
                          {st.name || 'ශිෂ්‍යයා'}
                        </AppText>

                        <AppText size="xs" color={ThemeColors.textSecondary} style={isNarrow ? { flexBasis: '25%', textAlign: 'right' } : { flex: 1 }}>
                          {st.grade || 2}
                        </AppText>

                        {/* Progress Bar & percentage */}
                        <View style={isNarrow ? { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 } : { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.studentTrack, isNarrow && { flex: 1, width: undefined }]}>
                            <View
                              style={[
                                styles.studentFill,
                                {
                                  width: stats.hasEnoughData && stats.avgAccuracy !== null ? `${stats.avgAccuracy}%` : '0%',
                                  backgroundColor: isGood
                                    ? ThemeColors.primary
                                    : isAttention
                                    ? ThemeColors.accent
                                    : isHelp
                                    ? '#EF4444'
                                    : '#CBD5E1',
                                },
                              ]}
                            />
                          </View>
                          <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                            {stats.hasEnoughData ? `${stats.avgAccuracy}%` : '—'}
                          </AppText>
                        </View>

                        {/* Status Badge */}
                        <View style={isNarrow ? { flexBasis: '55%', flexGrow: 1, alignItems: 'flex-start' } : { flex: 2, alignItems: 'center' }}>
                          <View
                            style={[
                              styles.statusBadgePill,
                              isGood && { backgroundColor: '#DCFCE7' },
                              isAttention && { backgroundColor: '#FEF3C7' },
                              isHelp && { backgroundColor: '#FEE2E2' },
                              isNoData && { backgroundColor: '#F1F5F9' },
                            ]}
                          >
                            <AppText
                              size="xs"
                              weight="bold"
                              color={
                                isGood
                                  ? '#16A34A'
                                  : isAttention
                                  ? '#D97706'
                                  : isHelp
                                  ? '#DC2626'
                                  : '#64748B'
                              }
                            >
                              • {stats.statusText}
                            </AppText>
                          </View>
                        </View>

                        {/* Action Button */}
                        <View style={isNarrow ? { flexBasis: '40%', flexGrow: 1, alignItems: 'flex-end' } : { flex: 1.5, alignItems: 'flex-end' }}>
                          <TouchableOpacity
                            style={[
                              styles.viewBtn,
                              isGood
                                ? { backgroundColor: ThemeColors.primary }
                                : isAttention
                                ? { backgroundColor: '#E0F2FE' }
                                : isHelp
                                ? { backgroundColor: '#FFEDD5' }
                                : { backgroundColor: '#F1F5F9' },
                            ]}
                            onPress={() => handleSelectStudent(st)}
                            activeOpacity={0.8}
                          >
                            <AppText
                              size="xs"
                              weight="bold"
                              color={isGood ? '#FFFFFF' : ThemeColors.textPrimary}
                            >
                              බලන්න
                            </AppText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
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
                    {needsAttentionCount > 0
                      ? `සිසුන් ${needsAttentionCount} දෙනෙකු සඳහා විශේෂ කියවීමේ සහාය සහ සරල අභ්‍යාස නිර්දේශ කර ඇත.`
                      : totalStudents > 0
                      ? `පන්තියේ සියලුම සිසුන් සතුටුදායක ප්‍රගතියක් පෙන්වයි.`
                      : `සිසුන් සම්බන්ධ කර ගැනීමෙන් පසු AI නිර්දේශ මෙහි දිස්වේ.`}
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
    flexGrow: 1,
    padding: Platform.OS === 'web' ? ThemeSpacing.lg : ThemeSpacing.md,
    gap: ThemeSpacing.md,
  },
  topHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: ThemeSpacing.xs,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  topRightHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  addStudentLink: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 4,
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
  switchParentBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: ThemeRadius.full,
    marginRight: 2,
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
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 0,
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
    flexGrow: 2,
    flexBasis: 320,
    minWidth: 0,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  studentTableRowNarrow: {
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
    paddingVertical: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  rightSideCol: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 0,
    maxWidth: '100%',
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
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
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
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateCenterWrap: {
    paddingVertical: ThemeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
