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
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(t('auth.forgotPassword.desc'));
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
        title={t('auth.forgotPassword.title')}
        subtitle={t('auth.forgotPassword.subtitle')}
        showBack={true}
        fallbackRoute="/(auth)/login"
        showSettings={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Card style={styles.card}>
            {isSubmitted ? (
              <View style={styles.successState}>
                <AppText size="display" align="center" style={{ marginBottom: ThemeSpacing.md }}>
                  ✉️
                </AppText>
                <AppText size="lg" weight="extrabold" align="center" color={ThemeColors.textPrimary}>
                  {t('auth.forgotPassword.title')}
                </AppText>
                <AppText
                  size="sm"
                  color={ThemeColors.textSecondary}
                  align="center"
                  style={{ marginTop: ThemeSpacing.xs, marginBottom: ThemeSpacing.lg }}
                >
                  {t('auth.forgotPassword.desc')}
                </AppText>

                <Button
                  label={t('auth.register.loginLink')}
                  onPress={() => router.push('/(auth)/login')}
                  fullWidth
                  size="md"
                />
              </View>
            ) : (
              <View>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginBottom: ThemeSpacing.xs }}>
                  {t('auth.forgotPassword.title')}
                </AppText>
                <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginBottom: ThemeSpacing.lg }}>
                  {t('auth.forgotPassword.desc')}
                </AppText>

                {errorMessage ? (
                  <View style={styles.errorAlert}>
                    <AppText size="xs" color={ThemeColors.error}>
                      ⚠️ {errorMessage}
                    </AppText>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginBottom: 4 }}>
                    {t('auth.register.email')}
                  </AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="parent@example.com"
                    placeholderTextColor={ThemeColors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Button
                  label={isSubmitting ? t('common.loading') : t('auth.forgotPassword.submitBtn')}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  size="lg"
                  style={{ marginTop: ThemeSpacing.md }}
                />

                <TouchableOpacity
                  style={styles.backToLogin}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.7}
                >
                  <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
                    ← {t('common.back')} {t('auth.register.loginLink')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: ThemeSpacing.lg,
    justifyContent: 'center',
  },
  card: {
    padding: ThemeSpacing.lg,
  },
  inputGroup: {
    marginBottom: ThemeSpacing.sm,
  },
  input: {
    backgroundColor: ThemeColors.surface,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    borderRadius: ThemeRadius.md,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: Platform.OS === 'ios' ? ThemeSpacing.sm + 2 : ThemeSpacing.sm,
    fontSize: 14,
    color: ThemeColors.textPrimary,
  },
  errorAlert: {
    backgroundColor: ThemeColors.errorSurface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: ThemeColors.errorBorder,
    marginBottom: ThemeSpacing.md,
  },
  successState: {
    alignItems: 'center',
  },
  backToLogin: {
    marginTop: ThemeSpacing.md,
    alignItems: 'center',
  },
});
