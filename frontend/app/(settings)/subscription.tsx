/**
 * nena-man · frontend/app/(settings)/subscription.tsx
 * Subscription & Plans Management Screen.
 *
 * Provides plan selection (Free, Premium, Institutional), status review,
 * mock checkout simulation, and navigation to institutional license management.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import PlanCard from '@/components/PlanCard';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useSubscriptionStoreBase } from '@/store/subscriptionStore';
import { subscriptionService } from '@/services/subscriptionService';
import { connectionService } from '@/services/connectionService';
import type { PlanId } from '@/types/subscription';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { entitlement, plan, isPremium, refresh, childLimit } = useEntitlement(user?.uid);
  const isChild = user?.role === 'child';

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<PlanId | null>(null);
  const [linkedChildCount, setLinkedChildCount] = useState<number>(0);

  // Modal for activating Institutional Plan (needs an institution name)
  const [showInstModal, setShowInstModal] = useState(false);
  const [institutionNameInput, setInstitutionNameInput] = useState('');
  const [instError, setInstError] = useState('');

  useEffect(() => {
    async function loadLinkedChildren() {
      if (!user?.uid) return;
      if (user.role === 'parent' || user.role === 'teacher') {
        try {
          const list = await connectionService.getLinkedChildren(user.uid, user.email);
          setLinkedChildCount(list?.length || 0);
        } catch {
          setLinkedChildCount(0);
        }
      }
    }
    loadLinkedChildren();
  }, [user?.uid, user?.email, user?.role]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const handleSelectPlan = async (targetPlan: PlanId) => {
    if (!user?.uid) return;

    if (isChild) {
      showAlert(
        'Nena Man',
        language === 'si'
          ? 'ශිෂ්‍ය ගිණුම් සඳහා සෘජු මිලදී ගැනීම් අවශ්‍ය නොවේ. ඔබගේ දෙමාපියන් හෝ ගුරුවරයා විසින් සැලසුම සක්‍රිය කළ පසු ඔබගේ ගිණුමටද එම පහසුකම් ස්වයංක්‍රීයව ලැබේ.'
          : 'Child accounts do not require direct subscription purchases. Once your parent or teacher upgrades, your account will automatically be included.'
      );
      return;
    }

    if (targetPlan === 'institution') {
      setInstitutionNameInput(user.schoolName || '');
      setInstError('');
      setShowInstModal(true);
      return;
    }

    if (targetPlan === 'premium') {
      try {
        setIsProcessing(true);
        setSelectedPlanToUpgrade('premium');
        const newEntitlement = await subscriptionService.subscribePremium({
          uid: user.uid,
          name: user.fullName || user.displayName || 'Parent',
          email: user.email,
          role: user.role,
        });
        useSubscriptionStoreBase.getState().setEntitlement(user.uid, newEntitlement);
        showAlert(
          '🎉 ' + t('subscription.plan.premium.name'),
          'ප්‍රිමියම් සැලසුම සාර්ථකව සක්‍රිය කරන ලදී! සියලු විශ්ලේෂණ විශේෂාංග දැන් විවෘතයි.'
        );
      } catch (err: any) {
        showAlert('Error', err?.message || 'Failed to activate plan.');
      } finally {
        setIsProcessing(false);
        setSelectedPlanToUpgrade(null);
      }
    }
  };

  const handleActivateInstitution = async () => {
    if (!institutionNameInput.trim()) {
      setInstError('කරුණාකර ආයතනයේ හෝ පාසලේ නම ඇතුළත් කරන්න.');
      return;
    }
    if (!user?.uid) return;

    try {
      setIsProcessing(true);
      const res = await subscriptionService.subscribeInstitution(
        {
          uid: user.uid,
          name: user.fullName || user.displayName || 'Administrator',
          email: user.email,
          role: user.role,
        },
        institutionNameInput.trim()
      );
      useSubscriptionStoreBase.getState().setEntitlement(user.uid, res.entitlement);
      setShowInstModal(false);
      showAlert(
        '🏫 ' + t('subscription.plan.institution.name'),
        'ආයතනික බලපත්‍රය සාර්ථකව සක්‍රිය කරන ලදී! ඔබට දැන් ගුරුවරුන් සහ දෙමාපියන් සම්බන්ධ කරගත හැක.',
        () => {
          router.push('/(parent)/institution');
        }
      );
    } catch (err: any) {
      setInstError(err?.message || 'Failed to activate institutional plan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    const confirmCancel = () => {
      void (async () => {
        if (!user?.uid) return;
        try {
          setIsProcessing(true);
          const cancelledEnt = await subscriptionService.cancelSubscription(user.uid);
          useSubscriptionStoreBase.getState().setEntitlement(user.uid, cancelledEnt);
          showAlert('Nena Man', t('subscription.cancelSuccess'));
        } catch (err: any) {
          showAlert('Error', err?.message || 'Failed to cancel.');
        } finally {
          setIsProcessing(false);
        }
      })();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('subscription.cancelConfirm'))) {
        confirmCancel();
      }
    } else {
      Alert.alert('Nena Man', t('subscription.cancelConfirm'), [
        { text: t('common.close'), style: 'cancel' },
        { text: t('subscription.cancelPlan'), style: 'destructive', onPress: confirmCancel },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        showBack={true}
        fallbackRoute="/(settings)/settings"
        showSettings={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── CURRENT PLAN STATUS BANNER ── */}
        <Card style={styles.statusCard} padding={18}>
          <View style={styles.statusHeaderRow}>
            <View>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('subscription.currentPlan')}
              </AppText>
              <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 2 }}>
                {plan === 'free'
                  ? t('subscription.plan.free.name')
                  : plan === 'premium'
                  ? t('subscription.plan.premium.name')
                  : t('subscription.plan.institution.name')}
              </AppText>
            </View>

            <View
              style={[
                styles.statusBadge,
                entitlement.status === 'active'
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <AppText
                size="xs"
                weight="extrabold"
                color={entitlement.status === 'active' ? '#047857' : '#B91C1C'}
              >
                {entitlement.status === 'active'
                  ? t('subscription.active')
                  : entitlement.status === 'cancelled'
                  ? t('subscription.cancelled')
                  : t('subscription.expired')}
              </AppText>
            </View>
          </View>

          {entitlement.expiresAt && (
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 8 }}>
              {t('subscription.expiresOn', {
                date: new Date(entitlement.expiresAt).toLocaleDateString(),
              })}
            </AppText>
          )}

          {entitlement.source === 'institution' && entitlement.institutionName && (
            <View style={styles.institutionInfoBox}>
              <AppText size="xs" weight="bold" color="#1E3A8A">
                🏫 {entitlement.institutionName} ({entitlement.institutionRole === 'admin' ? 'පරිපාලක / Admin' : 'සාමාජික / Member'})
              </AppText>
            </View>
          )}

          {/* If inherited from parent / teacher */}
          {entitlement.inheritedFromGuardian && (
            <View style={styles.inheritedInfoBox}>
              <AppText size="xs" weight="bold" color="#047857">
                👨‍👩‍👧 {t('subscription.inheritedFrom')}: {entitlement.guardianName || (language === 'si' ? 'දෙමාපිය / ගුරු ගිණුම' : 'Guardian')} (
                {entitlement.guardianRole === 'teacher'
                  ? (language === 'si' ? 'ගුරුතුමා / ගුරුතුමිය' : 'Teacher')
                  : (language === 'si' ? 'දෙමාපියන්' : 'Parent')}
                )
              </AppText>
            </View>
          )}

          {/* Child Accounts Quota / Limit Row */}
          <View style={styles.childCountRow}>
            <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
              👥 {t('subscription.childAccounts')}:
            </AppText>
            <AppText size="xs" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              {isChild
                ? (childLimit === Infinity
                    ? t('subscription.feature.unlimitedChildren')
                    : t('subscription.feature.childLimit', { count: String(childLimit) }))
                : `${linkedChildCount} / ${
                    childLimit === Infinity
                      ? t('subscription.feature.unlimitedChildren')
                      : childLimit
                  }`}
            </AppText>
          </View>

          {/* Action Row for Active Plans */}
          <View style={styles.currentPlanActions}>
            {entitlement.source === 'institution' && entitlement.institutionRole === 'admin' ? (
              <Button
                label={t('subscription.btn.manageInstitution')}
                onPress={() => router.push('/(parent)/institution')}
                variant="secondary"
                size="sm"
                style={{ flex: 1, marginRight: 8 }}
              />
            ) : null}

            {isChild && isPremium ? (
              <View style={styles.childActiveBox}>
                <AppText size="xs" weight="extrabold" color="#047857">
                  ✓ {language === 'si' ? 'සියලු ප්‍රිමියම් විශේෂාංග විවෘතයි' : 'All premium features active'}
                </AppText>
              </View>
            ) : !isChild && isPremium ? (
              <Button
                label={t('subscription.cancelPlan')}
                onPress={handleCancelSubscription}
                variant="danger"
                size="sm"
                loading={isProcessing}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </Card>

        {/* ── JOIN INSTITUTION SHORTCUT (FOR NON-INSTITUTION USERS) ── */}
        {!isChild && entitlement.source !== 'institution' && (
          <TouchableOpacity
            style={[styles.joinBanner, ThemeShadow.sm]}
            onPress={() => router.push('/(parent)/join-institution')}
            activeOpacity={0.8}
          >
            <View style={styles.joinBannerIcon}>
              <AppText size="md">🏫</AppText>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <AppText size="sm" weight="extrabold" color="#1E3A8A">
                {t('subscription.btn.joinInstitution')}
              </AppText>
              <AppText size="xs" color="#3B82F6" style={{ marginTop: 2 }}>
                {t('institution.join.subtitle')} →
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        {/* ── THREE PLANS LIST ── */}
        <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionHeader}>
          {t('subscription.title')}
        </AppText>

        {/* Free Plan */}
        <PlanCard
          planId="free"
          isCurrentPlan={plan === 'free'}
          onSelect={() => {}}
        />

        {/* Premium Plan (Rs. 999/=) */}
        <PlanCard
          planId="premium"
          isCurrentPlan={plan === 'premium'}
          onSelect={() => handleSelectPlan('premium')}
          loading={isProcessing && selectedPlanToUpgrade === 'premium'}
          disabled={isProcessing}
        />

        {/* Institutional Plan (Rs. 3000/=) */}
        <PlanCard
          planId="institution"
          isCurrentPlan={plan === 'institution'}
          onSelect={() => handleSelectPlan('institution')}
          loading={isProcessing && selectedPlanToUpgrade === 'institution'}
          disabled={isProcessing}
        />

        {/* ── MOCK DISCLAIMER ── */}
        <View style={styles.disclaimerCard}>
          <AppText size="xs" color="#047857" style={{ lineHeight: 18 }}>
            {t('subscription.mockNote')}
          </AppText>
        </View>
      </ScrollView>

      {/* ── MODAL: INSTITUTION SETUP ── */}
      <Modal visible={showInstModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, ThemeShadow.md]}>
            <View style={styles.modalHeader}>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                🏫 {t('institution.create.title')}
              </AppText>
              <TouchableOpacity onPress={() => setShowInstModal(false)} activeOpacity={0.7}>
                <AppText size="sm" color={ThemeColors.textMuted}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4, marginBottom: 14 }}>
              පාසල් සහ මධ්‍යස්ථාන සඳහා අසීමිත ශිෂ්‍ය ගිණුම් සහ ආරාධනා කේත (Invite code) මඟින් ගුරුවරුන් සම්බන්ධ කිරීමේ පහසුකම.
            </AppText>

            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 6 }}>
              {t('institution.create.nameLabel')}
            </AppText>
            <TextInput
              style={styles.textInput}
              value={institutionNameInput}
              onChangeText={(text) => {
                setInstitutionNameInput(text);
                setInstError('');
              }}
              placeholder={t('institution.create.namePlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            {instError ? (
              <AppText size="xs" color={ThemeColors.error} style={{ marginTop: 6 }}>
                ⚠️ {instError}
              </AppText>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                label={t('common.close')}
                onPress={() => setShowInstModal(false)}
                variant="ghost"
                size="md"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                label={t('institution.create.submit')}
                onPress={handleActivateInstitution}
                variant="primary"
                size="md"
                loading={isProcessing}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scroll: {
    padding: ThemeSpacing.md,
    paddingBottom: 40,
  },
  statusCard: {
    marginBottom: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2ECE6',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.pill,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  institutionInfoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inheritedInfoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  childCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  childActiveBox: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanActions: {
    flexDirection: 'row',
    marginTop: ThemeSpacing.md,
  },
  joinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    borderRadius: ThemeRadius.kidCard,
    padding: 14,
    marginBottom: ThemeSpacing.lg,
  },
  joinBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: ThemeSpacing.sm,
  },
  disclaimerCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: ThemeRadius.md,
    padding: 14,
    marginTop: ThemeSpacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.kidCard,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: ThemeColors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
});
