import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
} from '@/constants/theme';
import type { SkillDimension, PeerCluster } from '@/types';
import { MOCK_SKILL_DIMENSIONS, MOCK_PEER_CLUSTERS, MOCK_CHILD } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';

interface PeerClusterRadarProps {
  skills?: SkillDimension[];
  clusters?: PeerCluster[];
}

export default function PeerClusterRadar({
  skills = MOCK_SKILL_DIMENSIONS,
  clusters = MOCK_PEER_CLUSTERS,
}: PeerClusterRadarProps) {
  const activeCluster = clusters[1]; // Cluster B

  return (
    <Card variant="elevated" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            M3 — KNN Multi-Dimensional Peer Clustering
          </AppText>
        </View>
        <AppText size="xs" color={ThemeColors.textMuted}>
          Grade 2 Dyslexic Norms
        </AppText>
      </View>

      {/* Cluster Assignment Badge */}
      <View style={styles.clusterBanner}>
        <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
          KNN Model Cluster Assignment:
        </AppText>
        <AppText size="sm" weight="extrabold" color={ThemeColors.accentDark} style={{ marginVertical: 2 }}>
          {activeCluster.clusterName}
        </AppText>
        <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 16 }}>
          {activeCluster.description}
        </AppText>
      </View>

      {/* 5-Dimensional Skill Matrix Breakdown */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.matrixTitle}>
        5-Dimensional Clinical Skill Profiles ({MOCK_CHILD.name} vs. Cohort):
      </AppText>

      <View style={styles.skillsList}>
        {skills.map((skill) => {
          const delta = skill.studentScore - skill.peerCohortAvg;
          const isAbove = delta >= 0;

          return (
            <View key={skill.id} style={styles.skillItem}>
              <View style={styles.skillTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText size="sm">{skill.icon}</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {skill.label}
                  </AppText>
                </View>
                <View style={styles.scoreRow}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {skill.studentScore}%
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textMuted}>
                    (Peer: {skill.peerCohortAvg}%)
                  </AppText>
                  <AppText
                    size="xs"
                    weight="bold"
                    color={isAbove ? ThemeColors.success : ThemeColors.error}
                  >
                    {isAbove ? `+${delta}%` : `${delta}%`}
                  </AppText>
                </View>
              </View>

              {/* Student Progress Bar */}
              <View style={styles.barStack}>
                <ProgressBar
                  value={skill.studentScore}
                  color={ThemeColors.accent}
                  height={6}
                />
              </View>

              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2, fontSize: 11 }}>
                {skill.description}
              </AppText>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.accent }]} />
          <AppText size="xs" color={ThemeColors.textSecondary}>
            {MOCK_CHILD.name}'s Score
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.textMuted }]} />
          <AppText size="xs" color={ThemeColors.textSecondary}>
            Cohort Benchmark Avg
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.md,
  },
  header: {
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
  clusterBanner: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm + 2,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.sm,
  },
  matrixTitle: {
    marginTop: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.sm,
  },
  skillsList: {
    gap: ThemeSpacing.sm,
  },
  skillItem: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  skillTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barStack: {
    marginVertical: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ThemeSpacing.lg,
    marginTop: ThemeSpacing.md,
    paddingTop: ThemeSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
