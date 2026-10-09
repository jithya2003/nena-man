import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import type { M3Response } from '@/types';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';
import { useLanguage } from '@/context/LanguageContext';
import { recommendationService } from '@/services/recommendationService';

interface M3RecommendationCardProps {
  data: M3Response;
  showLauncher?: boolean;
}

export default function M3RecommendationCard({
  data,
  showLauncher = true,
}: M3RecommendationCardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'parent' | 'clinical'>('parent');
  const [showXaiDetails, setShowXaiDetails] = useState(true);
  const [showPeerDetails, setShowPeerDetails] = useState(false);

  const parentInsight = recommendationService.getParentExplanation(data);

  const getTransitionBadgeColor = () => {
    switch (data.recommendation) {
      case 'Increase':
        return {
          bg: ThemeColors.successSurface,
          text: ThemeColors.success,
          border: ThemeColors.successBorder,
          label: language === 'si' ? 'අපහසුතාව වැඩි කිරීම (Level Up 🚀)' : 'Increase Difficulty Level 🚀',
        };
      case 'Maintain':
        return {
          bg: ThemeColors.accentLight,
          text: ThemeColors.accentDark,
          border: ThemeColors.warningBorder,
          label: language === 'si' ? 'වත්මන් මට්ටම පවත්වා ගැනීම (Maintain ⚖️)' : 'Maintain Difficulty Level ⚖️',
        };
      case 'Decrease':
        return {
          bg: ThemeColors.infoSurface,
          text: ThemeColors.info,
          border: ThemeColors.infoBorder,
          label: language === 'si' ? 'පහසු කර සහාය ලබා දීම (Gentle Support 🛡️)' : 'Decrease & Scaffold 🛡️',
        };
    }
  };

  const badgeStyle = getTransitionBadgeColor();

  return (
    <Card variant="elevated" style={styles.card}>
      {/* Module Title Header */}
      <View style={styles.headerRow}>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            {language === 'si'
              ? 'අනුවර්තී නිර්දේශ එන්ජිම (M3 AI Guidance)'
              : 'Adaptive Recommendation Engine (M3)'}
          </AppText>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: ThemeColors.surface }]}>
          <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
            {Math.round(data.confidence * 100)}% {language === 'si' ? 'විශ්වාසනීයත්වය' : 'Confidence'}
          </AppText>
        </View>
      </View>

      {/* View Mode Toggle (Parent-Friendly vs Clinical XAI) */}
      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'parent' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('parent')}
          activeOpacity={0.8}
        >
          <AppText size="xs" weight="bold" color={viewMode === 'parent' ? '#FFFFFF' : ThemeColors.textSecondary}>
            {language === 'si' ? '👨‍👩‍👧 දෙමාපිය මගපෙන්වීම' : '👨‍👩‍👧 Parent Guide'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'clinical' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('clinical')}
          activeOpacity={0.8}
        >
          <AppText size="xs" weight="bold" color={viewMode === 'clinical' ? '#FFFFFF' : ThemeColors.textSecondary}>
            {language === 'si' ? '🔬 සායනික XAI විග්‍රහය' : '🔬 Clinical XAI (SHAP)'}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Main Recommendation Decision Banner */}
      <View style={[styles.decisionBanner, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
        <View style={styles.decisionTopRow}>
          <View style={styles.decisionIconWrap}>
            <AppText size="lg">
              {data.recommendation === 'Increase' ? '🚀' : data.recommendation === 'Maintain' ? '⚖️' : '🛡️'}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              {language === 'si' ? 'AI නිර්දේශිත පියවර:' : 'AI Prescribed Adaptation:'}
            </AppText>
            <AppText size="md" weight="extrabold" color={badgeStyle.text}>
              {badgeStyle.label}
            </AppText>
          </View>
        </View>

        {/* Target Skill Pill */}
        {data.targetPhonemeSkill && (
          <View style={styles.skillPill}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              🎯 {language === 'si' ? 'ඉලක්කගත ශබ්ද පුහුණුව:' : 'Target Focus:'} {data.targetPhonemeSkill}
            </AppText>
          </View>
        )}
      </View>

      {/* ── PARENT-FRIENDLY VIEW ─────────────────────────────────────────── */}
      {viewMode === 'parent' ? (
        <View style={styles.parentContentBox}>
          {/* Plain Language Rationale */}
          <View style={styles.parentReasonCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AppText size="sm">💡</AppText>
              <AppText size="xs" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                {language === 'si' ? 'මෙම නිර්දේශය ලබාදීමට හේතුව:' : 'Why the AI made this choice:'}
              </AppText>
            </View>
            <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 20 }}>
              {language === 'si' ? parentInsight.plainLanguageReasonSi : parentInsight.plainLanguageReason}
            </AppText>
          </View>

          {/* Actionable Home Practice Tip */}
          <View style={styles.parentTipCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AppText size="sm">🏡</AppText>
              <AppText size="xs" weight="extrabold" color="#9A3412" style={{ marginLeft: 6 }}>
                {language === 'si' ? 'අද ගෙදරදී කළ හැකි සරල අභ්‍යාසය:' : 'Actionable Home Exercise for Today:'}
              </AppText>
            </View>
            <AppText size="xs" color="#7C2D12" style={{ lineHeight: 20 }}>
              {language === 'si' ? parentInsight.homeTipSi : parentInsight.homeTip}
            </AppText>
          </View>
        </View>
      ) : (
        /* ── CLINICAL XAI VIEW ─────────────────────────────────────────────── */
        <View style={styles.clinicalContentBox}>
          {/* Plain Language AI Rationale */}
          <AppText size="xs" color={ThemeColors.textSecondary} style={styles.rationaleText}>
            {data.rationale}
          </AppText>

          {/* 1. Explainable AI (XAI) Feature Importance Section */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setShowXaiDetails(!showXaiDetails)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <AppText size="sm">🔍</AppText>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  Explainable AI (XAI) — Feature Contributions
                </AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
                {showXaiDetails ? 'Hide ▲' : 'Inspect ▼'}
              </AppText>
            </TouchableOpacity>

            {showXaiDetails && (
              <View style={styles.xaiBody}>
                <AppText size="xs" color={ThemeColors.textMuted} style={{ marginBottom: ThemeSpacing.sm }}>
                  Multi-signal learner state fusion (M1 Speech + M2 NLP + M4 Behavioral):
                </AppText>
                {data.xaiFactors.map((factor, idx) => {
                  const barColor =
                    factor.direction === 'positive'
                      ? ThemeColors.success
                      : factor.direction === 'negative'
                      ? ThemeColors.error
                      : ThemeColors.warning;
                  return (
                    <View key={idx} style={styles.xaiRow}>
                      <View style={styles.xaiLabelRow}>
                        <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                          {factor.name}
                        </AppText>
                        <AppText size="xs" weight="bold" color={barColor}>
                          {factor.weight}%
                        </AppText>
                      </View>
                      <ProgressBar value={factor.weight} color={barColor} height={6} />
                      <AppText size="xs" color={ThemeColors.textSecondary} style={styles.xaiDesc}>
                        {factor.description}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* 2. KNN Peer-Cohort Benchmark Section */}
          {data.peerBenchmark && (
            <View style={[styles.accordionContainer, { marginTop: ThemeSpacing.xs }]}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setShowPeerDetails(!showPeerDetails)}
                activeOpacity={0.7}
              >
                <View style={styles.accordionTitleRow}>
                  <AppText size="sm">👥</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    KNN Peer Benchmark ({data.peerBenchmark.similarityScore}% Match)
                  </AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
                  {showPeerDetails ? 'Hide ▲' : 'View ▼'}
                </AppText>
              </TouchableOpacity>

              {showPeerDetails && (
                <View style={styles.peerBody}>
                  <View style={styles.cohortTag}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                      Cohort: {data.peerBenchmark.cohortName}
                    </AppText>
                  </View>
                  <AppText size="xs" color={ThemeColors.textPrimary} style={{ marginVertical: 4 }}>
                    📈 Expected Growth: <AppText size="xs" weight="bold" color={ThemeColors.success}>{data.peerBenchmark.averageGrowthRate}</AppText>
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ fontStyle: 'italic', lineHeight: 18 }}>
                    "{data.peerBenchmark.comparisonNote}"
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Suggested Next Intervention CTA */}
      {showLauncher && (
        <View style={styles.actionFooter}>
          <View style={styles.nextInfoRow}>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              {language === 'si' ? 'නියමිත මීළඟ අභ්‍යාසය:' : 'Prescribed Next Activity:'}
            </AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
              {data.nextActivityLabel}
            </AppText>
          </View>
          <Button
            label={language === 'si' ? 'අභ්‍යාසයට පිවිසෙන්න 🚀' : 'Launch Prescribed Activity 🚀'}
            variant="primary"
            size="md"
            onPress={() => router.push('/(child)/reading')}
            style={styles.launchBtn}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ThemeSpacing.md,
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    marginBottom: ThemeSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.sm,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceBadge: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ThemeRadius.md,
    padding: 3,
    marginBottom: ThemeSpacing.sm,
  },
  modeToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: ThemeRadius.sm,
  },
  modeToggleBtnActive: {
    backgroundColor: ThemeColors.primary,
  },
  decisionBanner: {
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    marginBottom: ThemeSpacing.sm,
  },
  decisionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  decisionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillPill: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.sm,
  },
  parentContentBox: {
    gap: 8,
    marginVertical: 4,
  },
  parentReasonCard: {
    backgroundColor: ThemeColors.primaryLight,
    padding: 10,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  parentTipCard: {
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  clinicalContentBox: {
    marginTop: 4,
  },
  rationaleText: {
    lineHeight: 18,
    marginBottom: ThemeSpacing.sm,
  },
  accordionContainer: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderRadius: ThemeRadius.md,
    overflow: 'hidden',
    backgroundColor: ThemeColors.backgroundAlt,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 8,
    backgroundColor: ThemeColors.surfaceMuted,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xaiBody: {
    padding: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
  },
  xaiRow: {
    marginBottom: 8,
  },
  xaiLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  xaiDesc: {
    marginTop: 2,
    fontSize: 10,
  },
  peerBody: {
    padding: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
  },
  cohortTag: {
    backgroundColor: ThemeColors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  actionFooter: {
    marginTop: ThemeSpacing.md,
    paddingTop: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
  },
  nextInfoRow: {
    marginBottom: ThemeSpacing.xs,
  },
  launchBtn: {
    marginTop: 4,
  },
});
