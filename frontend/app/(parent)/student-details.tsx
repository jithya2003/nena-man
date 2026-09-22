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
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import NenaManLogo from '@/components/NenaManLogo';
import { StudentAvatarPhoto } from '@/components/Illustrations';

export default function TeacherStudentDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layoutWrapper}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoWrap}>
            <NenaManLogo size="sm" showText={true} />
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(parent)/dashboard')}
              activeOpacity={0.8}
            >
              <AppText size="xs">🎛️</AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8 }}>
                Dashboard
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemActive]}
              activeOpacity={0.8}
            >
              <AppText size="xs">👥</AppText>
              <AppText size="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 8 }}>
                Students
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(parent)/reports')}
              activeOpacity={0.8}
            >
              <AppText size="xs">📊</AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8 }}>
                Reports
              </AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sidebarSettingsBtn}
            onPress={() => router.push('/(settings)/settings')}
            activeOpacity={0.8}
          >
            <AppText size="xs">⚙️</AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 6 }}>
              Settings
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainScroll}
        >
          {/* Top Banner Card for Student */}
          <View style={[styles.studentBannerCard, ThemeShadow.sm]}>
            <View style={styles.studentBannerLeft}>
              <StudentAvatarPhoto size={60} showEditBadge={false} />
              <View style={{ marginLeft: 16 }}>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                  සෙනුලි පෙරේරා
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                  Grade 5
                </AppText>
                <View style={styles.statusPillWrap}>
                  <AppText size="xs" weight="bold" color="#16A34A">
                    • හොඳ ප්‍රගතියක්
                  </AppText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewReportBtn}
              onPress={() => router.push('/(parent)/reports')}
              activeOpacity={0.85}
            >
              <AppText size="xs" weight="bold" color="#FFFFFF">
                වාර්තාව බලන්න
              </AppText>
            </TouchableOpacity>
          </View>

          {/* 4 Metric Summary Cards */}
          <View style={styles.metricsGrid}>
            {/* Metric 1: Overall Progress Donut */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <AppText size="xs" color={ThemeColors.textSecondary} align="center">
                Overall Progress
              </AppText>
              <View style={styles.donutWrap}>
                <Svg width={60} height={60} viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                  <Circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={ThemeColors.accent}
                    strokeWidth="10"
                    strokeDasharray="196, 251.3"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>
                <View style={styles.donutText}>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                    78%
                  </AppText>
                </View>
              </View>
            </View>

            {/* Metric 2: Activities Completed */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <AppText size="sm" color="#10B981">
                  ✓
                </AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
                Activities Completed
              </AppText>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                38
              </AppText>
            </View>

            {/* Metric 3: Learning Streak */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <AppText size="sm">🔥</AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
                Learning Streak
              </AppText>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                5 <AppText size="xs" color={ThemeColors.textSecondary}>days</AppText>
              </AppText>
            </View>

            {/* Metric 4: Average Score */}
            <View style={[styles.metricCard, ThemeShadow.sm]}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <AppText size="sm">⭐</AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
                Average Score
              </AppText>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                72%
              </AppText>
            </View>
          </View>

          {/* 2-Column Section (Left Skills & Adaptive, Right Behavior & Rest) */}
          <View style={styles.twoColGrid}>
            {/* Left Column */}
            <View style={styles.leftCol}>
              {/* කුසලතා මට්ටම (Skills Progress) */}
              <View style={[styles.card, ThemeShadow.sm]}>
                <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginBottom: ThemeSpacing.md }}>
                  කුසලතා මට්ටම
                </AppText>

                {/* Skill 1 */}
                <View style={styles.skillItem}>
                  <View style={styles.skillLabelRow}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                      අකුරු හඳුනාගැනීම
                    </AppText>
                    <AppText size="xs" weight="extrabold" color={ThemeColors.accent}>
                      90%
                    </AppText>
                  </View>
                  <View style={styles.skillTrack}>
                    <View style={[styles.skillFill, { width: '90%' }]} />
                  </View>
                </View>

                {/* Skill 2 */}
                <View style={styles.skillItem}>
                  <View style={styles.skillLabelRow}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                      ශබ්ද හඳුනාගැනීම
                    </AppText>
                    <AppText size="xs" weight="extrabold" color={ThemeColors.accent}>
                      82%
                    </AppText>
                  </View>
                  <View style={styles.skillTrack}>
                    <View style={[styles.skillFill, { width: '82%' }]} />
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
                    <View style={[styles.skillFill, { width: '65%' }]} />
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
                    <View style={[styles.skillFill, { width: '48%' }]} />
                  </View>
                </View>
              </View>

              {/* Adaptive Insights Card */}
              <View style={[styles.adaptiveCard, ThemeShadow.sm]}>
                <View style={styles.adaptiveHeader}>
                  <AppText size="md">🤖</AppText>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                    Adaptive Insights
                  </AppText>
                </View>

                <View style={styles.insightPromptBox}>
                  <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                    වාක්‍ය කියවීමේ කුසලතාව තවදුරටත් පුහුණු කිරීම නිර්දේශ කර ඇත.
                  </AppText>
                </View>

                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginVertical: 6 }}>
                  Recommended Activities:
                </AppText>

                <View style={styles.recPillsRow}>
                  <View style={styles.recPillItem}>
                    <AppText size="xs" color={ThemeColors.primary}>
                      • සරල වාක්‍ය කියවීම
                    </AppText>
                  </View>
                  <View style={styles.recPillItem}>
                    <AppText size="xs" color={ThemeColors.primary}>
                      • වචන ගැලපීම
                    </AppText>
                  </View>
                  <View style={styles.recPillItem}>
                    <AppText size="xs" color={ThemeColors.primary}>
                      • පින්තූරය හා වචනය ගැලපීම
                    </AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column: හැසිරීම් සහ විවේක */}
            <View style={styles.rightCol}>
              <View style={[styles.card, ThemeShadow.sm]}>
                <View style={styles.behaviorHeaderRow}>
                  <AppText size="sm">🌿</AppText>
                  <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                    හැසිරීම් සහ විවේක
                  </AppText>
                </View>

                {/* Stat 1 */}
                <View style={styles.behaviorStatCard}>
                  <View style={[styles.behaviorIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <AppText size="xs">🧘</AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppText size="xs" color={ThemeColors.textSecondary}>
                      Cool-down sessions
                    </AppText>
                  </View>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                    3
                  </AppText>
                </View>

                {/* Stat 2 */}
                <View style={styles.behaviorStatCard}>
                  <View style={[styles.behaviorIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <AppText size="xs">🎮</AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppText size="xs" color={ThemeColors.textSecondary}>
                      Games completed
                    </AppText>
                  </View>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                    8
                  </AppText>
                </View>

                {/* Stat 3 */}
                <View style={[styles.behaviorStatCard, { marginBottom: 0 }]}>
                  <View style={[styles.behaviorIconWrap, { backgroundColor: '#EBF5FA' }]}>
                    <AppText size="xs">⏱️</AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppText size="xs" color={ThemeColors.textSecondary}>
                      Avg session duration
                    </AppText>
                  </View>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                    18m
                  </AppText>
                </View>
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
  studentBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    flexWrap: 'wrap',
    gap: 12,
  },
  studentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPillWrap: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewReportBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  donutWrap: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  donutText: {
    position: 'absolute',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: ThemeSpacing.md,
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: 2,
    minWidth: 300,
    gap: ThemeSpacing.md,
  },
  rightCol: {
    flex: 1,
    minWidth: 220,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    overflow: 'hidden',
  },
  skillFill: {
    height: 7,
    backgroundColor: ThemeColors.accent,
    borderRadius: ThemeRadius.full,
  },
  adaptiveCard: {
    backgroundColor: '#EBF5FA',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  adaptiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  insightPromptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: ThemeSpacing.sm + 2,
    marginVertical: 4,
  },
  recPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recPillItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  behaviorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  behaviorStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  behaviorIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
