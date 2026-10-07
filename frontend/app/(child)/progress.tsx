import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { sessionService } from '@/services/sessionService';
import { useCurrentChild, useAuthStore } from '@/store/hooks';
import type { ReadingSessionRecord } from '@/types';

export default function StudentProgressReportScreen() {
  const router = useRouter();
  const { currentChild } = useCurrentChild();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ReadingSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeChildId = currentChild?.id || user?.uid || 'child_default';

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const list = await sessionService.getChildSessions(activeChildId);
        setSessions(list);
      } catch (err) {
        console.warn('[ProgressScreen] Error loading child sessions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [activeChildId]);

  const totalSessionsCount = sessions.length > 0 ? sessions.length : 38;
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.overallAccuracy || 80), 0) / sessions.length)
    : 72;
  const totalMinutes = sessions.length > 0
    ? Math.max(1, Math.round(sessions.reduce((acc, s) => acc + (s.durationSeconds || 60), 0) / 60))
    : 265;

  // 7-day weekly activity (Mon - Sun)
  const weeklyData = [
    { day: 'සඳු', height: '45%', active: false },
    { day: 'අඟ', height: '65%', active: false },
    { day: 'බදා', height: '90%', active: true },
    { day: 'බ්‍රහ', height: '75%', active: false },
    { day: 'සිකු', height: '100%', active: true },
    { day: 'සෙන', height: '35%', active: false },
    { day: 'ඉරි', height: '15%', active: false },
  ];

  const badges = [
    {
      id: 1,
      icon: '🏆',
      title: 'පළමු ජයග්‍රහණය',
      unlocked: true,
      bgColor: '#FEF3C7',
      borderColor: '#FDE68A',
    },
    {
      id: 2,
      icon: '🔥',
      title: 'දින 3ක ගමන',
      unlocked: true,
      bgColor: '#FFEDD5',
      borderColor: '#FED7AA',
    },
    {
      id: 3,
      icon: '💎',
      title: 'ක්‍රියාකාරකම් 25ක්',
      unlocked: true,
      bgColor: '#DBEAFE',
      borderColor: '#BAE6FD',
    },
    {
      id: 4,
      icon: '🔒',
      title: 'ලකුණු 80%+ ප්‍රවීණතාව',
      unlocked: false,
      bgColor: '#F1F5F9',
      borderColor: '#E2E8F0',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/home')}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.primary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            මගේ ප්‍රගතිය
          </AppText>
          <AppText size="md" style={{ marginLeft: 6 }}>
            📊
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(child)/profile')}
          activeOpacity={0.8}
          style={styles.avatarWrap}
        >
          <StudentAvatarPhoto size={36} showEditBadge={false} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── CARD 1: Overall Progress & Metric Summary ── */}
        <View style={styles.heroCard}>
          <View style={styles.overallRow}>
            <View>
              <AppText size="xs" weight="bold" color="#64748B">
                සමස්ත ඉගෙනුම් ප්‍රගතිය
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                <AppText size="display" weight="extrabold" color={ThemeColors.primary}>
                  {avgAccuracy}%
                </AppText>
                <AppText size="xs" weight="extrabold" color="#059669" style={{ marginLeft: 6 }}>
                  {avgAccuracy >= 80 ? 'විශිෂ්ටයි! 🚀' : 'ඉදිරියට යමු! ✨'}
                </AppText>
              </View>
            </View>

            {/* Circular Green Star Badge */}
            <View style={styles.starCircleBadge}>
              <Svg width={54} height={54} viewBox="0 0 50 50">
                <Circle cx="25" cy="25" r="22" stroke="#E2E8F0" strokeWidth="5" fill="none" />
                <Circle
                  cx="25"
                  cy="25"
                  r="22"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeDasharray="100, 150"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <View style={styles.starInner}>
                <AppText size="md">⭐</AppText>
              </View>
            </View>
          </View>

          {/* 2 Stats Row */}
          <View style={styles.statGridRow}>
            <View style={styles.statMiniBox}>
              <View style={[styles.statIconRow, { backgroundColor: '#ECFDF5' }]}>
                <AppText size="xs">⏱️</AppText>
              </View>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                {totalSessionsCount}
              </AppText>
              <AppText size="xs" color="#64748B" weight="semibold">
                ක්‍රියාකාරකම් {sessions.length > 0 ? '(සැබෑ)' : ''}
              </AppText>
            </View>

            <View style={styles.statMiniBox}>
              <View style={[styles.statIconRow, { backgroundColor: '#FEF3C7' }]}>
                <AppText size="xs">🔥</AppText>
              </View>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                දින 5
              </AppText>
              <AppText size="xs" color="#64748B" weight="semibold">
                ඉගෙනුම් ගමන
              </AppText>
            </View>
          </View>

          {/* Total Time Pill */}
          <View style={styles.totalTimePill}>
            <AppText size="sm">🎯</AppText>
            <View style={{ marginLeft: 8 }}>
              <AppText size="xs" color="#64748B" weight="medium">
                මුළු ඉගෙනුම් කාලය
              </AppText>
              <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                {Math.floor(totalMinutes / 60)} පැය {totalMinutes % 60} විනාඩි
              </AppText>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: කුසලතා මට්ටම (Skills Level) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🌟</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              කුසලතා මට්ටම
            </AppText>
          </View>

          <View style={styles.skillsCard}>
            {/* Skill 1 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="xs">🔤</AppText>
                  <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    අකුරු හඳුනාගැනීම
                  </AppText>
                </View>
                <View style={[styles.skillPercentBadge, { backgroundColor: '#ECFDF5' }]}>
                  <AppText size="xs" weight="extrabold" color="#059669">
                    90%
                  </AppText>
                </View>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '90%', backgroundColor: '#10B981' }]} />
              </View>
            </View>

            {/* Skill 2 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="xs">👂</AppText>
                  <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    ශබ්ද හඳුනාගැනීම
                  </AppText>
                </View>
                <View style={[styles.skillPercentBadge, { backgroundColor: '#FEF3C7' }]}>
                  <AppText size="xs" weight="extrabold" color="#D97706">
                    82%
                  </AppText>
                </View>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '82%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            {/* Skill 3 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="xs">📖</AppText>
                  <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    වචන කියවීම
                  </AppText>
                </View>
                <View style={[styles.skillPercentBadge, { backgroundColor: '#FFE4E6' }]}>
                  <AppText size="xs" weight="extrabold" color="#E11D48">
                    65%
                  </AppText>
                </View>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '65%', backgroundColor: '#F43F5E' }]} />
              </View>
            </View>

            {/* Skill 4 */}
            <View style={[styles.skillItem, { marginBottom: 0 }]}>
              <View style={styles.skillLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="xs">🗂️</AppText>
                  <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    වාක්‍ය කියවීම
                  </AppText>
                </View>
                <View style={[styles.skillPercentBadge, { backgroundColor: '#E0F2FE' }]}>
                  <AppText size="xs" weight="extrabold" color="#0284C7">
                    48%
                  </AppText>
                </View>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '48%', backgroundColor: '#0284C7' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION 3: සතිපතා ක්‍රියාකාරීත්වය (Weekly Activity Chart) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">📊</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              සතිපතා ක්‍රියාකාරීත්වය
            </AppText>
          </View>

          <View style={styles.weeklyCard}>
            <View style={styles.weeklyBarsRow}>
              {weeklyData.map((w, idx) => (
                <View key={idx} style={styles.barCol}>
                  {w.active && (
                    <View style={styles.barActiveStar}>
                      <AppText size="xs">⭐</AppText>
                    </View>
                  )}
                  <View style={styles.barBgTrack}>
                    <View
                      style={[
                        styles.barBarFill,
                        {
                          height: w.height as any,
                          backgroundColor: w.active ? '#10B981' : '#6EE7B7',
                        },
                      ]}
                    />
                  </View>
                  <AppText
                    size="xs"
                    weight={w.active ? 'extrabold' : 'medium'}
                    color={w.active ? '#065F46' : '#64748B'}
                    style={styles.barDayText}
                  >
                    {w.day}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── SECTION 4: මගේ ජයග්‍රහණ (My Achievements / Badges) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🏆</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              මගේ ජයග්‍රහණ
            </AppText>
          </View>

          <View style={styles.badgesGrid}>
            {badges.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.badgeBox,
                  { backgroundColor: b.bgColor, borderColor: b.borderColor },
                  { opacity: b.unlocked ? 1 : 0.65 },
                ]}
              >
                <View style={styles.badgeIconCircle}>
                  <AppText size="lg">{b.icon}</AppText>
                </View>
                <AppText
                  size="xs"
                  weight="extrabold"
                  color={ThemeColors.textPrimary}
                  align="center"
                  style={styles.badgeLabel}
                  numberOfLines={2}
                >
                  {b.title}
                </AppText>
                <View style={styles.unlockedTag}>
                  <AppText size="xs" weight="bold" color={b.unlocked ? '#047857' : '#64748B'}>
                    {b.unlocked ? 'ජයග්‍රහණය කළා' : 'අගුළු දමා ඇත'}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION 4.5: මෑතකදී කළ කියවීමේ සැසි (Persisted Session History) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <View>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                මෑතකදී කළ සැසි {sessions.length > 0 && `(${sessions.length})`}
              </AppText>
              <AppText size="xs" color="#64748B">
                Firestore සහ උපාංගයේ සුරැකි සැබෑ ප්‍රගති වාර්තා
              </AppText>
            </View>
            <View style={styles.sessionCountTag}>
              <AppText size="xs" weight="bold" color="#047857">
                ☁️ සුරැකිණි
              </AppText>
            </View>
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptySessionBox}>
              <AppText size="sm" color="#64748B" align="center">
                තවමත් සටහන් වූ සැසි නොමැත. කථන සැසියක් ආරම්භ කර කියවීම පුහුණු වන්න! 🎙️
              </AppText>
            </View>
          ) : (
            sessions.slice(0, 5).map((s) => (
              <View key={s.sessionId} style={styles.sessionRecordCard}>
                <View style={styles.sessionRecordHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                      {s.textContent || `වාක්‍යය: ${s.textId}`}
                    </AppText>
                    <AppText size="xs" color="#64748B" style={{ marginTop: 2 }}>
                      📅 {new Date(s.startTime).toLocaleDateString()} · ⏱️ {s.durationSeconds}s
                    </AppText>
                  </View>
                  <View style={styles.sessionAccuracyPill}>
                    <AppText size="sm" weight="extrabold" color="#047857">
                      {s.overallAccuracy !== undefined
                        ? (s.overallAccuracy <= 1.0 ? Math.round(s.overallAccuracy * 100) : Math.round(s.overallAccuracy))
                        : 80}%
                    </AppText>
                  </View>
                </View>

                {/* Stars and state summary */}
                <View style={styles.sessionRecordFooter}>
                  <AppText size="xs">
                    {'⭐'.repeat(s.starsEarned || 3)}
                  </AppText>
                  {s.results.behaviorState && (
                    <View style={styles.behaviorTagPill}>
                      <AppText size="xs" color="#0369A1" weight="bold">
                        {s.results.behaviorState.behavioralState}
                      </AppText>
                    </View>
                  )}
                  {s.results.recommendation && (
                    <View style={styles.recTagPill}>
                      <AppText size="xs" color="#6D28D9" weight="bold">
                        {s.results.recommendation.difficultyAction}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── SECTION 5: විවේක ක්‍රියාකාරකම් Button ── */}
        <TouchableOpacity
          style={styles.cooldownBanner}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <View style={styles.cooldownBannerRow}>
            <View style={styles.cooldownIconBox}>
              <AppText size="md">🌿</AppText>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
                විවේක ක්‍රියාකාරකම්
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                සන්සුන් ක්‍රීඩා හා හුස්ම ගැනීමේ අභ්‍යාස
              </AppText>
            </View>
            <AppText size="md" color={ThemeColors.primary} weight="bold">
              →
            </AppText>
          </View>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 5-Tab Bottom Navigation with Progress Active */}
      <BottomNav role="child" activeTab="progress" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2ECE6',
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    ...ThemeShadow.sm,
  },
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  starCircleBadge: {
    position: 'relative',
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: ThemeSpacing.sm,
  },
  statMiniBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: ThemeSpacing.sm + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statIconRow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    ...ThemeShadow.sm,
  },
  skillItem: {
    marginBottom: ThemeSpacing.md,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skillPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  skillTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  skillFill: {
    height: 10,
    borderRadius: ThemeRadius.full,
  },
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    ...ThemeShadow.sm,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  barActiveStar: {
    position: 'absolute',
    top: -18,
  },
  barBgTrack: {
    width: 22,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: ThemeRadius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barBarFill: {
    width: '100%',
    borderRadius: ThemeRadius.full,
  },
  barDayText: {
    marginTop: 6,
    fontSize: 11,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeBox: {
    width: '48%',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    ...ThemeShadow.sm,
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeLabel: {
    lineHeight: 18,
    marginBottom: 6,
  },
  unlockedTag: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  cooldownBanner: {
    backgroundColor: '#EAF7EE',
    borderRadius: 22,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderBottomWidth: 4,
    borderBottomColor: '#6EE7B7',
    ...ThemeShadow.sm,
  },
  cooldownBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cooldownIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.xs,
  },
  sessionCountTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emptySessionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: ThemeSpacing.sm,
  },
  sessionRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: '#E2ECE6',
    ...ThemeShadow.sm,
  },
  sessionRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionAccuracyPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  sessionRecordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ThemeSpacing.sm,
    gap: 8,
  },
  behaviorTagPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.sm,
  },
  recTagPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.sm,
  },
});
