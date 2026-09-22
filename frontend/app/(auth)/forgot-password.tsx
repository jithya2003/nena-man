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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 500);
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
            <View>
              <View style={styles.headerInfo}>
                <AppText size="display" style={{ marginBottom: ThemeSpacing.xs }}>
                  🔐
                </AppText>
                <AppText size="xxl" weight="extrabold" color={ThemeColors.textPrimary}>
                  Forgot your password?
                </AppText>
                <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginTop: ThemeSpacing.xs }}>
                  Enter your registered email address and we'll send you instructions to reset your password or child PIN.
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
                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
                  Registered Email Address
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
                fullWidth
                size="lg"
                style={{ marginTop: ThemeSpacing.lg }}
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
            <Card variant="elevated" style={styles.successCard}>
              <AppText size="display" style={{ marginBottom: ThemeSpacing.sm }}>
                ✉️
              </AppText>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center">
                Instructions Sent!
              </AppText>
              <AppText
                size="sm"
                color={ThemeColors.textSecondary}
                align="center"
                style={{ marginVertical: ThemeSpacing.md, lineHeight: 22 }}
              >
                We've sent password reset instructions to{' '}
                <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                  {email}
                </AppText>
                . Please check your inbox and spam folder.
              </AppText>

              <Button
                label="Return to Sign In →"
                onPress={() => router.replace('/(auth)/login')}
                fullWidth
                size="lg"
                style={{ marginTop: ThemeSpacing.sm }}
              />

              <Button
                label="Resend Email"
                onPress={() => setIsSubmitted(false)}
                variant="ghost"
                fullWidth
                style={{ marginTop: ThemeSpacing.xs }}
              />
            </Card>
          )}
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
    padding: ThemeSpacing.xl,
    justifyContent: 'center',
  },
  headerInfo: {
    marginBottom: ThemeSpacing.xl,
  },
  inputGroup: {
    marginBottom: ThemeSpacing.sm,
  },
  inputLabel: {
    marginBottom: ThemeSpacing.xs,
  },
  input: {
    backgroundColor: ThemeColors.surface,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    borderRadius: ThemeRadius.md,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    fontSize: 16,
    color: ThemeColors.textPrimary,
    minHeight: 48,
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
  },
  successCard: {
    alignItems: 'center',
    padding: ThemeSpacing.xl,
  },
});
