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
  MOCK_CHILD,
  MOCK_SESSIONS,
  MOCK_ERROR_BREAKDOWN,
  MOCK_M3_RESPONSE,
} from '@/mock/data';
import { BehaviorBadge } from '@/components/Badge';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import Button from '@/components/Button';
import M3RecommendationCard from '@/components/M3RecommendationCard';

const ERROR_DETAIL = {
  substitution: {
    label: 'Substitution Errors',
    icon: '🔄',
    description: 'Child replaces a word with a different word (e.g. says "ගස්" instead of "ගස").',
    tip: 'Practice the target word in isolation with syllable split, then in short context.',
    color: ThemeColors.m1,
    bg: ThemeColors.m1Surface,
    border: ThemeColors.border,
  },
  omission: {
    label: 'Omission Errors',
    icon: '❌',
    description: 'Child skips a word or syllable while reading aloud.',
    tip: 'Use finger-pointing or the Word Focus (L1) mode to track each akuru unit.',
    color: ThemeColors.error,
    bg: ThemeColors.errorSurface,
    border: ThemeColors.errorBorder,
  },
  reversal: {
    label: 'Reversal Errors',
    icon: '↩️',
    description: 'Child reverses letters or the order of Sinhala syllables (kombuwa/al-lakuna).',
    tip: 'Use syllable-split support (L2) and color-coded stroke highlighting.',
    color: ThemeColors.warning,
    bg: ThemeColors.warningSurface,
    border: ThemeColors.warningBorder,
  },
  hesitation: {
    label: 'Hesitation & Pauses',
    icon: '⏸️',
    description: 'Child pauses significantly before or during a word due to cognitive load.',
    tip: 'Reduce text complexity; use picture cues (L4) to activate semantic memory.',
    color: ThemeColors.info,
    bg: ThemeColors.infoSurface,
    border: ThemeColors.infoBorder,
  },
};

const totalErrors = Object.values(MOCK_ERROR_BREAKDOWN).reduce((a, b) => a + b, 0);

export default function ReportsScreen() {
  const router = useRouter();
  const [filterSession, setFilterSession] = useState<'all' | 'recent'>('all');

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Top Navigation */}
      <NavBar
        title="Clinical Error Reports"
        subtitle={`${MOCK_CHILD.name} · ${MOCK_CHILD.totalSessions} Sessions`}
        showBack={true}
        fallbackRoute="/(parent)/dashboard"
        showSettings={true}
        showLogout={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Child Profile Quick Bar */}
        <View style={styles.childHeaderCard}>
          <View style={styles.childAvatar}>
            <AppText size="lg" weight="bold" color={ThemeColors.textPrimary}>
              {MOCK_CHILD.name.charAt(0)}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
              {MOCK_CHILD.name} — Progress Report
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              Grade {MOCK_CHILD.grade} · Primary Language: Sinhala
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.backDashBtn}
            onPress={() => router.replace('/(parent)/dashboard')}
            activeOpacity={0.7}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              ← Dashboard
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── Adaptive Recommendation Engine & XAI ──────────────── */}
        <AppText size="lg" weight="bold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          🧠 Clinical Learning Recommendation (AI Engine)
        </AppText>
        <M3RecommendationCard data={MOCK_M3_RESPONSE} showLauncher={false} />

        {/* Error deep-dive */}
        <AppText size="lg" weight="bold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          Error Analysis by Classification
        </AppText>
        {(
          Object.entries(ERROR_DETAIL) as [
            keyof typeof ERROR_DETAIL,
            (typeof ERROR_DETAIL)[keyof typeof ERROR_DETAIL],
          ][]
        ).map(([key, meta]) => {
          const count = MOCK_ERROR_BREAKDOWN[key as keyof typeof MOCK_ERROR_BREAKDOWN] ?? 0;
          return (
            <Card
              key={key}
              style={[
                styles.errorDetailCard,
                { borderLeftWidth: 4, borderLeftColor: meta.color },
              ]}
            >
              <View style={styles.errorDetailHeader}>
                <View
                  style={[
                    styles.errorDetailBadge,
                    { backgroundColor: meta.bg, borderColor: meta.border },
                  ]}
                >
                  <AppText size="sm">{meta.icon}</AppText>
                  <AppText size="xs" weight="bold" color={meta.color}>
                    {meta.label}
                  </AppText>
                </View>
                <AppText size="xl" weight="extrabold" color={meta.color}>
                  {count}
                </AppText>
              </View>
              <ProgressBar
                value={(count / totalErrors) * 100}
                color={meta.color}
                height={6}
              />
              <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginTop: ThemeSpacing.sm, lineHeight: 20 }}>
                {meta.description}
              </AppText>
              <View style={styles.tipBox}>
                <AppText size="sm">💡</AppText>
                <AppText size="xs" color={ThemeColors.info} style={{ flex: 1, lineHeight: 18 }}>
                  {meta.tip}
                </AppText>
              </View>
            </Card>
          );
        })}

        {/* Session breakdown */}
        <AppText size="lg" weight="bold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          Session-by-Session Breakdown
        </AppText>
        {MOCK_SESSIONS.map((s) => (
          <Card key={s.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                {s.date}
              </AppText>
              <BehaviorBadge state={s.behaviorState} />
            </View>
            <View style={styles.sessionStats}>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {s.accuracy}%
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  Accuracy
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {s.errorCount}
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  Errors
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {Math.round(s.durationSeconds / 60)}m
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  Duration
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="sm">{'⭐'.repeat(s.starsEarned)}</AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  Stars
                </AppText>
              </View>
            </View>
            <ProgressBar
              value={s.accuracy}
              color={
                s.accuracy >= 75
                  ? ThemeColors.success
                  : s.accuracy >= 60
                  ? ThemeColors.warning
                  : ThemeColors.error
              }
              height={6}
            />
          </Card>
        ))}

        {/* Return to Dashboard CTA */}
        <Button
          label="← Return to Dashboard"
          onPress={() => router.replace('/(parent)/dashboard')}
          fullWidth
          size="lg"
          style={{ marginTop: ThemeSpacing.md, marginBottom: ThemeSpacing.sm }}
        />

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* Universal Bottom Navigation */}
      <BottomNav role="parent" activeTab="reports" />
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
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxxl,
  },
  childHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.md,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: ThemeRadius.full,
    backgroundColor: ThemeColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
  },
  backDashBtn: {
    backgroundColor: ThemeColors.surfaceElevated,
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  m3Card: {
    padding: ThemeSpacing.md,
    backgroundColor: ThemeColors.m3Surface,
    borderColor: ThemeColors.successBorder,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.xs,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: ThemeRadius.full,
  },
  m3RecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    marginVertical: ThemeSpacing.xs,
  },
  sectionTitle: {
    marginTop: ThemeSpacing.xl,
    marginBottom: ThemeSpacing.sm,
  },
  errorDetailCard: {
    padding: ThemeSpacing.md,
    marginBottom: ThemeSpacing.md,
  },
  errorDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  errorDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xxs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
  },
  tipBox: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
    marginTop: ThemeSpacing.sm,
    backgroundColor: ThemeColors.infoSurface,
    borderRadius: ThemeRadius.sm,
    padding: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: ThemeColors.infoBorder,
  },
  sessionCard: {
    padding: ThemeSpacing.md,
    marginBottom: ThemeSpacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: ThemeSpacing.sm,
  },
  sessionStat: {
    alignItems: 'center',
  },
});
