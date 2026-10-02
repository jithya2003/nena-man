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
import { EmptyView } from '@/components/shared-states';

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
      cardBg: '#FFFDF7',
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
      barColor: '#8B5CF6',
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
      barColor: '#059669',
      progress: 55,
      cardBg: '#ECFDF5',
      badge: '🧠 ක්ෂණික විශ්ලේෂණය',
      badgePos: 'right',
      route: '/(child)/m1-session',
    },
  ];

  const filteredActivities = activities.filter((act) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'letters') return act.category === 'අකුරු';
    if (activeFilter === 'sounds') return act.category === 'ශබ්ද';
    if (activeFilter === 'words') return act.category === 'වචන';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER ── */}
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
            ඉගෙනුම් ක්‍රියාකාරකම්
          </AppText>
          <AppText size="md" style={{ marginLeft: 6 }}>
            📚
          </AppText>
        </View>

        {/* Circular Fire Streak Meter */}
        <View style={styles.fireRingBadge}>
          <AppText size="xs">🔥</AppText>
          <AppText size="xs" weight="extrabold" color="#92400E" style={{ marginLeft: 3 }}>
            5
          </AppText>
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
              weight="extrabold"
              color={activeFilter === 'all' ? '#FFFFFF' : '#475569'}
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
              weight="extrabold"
              color={activeFilter === 'letters' ? '#FFFFFF' : '#0369A1'}
            >
              🔤 අකුරු
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
              weight="extrabold"
              color={activeFilter === 'sounds' ? '#FFFFFF' : '#C2410C'}
            >
              👂 ශබ්ද
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
              weight="extrabold"
              color={activeFilter === 'words' ? '#FFFFFF' : '#B45309'}
            >
              📖 වචන
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: ✨ අද ඔබට (Today for You) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">✨</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              අද ඔබට විශේෂයි
            </AppText>
          </View>

          <View style={styles.heroCard}>
            {/* Student Illustration */}
            <View style={styles.heroIllustrationWrap}>
              <WelcomeStudentIllustration size={130} />
            </View>

            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} align="center" style={styles.heroTitle}>
              සරල වාක්‍ය කියවීම
            </AppText>

            {/* Badges: Time, Difficulty, Stars */}
            <View style={styles.heroSpecsRow}>
              <View style={styles.specPill}>
                <AppText size="xs">⏱️</AppText>
                <AppText size="xs" color="#334155" weight="bold" style={{ marginLeft: 4 }}>
                  මිනිත්තු 5
                </AppText>
              </View>

              <View style={[styles.specPill, { backgroundColor: '#DCFCE7' }]}>
                <AppText size="xs" color="#15803D" weight="extrabold">
                  🟢 පහසු
                </AppText>
              </View>

              <View style={[styles.specPill, { backgroundColor: '#FEF3C7' }]}>
                <AppText size="xs">⭐</AppText>
                <AppText size="xs" weight="extrabold" color="#92400E" style={{ marginLeft: 4 }}>
                  +10 ලකුණු
                </AppText>
              </View>
            </View>

            {/* Tactile 3D Action CTA */}
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => router.push('/(child)/reading-comprehension')}
              activeOpacity={0.8}
            >
              <AppText size="md" weight="extrabold" color="#FFFFFF">
                ආරම්භ කරන්න
              </AppText>
              <AppText size="md" color="#FFFFFF" style={{ marginLeft: 6 }}>
                🚀
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 2: 🗺️ ඉගෙනුම් මාවත (Learning Journey) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🗺️</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              ක්‍රියාකාරකම් පෙළගැස්ම
            </AppText>
          </View>

          <View style={styles.activitiesListWrap}>
            {filteredActivities.length === 0 ? (
              <EmptyView
                compact
                title="ක්‍රියාකාරකම් හමු නොවීය"
                message="මෙම වර්ගය යටතේ ක්‍රියාකාරකම් තවම නැත."
                actionLabel="සියල්ල බලන්න"
                onAction={() => setActiveFilter('all')}
              />
            ) : filteredActivities.map((act) => (
              <TouchableOpacity
                key={act.id}
                style={[
                  styles.activityJourneyCard,
                  { backgroundColor: act.cardBg },
                ]}
                onPress={() => router.push(act.route as any)}
                activeOpacity={0.85}
              >
                {act.badge && (
                  <View style={[styles.floatingBadgeTag, act.badgePos === 'right' ? { right: 14 } : { left: 14 }]}>
                    <AppText size="xs" weight="extrabold" color="#FFFFFF">
                      {act.badge}
                    </AppText>
                  </View>
                )}

                <View style={styles.activityContentRow}>
                  <View style={[styles.actCircleIcon, { backgroundColor: act.iconBg }]}>
                    <AppText size="xl">{act.icon}</AppText>
                  </View>

                  <View style={styles.activityTextWrap}>
                    <View style={styles.activityMetaRow}>
                      <View style={styles.categoryPill}>
                        <AppText size="xs" color="#64748B" weight="bold">
                          {act.category}
                        </AppText>
                      </View>
                      <AppText size="xs" weight="extrabold" color={act.barColor}>
                        {act.progress}%
                      </AppText>
                    </View>

                    <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 4 }}>
                      {act.title}
                    </AppText>

                    {/* Candy Progress Bar Track */}
                    <View style={styles.progressBarTrackWrap}>
                      <View
                        style={[
                          styles.progressBarFillLine,
                          { width: `${act.progress}%`, backgroundColor: act.barColor },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.arrowCircleBtn}>
                    <AppText size="sm" weight="bold" color={ThemeColors.primary}>
                      →
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Encouraging Footer Card ── */}
        <View style={styles.encouragingFooterCard}>
          <AppText size="lg">🌟</AppText>
          <AppText size="sm" weight="extrabold" color={ThemeColors.primary} align="center" style={{ marginTop: 4 }}>
            නියමයි! දිනපතා පුහුණුවෙන් ඔබ තවත් දක්ෂ වෙනවා!
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 2 }}>
            සෙමින්, සන්සුන්ව කියවමු. ඔබට මෙය පහසුවෙන්ම කරන්න පුළුවන්!
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
    backgroundColor: '#F7FAF8',
    ...(Platform.OS === 'web'
      ? { minHeight: '100vh' as any, height: '100vh' as any }
      : {}),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2ECE6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
  fireRingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: ThemeSpacing.xs,
  },
  filterPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.full,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
    borderBottomColor: '#064E2A',
  },
  filterPillBlue: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderBottomColor: '#7DD3FC',
  },
  filterPillOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderBottomColor: '#FDBA74',
  },
  filterPillYellow: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderBottomColor: '#FDE047',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    ...ThemeShadow.sm,
  },
  heroIllustrationWrap: {
    width: 140,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  heroSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: ThemeSpacing.md,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.full,
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryDark,
    borderBottomWidth: 4,
    borderBottomColor: '#064E2A',
  },
  activitiesListWrap: {
    gap: ThemeSpacing.sm + 2,
  },
  activityJourneyCard: {
    borderRadius: 22,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#D1E0D7',
    position: 'relative',
    ...ThemeShadow.sm,
  },
  floatingBadgeTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#D97706',
    zIndex: 10,
  },
  activityContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actCircleIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextWrap: {
    flex: 1,
  },
  activityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  progressBarTrackWrap: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFillLine: {
    height: 8,
    borderRadius: ThemeRadius.full,
  },
  arrowCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF7EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  encouragingFooterCard: {
    backgroundColor: '#EAF7EE',
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderBottomWidth: 4,
    borderBottomColor: '#6EE7B7',
    marginTop: ThemeSpacing.xs,
  },
});
