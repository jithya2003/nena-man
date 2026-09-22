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
import BottomNav from '@/components/BottomNav';
import { WelcomeStudentIllustration } from '@/components/Illustrations';

type ActivityFilter = 'all' | 'letters' | 'sounds' | 'words';

export default function LearningActivitiesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');

  const activities = [
    {
      id: 'letter-recognition',
      title: 'අකුරු හඳුනාගැනීම',
      category: 'අකුරු',
      level: 'පහසු',
      icon: '🔤',
      iconBg: '#DBEAFE',
      barColor: '#3B82F6',
      progress: 80,
      cardBg: '#FFFFFF',
      badge: '⭐ නිර්දේශිතයි',
      badgePos: 'right',
      route: '/(child)/quiz-letter',
    },
    {
      id: 'sound-recognition',
      title: 'ශබ්දය හඳුනාගැනීම',
      category: 'ශබ්ද',
      level: 'පහසු',
      icon: '👂',
      iconBg: '#FFEDD5',
      barColor: '#F97316',
      progress: 65,
      cardBg: '#FFF7ED',
      badge: null,
      route: '/(child)/quiz-letter',
    },
    {
      id: 'word-matching',
      title: 'වචන ගළපමු',
      category: 'වචන',
      level: 'මධ්‍යම',
      icon: '🧩',
      iconBg: '#DCFCE7',
      barColor: '#10B981',
      progress: 45,
      cardBg: '#F0FDF4',
      badge: null,
      route: '/(child)/quiz-word',
    },
    {
      id: 'sentence-reading',
      title: 'සරල වාක්‍ය කියවීම',
      category: 'කියවීම',
      level: 'පහසු',
      icon: '📖',
      iconBg: '#F3E8FF',
      barColor: '#9333EA',
      progress: 30,
      cardBg: '#FAF5FF',
      badge: '⭐ නිර්දේශිතයි',
      badgePos: 'left',
      route: '/(child)/reading-comprehension',
    },
    {
      id: 'speech-session',
      title: 'AI කථන සහ උච්චාරණ පුහුණුව',
      category: 'AI කථන සහායක',
      level: 'මධ්‍යම',
      icon: '🎙️',
      iconBg: '#DCFCE7',
      barColor: '#0B7A44',
      progress: 55,
      cardBg: '#F0FDF4',
      badge: '🧠 ක්ෂණික විශ්ලේෂණය',
      badgePos: 'right',
      route: '/(child)/m1-session',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/(child)/home')}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.primary}
            />
          </Svg>
        </TouchableOpacity>

        <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
          ඉගෙනුම් ක්‍රියාකාරකම්
        </AppText>

        {/* Circular Fire Streak Meter */}
        <View style={styles.fireRingBadge}>
          <AppText size="xs">🔥</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── FILTER PILLS ── */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <AppText
              size="xs"
              weight={activeFilter === 'all' ? 'bold' : 'regular'}
              color={activeFilter === 'all' ? '#FFFFFF' : ThemeColors.textPrimary}
            >
              සියල්ල
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              styles.filterPillBlue,
              activeFilter === 'letters' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('letters')}
            activeOpacity={0.8}
          >
            <AppText
              size="xs"
              weight={activeFilter === 'letters' ? 'bold' : 'regular'}
              color={activeFilter === 'letters' ? '#FFFFFF' : ThemeColors.textPrimary}
            >
              අකුරු
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              styles.filterPillOrange,
              activeFilter === 'sounds' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('sounds')}
            activeOpacity={0.8}
          >
            <AppText
              size="xs"
              weight={activeFilter === 'sounds' ? 'bold' : 'regular'}
              color={activeFilter === 'sounds' ? '#FFFFFF' : ThemeColors.textPrimary}
            >
              ශබ්ද
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              styles.filterPillYellow,
              activeFilter === 'words' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('words')}
            activeOpacity={0.8}
          >
            <AppText
              size="xs"
              weight={activeFilter === 'words' ? 'bold' : 'regular'}
              color={activeFilter === 'words' ? '#FFFFFF' : ThemeColors.textPrimary}
            >
              වචන
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: ✨ අද ඔබට (Today for You) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">✨</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              අද ඔබට
            </AppText>
          </View>

          <View style={[styles.heroCard, ThemeShadow.sm]}>
            {/* Student Illustration */}
            <View style={styles.heroIllustrationWrap}>
              <WelcomeStudentIllustration size={130} />
            </View>

            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} align="center" style={styles.heroTitle}>
              සරල වාක්‍ය කියවීම
            </AppText>

            {/* Badges: Time, Difficulty, Stars */}
            <View style={styles.heroSpecsRow}>
              <View style={styles.specPill}>
                <AppText size="xs">⏱️</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 3 }}>
                  මිනිත්තු 5
                </AppText>
              </View>

              <View style={[styles.specPill, { backgroundColor: '#DCFCE7' }]}>
                <AppText size="xs" color="#15803D" weight="bold">
                  🟢 පහසු
                </AppText>
              </View>

              <View style={[styles.specPill, { backgroundColor: '#F59E0B' }]}>
                <AppText size="xs">⭐</AppText>
                <AppText size="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 3 }}>
                  10
                </AppText>
              </View>
            </View>

            {/* Green Action CTA */}
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => router.push('/(child)/reading-comprehension')}
              activeOpacity={0.85}
            >
              <AppText size="md" weight="bold" color="#FFFFFF">
                ආරම්භ කරන්න
              </AppText>
              <View style={styles.heroPlayIcon}>
                <AppText size="xs" color="#FFFFFF">
                  ▷
                </AppText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 2: ක්‍රියාකාරීත්ව ගමන (Activity Journey) ── */}
        <View style={styles.sectionWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} align="center" style={styles.journeyHeaderTitle}>
            ක්‍රියාකාරීත්ව ගමන
          </AppText>

          <View style={styles.activitiesListWrap}>
            {activities.map((act) => (
              <TouchableOpacity
                key={act.id}
                style={[
                  styles.activityJourneyCard,
                  { backgroundColor: act.cardBg },
                  ThemeShadow.sm,
                ]}
                onPress={() => router.push(act.route as any)}
                activeOpacity={0.8}
              >
                {/* Floating Tag if present */}
                {act.badge && (
                  <View
                    style={[
                      styles.floatingBadgeTag,
                      act.badgePos === 'right' ? { right: 12 } : { left: 12 },
                    ]}
                  >
                    <AppText size="xs" weight="extrabold" color="#FFFFFF">
                      {act.badge}
                    </AppText>
                  </View>
                )}

                {/* Big Circle Icon */}
                <View style={[styles.actCircleIcon, { backgroundColor: act.iconBg }]}>
                  <AppText size="xl">{act.icon}</AppText>
                </View>

                {/* Subtitle / Category */}
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 6 }}>
                  {act.category} • {act.level}
                </AppText>

                {/* Title */}
                <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 4 }}>
                  {act.title}
                </AppText>

                {/* Progress Bar with circle thumb */}
                <View style={styles.progressBarTrackWrap}>
                  <View style={[styles.progressBarFillLine, { width: `${act.progress}%`, backgroundColor: act.barColor }]} />
                  <View style={[styles.progressThumbCircle, { left: `${act.progress - 3}%`, borderColor: act.barColor }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Encouraging Footer Card */}
        <View style={[styles.encouragingFooterCard, ThemeShadow.sm]}>
          <AppText size="md">⭐</AppText>
          <AppText size="xs" color={ThemeColors.textPrimary} align="center" style={{ marginTop: 4, lineHeight: 18 }}>
            ටිකෙන් ටික ඉගෙන ගමු.{'\n'}ඔබේ ගමන අප සමඟින්! 🌱
          </AppText>
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 5-Tab Sinhala Bottom Navigation with Learning Active */}
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
  fireRingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: ThemeSpacing.xs,
  },
  filterPill: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  filterPillBlue: {
    backgroundColor: '#E0F2FE',
  },
  filterPillOrange: {
    backgroundColor: '#FFEDD5',
  },
  filterPillYellow: {
    backgroundColor: '#FEF3C7',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  heroIllustrationWrap: {
    width: 140,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 4,
    marginBottom: 6,
  },
  heroSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: ThemeSpacing.md,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#065F46',
    borderRadius: ThemeRadius.md,
    width: '100%',
    height: 46,
    gap: 8,
  },
  heroPlayIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyHeaderTitle: {
    marginVertical: ThemeSpacing.xs,
  },
  activitiesListWrap: {
    gap: ThemeSpacing.md,
  },
  activityJourneyCard: {
    borderRadius: 20,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    position: 'relative',
  },
  floatingBadgeTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  actCircleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  progressBarTrackWrap: {
    width: '80%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    position: 'relative',
    marginVertical: 6,
  },
  progressBarFillLine: {
    height: 6,
    borderRadius: ThemeRadius.full,
  },
  progressThumbCircle: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  encouragingFooterCard: {
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7EBD2',
    marginTop: ThemeSpacing.xs,
  },
});
