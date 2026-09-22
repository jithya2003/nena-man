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
import type { RoadmapStage } from '@/types';
import { MOCK_ROADMAP_STAGES } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';

interface LearningRoadmapProps {
  stages?: RoadmapStage[];
  onSelectStage?: (stage: RoadmapStage) => void;
}

export default function LearningRoadmap({
  stages = MOCK_ROADMAP_STAGES,
  onSelectStage,
}: LearningRoadmapProps) {
  const router = useRouter();
  const [selectedStageId, setSelectedStageId] = useState<string>(
    stages.find((s) => s.status === 'current')?.id ?? stages[0].id
  );

  const selectedStage =
    stages.find((s) => s.id === selectedStageId) ?? stages[0];

  const getStatusBadge = (status: RoadmapStage['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', icon: '✅', color: ThemeColors.success, bg: ThemeColors.successSurface };
      case 'current':
        return { label: 'Current AI Focus', icon: '🎯', color: ThemeColors.accentDark, bg: ThemeColors.accentLight };
      case 'locked':
        return { label: 'Upcoming', icon: '🔒', color: ThemeColors.textMuted, bg: ThemeColors.surface };
    }
  };

  return (
    <View style={styles.container}>
      {/* Visual Roadmap Node Chain */}
      <View style={styles.chainContainer}>
        {stages.map((stage, idx) => {
          const isSelected = stage.id === selectedStageId;
          const statusMeta = getStatusBadge(stage.status);
          const isLast = idx === stages.length - 1;

          return (
            <View key={stage.id} style={styles.nodeWrapper}>
              <TouchableOpacity
                style={[
                  styles.nodeItem,
                  isSelected && styles.nodeItemSelected,
                  stage.status === 'current' && styles.nodeItemCurrent,
                  ThemeShadow.sm,
                ]}
                onPress={() => {
                  setSelectedStageId(stage.id);
                  if (onSelectStage) onSelectStage(stage);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.nodeIconCircle, { backgroundColor: statusMeta.bg }]}>
                  <AppText size="md">{statusMeta.icon}</AppText>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nodeTitleRow}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                      STAGE {stage.stageNumber}
                    </AppText>
                    <AppText size="xs" weight="bold" color={statusMeta.color}>
                      {stage.progressPercentage}%
                    </AppText>
                  </View>
                  <AppText
                    size="sm"
                    weight={isSelected ? 'extrabold' : 'bold'}
                    color={ThemeColors.textPrimary}
                    numberOfLines={1}
                  >
                    {stage.title}
                  </AppText>
                  <ProgressBar
                    value={stage.progressPercentage}
                    color={statusMeta.color}
                    height={4}
                    style={{ marginTop: 4 }}
                  />
                </View>
              </TouchableOpacity>

              {/* Connecting path line */}
              {!isLast && (
                <View
                  style={[
                    styles.pathLine,
                    {
                      backgroundColor:
                        stage.status === 'completed'
                          ? ThemeColors.success
                          : ThemeColors.borderLight,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Selected Stage Detail Dossier */}
      <Card variant="elevated" style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View>
            <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
              STAGE {selectedStage.stageNumber} DOSSIER
            </AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
              {selectedStage.title}
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              {selectedStage.subtitle}
            </AppText>
          </View>
        </View>

        {/* Target Skills Checklist */}
        <View style={styles.skillsSection}>
          <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 4 }}>
            🎯 Target Phonological Milestones:
          </AppText>
          {selectedStage.targetSkills.map((skill, i) => (
            <View key={i} style={styles.skillRow}>
              <AppText size="xs" color={ThemeColors.accentDark}>
                ✓
              </AppText>
              <AppText size="xs" color={ThemeColors.textPrimary}>
                {skill}
              </AppText>
            </View>
          ))}
        </View>

        {selectedStage.status === 'current' && (
          <View style={styles.estimatePill}>
            <AppText size="xs" color={ThemeColors.accentDark} weight="bold">
              ⏱ Estimated AI Mastery: {selectedStage.estimatedDaysLeft} days at current reading velocity
            </AppText>
          </View>
        )}

        {selectedStage.status !== 'locked' && (
          <Button
            label={`Practice Stage ${selectedStage.stageNumber} Activities →`}
            onPress={() => router.push('/(child)/reading')}
            fullWidth
            size="md"
            style={{ marginTop: ThemeSpacing.md }}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chainContainer: {
    paddingVertical: ThemeSpacing.xs,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
    width: '100%',
  },
  nodeItemSelected: {
    borderColor: ThemeColors.accentDark,
    backgroundColor: ThemeColors.surfaceElevated,
    borderWidth: 2,
  },
  nodeItemCurrent: {
    borderColor: ThemeColors.accent,
  },
  nodeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pathLine: {
    width: 3,
    height: 16,
    marginVertical: 2,
    borderRadius: 1.5,
  },
  detailCard: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.md,
    backgroundColor: ThemeColors.surfaceElevated,
  },
  detailHeader: {
    marginBottom: ThemeSpacing.sm,
  },
  skillsSection: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    marginVertical: ThemeSpacing.xs,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    marginTop: 2,
  },
  estimatePill: {
    backgroundColor: ThemeColors.accentLight,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.sm,
    marginTop: ThemeSpacing.xs,
    borderWidth: 1,
    borderColor: ThemeColors.warningBorder,
  },
});
