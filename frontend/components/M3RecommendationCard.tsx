import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
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

interface M3RecommendationCardProps {
  data: M3Response;
  showLauncher?: boolean;
}

export default function M3RecommendationCard({
  data,
  showLauncher = true,
}: M3RecommendationCardProps) {
  const router = useRouter();
  const [showXaiDetails, setShowXaiDetails] = useState(false);
  const [showPeerDetails, setShowPeerDetails] = useState(false);

  const getTransitionBadgeColor = () => {
    switch (data.recommendation) {
      case 'Increase':
        return { bg: ThemeColors.successSurface, text: ThemeColors.success, border: ThemeColors.successBorder };
      case 'Maintain':
        return { bg: ThemeColors.accentLight, text: ThemeColors.accentDark, border: ThemeColors.warningBorder };
      case 'Decrease':
        return { bg: ThemeColors.infoSurface, text: ThemeColors.info, border: ThemeColors.infoBorder };
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
            Adaptive Recommendation Engine (AI Guidance)
          </AppText>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: ThemeColors.surface }]}>
          <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
            {Math.round(data.confidence * 100)}% Confidence
          </AppText>
        </View>
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
              AI Prescribed Adaptation:
            </AppText>
            <AppText size="md" weight="extrabold" color={badgeStyle.text}>
              {data.recommendation} Current Difficulty Level
            </AppText>
          </View>
        </View>

        {/* Target Skill Pill */}
        {data.targetPhonemeSkill && (
          <View style={styles.skillPill}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              🎯 Target Focus: {data.targetPhonemeSkill}
            </AppText>
          </View>
        )}
      </View>

      {/* Plain Language AI Rationale */}
      <AppText size="sm" color={ThemeColors.textPrimary} style={styles.rationaleText}>
        {data.rationale}
      </AppText>

      {/* ── 1. Explainable AI (XAI) Feature Importance Section ────────────── */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setShowXaiDetails(!showXaiDetails)}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleRow}>
            <AppText size="sm">🔍</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              Explainable AI (XAI) — Why this decision?
            </AppText>
          </View>
          <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
            {showXaiDetails ? 'Hide ▲' : 'Inspect ▼'}
          </AppText>
        </TouchableOpacity>

        {showXaiDetails && (
          <View style={styles.xaiBody}>
            <AppText size="xs" color={ThemeColors.textMuted} style={{ marginBottom: ThemeSpacing.sm }}>
              Relative feature contributions in Random Forest decision:
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
                      {factor.weight}% weight
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

      {/* ── 2. KNN Peer-Cohort Benchmark Section ──────────────────────────── */}
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
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 18 }}>
                {data.peerBenchmark.comparisonNote}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* ── 3. Next Activity Launcher Button ──────────────────────────────── */}
      {showLauncher && (
        <Button
          label={`Start Prescribed Activity: ${data.nextActivityLabel} →`}
          onPress={() =>
            router.push({
              pathname: '/(child)/reading',
              params: { textId: data.nextActivityId },
            })
          }
          fullWidth
          size="md"
          style={{ marginTop: ThemeSpacing.md }}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: ThemeRadius.full,
  },
  confidenceBadge: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  decisionBanner: {
    padding: ThemeSpacing.sm + 2,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    marginBottom: ThemeSpacing.sm,
  },
  decisionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
  },
  decisionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: ThemeRadius.full,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillPill: {
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 3,
    borderRadius: ThemeRadius.sm,
    marginTop: ThemeSpacing.xs,
    alignSelf: 'flex-start',
  },
  rationaleText: {
    lineHeight: 20,
    marginBottom: ThemeSpacing.sm,
  },
  accordionContainer: {
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeSpacing.sm,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  xaiBody: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    paddingTop: ThemeSpacing.xs,
  },
  xaiRow: {
    marginBottom: ThemeSpacing.sm,
  },
  xaiLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  xaiDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  peerBody: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    paddingTop: ThemeSpacing.xs,
  },
  cohortTag: {
    backgroundColor: ThemeColors.surfaceElevated,
    paddingHorizontal: ThemeSpacing.xs + 2,
    paddingVertical: 2,
    borderRadius: ThemeRadius.xs,
    alignSelf: 'flex-start',
  },
});
