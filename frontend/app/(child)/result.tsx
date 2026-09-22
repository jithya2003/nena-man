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
import Svg, { Circle } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import NenaManLogo from '@/components/NenaManLogo';

export default function ActivityResultScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <NenaManLogo size="sm" showText={true} />

        <TouchableOpacity
          onPress={() => router.push('/(child)/home')}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <AppText size="lg" weight="bold" color={ThemeColors.textSecondary}>
            ✕
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Celebration Header */}
        <View style={styles.celebrationWrap}>
          <View style={styles.titleRow}>
            <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center">
              ක්‍රියාකාරකම අවසන්!
            </AppText>
            <AppText size="xl" style={{ marginLeft: 6 }}>
              🎉
            </AppText>
          </View>

          <View style={styles.subtitleRow}>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              හොඳ උත්සාහයක්, සෙනුලි!
            </AppText>
            <AppText size="xs" style={{ marginLeft: 4 }}>
              🌟
            </AppText>
          </View>
        </View>

        {/* ── CARD 1: Score Donut & Stats Box ── */}
        <View style={[styles.scoreCard, ThemeShadow.sm]}>
          {/* Donut Chart */}
          <View style={styles.donutWrap}>
            <Svg width={140} height={140} viewBox="0 0 100 100">
              {/* Background Track */}
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="9"
                fill="none"
              />
              {/* Green Progress Arc (70%) */}
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10B981"
                strokeWidth="9"
                strokeDasharray="175.9, 251.3"
                strokeDashoffset="62.8"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View style={styles.donutCenterText}>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                70%
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                7 / 10
              </AppText>
            </View>
          </View>

          {/* Stats Summary Container */}
          <View style={styles.statsSummaryBox}>
            <View style={styles.statLine}>
              <View style={styles.statIconBadge}>
                <AppText size="xs" weight="bold" color="#10B981">
                  ✓
                </AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                නිවැරදි පිළිතුරු:
              </AppText>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                7
              </AppText>
            </View>

            <View style={styles.statLine}>
              <View style={styles.statIconBadge}>
                <AppText size="xs" color="#64748B">
                  ◯
                </AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                උත්සාහ කළ ප්‍රශ්න:
              </AppText>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                10
              </AppText>
            </View>

            <View style={[styles.statLine, { marginBottom: 0 }]}>
              <View style={styles.statIconBadge}>
                <AppText size="xs">⏱️</AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                කාලය:
              </AppText>
              <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                මිනිත්තු 4
              </AppText>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: කුසලතා ප්‍රගතිය (Skills Progress) ── */}
        <View style={styles.sectionWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={styles.sectionHeaderTitle}>
            කුසලතා ප්‍රගතිය
          </AppText>

          <View style={[styles.skillsCard, ThemeShadow.sm]}>
            {/* Skill 1 */}
            <View style={styles.skillItem}>
              <View style={styles.skillLabelRow}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  අකුරු හඳුනාගැනීම
                </AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.accent}>
                  85%
                </AppText>
              </View>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: '85%' }]}>
                  <View style={styles.starWrap}>
                    <AppText size="xs">⭐</AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* Skill 2 */}
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
                <View style={[styles.skillFill, { width: '65%' }]}>
                  <View style={styles.starWrap}>
                    <AppText size="xs">⭐</AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* Skill 3 */}
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
                <View style={[styles.skillFill, { width: '48%' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION 3: ඔබේ ඊළඟ පියවර (Next Step AI Advice) ── */}
        <View style={[styles.aiNextStepCard, ThemeShadow.sm]}>
          <View style={styles.aiHeaderRow}>
            <AppText size="lg">🤖</AppText>
            <View style={{ marginLeft: 8 }}>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
                ඔබේ ඊළඟ පියවර
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                වාක්‍ය කියවීම තව ටිකක් පුහුණු කරමු.
              </AppText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          {/* Primary View Recommendations */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => router.push('/(child)/adaptive')}
            activeOpacity={0.85}
          >
            <AppText size="md" weight="bold" color="#FFFFFF">
              මගේ නිර්දේශ බලන්න
            </AppText>
            <AppText size="md" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
              →
            </AppText>
          </TouchableOpacity>

          {/* Secondary Try Again */}
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => router.push('/(child)/reading-comprehension')}
            activeOpacity={0.8}
          >
            <AppText size="sm" weight="bold" color={ThemeColors.primary}>
              🔄 නැවත උත්සාහ කරන්න
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
  closeBtn: {
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
  celebrationWrap: {
    alignItems: 'center',
    marginVertical: ThemeSpacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  donutWrap: {
    width: 140,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ThemeSpacing.xs,
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSummaryBox: {
    width: '100%',
    backgroundColor: '#EBF5FA',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.md,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.xs + 2,
  },
  statIconBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderTitle: {
    marginBottom: 2,
  },
  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
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
    overflow: 'visible',
    position: 'relative',
  },
  skillFill: {
    height: 7,
    backgroundColor: ThemeColors.accent,
    borderRadius: ThemeRadius.full,
    position: 'relative',
  },
  starWrap: {
    position: 'absolute',
    right: -8,
    top: -6,
  },
  aiNextStepCard: {
    backgroundColor: '#EBF5FA',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsWrap: {
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.xs,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    height: 48,
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
  },
});
