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
import { useLanguage } from '@/context/LanguageContext';

export default function RecommendationSimulator() {
  const { language } = useLanguage();
  const isSi = language === 'si';

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
    { key: 'easy', label: isSi ? 'පහසු' : 'Easy', icon: '🟢' },
    { key: 'medium', label: isSi ? 'සාමාන්‍ය' : 'Medium', icon: '🟡' },
    { key: 'hard', label: isSi ? 'උසස්' : 'Hard', icon: '🔴' },
  ];

  const supports: { key: SupportType; label: string; icon: string }[] = [
    { key: 'simplification', label: isSi ? 'සරල කිරීම' : 'Simplification', icon: '✨' },
    { key: 'syllable_split', label: isSi ? 'අක්ෂර වෙන්කිරීම' : 'Syllables', icon: '🔤' },
    { key: 'audio', label: isSi ? 'හඬ සහාය' : 'Audio Cue', icon: '🔊' },
    { key: 'picture', label: isSi ? 'පින්තූර සහාය' : 'Picture Cue', icon: '🖼️' },
  ];

  const durations = [5, 10, 15];

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.moduleTag}>
          <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            {isSi ? 'අන්තර්ක්‍රියාකාරී පුහුණු සැලසුම්කාරකය' : 'Interactive Practice Planner'}
          </AppText>
        </View>
        <AppText size="xs" color={ThemeColors.textMuted}>
          {isSi ? 'පුහුණු සැලසුම වෙනස් කර බලන්න' : 'Plan Practice Activities & Support'}
        </AppText>
      </View>

      {/* ── Lever 1: Text Difficulty ────────────────────────────────────── */}
      <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.leverTitle}>
        {isSi ? '1. අභ්‍යාසවල අපහසුතා මට්ටම තෝරන්න:' : '1. Select Target Difficulty Level:'}
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
        {isSi ? '2. ලබාදෙන කියවීමේ සහාය:' : '2. Primary Support Strategy:'}
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
        {isSi ? '3. දිනකට පුහුණු වන කාලය:' : '3. Daily Practice Duration:'}
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
                ⏱ {isSi ? `දිනකට මිනිත්තු ${mins}` : `${mins} mins / day`}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Real-Time Prediction Results Matrix ─────────────────────────── */}
      <View style={styles.resultsBox}>
        <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginBottom: ThemeSpacing.xs }}>
          {isSi ? '📈 අපේක්ෂිත ප්‍රගති පුරෝකථනය:' : '📈 Projected Progress Forecast:'}
        </AppText>

        <View style={styles.metricsRow}>
          <View style={styles.forecastItem}>
            <AppText size="xs" color={ThemeColors.textMuted}>
              {isSi ? 'අපේක්ෂිත නිරවද්‍යතාව' : 'Predicted Accuracy'}
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
              {isSi ? 'අපහසු වීමේ අවදානම' : 'Challenge Risk'}
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
              {isSi ? 'මීළඟ පියවරට කාලය' : 'Time to Next Milestone'}
            </AppText>
            <AppText size="lg" weight="extrabold" color={ThemeColors.accentDark}>
              {isSi ? `දින ${outputs.timeToNextMilestoneDays}ක්` : `${outputs.timeToNextMilestoneDays} days`}
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
            {isSi
              ? '✓ නව පුහුණු සැලසුම දරුවාගේ මීළඟ සැසිය සඳහා සාර්ථකව යොදන ලදී!'
              : '✓ Customized strategy saved and applied to next session!'}
          </AppText>
        </View>
      )}

      <Button
        label={isSi ? 'මෙම පුහුණු සැලසුම යොදන්න ⚡' : 'Apply This Practice Plan ⚡'}
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
