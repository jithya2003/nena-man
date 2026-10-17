/**
 * nena-man · frontend/app/(parent)/join-institution.tsx
 * Join Institution Screen.
 *
 * Allows parents and teachers to enter an institutional invite code
 * to link their account to an active school or center license.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
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
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { subscriptionService } from '@/services/subscriptionService';

export default function JoinInstitutionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { refresh } = useEntitlement();

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage(t('institution.join.errorNotFound'));
      return;
    }
    if (!user?.uid) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await subscriptionService.joinInstitution(
        {
          uid: user.uid,
          name: user.fullName || user.displayName || 'Member',
          email: user.email,
          role: user.role,
        },
        code
      );
      await refresh();

      const successMsg = t('institution.join.success');
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.replace('/(settings)/subscription');
      } else {
        Alert.alert('Nena Man', successMsg, [
          {
            text: 'OK',
            onPress: () => router.replace('/(settings)/subscription'),
          },
        ]);
      }
    } catch (err: any) {
      if (err?.message === 'INSTITUTION_NOT_FOUND') {
        setErrorMessage(t('institution.join.errorNotFound'));
      } else if (err?.message === 'INSTITUTION_INACTIVE') {
        setErrorMessage(t('institution.join.errorInactive'));
      } else if (err?.message === 'ROLE_NOT_ALLOWED') {
        setErrorMessage(t('institution.join.errorRole'));
      } else {
        setErrorMessage(err?.message || 'Failed to join institution');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title={t('institution.join.title')}
        subtitle={t('institution.join.subtitle')}
        showBack={true}
        fallbackRoute="/(settings)/subscription"
        showSettings={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={[styles.card, ThemeShadow.md]} padding={24}>
          <View style={styles.iconCircle}>
            <AppText size="xl">🏫</AppText>
          </View>

          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} align="center" style={{ marginTop: 8 }}>
            {t('institution.join.title')}
          </AppText>

          <AppText
            size="xs"
            color={ThemeColors.textSecondary}
            align="center"
            style={{ marginTop: 6, marginBottom: 20, lineHeight: 18 }}
          >
            {t('institution.join.subtitle')}
          </AppText>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 6 }}>
              {t('institution.join.codeLabel')}
            </AppText>
            <TextInput
              style={styles.textInput}
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setErrorMessage('');
              }}
              placeholder={t('institution.join.codePlaceholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <AppText size="xs" color={ThemeColors.error} weight="bold">
                ⚠️ {errorMessage}
              </AppText>
            </View>
          ) : null}

          <Button
            label={isSubmitting ? t('institution.join.joining') : t('institution.join.submit')}
            onPress={handleJoin}
            variant="primary"
            size="md"
            loading={isSubmitting}
            fullWidth={true}
            style={{ marginTop: ThemeSpacing.md }}
          />
        </Card>
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
    paddingTop: ThemeSpacing.xl,
  },
  card: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    width: '100%',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    color: ThemeColors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ThemeRadius.sm,
    padding: 10,
    marginTop: 10,
  },
});
