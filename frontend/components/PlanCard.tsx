/**
 * nena-man · frontend/components/PlanCard.tsx
 * Card presenting a subscription plan (Free / Premium / Institutional)
 * matching the Nena-Man design system tokens and component language.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useLanguage } from '@/context/LanguageContext';
import { PLANS, PlanDefinition } from '@/constants/subscriptionPlans';
import type { PlanId } from '@/types/subscription';

interface PlanCardProps {
  planId: PlanId;
  isCurrentPlan: boolean;
  onSelect?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PlanCard({
  planId,
  isCurrentPlan,
  onSelect,
  loading = false,
  disabled = false,
}: PlanCardProps) {
  const { t } = useLanguage();
  const plan: PlanDefinition = PLANS[planId];

  const planIcons: Record<PlanId, string> = {
    free: '🌱',
    premium: '⭐',
    institution: '🏫',
  };

  const getPriceLabel = () => {
    if (planId === 'free') return t('subscription.plan.free.price');
    if (planId === 'premium') return t('subscription.plan.premium.price');
    return t('subscription.plan.institution.price');
  };

  const renderFeatureItem = (text: string, included: boolean) => (
    <View key={text} style={styles.featureRow}>
      <AppText size="xs" style={{ marginRight: 8 }}>
        {included ? '✅' : '🔒'}
      </AppText>
      <AppText
        size="xs"
        weight={included ? 'medium' : 'regular'}
        color={included ? ThemeColors.textPrimary : ThemeColors.textMuted}
        style={{ flex: 1, lineHeight: 18 }}
      >
        {text}
      </AppText>
    </View>
  );

  const isHighlighted = planId === 'premium' || (planId === 'institution' && !isCurrentPlan);

  return (
    <Card
      style={[
        styles.cardContainer,
        isHighlighted && styles.highlightedBorder,
        isCurrentPlan && styles.currentPlanBorder,
      ]}
      padding={18}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconAndName}>
          <View style={styles.iconCircle}>
            <AppText size="lg">{planIcons[planId]}</AppText>
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
              {t(plan.nameKey)}
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
              {t(plan.taglineKey)}
            </AppText>
          </View>
        </View>

        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <AppText size="xs" weight="extrabold" color="#047857">
              {t('subscription.active')}
            </AppText>
          </View>
        )}
      </View>

      {/* Price Display */}
      <View style={styles.priceContainer}>
        <AppText size="xl" weight="extrabold" color={ThemeColors.primary}>
          {getPriceLabel()}
        </AppText>
      </View>

      <View style={styles.divider} />

      {/* Feature Checklist */}
      <View style={styles.featuresList}>
        {/* Child limit */}
        {renderFeatureItem(
          plan.childLimit === Infinity
            ? t('subscription.feature.unlimitedChildren')
            : t('subscription.feature.childLimit', { count: String(plan.childLimit) }),
          true
        )}

        {/* Basic reading */}
        {renderFeatureItem(t('subscription.feature.basicReading'), true)}

        {/* Recent vs Full History */}
        {planId === 'free'
          ? renderFeatureItem(t('subscription.feature.recentSessions'), true)
          : renderFeatureItem(t('subscription.feature.fullHistory'), true)}

        {/* Clinical error deep dive */}
        {renderFeatureItem(t('subscription.feature.errorDeepDive'), planId !== 'free')}

        {/* AI Recommendations Hub */}
        {renderFeatureItem(t('subscription.feature.recommendations'), planId !== 'free')}

        {/* PDF Report Export */}
        {renderFeatureItem(t('subscription.feature.pdfExport'), planId !== 'free')}

        {/* Teacher / Institution analytics */}
        {planId === 'institution' &&
          renderFeatureItem(t('subscription.feature.teacherAnalytics'), true)}
      </View>

      {/* Action CTA */}
      <View style={styles.ctaContainer}>
        {isCurrentPlan ? (
          <Button
            label={t('subscription.btn.current')}
            onPress={() => {}}
            variant="ghost"
            disabled={true}
            fullWidth={true}
          />
        ) : (
          <Button
            label={t('subscription.btn.upgrade')}
            onPress={onSelect || (() => {})}
            variant={planId === 'premium' ? 'primary' : 'secondary'}
            loading={loading}
            disabled={disabled}
            fullWidth={true}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: ThemeSpacing.md,
  },
  highlightedBorder: {
    borderColor: '#A7F3D0',
    borderWidth: 2,
    borderBottomColor: '#059669',
  },
  currentPlanBorder: {
    borderColor: ThemeColors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  priceContainer: {
    marginTop: ThemeSpacing.sm + 4,
    marginBottom: ThemeSpacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2ECE6',
    marginVertical: ThemeSpacing.sm,
  },
  featuresList: {
    gap: 8,
    marginVertical: ThemeSpacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaContainer: {
    marginTop: ThemeSpacing.md,
  },
});
