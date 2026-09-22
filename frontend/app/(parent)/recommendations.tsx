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
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import {
  MOCK_M3_RESPONSE,
  MOCK_CHILD,
} from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import LearningRoadmap from '@/components/LearningRoadmap';
import PeerClusterRadar from '@/components/PeerClusterRadar';
import RecommendationSimulator from '@/components/RecommendationSimulator';
import M3RecommendationCard from '@/components/M3RecommendationCard';

type TabKey = 'roadmap' | 'simulator' | 'peer_cluster' | 'xai';

export default function RecommendationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { key: 'simulator', label: 'Simulator', icon: '🧪' },
    { key: 'peer_cluster', label: 'Peer KNN', icon: '👥' },
    { key: 'xai', label: 'XAI Logic', icon: '🔍' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Universal App Bar */}
      <NavBar
        title="AI Recommendation Hub"
        subtitle={`Adaptive Learning Engine · ${MOCK_CHILD.name}`}
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
              Adaptive Recommendation & Learning Pathway Engine
            </AppText>
          </View>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
            Personalized Dyslexia Scaffolding & Explainable AI
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 18 }}>
            Random Forest classifiers and KNN peer-similarity modeling predict optimal text difficulty, phonological milestones, and scaffolding strategies tailored for Sinhala readers.
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
              🗺️ Multi-Stage Sinhala Curriculum Roadmap
            </AppText>
            <LearningRoadmap />
          </View>
        )}

        {/* ── Tab 2: What-If Pedagogical Simulator ────────────────────────── */}
        {activeTab === 'simulator' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🧪 Interactive "What-If" Teaching Strategy Simulator
            </AppText>
            <RecommendationSimulator />
          </View>
        )}

        {/* ── Tab 3: KNN Peer-Cohort Clustering ───────────────────────────── */}
        {activeTab === 'peer_cluster' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              👥 KNN Peer-Cohort Clustering (Grade 2 Norms)
            </AppText>
            <PeerClusterRadar />
          </View>
        )}

        {/* ── Tab 4: Explainable AI (XAI) Deep-Dive ───────────────────────── */}
        {activeTab === 'xai' && (
          <View style={styles.tabContent}>
            <AppText size="sm" weight="bold" color={ThemeColors.textSecondary} style={styles.sectionHeading}>
              🔍 Full Explainable AI Decision Breakdown
            </AppText>
            <M3RecommendationCard data={MOCK_M3_RESPONSE} showLauncher={true} />
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
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xxxl,
  },
  introCard: {
    padding: ThemeSpacing.md,
    backgroundColor: ThemeColors.surfaceElevated,
    marginBottom: ThemeSpacing.md,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    marginBottom: 4,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: ThemeRadius.full,
  },
  tabBar: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: ThemeColors.surface,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  tabButtonActive: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentDark,
    borderWidth: 2,
  },
  tabContent: {
    marginTop: ThemeSpacing.xs,
  },
  sectionHeading: {
    marginBottom: ThemeSpacing.xs,
  },
});
