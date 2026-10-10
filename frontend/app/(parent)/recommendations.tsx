import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import {
  MOCK_M3_RESPONSE,
} from '@/mock/data';
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
import { useCurrentChild, useAuthStore } from '@/store/hooks';
import { useLanguage } from '@/context/LanguageContext';
import type { M3Response } from '@/types';

type TabKey = 'roadmap' | 'xai' | 'peer_cluster' | 'simulator';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { currentChild } = useCurrentChild();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');
  const [m3Data, setM3Data] = useState<M3Response>(MOCK_M3_RESPONSE);

  const activeChildName = currentChild?.name || user?.name || (language === 'si' ? 'සෙනුලි පෙරේරා' : 'Senuli Perera');
  const activeChildId = currentChild?.id || user?.uid || 'child_default';

  useEffect(() => {
    async function loadM3() {
      try {
        const records = await sessionService.getChildSessions(activeChildId, 1);
        const latest = records && records.length > 0 ? records[0] : null;
        const res = await recommendationService.getNextRecommendation(activeChildId, latest);
        setM3Data(res);
      } catch (err) {
        console.warn('[RecommendationsScreen] Error loading M3 recommendation:', err);
      }
    }
    loadM3();
  }, [activeChildId]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'roadmap', label: language === 'si' ? 'ඉගෙනුම් මාවත' : 'Roadmap', icon: '🗺️' },
    { key: 'xai', label: language === 'si' ? 'AI මගපෙන්වීම' : 'XAI Logic', icon: '🧠' },
    { key: 'peer_cluster', label: language === 'si' ? 'සම වයස් Radar' : 'Peer KNN', icon: '👥' },
    { key: 'simulator', label: language === 'si' ? 'උපකල්පන Simulator' : 'Simulator', icon: '🧪' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Universal App Bar */}
      <NavBar
        title={language === 'si' ? 'AI නිර්දේශ හබ් (Module 3)' : 'AI Recommendation Hub'}
        subtitle={`Adaptive Learning Engine · ${activeChildName}`}
        showBack={true}
        fallbackRoute="/(parent)/dashboard"
        showSettings={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hub Introduction Banner */}
        <Card style={styles.introCard}>
          <View style={styles.moduleTag}>
            <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              {language === 'si'
                ? 'අනුවර්තී ඉගෙනුම් මාර්ග සහ නිර්දේශ එන්ජිම (M3)'
                : 'Adaptive Recommendation & Learning Pathway Engine'}
            </AppText>
          </View>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
            {language === 'si'
              ? 'පුද්ගලානුබද්ධ ඩිස්ලෙක්සියා ඉගෙනුම් සැලසුම් සහ Explainable AI'
              : 'Personalized Dyslexia Scaffolding & Explainable AI'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 18 }}>
            {language === 'si'
              ? 'M1 කථන දෝෂ, M2 වාක්‍ය සංකීර්ණතාව සහ M4 හැසිරීම් දත්ත පදනම් කරගෙන Random Forest හා KNN ඇල්ගොරිතම මගින් දරුවාට වඩාත්ම උචිත ඊළඟ අභ්‍යාසය තීරණය කරයි.'
              : 'Random Forest classifiers and KNN peer-similarity modeling predict optimal text difficulty, phonological milestones, and scaffolding strategies tailored for Sinhala readers.'}
          </AppText>
        </Card>

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
              🗺️ {language === 'si' ? 'සිංහල කියවීමේ පියවරෙන් පියවර ඉගෙනුම් සැලැස්ම' : 'Multi-Stage Sinhala Curriculum Roadmap'}
            </AppText>
            <LearningRoadmap />
          </View>
        )}

        {/* ── Tab 2: Explainable AI (XAI) Deep-Dive ───────────────────────── */}
        {activeTab === 'xai' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🧠 {language === 'si' ? 'AI තීරණ පැහැදිලි කිරීම සහ දෙමාපිය මගපෙන්වීම' : 'Full Explainable AI Decision Breakdown'}
            </AppText>
            <M3RecommendationCard data={m3Data} showLauncher={true} />
          </View>
        )}

        {/* ── Tab 3: KNN Peer-Cohort Clustering ───────────────────────────── */}
        {activeTab === 'peer_cluster' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              👥 {language === 'si' ? 'සම වයස් ළමුන්ගේ දක්ෂතා සැසඳීම (Grade 2 KNN)' : 'KNN Peer-Cohort Clustering (Grade 2 Norms)'}
            </AppText>
            <PeerClusterRadar />
          </View>
        )}

        {/* ── Tab 4: What-If Pedagogical Simulator ────────────────────────── */}
        {activeTab === 'simulator' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🧪 {language === 'si' ? 'අන්තර්ක්‍රියාකාරී "What-If" ඉගැන්වීම් උපකල්පන Simulator' : 'Interactive "What-If" Teaching Strategy Simulator'}
            </AppText>
            <RecommendationSimulator />
          </View>
        )}

        <View style={{ height: ThemeSpacing.xxxl }} />
      </ScrollView>

      {/* Universal Bottom Navigation */}
      <BottomNav role="parent" activeTab="dashboard" />
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
  },
  introCard: {
    backgroundColor: ThemeColors.card,
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 4,
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
    gap: ThemeSpacing.xs,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
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
