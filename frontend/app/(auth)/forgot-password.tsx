import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
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
import Button from '@/components/Button';
import Card from '@/components/Card';
import NavBar from '@/components/NavBar';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await authService.sendPasswordResetEmail(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title="Reset Password"
        subtitle="Account recovery"
        showBack={true}
        fallbackRoute="/(auth)/login"
        showSettings={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          {!isSubmitted ? (
            <View style={styles.cardWrapper}>
              <View style={styles.iconWrap}>
                <AppText style={styles.icon}>🔐</AppText>
              </View>
              <View style={styles.headerInfo}>
                <AppText size="xl" weight="extrabold" color="#172B20" align="center">
                  මුරපදය නැවත සකසන්න
                </AppText>
                <AppText size="xs" weight="bold" color="#0B7A44" align="center" style={{ marginTop: 2 }}>
                  Forgot your password?
                </AppText>
                <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginTop: ThemeSpacing.xs, lineHeight: 20 }}>
                  ලියාපදිංචි විද්‍යුත් තැපෑල ඇතුළත් කරන්න. ඔබට මුරපදය නැවත සැකසීමේ සබැඳියක් ලැබෙනු ඇත.
                </AppText>
              </View>

              {errorMessage ? (
                <View style={styles.errorAlert}>
                  <AppText size="sm">⚠️</AppText>
                  <AppText size="xs" weight="bold" color={ThemeColors.error} style={{ flex: 1 }}>
                    {errorMessage}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <AppText size="xs" weight="bold" color="#172B20" style={styles.inputLabel}>
                  Registered Email Address (විද්‍යුත් තැපෑල)
                </AppText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. parent@example.com"
                  placeholderTextColor={ThemeColors.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <Button
                label={isSubmitting ? 'Sending instructions...' : 'Send Reset Instructions ✉️'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                fullWidth
                size="lg"
                style={{ marginTop: ThemeSpacing.md, backgroundColor: '#0B7A44' }}
              />

              <Button
                label="← Back to Sign In"
                onPress={() => router.back()}
                variant="ghost"
                fullWidth
                style={{ marginTop: ThemeSpacing.sm }}
              />
            </View>
          ) : (
            <View style={styles.cardWrapper}>
              <View style={styles.iconWrap}>
                <AppText style={styles.icon}>✉️</AppText>
              </View>
              <AppText size="xl" weight="extrabold" color="#172B20" align="center">
                උපදෙස් යවන ලදී!
              </AppText>
              <AppText size="xs" weight="bold" color="#0B7A44" align="center" style={{ marginTop: 2 }}>
                Instructions Sent!
              </AppText>
              <View style={styles.infoBox}>
                <AppText
                  size="sm"
                  color={ThemeColors.textSecondary}
                  align="center"
                  style={{ lineHeight: 22 }}
                >
                  We've sent password reset instructions to{' '}
                  <AppText size="sm" weight="bold" color="#172B20">
                    {email}
                  </AppText>
                  .{'\n'}කරුණාකර ඔබගේ inbox හෝ spam ෆෝල්ඩරය පරීක්ෂා කරන්න.
                </AppText>
              </View>

              <Button
                label="Return to Sign In →"
                onPress={() => router.replace('/(auth)/login')}
                fullWidth
                size="lg"
                style={{ marginTop: ThemeSpacing.sm, backgroundColor: '#0B7A44' }}
              />

              <Button
                label="Resend Email"
                onPress={() => setIsSubmitted(false)}
                variant="ghost"
                fullWidth
                style={{ marginTop: ThemeSpacing.xs }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Calming light green background
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: ThemeSpacing.lg,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  cardWrapper: {
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
    backgroundColor: '#DCFCE7', // Calming light green badge
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.md,
  },
  icon: {
    fontSize: 34,
  },
  headerInfo: {
    marginBottom: ThemeSpacing.md,
    alignItems: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: ThemeSpacing.sm,
  },
  inputLabel: {
    marginBottom: ThemeSpacing.xs,
  },
  input: {
    backgroundColor: '#F4FAF6', // Soft cooling mint surface
    borderWidth: 1.5,
    borderColor: '#BCE6CB',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    fontSize: 16,
    color: '#172B20',
    minHeight: 48,
  },
  infoBox: {
    backgroundColor: '#EAF7EE', // Calming light green info box
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#BCE6CB',
    width: '100%',
    marginVertical: ThemeSpacing.md,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    backgroundColor: ThemeColors.errorSurface,
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: ThemeColors.errorBorder,
    marginBottom: ThemeSpacing.md,
    width: '100%',
  },
});
