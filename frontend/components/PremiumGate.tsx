/**
 * nena-man · frontend/components/PremiumGate.tsx
 * Purely additive entitlement gate component.
 *
 * Wraps existing premium-eligible UI. When the active user has an active
 * Premium or Institutional entitlement for the requested feature, it renders
 * `children` verbatim without altering any inner component behavior.
 * When locked, it renders an aesthetic upgrade prompt built from the
 * Nena-Man design system tokens.
 *
 * LIMITATION: entitlement is checked client-side only; Firestore Spark plan has
 * no Cloud Functions for server-side verification. Acceptable for
 * mocked/research-phase subscriptions.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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
import { useEntitlement } from '@/hooks/useEntitlement';
import type { PremiumFeature } from '@/types/subscription';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  compact?: boolean;
}

export default function PremiumGate({
  feature,
  children,
  fallbackTitle,
  fallbackDescription,
  compact = false,
}: PremiumGateProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { canUse, isResolved } = useEntitlement();

  // If user is entitled, render the guarded content directly
  if (canUse(feature)) {
    return <>{children}</>;
  }

  const title = fallbackTitle || t('gate.title');
  const description = fallbackDescription || t('gate.desc');

  const handleUpgradePress = () => {
    router.push('/(settings)/subscription');
  };

  if (compact) {
    return (
      <Card style={styles.compactCard} padding={12}>
        <View style={styles.compactRow}>
          <AppText size="md" style={{ marginRight: 8 }}>
            🔒
          </AppText>
          <View style={{ flex: 1 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              {title}
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
              {description}
            </AppText>
          </View>
          <Button
            label={t('gate.viewPlans')}
            onPress={handleUpgradePress}
            size="sm"
            variant="secondary"
            style={{ marginLeft: 8 }}
          />
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.lockedCard, ThemeShadow.md]} padding={24}>
      <View style={styles.lockIconCircle}>
        <AppText size="xl">🔒</AppText>
      </View>

      <View style={styles.badgeWrap}>
        <View style={styles.premiumBadge}>
          <AppText size="xs" weight="extrabold" color="#92400E">
            ⭐ {t('gate.badge')}
          </AppText>
        </View>
      </View>

      <AppText
        size="md"
        weight="extrabold"
        color={ThemeColors.textPrimary}
        align="center"
        style={{ marginTop: ThemeSpacing.sm }}
      >
        {title}
      </AppText>

      <AppText
        size="xs"
        color={ThemeColors.textSecondary}
        align="center"
        style={styles.descText}
      >
        {description}
      </AppText>

      <Button
        label={t('gate.upgradeBtn')}
        onPress={handleUpgradePress}
        variant="primary"
        size="md"
        style={styles.actionBtn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderBottomColor: '#FCD34D',
    alignItems: 'center',
    marginVertical: ThemeSpacing.md,
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  badgeWrap: {
    marginVertical: 4,
  },
  premiumBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.pill,
  },
  descText: {
    lineHeight: 20,
    maxWidth: 320,
    marginTop: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.md,
  },
  actionBtn: {
    minWidth: 200,
  },
  compactCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#FCD34D',
    marginVertical: ThemeSpacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
