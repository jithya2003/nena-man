import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import type { DifficultyLevel, SupportType, SimulationInputs } from '@/types';
import { simulateRecommendation } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';

export default function RecommendationSimulator() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [support, setSupport] = useState<SupportType>('simplification');
  const [duration, setDuration] = useState<number>(10);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  const simulationInputs: SimulationInputs = useMemo(
    () => ({
      difficultyLevel: difficulty,
      supportLevel: support,
      dailyMinutes: duration,
    }),
    [difficulty, support, duration]
  );

  const outputs = useMemo(() => simulateRecommendation(simulationInputs), [simulationInputs]);

  const handleApply = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  const difficulties: { key: DifficultyLevel; label: string; icon: string }[] = [
    { key: 'easy', label: 'Easy', icon: '🟢' },
    { key: 'medium', label: 'Medium', icon: '🟡' },
    { key: 'hard', label: 'Hard', icon: '🔴' },
  ];

  const supports: { key: SupportType; label: string; icon: string }[] = [
    { key: 'simplification', label: 'AI Simplify', icon: '✨' },
    { key: 'syllable_split', label: 'Syllables', icon: '🔤' },
    { key: 'audio', label: 'Audio Cue', icon: '🔊' },
    { key: 'picture', label: 'Picture Cue', icon: '🖼️' },
  ];

  const durations = [5, 10, 15];

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            M3 — What-If Recommendation Simulator
          </AppText>
        </View>
        <AppText size="xs" color={ThemeColors.textMuted}>
          Simulate Pedagogical Shifts
        </AppText>
      </View>

      {/* ── Lever 1: Text Difficulty ────────────────────────────────────── */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.leverTitle}>
        1. Select Target Difficulty Level:
      </AppText>
      <View style={styles.pillRow}>
        {difficulties.map((d) => {
          const isSelected = difficulty === d.key;
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => setDifficulty(d.key)}
              activeOpacity={0.8}
            >
              <AppText size="xs">{d.icon}</AppText>
              <AppText
                size="xs"
                weight={isSelected ? 'bold' : 'medium'}
                color={isSelected ? ThemeColors.accentDark : ThemeColors.textPrimary}
              >
                {d.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Lever 2: Scaffolding Strategy ───────────────────────────────── */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.leverTitle}>
        2. Primary Scaffolding Level:
      </AppText>
      <View style={styles.pillRow}>
        {supports.map((s) => {
          const isSelected = support === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => setSupport(s.key)}
              activeOpacity={0.8}
            >
              <AppText size="xs">{s.icon}</AppText>
              <AppText
                size="xs"
                weight={isSelected ? 'bold' : 'medium'}
                color={isSelected ? ThemeColors.accentDark : ThemeColors.textPrimary}
              >
                {s.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Lever 3: Daily Duration ─────────────────────────────────────── */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.leverTitle}>
        3. Daily Session Duration:
      </AppText>
      <View style={styles.pillRow}>
        {durations.map((mins) => {
          const isSelected = duration === mins;
          return (
            <TouchableOpacity
              key={mins}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => setDuration(mins)}
              activeOpacity={0.8}
            >
              <AppText
                size="xs"
                weight={isSelected ? 'bold' : 'medium'}
                color={isSelected ? ThemeColors.accentDark : ThemeColors.textPrimary}
              >
                ⏱ {mins} mins / day
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Real-Time Prediction Results Matrix ─────────────────────────── */}
      <View style={styles.resultsBox}>
        <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginBottom: ThemeSpacing.xs }}>
          🤖 ML Model Simulated Forecast:
        </AppText>

        <View style={styles.metricsRow}>
          <View style={styles.forecastItem}>
            <AppText size="xs" color={ThemeColors.textMuted}>
              Predicted Accuracy
            </AppText>
            <AppText
              size="lg"
              weight="extrabold"
              color={outputs.predictedAccuracy >= 75 ? ThemeColors.success : ThemeColors.warning}
            >
              {outputs.predictedAccuracy}%
            </AppText>
          </View>

          <View style={styles.forecastItem}>
            <AppText size="xs" color={ThemeColors.textMuted}>
              Frustration Risk
            </AppText>
            <AppText
              size="lg"
              weight="extrabold"
              color={outputs.frustrationRisk > 30 ? ThemeColors.error : ThemeColors.success}
            >
              {outputs.frustrationRisk}%
            </AppText>
          </View>

          <View style={styles.forecastItem}>
            <AppText size="xs" color={ThemeColors.textMuted}>
              Time to Milestone
            </AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.accentDark}>
              {outputs.timeToNextMilestoneDays} days
            </AppText>
          </View>
        </View>

        <ProgressBar
          value={outputs.predictedAccuracy}
          color={outputs.predictedAccuracy >= 75 ? ThemeColors.success : ThemeColors.warning}
          height={6}
          style={{ marginTop: ThemeSpacing.sm }}
        />
      </View>

      {appliedNotice && (
        <View style={styles.appliedPill}>
          <AppText size="xs" weight="bold" color={ThemeColors.success}>
            ✓ Customized strategy saved and applied to Nimasha's next session!
          </AppText>
        </View>
      )}

      <Button
        label="Apply This Customized Strategy ⚡"
        onPress={handleApply}
        fullWidth
        size="md"
        style={{ marginTop: ThemeSpacing.md }}
      />
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
  leverTitle: {
    marginTop: ThemeSpacing.sm,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
    flex: 1,
    justifyContent: 'center',
    minWidth: 72,
  },
  pillActive: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentDark,
  },
  resultsBox: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.lg,
    marginTop: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  appliedPill: {
    backgroundColor: ThemeColors.successSurface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    marginTop: ThemeSpacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.successBorder,
  },
});
