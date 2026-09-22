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
import AppText from '@/components/AppText';
import { StudentAvatarPhoto } from '@/components/Illustrations';

export default function ParentMobileDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuIconBtn} activeOpacity={0.7}>
          <AppText size="lg">☰</AppText>
        </TouchableOpacity>

        <View style={styles.greetingRow}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            ආයුබෝවන්!
          </AppText>
          <AppText size="md" style={{ marginLeft: 4 }}>
            👏
          </AppText>
        </View>

        <View style={styles.parentAvatarWrap}>
          <AppText size="sm">👩‍🏫</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Student Profile Card */}
        <View style={[styles.studentCard, ThemeShadow.sm]}>
          <StudentAvatarPhoto size={48} showEditBadge={false} />
          <View style={{ marginLeft: 12 }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
              සෙනුලි පෙරේරා
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
              5 ශ්‍රේණිය
            </AppText>
          </View>
        </View>

        {/* 78% Overall Progress Ring Card */}
        <View style={[styles.progressRingCard, ThemeShadow.sm]}>
          <View style={styles.ringWrap}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray="196, 251.3"
                strokeDashoffset="62.8"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <View style={styles.ringCenterText}>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                78%
              </AppText>
            </View>
          </View>

          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginTop: 6 }}>
            සමස්ත ප්‍රගතිය
          </AppText>
        </View>

        {/* 3 Metric Cards */}
        <View style={styles.metricRow}>
          <View style={[styles.metricBox, ThemeShadow.sm]}>
            <AppText size="sm">📖</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
              38
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              ක්‍රියාකාරකම්
            </AppText>
          </View>

          <View style={[styles.metricBox, ThemeShadow.sm]}>
            <AppText size="sm">🔥</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
              දින 5
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              ඉගෙනුම් දින
            </AppText>
          </View>

          <View style={[styles.metricBox, ThemeShadow.sm]}>
            <AppText size="sm">⭐</AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
              72%
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              සාමාන්‍ය ලකුණු
            </AppText>
          </View>
        </View>

        {/* ── SECTION: ඉගෙනුම් ප්‍රගතිය ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">📚</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              ඉගෙනුම් ප්‍රගතිය
            </AppText>
          </View>

          <View style={[styles.card, ThemeShadow.sm]}>
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
        </View>

        {/* ── SECTION: හැසිරීම් සහ විවේකය ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🌿</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              හැසිරීම් සහ විවේකය
            </AppText>
          </View>

          <View style={styles.behaviorRow}>
            <View style={[styles.behaviorBox, ThemeShadow.sm]}>
              <AppText size="sm">🧘</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
                3
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.behaviorLabel}>
                සන්සුන් වීමේ වාර
              </AppText>
            </View>

            <View style={[styles.behaviorBox, ThemeShadow.sm]}>
              <AppText size="sm">🎮</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
                8
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.behaviorLabel}>
                ක්‍රීඩා කළ ගණන
              </AppText>
            </View>

            <View style={[styles.behaviorBox, ThemeShadow.sm]}>
              <AppText size="sm">⏱️</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
                18m
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.behaviorLabel}>
                සාමාන්‍ය කාලය
              </AppText>
            </View>
          </View>
        </View>

        {/* ── SECTION: නැණ මං නිර්දේශය ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🎯</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              නැණ මං නිර්දේශය
            </AppText>
          </View>

          <View style={[styles.recSpeechBubble, ThemeShadow.sm]}>
            <AppText size="md">💬</AppText>
            <AppText size="xs" color={ThemeColors.textPrimary} style={styles.recSpeechText}>
              සෙනුලිට වාක්‍ය කියවීමේ ක්‍රියාකාරකම් තවදුරටත් පුහුණු කිරීම සුදුසුයි.
            </AppText>
          </View>
        </View>

        {/* View Full Progress Button */}
        <TouchableOpacity
          style={styles.fullProgressBtn}
          onPress={() => router.push('/(parent)/student-details')}
          activeOpacity={0.85}
        >
          <AppText size="md" weight="bold" color="#FFFFFF">
            සම්පූර්ණ ප්‍රගතිය බලන්න
          </AppText>
          <AppText size="md" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
            →
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 3-Tab Bottom Nav for Parent */}
      <View style={[styles.bottomBarWrap, ThemeShadow.md]}>
        <TouchableOpacity style={styles.parentBottomBtnActive} activeOpacity={0.8}>
          <AppText size="sm">🏠</AppText>
          <AppText size="xs" weight="bold" color="#FFFFFF">
            මුල් පිටුව
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.parentBottomBtn}
          onPress={() => router.push('/(parent)/student-details')}
          activeOpacity={0.8}
        >
          <AppText size="sm">📈</AppText>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            ප්‍රගතිය
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.parentBottomBtn}
          onPress={() => router.push('/(settings)/settings')}
          activeOpacity={0.8}
        >
          <AppText size="sm">⚙️</AppText>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            සැකසුම්
          </AppText>
        </TouchableOpacity>
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
  menuIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  progressRingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  ringWrap: {
    width: 100,
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
  },
  metricRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  behaviorRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
  },
  behaviorBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  behaviorLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  recSpeechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#C7EBD2',
    borderLeftWidth: 4,
    borderLeftColor: ThemeColors.primary,
  },
  recSpeechText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  fullProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
    marginTop: ThemeSpacing.xs,
  },
  bottomBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: ThemeSpacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  parentBottomBtnActive: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  parentBottomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
