/**
 * nena-man · frontend/app/(child)/progressive-reading.tsx
 * Dedicated Research Component Screen: Sinhala Text Difficulty & Progressive Reading Support.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';
import { ReadingSupportItem } from '@/types/progressiveSupport';
import textDifficultyService, { MOCK_SUPPORT_ITEMS } from '@/services/textDifficultyService';
import ProgressiveSupportCard from '@/components/progressive-support/ProgressiveSupportCard';

export default function ProgressiveReadingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('demo-hard-003');
  const [currentItem, setCurrentItem] = useState<ReadingSupportItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      setLoading(true);
      const item = await textDifficultyService.getReadingSupportItem(selectedScenarioKey);
      if (isMounted) {
        setCurrentItem(item);
        setLoading(false);
      }
    }
    loadItem();
    return () => {
      isMounted = false;
    };
  }, [selectedScenarioKey]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(child)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavBar
        title={t('progressiveSupport.title')}
        showBack
        fallbackRoute="/(child)/home"
        onBack={handleBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Research Banner Intro */}
        <Card style={styles.introCard}>
          <View style={styles.headerPill}>
            <AppText size="xs" weight="extrabold" color="#0B7A44">
              {t('progressiveSupport.introBadge')}
            </AppText>
          </View>
          <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={styles.introTitle}>
            {t('progressiveSupport.title')}
          </AppText>
          <AppText size="sm" color={ThemeColors.textSecondary} style={styles.introDesc}>
            {t('progressiveSupport.introSubtitle')}
          </AppText>

          {/* Scenario Tabs */}
          <View style={styles.scenarioRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                selectedScenarioKey === 'demo-easy-001' && styles.tabBtnActive,
              ]}
              onPress={() => setSelectedScenarioKey('demo-easy-001')}
            >
              <AppText
                size="xs"
                weight="extrabold"
                color={selectedScenarioKey === 'demo-easy-001' ? '#FFFFFF' : ThemeColors.textPrimary}
              >
                {t('progressiveSupport.easyScenario')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                selectedScenarioKey === 'demo-medium-002' && styles.tabBtnActive,
              ]}
              onPress={() => setSelectedScenarioKey('demo-medium-002')}
            >
              <AppText
                size="xs"
                weight="extrabold"
                color={selectedScenarioKey === 'demo-medium-002' ? '#FFFFFF' : ThemeColors.textPrimary}
              >
                {t('progressiveSupport.mediumScenario')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                selectedScenarioKey === 'demo-hard-003' && styles.tabBtnActive,
              ]}
              onPress={() => setSelectedScenarioKey('demo-hard-003')}
            >
              <AppText
                size="xs"
                weight="extrabold"
                color={selectedScenarioKey === 'demo-hard-003' ? '#FFFFFF' : ThemeColors.textPrimary}
              >
                {t('progressiveSupport.hardScenario')}
              </AppText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Active Support Card */}
        {loading || !currentItem ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ThemeColors.primary} />
          </View>
        ) : (
          <ProgressiveSupportCard
            key={currentItem.id}
            item={currentItem}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scrollContent: {
    padding: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxl,
  },
  introCard: {
    padding: ThemeSpacing.md,
    backgroundColor: '#E8F6ED',
    borderRadius: ThemeRadius.lg,
    borderColor: '#B2E2C3',
    borderWidth: 1.5,
    marginBottom: ThemeSpacing.sm,
  },
  headerPill: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs,
    borderRadius: ThemeRadius.full,
    marginBottom: ThemeSpacing.xs,
  },
  introTitle: {
    marginBottom: ThemeSpacing.xxs,
  },
  introDesc: {
    lineHeight: 20,
    marginBottom: ThemeSpacing.md,
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  tabBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
  },
  loadingContainer: {
    padding: ThemeSpacing.xxl,
    alignItems: 'center',
  },
});
