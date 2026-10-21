import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import LearningRoadmap from '@/components/LearningRoadmap';
import PeerClusterRadar from '@/components/PeerClusterRadar';
import RecommendationSimulator from '@/components/RecommendationSimulator';
import M3RecommendationCard from '@/components/M3RecommendationCard';
import { sessionService } from '@/services/sessionService';
import { recommendationService } from '@/services/recommendationService';
import { useCurrentChild } from '@/store/hooks';
import { useLanguage } from '@/context/LanguageContext';
import type { M3Response } from '@/types';

type TabKey = 'roadmap' | 'xai' | 'peer_cluster' | 'simulator';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { currentChild } = useCurrentChild();
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');
  const [m3Data, setM3Data] = useState<M3Response | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const activeChildName = currentChild?.name || (language === 'si' ? 'ශිෂ්‍යයා' : 'Student');
  const activeChildId = currentChild?.id || '';

  useEffect(() => {
    let isMounted = true;
    async function loadM3() {
      if (!activeChildId) {
        if (isMounted) {
          setM3Data(null);
          setIsLoading(false);
          setFetchError(null);
        }
        return;
      }
      try {
        setIsLoading(true);
        setFetchError(null);
        setM3Data(null);

        const records = await sessionService.getChildSessions(activeChildId, 1);
        if (!isMounted) return;

        const latest = records && records.length > 0 ? records[0] : null;
        const res = await recommendationService.getNextRecommendation(activeChildId, latest);
        if (isMounted) {
          setM3Data(res);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[RecommendationsScreen] Error loading M3 recommendation:', err);
          setFetchError(
            err?.message ||
              (language === 'si'
                ? 'නිර්දේශ දත්ත ලබාගැනීමට නොහැකි විය.'
                : 'Failed to load recommendations.')
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadM3();
    return () => {
      isMounted = false;
    };
  }, [activeChildId, language]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'roadmap', label: language === 'si' ? 'ඉගෙනුම් පියවර' : 'Learning Steps', icon: '🗺️' },
    { key: 'xai', label: language === 'si' ? 'ගුරු මඟපෙන්වීම' : 'Teaching Guide', icon: '💡' },
    { key: 'peer_cluster', label: language === 'si' ? 'සම වයස් සැසඳීම' : 'Peer Comparison', icon: '📊' },
    { key: 'simulator', label: language === 'si' ? 'පුහුණු සැලසුම' : 'Practice Planner', icon: '🎯' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Universal App Bar */}
      <NavBar
        title={language === 'si' ? 'දරුවාගේ ඉගෙනුම් ප්‍රගතිය' : 'Student Learning Progress'}
        subtitle={language === 'si' ? `දරුවාට ගැළපෙන ඉගෙනුම් සැලැස්ම · ${activeChildName}` : `Adaptive Learning Plan · ${activeChildName}`}
        showBack={true}
        fallbackRoute="/(parent)/dashboard"
        showSettings={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hub Introduction Banner */}
        <Card style={styles.introCard}>
          <View style={styles.moduleTag}>
            <View style={[styles.moduleDot, { backgroundColor: ThemeColors.primary }]} />
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              {language === 'si'
                ? 'දරුවාට ගැළපෙන ඉගෙනුම් සැලැස්ම'
                : 'Personalized Adaptive Learning Plan'}
            </AppText>
          </View>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
            {language === 'si'
              ? 'දරුවාගේ කියවීමේ කුසලතා වර්ධනය කිරීමේ පියවර'
              : 'Personalized Reading Development Steps'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 18 }}>
            {language === 'si'
              ? 'දරුවාගේ කියවීමේ වේගය, අකුරු හා පිල්ලම් හඳුනාගැනීම සහ දෝෂ රටා සැලකිල්ලට ගනිමින් ඊළඟට පුහුණු විය යුතු වඩාත්ම උචිත අභ්‍යාස මෙහිදී නිර්දේශ කෙරේ.'
              : 'Analyzes reading speed, letter and diacritic recognition, and error patterns to recommend the optimal next practice activity tailored to the student.'}
          </AppText>
        </Card>

        {/* Notice banner if no active child selected */}
        {!activeChildId && (
          <Card style={styles.noticeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AppText size="lg">ℹ️</AppText>
              <View style={{ flex: 1 }}>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  {language === 'si' ? 'ශිෂ්‍යයෙකු තෝරාගෙන නොමැත' : 'No Student Profile Selected'}
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                  {language === 'si'
                    ? 'සාමාන්‍ය විෂය නිර්දේශ මාර්ග සිතියම පෙන්වයි. දරුවාගේ පුද්ගලික නිර්දේශ සඳහා මුල් පිටුවෙන් දරුවෙකු තෝරන්න හෝ සම්බන්ධ කරන්න.'
                    : 'Showing standard curriculum roadmap. Select a student on the dashboard for tailored insights.'}
                </AppText>
              </View>
            </View>
          </Card>
        )}

        {/* Tab Navigation Controls */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  isActive && styles.tabButtonActive,
                  ThemeShadow.sm,
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <AppText size="sm">{tab.icon}</AppText>
                <AppText
                  size="xs"
                  weight={isActive ? 'extrabold' : 'semibold'}
                  color={isActive ? ThemeColors.accentDark : ThemeColors.textPrimary}
                  style={{ textAlign: 'center', flexShrink: 1 }}
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab 1: Learning Pathway Roadmap ─────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🗺️ {language === 'si' ? 'සිංහල කියවීමේ පියවරෙන් පියවර ඉගෙනුම් සැලැස්ම' : 'Step-by-Step Sinhala Reading Plan'}
            </AppText>
            <LearningRoadmap />
          </View>
        )}

        {/* ── Tab 2: Teaching Guidance ────────────────────────────────────── */}
        {activeTab === 'xai' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              💡 {language === 'si' ? 'නිර්දේශ සහ ගුරු මඟපෙන්වීම' : 'Recommendations & Teaching Guidance'}
            </AppText>
            {m3Data ? (
              <M3RecommendationCard data={m3Data} showLauncher={true} />
            ) : (
              <Card style={styles.stateCard}>
                {isLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: ThemeSpacing.md }}>
                    <ActivityIndicator size="small" color={ThemeColors.primary} />
                    <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
                      {language === 'si' ? 'නිර්දේශ සකස් කරමින් පවතී...' : 'Preparing recommendations...'}
                    </AppText>
                  </View>
                ) : fetchError ? (
                  <View style={{ alignItems: 'center', paddingVertical: ThemeSpacing.md }}>
                    <AppText size="sm" weight="bold" color={ThemeColors.error} style={{ textAlign: 'center' }}>
                      ⚠️ {fetchError}
                    </AppText>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: ThemeSpacing.md, gap: 8 }}>
                    <AppText size="lg">📊</AppText>
                    <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ textAlign: 'center' }}>
                      {language === 'si' ? 'දත්ත ප්‍රමාණවත් නොවේ' : 'Insufficient Session Data'}
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', lineHeight: 18 }}>
                      {language === 'si'
                        ? 'දරුවාට අදාළ අනුවර්තී නිර්දේශ ලබාගැනීම සඳහා කියවීමේ සැසියක් සම්පූර්ණ කරන්න.'
                        : 'Complete at least one reading session to generate personalized recommendations.'}
                    </AppText>
                  </View>
                )}
              </Card>
            )}
          </View>
        )}

        {/* ── Tab 3: Peer Cohort Comparison ───────────────────────────────── */}
        {activeTab === 'peer_cluster' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              📊 {language === 'si' ? 'සම වයස් ළමුන්ගේ දක්ෂතා සැසඳීම (2 ශ්‍රේණිය)' : 'Grade 2 Peer Reading Comparison'}
            </AppText>
            <PeerClusterRadar childName={activeChildName} />
          </View>
        )}

        {/* ── Tab 4: Teaching Practice Planner ────────────────────────────── */}
        {activeTab === 'simulator' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🎯 {language === 'si' ? 'අන්තර්ක්‍රියාකාරී ඉගැන්වීම් සැලසුම්කාරකය' : 'Interactive Teaching Practice Planner'}
            </AppText>
            <RecommendationSimulator />
          </View>
        )}

        <View style={{ height: ThemeSpacing.xxxl }} />
      </ScrollView>

      {/* Universal Bottom Navigation */}
      <BottomNav role="parent" activeTab="recommendations" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  introCard: {
    backgroundColor: ThemeColors.card,
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 4,
  },
  noticeCard: {
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  stateCard: {
    backgroundColor: ThemeColors.card,
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.xs,
    justifyContent: 'space-between',
  },
  tabButton: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 2,
  },
  tabButtonActive: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentBorder,
  },
  tabContent: {
    gap: ThemeSpacing.sm,
  },
  sectionHeading: {
    marginBottom: 4,
  },
});
