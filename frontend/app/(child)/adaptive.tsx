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
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';

export default function AdaptiveRecommendationsScreen() {
  const router = useRouter();

  const levels = [
    { num: 1, label: 'ආරම්භක', active: true },
    { num: 2, label: 'මූලික', active: false },
    { num: 3, label: 'මධ්‍යම', active: false },
    { num: 4, label: 'උසස්', active: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/reading')}
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

        <View style={styles.titleWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            ඔබට සුදුසු ඉගෙනුම්
          </AppText>
          <AppText size="sm" style={{ marginLeft: 4 }}>
            🏛️
          </AppText>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Welcome Notice Card */}
        <View style={[styles.welcomeNoticeCard, ThemeShadow.sm]}>
          <AppText size="xs" color={ThemeColors.textPrimary} style={styles.welcomeNoticeText}>
            සෙනුලි, ඔබ වෙනුවෙන් අපි ක්‍රියාකාරකම් කිහිපයක් තෝරාගෙන තිබෙනවා 💚
          </AppText>
        </View>

        {/* ── CARD 1: අද ඔබට නිර්දේශිතයි (Today's Recommendation) ── */}
        <View style={[styles.mainRecCard, ThemeShadow.sm]}>
          <View style={styles.recTitleRow}>
            <AppText size="sm">✨</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 4 }}>
              අද ඔබට නිර්දේශිතයි
            </AppText>
          </View>

          {/* Activity Inner Box */}
          <View style={styles.activityBox}>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={styles.actTitle}>
              සරල වාක්‍ය කියවීම
            </AppText>

            {/* Bullets: Level, Time, Stars */}
            <View style={styles.actSpecs}>
              <View style={styles.specBadge}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  • පහසු මට්ටම
                </AppText>
              </View>
              <View style={styles.specBadge}>
                <AppText size="xs">⏱️</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  මිනිත්තු 5
                </AppText>
              </View>
              <View style={styles.starBadge}>
                <AppText size="xs">⭐</AppText>
                <AppText size="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 4 }}>
                  10 ලකුණු
                </AppText>
              </View>
            </View>

            {/* Green Action Button */}
            <TouchableOpacity
              style={styles.startNowBtn}
              onPress={() => router.push('/(child)/quiz-word')}
              activeOpacity={0.85}
            >
              <AppText size="md" weight="bold" color="#FFFFFF">
                දැන් ආරම්භ කරන්න
              </AppText>
              <AppText size="md" weight="bold" color="#FFFFFF" style={{ marginLeft: 8 }}>
                ▶
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Why Recommended Explanation */}
          <View style={styles.whyBox}>
            <View style={styles.whyHeaderRow}>
              <AppText size="sm">💡</AppText>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
                ඇයි මෙයා නිර්දේශ කළේ?
              </AppText>
            </View>

            <AppText size="xs" color={ThemeColors.textMuted} style={styles.resultsLabel}>
              ඔබගේ මෑත ප්‍රතිඵල:
            </AppText>

            {/* Stat 1 */}
            <View style={styles.statLine}>
              <View style={styles.statLabelRow}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  වචන කියවීම
                </AppText>
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  65%
                </AppText>
              </View>
              <View style={styles.statTrack}>
                <View style={[styles.statFill, { width: '65%', backgroundColor: ThemeColors.primary }]} />
              </View>
            </View>

            {/* Stat 2 */}
            <View style={styles.statLine}>
              <View style={styles.statLabelRow}>
                <AppText size="xs" color={ThemeColors.textSecondary}>
                  වාක්‍ය කියවීම
                </AppText>
                <AppText size="xs" weight="bold" color={ThemeColors.accent}>
                  48%
                </AppText>
              </View>
              <View style={styles.statTrack}>
                <View style={[styles.statFill, { width: '48%', backgroundColor: ThemeColors.accent }]} />
              </View>
            </View>

            <AppText size="xs" color={ThemeColors.textSecondary} style={styles.whySummary}>
              ඔබට වාක්‍ය කියවීම තව ටිකක් පුහුණු කිරීම උපකාරී වේ.
            </AppText>
          </View>
        </View>

        {/* ── SECTION 2: ඔබේ මට්ටම (Your Level Stepper) ── */}
        <View style={[styles.levelCard, ThemeShadow.sm]}>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.levelCardTitle}>
            ඔබේ මට්ටම
          </AppText>

          <View style={styles.stepperRow}>
            {levels.map((lvl) => (
              <View key={lvl.num} style={styles.stepItem}>
                <View style={[styles.stepCircle, lvl.active && styles.stepCircleActive]}>
                  {lvl.active ? (
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      ✓
                    </AppText>
                  ) : (
                    <AppText size="xs" color={ThemeColors.textMuted}>
                      {lvl.num}
                    </AppText>
                  )}
                </View>
                <AppText
                  size="xs"
                  weight={lvl.active ? 'bold' : 'regular'}
                  color={lvl.active ? ThemeColors.primary : ThemeColors.textMuted}
                  style={styles.stepLabel}
                >
                  {lvl.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION 3: තවත් ඔබට සුදුසු ක්‍රියාකාරකම් ── */}
        <View style={styles.moreActivitiesWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🌱</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 4 }}>
              තවත් ඔබට සුදුසු ක්‍රියාකාරකම්
            </AppText>
          </View>

          {/* Activity 1 */}
          <TouchableOpacity
            style={[styles.subActCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/quiz-word')}
            activeOpacity={0.8}
          >
            <View style={styles.subActLeft}>
              <View style={styles.subActIconWrap}>
                <AppText size="sm">🔤</AppText>
              </View>
              <View>
                <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                  වචන ගැලපීම
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                  • පහසු • ⏱️ 5min
                </AppText>
              </View>
            </View>

            <View style={styles.recBadgePill}>
              <AppText size="xs" weight="bold" color="#0369A1">
                නිර්දේශිතයි
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Activity 2 */}
          <TouchableOpacity
            style={[styles.subActCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/quiz-letter')}
            activeOpacity={0.8}
          >
            <View style={styles.subActLeft}>
              <View style={styles.subActIconWrap}>
                <AppText size="sm">📖</AppText>
              </View>
              <View>
                <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                  සරල වාක්‍ය කියවීම
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                  • මධ්‍යම • ⏱️ 7min
                </AppText>
              </View>
            </View>
          </TouchableOpacity>

          {/* Activity 3 */}
          <TouchableOpacity
            style={[styles.subActCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/quiz-word')}
            activeOpacity={0.8}
          >
            <View style={styles.subActLeft}>
              <View style={styles.subActIconWrap}>
                <AppText size="sm">🖼️</AppText>
              </View>
              <View>
                <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                  පින්තූරය හා වචනය ගැලපීම
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                  • පහසු • ⏱️ 6min
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      <BottomNav role="child" activeTab="learning" />
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  welcomeNoticeCard: {
    backgroundColor: '#E8F1F8',
    borderRadius: 14,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  welcomeNoticeText: {
    lineHeight: 18,
  },
  mainRecCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  recTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  activityBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: ThemeSpacing.md,
  },
  actTitle: {
    marginBottom: 6,
  },
  actSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: ThemeSpacing.md,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  startNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 46,
  },
  whyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultsLabel: {
    marginBottom: 4,
  },
  statLine: {
    marginBottom: 6,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  statFill: {
    height: 5,
    borderRadius: ThemeRadius.full,
  },
  whySummary: {
    marginTop: 6,
    lineHeight: 16,
  },
  levelCard: {
    backgroundColor: '#E8F1F8',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  levelCardTitle: {
    marginBottom: ThemeSpacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  stepLabel: {
    fontSize: 11,
  },
  moreActivitiesWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  subActCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  subActLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subActIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBadgePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
});
