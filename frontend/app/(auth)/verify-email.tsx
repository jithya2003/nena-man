/**
 * nena-man · frontend/app/(auth)/verify-email.tsx
 * Email Verification Screen.
 * Uses global LanguageContext for interface translations.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reload, sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AppText from '@/components/AppText';
import { UserProfile, UserRole } from '@/types';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, unverified } = useLocalSearchParams<{ email: string; unverified?: string }>();
  const { setUserSession } = useAuth();
  const { language, t } = useLanguage();

  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    unverified === 'true'
      ? t('auth.verifyEmail.desc')
      : ''
  );
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>(
    unverified === 'true' ? 'error' : ''
  );

  const handleCheckVerification = async () => {
    const isFallback = (auth as any)?.isFallback;
    const currentUser = auth?.currentUser;

    if (isFallback) {
      setIsCheckingVerification(true);
      setStatusType('success');
      setStatusMessage(
        language === 'si'
          ? 'විද්‍යුත් තැපෑල සාර්ථකව සත්‍යාපනය කරන ලදී! (Local Dev Mode)'
          : 'Email verified successfully! (Local Dev Mode)'
      );
      setTimeout(() => {
        router.replace('/(parent)/dashboard');
      }, 1000);
      return;
    }

    if (!currentUser) {
      setStatusType('error');
      setStatusMessage(
        language === 'si'
          ? 'ගිණුම හමු නොවීය. කරුණාකර නැවත ලොගින් වන්න.'
          : 'Session expired. Please log in again.'
      );
      return;
    }

    setIsCheckingVerification(true);
    setStatusMessage('');
    try {
      await reload(currentUser);

      if (currentUser.emailVerified) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            emailVerified: true,
          });
        } catch (e) {
          console.warn('[VerifyEmail] Firestore update warning:', e);
        }

        let userRole: UserRole = 'parent';

        try {
          const token = await currentUser.getIdToken();
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          const docData = snap.exists() ? snap.data() : {};
          userRole = (docData.role as UserRole) || 'parent';
          const profile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || email,
            displayName: docData.displayName || currentUser.displayName || (userRole === 'child' ? 'ශිෂ්‍යයා' : 'දෙමාපියන්'),
            role: userRole,
            age: docData.age,
            grade: docData.grade,
            schoolName: docData.schoolName,
            createdAt: docData.createdAt || new Date().toISOString(),
            emailVerified: true,
            childProfile: docData.childProfile,
          };
          await setUserSession(profile, token);
        } catch (sessionErr) {
          console.warn('[VerifyEmail] Session establish warning:', sessionErr);
        }

        setStatusType('success');
        setStatusMessage('විද්‍යුත් තැපෑල සාර්ථකව සත්‍යාපනය කරන ලදී! (Email verified successfully!)');
        setTimeout(() => {
          if (userRole === 'child') {
            router.replace('/(child)/home');
          } else {
            router.replace('/(parent)/dashboard');
          }
        }, 1200);
      } else {
        setStatusType('error');
        setStatusMessage(
          language === 'si'
            ? 'ඔබගේ විද්‍යුත් තැපෑල තවම සත්‍යාපනය කර නොමැත. ඊමේල් සබැඳිය ක්ලික් කරන්න.'
            : 'Email not yet verified. Please click the link in your inbox.'
        );
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(
        language === 'si'
          ? 'දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    const isFallback = (auth as any)?.isFallback;
    if (isFallback) {
      setStatusType('success');
      setStatusMessage(
        language === 'si'
          ? 'Local Dev Mode: ඊමේල් සත්‍යාපනය මඟ හැර ඇත.'
          : 'Local Dev Mode: Firebase keys not set in .env. Verification email bypassed.'
      );
      return;
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) return;

    setIsResending(true);
    setStatusMessage('');
    try {
      await sendEmailVerification(currentUser);
      setStatusType('success');
      setStatusMessage(
        language === 'si'
          ? 'සත්‍යාපන ඊමේල් නැවත යවන ලදී. ඔබගේ inbox පරීක්ෂා කරන්න.'
          : 'Verification email resent. Please check your inbox.'
      );
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(
        language === 'si'
          ? 'ඊමේල් නැවත යැවීම අසාර්ථකයි. කරුණාකර ටික වේලාවකින් නැවත උත්සාහ කරන්න.'
          : 'Could not resend email. Please wait a moment and try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <AppText style={styles.icon}>📧</AppText>
        </View>

        <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center" style={styles.title}>
          {t('auth.verifyEmail.title')}
        </AppText>

        <View style={styles.infoBox}>
          <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ lineHeight: 22 }}>
            {email || 'Your Email'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 8, lineHeight: 18 }}>
            {t('auth.verifyEmail.desc')}
          </AppText>
        </View>

        {statusMessage ? (
          <View
            style={[
              styles.statusBox,
              statusType === 'success' ? styles.statusSuccess : styles.statusError,
            ]}
          >
            <AppText
              size="xs"
              weight="bold"
              color={statusType === 'success' ? '#166534' : '#991B1B'}
              align="center"
            >
              {statusType === 'success' ? '✅ ' : '⚠️ '}
              {statusMessage}
            </AppText>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, isCheckingVerification && { opacity: 0.7 }]}
          onPress={handleCheckVerification}
          disabled={isCheckingVerification}
          activeOpacity={0.85}
        >
          {isCheckingVerification ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <AppText size="md" weight="bold" color="#FFFFFF" align="center">
              {t('auth.verifyEmail.checkBtn')} →
            </AppText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, isResending && { opacity: 0.6 }]}
          onPress={handleResendEmail}
          disabled={isResending}
          activeOpacity={0.7}
        >
          {isResending ? (
            <ActivityIndicator color={ThemeColors.textSecondary} size="small" />
          ) : (
            <AppText size="sm" weight="medium" color={ThemeColors.textSecondary} align="center">
              {t('auth.verifyEmail.resendBtn')}
            </AppText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <AppText size="xs" weight="bold" color={ThemeColors.primary}>
            ← {t('auth.register.loginLink')}
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.lg,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.xl,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
    ...ThemeShadow.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ThemeColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    width: '100%',
    marginVertical: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBox: {
    borderRadius: ThemeRadius.sm,
    padding: ThemeSpacing.sm,
    width: '100%',
    marginBottom: ThemeSpacing.md,
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  primaryBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm + 4,
    paddingHorizontal: ThemeSpacing.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.sm,
  },
  resendBtn: {
    marginTop: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs,
  },
  backLink: {
    marginTop: ThemeSpacing.lg,
  },
});
