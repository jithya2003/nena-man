import React from 'react';
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
import { MOCK_CHILD } from '@/mock/data';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';
import { StudentAvatarPhoto } from '@/components/Illustrations';

export default function StudentProgressReportScreen() {
  const router = useRouter();

  // 7-day weekly activity (Mon - Sun)
  const weeklyData = [
    { day: 'සඳු', height: '45%', active: false },
    { day: 'අඟ', height: '65%', active: false },
    { day: 'බදා', height: '90%', active: true },
    { day: 'බ්‍රහ', height: '75%', active: false },
    { day: 'සිකු', height: '100%', active: true },
    { day: 'සෙන', height: '25%', active: false },
    { day: 'ඉරි', height: '0%', active: false },
  ];

  const badges = [
    {
      id: 1,
      icon: '🏆',
      title: 'පළමු ක්‍රියාකාරකම',
      unlocked: true,
      bgColor: '#FFEDD5',
    },
    {
      id: 2,
      icon: '🔥',
      title: 'දින 3ක ඉගෙනුම් ගමන',
      unlocked: true,
      bgColor: '#FFEDD5',
    },
    {
      id: 3,
      icon: '💎',
      title: 'ක්‍රියාකාරකම් 25ක්',
      unlocked: true,
      bgColor: '#DBEAFE',
    },
    {
      id: 4,
      icon: '🔒',
      title: 'ලකුණු 80%ක ප්‍රතිඵලයක්',
      unlocked: false,
      bgColor: '#F1F5F9',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/home')}
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
          <AppText size="sm">📊</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            මගේ ප්‍රගතිය
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(child)/profile')}
          activeOpacity={0.8}
        >
          <StudentAvatarPhoto size={34} showEditBadge={false} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── CARD 1: Overall Progress & Metric Summary ── */}
        <View style={[styles.card, ThemeShadow.sm]}>
          <View style={styles.overallRow}>
            <View>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                සමස්ත ප්‍රගතිය
              </AppText>
              <AppText size="xxl" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 2 }}>
                72%
              </AppText>
            </View>

            {/* Circular Green Star Badge */}
            <View style={styles.starCircleBadge}>
              <Svg width={46} height={46} viewBox="0 0 50 50">
                <Circle cx="25" cy="25" r="22" stroke="#E2E8F0" strokeWidth="4" fill="none" />
                <Circle
                  cx="25"
                  cy="25"
                  r="22"
                  stroke={ThemeColors.primary}
                  strokeWidth="4"
                  strokeDasharray="100, 150"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <View style={styles.starInner}>
                <AppText size="sm">⭐</AppText>
              </View>
            </View>
          </View>

          {/* 2 Stats Row */}
          <View style={styles.statGridRow}>
            <View style={styles.statMiniBox}>
              <View style={styles.statIconRow}>
                <AppText size="xs">⏱️</AppText>
              </View>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                38
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                ක්‍රියාකාරකම්
              </AppText>
            </View>

            <View style={styles.statMiniBox}>
              <View style={styles.statIconRow}>
                <AppText size="xs">🔥</AppText>
              </View>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                දින 5
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                ඉගෙනුම් ගමන
              </AppText>
            </View>
          </View>

          {/* Total Time Pill */}
          <View style={styles.totalTimePill}>
            <AppText size="xs">🎯</AppText>
            <View style={{ marginLeft: 6 }}>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                මුළු ඉගෙනුම් කාලය
              </AppText>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                පැය 4 විනාඩි 25
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

          <View style={[styles.card, ThemeShadow.sm]}>
            {/* Skill 1 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  අකුරු හඳුනාගැනීම
                </AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  90%
                </AppText>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '90%', backgroundColor: ThemeColors.primary }]} />
              </View>
            </View>

            {/* Skill 2 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  ශබ්ද හඳුනාගැනීම
                </AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  82%
                </AppText>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '82%', backgroundColor: ThemeColors.primary }]} />
              </View>
            </View>

            {/* Skill 3 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  වචන කියවීම
                </AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.accent}>
                  65%
                </AppText>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '65%', backgroundColor: ThemeColors.accent }]} />
              </View>
            </View>

            {/* Skill 4 */}
            <View style={[styles.skillItem, { marginBottom: 0 }]}>
              <View style={styles.skillLabelRow}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  වාක්‍ය කියවීම
                </AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.accent}>
                  48%
                </AppText>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '48%', backgroundColor: ThemeColors.accent }]} />
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

          <View style={[styles.card, ThemeShadow.sm]}>
            <View style={styles.weeklyBarsRow}>
              {weeklyData.map((w, idx) => (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barBgTrack}>
                    <View
                      style={[
                        styles.barBarFill,
                        {
                          height: w.height as any,
                          backgroundColor: w.active ? ThemeColors.primary : '#86EFAC',
                        },
                      ]}
                    />
                  </View>
                  <AppText size="xs" color={ThemeColors.textSecondary} style={styles.barDayText}>
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
                  { opacity: b.unlocked ? 1 : 0.6 },
                  ThemeShadow.sm,
                ]}
              >
                <View style={[styles.badgeIconCircle, { backgroundColor: b.bgColor }]}>
                  <AppText size="md">{b.icon}</AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} align="center" style={styles.badgeLabel}>
                  {b.title}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION 5: විවේක ක්‍රියාකාරකම් Button ── */}
        <TouchableOpacity
          style={[styles.cooldownBanner, ThemeShadow.sm]}
          onPress={() => router.push('/(child)/cooldown')}
          activeOpacity={0.85}
        >
          <View style={styles.cooldownBannerRow}>
            <AppText size="md">🌿</AppText>
            <View style={{ marginLeft: 8 }}>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
                විවේක ක්‍රියාකාරකම්
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                සන්සුන් ක්‍රීඩා හා හුස්ම ගැනීමේ අභ්‍යාස
              </AppText>
            </View>
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
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  starCircleBadge: {
    position: 'relative',
    width: 46,
    height: 46,
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
    gap: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.sm,
  },
  statMiniBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: ThemeSpacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconRow: {
    marginBottom: 2,
  },
  totalTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1F8',
    borderRadius: 14,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  skillItem: {
    marginBottom: ThemeSpacing.md,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  skillFill: {
    height: 7,
    borderRadius: ThemeRadius.full,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBgTrack: {
    width: 22,
    height: 85,
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  barDayText: {
    marginTop: 6,
    fontSize: 10,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
  },
  badgeBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  badgeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 11,
    lineHeight: 15,
  },
  cooldownBanner: {
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#C7EBD2',
    marginTop: ThemeSpacing.xs,
  },
  cooldownBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
