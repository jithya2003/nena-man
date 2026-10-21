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
import { MOCK_SKILL_DIMENSIONS, MOCK_PEER_CLUSTERS } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { useLanguage } from '@/context/LanguageContext';

interface PeerClusterRadarProps {
  skills?: SkillDimension[];
  clusters?: PeerCluster[];
  childName?: string;
}

const SKILL_LOCALIZATIONS: Record<string, { labelSi: string; descSi: string }> = {
  dim_accuracy: {
    labelSi: 'ශබ්ද හඳුනාගැනීම',
    descSi: 'අකුරු සහ ශබ්ද නිවැරදිව හඳුනාගැනීමේ හැකියාව.',
  },
  dim_speed: {
    labelSi: 'කියවීමේ වේගය (WPM)',
    descSi: 'විනාඩියකට කියවන වචන ප්‍රමාණය අනුව මනිනු ලබන වේගය.',
  },
  dim_resilience: {
    labelSi: 'වැරදි නිවැරදි කරගැනීම',
    descSi: 'කියවීමේදී වන වැරදීම් තනිව හඳුනාගෙන නිවැරදි කරගැනීමේ හැකියාව.',
  },
  dim_attention: {
    labelSi: 'අවධානය සහ උනන්දුව',
    descSi: 'කියවීමේ ක්‍රියාකාරකමෙහි නොකඩවා රැඳී සිටීමේ හැකියාව.',
  },
  dim_comprehension: {
    labelSi: 'තේරුම් ගැනීමේ හැකියාව',
    descSi: 'කියවූ සරල වාක්‍ය සහ කථාංගවල අර්ථය තේරුම් ගැනීම.',
  },
};

export default function PeerClusterRadar({
  skills = MOCK_SKILL_DIMENSIONS,
  clusters = MOCK_PEER_CLUSTERS,
  childName,
}: PeerClusterRadarProps) {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const displayName = childName || (isSi ? 'දරුවා' : 'Student');
  const activeCluster = clusters[1]; // Cluster B

  const clusterName = isSi
    ? 'පිල්ලම් සහ කොම්බුව කියවීමේ මට්ටම'
    : activeCluster.clusterName;
  const clusterDesc = isSi
    ? 'අකුරු හඳුනාගැනීම හොඳ මට්ටමක පවතින අතර, පිල්ලම් සහ කොම්බුව සහිත වචන කියවීමේදී මඟපෙන්වීම අවශ්‍ය වේ.'
    : activeCluster.description;

  return (
    <Card variant="elevated" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            {isSi ? 'සම වයස් කියවීමේ කුසලතා සැසඳීම' : 'Multi-Dimensional Peer Comparison'}
          </AppText>
        </View>
        <AppText size="xs" color={ThemeColors.textMuted}>
          {isSi ? '2 ශ්‍රේණියේ සම වයස් මට්ටම්' : 'Grade 2 Peer Norms'}
        </AppText>
      </View>

      {/* Cluster Assignment Badge */}
      <View style={styles.clusterBanner}>
        <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
          {isSi ? 'දරුවාගේ වත්මන් ඉගෙනුම් මට්ටම:' : 'Identified Learning Level:'}
        </AppText>
        <AppText size="sm" weight="extrabold" color={ThemeColors.accentDark} style={{ marginVertical: 2 }}>
          {clusterName}
        </AppText>
        <AppText size="xs" color={ThemeColors.textSecondary} style={{ lineHeight: 16 }}>
          {clusterDesc}
        </AppText>
      </View>

      {/* 5-Dimensional Skill Matrix Breakdown */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.matrixTitle}>
        {isSi
          ? 'දරුවාගේ ප්‍රධාන කියවීමේ කුසලතා 5 (සම වයස් සාමාන්‍යය සමඟ සැසඳීම):'
          : `Key Reading Skills (${displayName} vs. Peer Average):`}
      </AppText>

      <View style={styles.skillsList}>
        {skills.map((skill) => {
          const delta = skill.studentScore - skill.peerCohortAvg;
          const isAbove = delta >= 0;
          const label = isSi && SKILL_LOCALIZATIONS[skill.id] ? SKILL_LOCALIZATIONS[skill.id].labelSi : skill.label;
          const desc = isSi && SKILL_LOCALIZATIONS[skill.id] ? SKILL_LOCALIZATIONS[skill.id].descSi : skill.description;

          return (
            <View key={skill.id} style={styles.skillItem}>
              <View style={styles.skillTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText size="sm">{skill.icon}</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {label}
                  </AppText>
                </View>
                <View style={styles.scoreRow}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {skill.studentScore}%
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textMuted}>
                    ({isSi ? 'සම වයස්' : 'Peer'}: {skill.peerCohortAvg}%)
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
                {desc}
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
            {isSi ? 'දරුවාගේ ලකුණු' : `${displayName}'s Score`}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.textMuted }]} />
          <AppText size="xs" color={ThemeColors.textSecondary}>
            {isSi ? 'සම වයස් සාමාන්‍යය' : 'Peer Benchmark Avg'}
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
