/**
 * nena-man · frontend/app/(auth)/verify-email.tsx
 * Email Verification Screen.
 * Shown after registration — user must verify their email before accessing the dashboard.
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
import AppText from '@/components/AppText';
import { UserProfile, UserRole } from '@/types';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';

import { AppStorage } from '@/utils/storage';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, unverified } = useLocalSearchParams<{ email: string; unverified?: string }>();
  const { setUserSession } = useAuth();

  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    unverified === 'true'
      ? 'පුවරුවට පිවිසීමට පෙර කරුණාකර ඔබගේ විද්‍යුත් තැපෑල සත්‍යාපනය කරන්න. (Please verify your email before accessing the dashboard.)'
      : ''
  );
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>(
    unverified === 'true' ? 'error' : ''
  );

  const handleCheckVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatusType('error');
      setStatusMessage(
        'ගිණුම හමු නොවීය. කරුණාකර නැවත ලොගින් වන්න. (Session expired. Please log in again.)'
      );
      return;
    }

    setIsCheckingVerification(true);
    setStatusMessage('');
    try {
      // Force refresh the Firebase Auth token to get latest emailVerified status
      await reload(currentUser);

      if (currentUser.emailVerified) {
        // Update Firestore to mark email as verified
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            emailVerified: true,
          });
        } catch (e) {
          console.warn('[VerifyEmail] Firestore update warning:', e);
        }

        // Establish active authenticated session now that email is verified
        try {
          const token = await currentUser.getIdToken();
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          const docData = snap.exists() ? snap.data() : {};
          const profile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || email,
            displayName: docData.displayName || currentUser.displayName || 'පෙරේරා මහතා',
            role: (docData.role as UserRole) || 'parent',
            age: docData.age,
            grade: docData.grade,
            schoolName: docData.schoolName,
            createdAt: docData.createdAt || new Date().toISOString(),
            emailVerified: true,
          };
          await setUserSession(profile, token);
        } catch (sessionErr) {
          console.warn('[VerifyEmail] Session establish warning:', sessionErr);
        }

        setStatusType('success');
        setStatusMessage('විද්‍යුත් තැපෑල සාර්ථකව සත්‍යාපනය කරන ලදී! (Email verified successfully!)');
        // Navigate to parent dashboard after a short delay
        setTimeout(() => {
          router.replace('/(parent)/dashboard');
        }, 1200);
      } else {
        setStatusType('error');
        setStatusMessage(
          'ඔබගේ විද්‍යුත් තැපෑල තවම සත්‍යාපනය කර නොමැත. ඊමේල් සබැඳිය ක්ලික් කරන්න. (Email not yet verified. Please click the link in your inbox.)'
        );
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage('දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න. (An error occurred. Please try again.)');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsResending(true);
    setStatusMessage('');
    try {
      await sendEmailVerification(currentUser);
      setStatusType('success');
      setStatusMessage(
        'සත්‍යාපන ඊමේල් නැවත යවන ලදී. ඔබගේ inbox පරීක්ෂා කරන්න. (Verification email resent. Please check your inbox.)'
      );
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(
        'ඊමේල් නැවත යැවීම අසාර්ථකයි. කරුණාකර ටික වේලාවකින් නැවත උත්සාහ කරන්න. (Could not resend email. Please wait a moment and try again.)'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <AppText style={styles.icon}>📧</AppText>
        </View>

        {/* Heading */}
        <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center" style={styles.title}>
          විද්‍යුත් තැපෑල සත්‍යාපනය කරන්න
        </AppText>
        <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} align="center" style={styles.subtitle}>
          Verify Your Email Address
        </AppText>

        {/* Body */}
        <View style={styles.infoBox}>
          <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ lineHeight: 22 }}>
            සත්‍යාපන සබැඳියක් යවා ඇත:
          </AppText>
          <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} align="center" style={{ marginTop: 4 }}>
            {email || 'ඔබගේ විද්‍යුත් තැපෑල'}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 8, lineHeight: 18 }}>
            ඊමේල් වලින් සබැඳිය ක්ලික් කිරීමෙන් පසු, "සත්‍යාපිත, දිගටම" ක්ලික් කරන්න.{'\n'}
            (After clicking the link in your email, press "I've Verified, Continue".)
          </AppText>
        </View>

        {/* Status Message */}
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

        {/* Primary CTA */}
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
              සත්‍යාපිතයි, දිගටම යන්න →
            </AppText>
          )}
        </TouchableOpacity>

        {/* Resend Link */}
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
              ඊමේල් නොලැබුණිද?{' '}
              <AppText size="sm" weight="bold" color={ThemeColors.primary}>
                නැවත යවන්න
              </AppText>
            </AppText>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
          style={{ marginTop: ThemeSpacing.sm }}
        >
          <AppText size="xs" weight="medium" color={ThemeColors.textMuted} align="center">
            ← ලොගින් පිටුවට යන්න (Back to Login)
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Calming light green background
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ThemeSpacing.lg,
    ...(Platform.OS === 'web'
      ? { minHeight: '100vh' as any }
      : {}),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.xl,
    borderWidth: 1.5,
    borderColor: '#BCE6CB', // Soft mint border
    alignItems: 'center',
    ...ThemeShadow.md,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7', // Refreshing light green circle
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    marginBottom: 4,
    color: '#172B20',
  },
  subtitle: {
    marginBottom: ThemeSpacing.md,
    color: '#0B7A44',
  },
  infoBox: {
    backgroundColor: '#EAF7EE', // Soothing light green container
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#BCE6CB',
    width: '100%',
    marginBottom: ThemeSpacing.md,
  },
  statusBox: {
    width: '100%',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#0B7A44', // Deep emerald green
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.md,
    ...ThemeShadow.sm,
  },
  resendBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#E8F6ED', // Soft mint button
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B2E2C3',
  },
});
