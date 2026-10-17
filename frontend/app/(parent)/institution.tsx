/**
 * nena-man · frontend/app/(parent)/institution.tsx
 * Institutional License Management Screen.
 *
 * For school and center administrators to view active license details,
 * manage and share the 6-character invite code, and view/remove members.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
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
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { subscriptionService } from '@/services/subscriptionService';
import type { Institution, InstitutionMember } from '@/types/subscription';

export default function InstitutionManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { entitlement, refresh } = useEntitlement();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const institutionId = entitlement.institutionId;
  const isAdmin = entitlement.institutionRole === 'admin';

  useEffect(() => {
    async function loadInstitution() {
      if (!institutionId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await subscriptionService.getInstitution(institutionId);
        setInstitution(data);
      } catch (err) {
        console.warn('[InstitutionScreen] Error loading institution:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInstitution();
  }, [institutionId]);

  const handleCopyCode = () => {
    if (!institution?.inviteCode) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(institution.inviteCode);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleRemoveMember = (member: InstitutionMember) => {
    if (!institutionId) return;

    const confirmRemove = async () => {
      try {
        setIsProcessing(true);
        const updated = await subscriptionService.removeMember(institutionId, member.uid);
        if (updated) setInstitution(updated);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to remove member');
      } finally {
        setIsProcessing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${member.name}: ${t('institution.removeMemberConfirm')}`)) {
        void confirmRemove();
      }
    } else {
      Alert.alert(
        member.name,
        t('institution.removeMemberConfirm'),
        [
          { text: t('common.close'), style: 'cancel' },
          { text: t('institution.removeMember'), style: 'destructive', onPress: confirmRemove },
        ]
      );
    }
  };

  const handleLeaveInstitution = () => {
    const confirmLeave = async () => {
      if (!user?.uid) return;
      try {
        setIsProcessing(true);
        await subscriptionService.leaveInstitution(user.uid);
        await refresh();
        router.replace('/(settings)/subscription');
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to leave institution');
      } finally {
        setIsProcessing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('institution.leaveConfirm'))) {
        void confirmLeave();
      }
    } else {
      Alert.alert(
        'Nena Man',
        t('institution.leaveConfirm'),
        [
          { text: t('common.close'), style: 'cancel' },
          { text: t('institution.leave'), style: 'destructive', onPress: confirmLeave },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title={t('institution.title')}
        subtitle={institution?.name || t('institution.subtitle')}
        showBack={true}
        fallbackRoute="/(settings)/subscription"
        showSettings={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── CARD 1: LICENSE STATUS OVERVIEW ── */}
        <Card style={styles.card} padding={18}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('institution.subtitle')}
              </AppText>
              <AppText size="lg" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 2 }}>
                {institution?.name || entitlement.institutionName || 'පාසල / මධ්‍යස්ථානය'}
              </AppText>
            </View>

            <View style={styles.activeBadge}>
              <AppText size="xs" weight="extrabold" color="#047857">
                {t('subscription.active')}
              </AppText>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <AppText size="xs" color={ThemeColors.textMuted}>
                දරුවන්ගේ ගිණුම්
              </AppText>
              <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                අසීමිතයි (Unlimited)
              </AppText>
            </View>

            {institution?.expiresAt && (
              <View style={styles.infoCol}>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  කල් ඉකුත්වන්නේ
                </AppText>
                <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                  {new Date(institution.expiresAt).toLocaleDateString()}
                </AppText>
              </View>
            )}
          </View>
        </Card>

        {/* ── CARD 2: INVITE CODE BOX ── */}
        <Card style={[styles.card, styles.inviteCard]} padding={20}>
          <View style={styles.inviteIconCircle}>
            <AppText size="lg">🔑</AppText>
          </View>
          <AppText size="xs" color="#1E3A8A" weight="bold" align="center" style={{ marginTop: 8 }}>
            {t('institution.inviteCode')}
          </AppText>
          <AppText
            size="xl"
            weight="extrabold"
            color="#1E3A8A"
            align="center"
            style={styles.codeText}
          >
            {institution?.inviteCode || '...'}
          </AppText>
          <AppText
            size="xs"
            color={ThemeColors.textSecondary}
            align="center"
            style={{ marginBottom: 14, lineHeight: 18 }}
          >
            {t('institution.inviteCodeDesc')}
          </AppText>

          <Button
            label={isCopied ? t('institution.copied') : '📋 කේතය පිටපත් කරන්න (Copy Code)'}
            onPress={handleCopyCode}
            variant="secondary"
            size="md"
            fullWidth={true}
          />
        </Card>

        {/* ── CARD 3: MEMBERS LIST ── */}
        <Card style={styles.card} padding={18}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
              👥 {t('institution.members')} ({institution?.members.length || 0})
            </AppText>
          </View>

          {institution?.members && institution.members.length > 0 ? (
            <View style={styles.membersList}>
              {institution.members.map((member) => (
                <View key={member.uid} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <AppText size="sm">
                      {member.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                      {member.name}
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 1 }}>
                      {member.role === 'teacher' ? 'ගුරුතුමා / ගුරුතුමිය' : 'දෙමාපියන්'} ·{' '}
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </AppText>
                  </View>

                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(member)}
                      style={styles.removeBtn}
                      activeOpacity={0.7}
                    >
                      <AppText size="xs" color={ThemeColors.error} weight="bold">
                        {t('institution.removeMember')}
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyMembersBox}>
              <AppText size="xs" color={ThemeColors.textMuted} align="center">
                {t('institution.noMembers')}
              </AppText>
            </View>
          )}
        </Card>

        {/* Leave button for members */}
        {!isAdmin && (
          <Button
            label={t('institution.leave')}
            onPress={handleLeaveInstitution}
            variant="ghost"
            size="sm"
            loading={isProcessing}
            style={{ marginTop: ThemeSpacing.md }}
          />
        )}
      </ScrollView>
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
  card: {
    marginBottom: ThemeSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  infoGrid: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2ECE6',
  },
  infoCol: {
    flex: 1,
  },
  inviteCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  inviteIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    letterSpacing: 4,
    marginVertical: 6,
  },
  sectionHeaderRow: {
    marginBottom: ThemeSpacing.sm,
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ThemeRadius.sm,
    backgroundColor: '#FEE2E2',
  },
  emptyMembersBox: {
    paddingVertical: 20,
  },
});
