/**
 * nena-man · frontend/app/(auth)/register.tsx
 * Registration screen using react-hook-form + zod for real-time validation.
 * Uses global LanguageContext for UI labels.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { registerSchema, RegisterFormData } from '@/utils/validators';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [accountType, setAccountType] = useState<'parent' | 'educator'>(
    params.role === 'educator' ? 'educator' : 'parent'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('Grade 2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      childName: '',
      agreeTerms: true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const parsedGrade = parseInt(selectedGrade.replace(/\D/g, ''), 10) || 2;
      const result = await register({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
        role: accountType === 'educator' ? 'teacher' : 'parent',
        childName: data.childName,
        age: 7,
        grade: parsedGrade,
      });

      if (result.success) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: result.email },
        });
      }
    } catch (err: any) {
      setServerError(err?.message || 'ගිණුම සෑදීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title={t('auth.register.title')}
        subtitle={t('auth.register.subtitle')}
        showBack={true}
        fallbackRoute="/(auth)/login"
        showSettings={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.headerInfo}>
            <AppText size="xxl" weight="extrabold" color={ThemeColors.textPrimary}>
              {t('auth.register.title')} 🌟
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
              {t('auth.register.subtitle')}
            </AppText>
          </View>

          {/* Account Type Selector */}
          <View style={styles.accountTypeRow}>
            <TouchableOpacity
              style={[
                styles.accountTypeBtn,
                accountType === 'parent' && styles.accountTypeBtnActive,
              ]}
              onPress={() => setAccountType('parent')}
              activeOpacity={0.8}
            >
              <AppText size="sm">🏡</AppText>
              <AppText
                size="sm"
                weight={accountType === 'parent' ? 'bold' : 'medium'}
                color={ThemeColors.textPrimary}
                style={{ flexShrink: 1 }}
              >
                {t('auth.register.parentTab')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeBtn,
                accountType === 'educator' && styles.accountTypeBtnActive,
              ]}
              onPress={() => setAccountType('educator')}
              activeOpacity={0.8}
            >
              <AppText size="sm">👩‍🏫</AppText>
              <AppText
                size="sm"
                weight={accountType === 'educator' ? 'bold' : 'medium'}
                color={ThemeColors.textPrimary}
                style={{ flexShrink: 1 }}
              >
                {t('auth.register.educatorTab')}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Server-level Error */}
          {serverError ? (
            <View style={styles.errorAlert}>
              <AppText size="sm">⚠️</AppText>
              <AppText size="xs" weight="bold" color={ThemeColors.error} style={{ flex: 1 }}>
                {serverError}
              </AppText>
            </View>
          ) : null}

          {/* ── SECTION 1: YOUR INFORMATION ── */}
          <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
            1. {t('auth.register.fullName')} & {t('auth.register.email')}
          </AppText>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.fullName')}
            </AppText>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="e.g. Priyanthi Perera"
                  placeholderTextColor={ThemeColors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.fullName && (
              <AppText size="xs" color={ThemeColors.error} style={styles.fieldError}>
                ⚠ {errors.fullName.message}
              </AppText>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.email')}
            </AppText>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="e.g. priyanthi@example.com"
                  placeholderTextColor={ThemeColors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <AppText size="xs" color={ThemeColors.error} style={styles.fieldError}>
                ⚠ {errors.email.message}
              </AppText>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.password')}
            </AppText>
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }, errors.password && styles.inputError]}
                    placeholder="Min 8 chars"
                    placeholderTextColor={ThemeColors.textMuted}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <AppText size="sm">{showPassword ? '👁️' : '🙈'}</AppText>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <AppText size="xs" color={ThemeColors.error} style={styles.fieldError}>
                ⚠ {errors.password.message}
              </AppText>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.confirmPassword')}
            </AppText>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Re-enter password"
                  placeholderTextColor={ThemeColors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                />
              )}
            />
            {errors.confirmPassword && (
              <AppText size="xs" color={ThemeColors.error} style={styles.fieldError}>
                ⚠ {errors.confirmPassword.message}
              </AppText>
            )}
          </View>

          {/* ── SECTION 2: CHILD PROFILE ── */}
          <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
            2. {t('auth.register.childName')} & {t('auth.register.grade')}
          </AppText>

          {/* Child Name */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.childName')}
            </AppText>
            <Controller
              control={control}
              name="childName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.childName && styles.inputError]}
                  placeholder="e.g. Nimasha"
                  placeholderTextColor={ThemeColors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.childName && (
              <AppText size="xs" color={ThemeColors.error} style={styles.fieldError}>
                ⚠ {errors.childName.message}
              </AppText>
            )}
          </View>

          {/* Grade Selector */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              {t('auth.register.grade')}
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeRow}>
              {GRADES.map((g) => {
                const isSelected = selectedGrade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gradeChip, isSelected && styles.gradeChipSelected]}
                    onPress={() => setSelectedGrade(g)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      size="xs"
                      weight={isSelected ? 'bold' : 'medium'}
                      color={isSelected ? ThemeColors.accentDark : ThemeColors.textPrimary}
                    >
                      {g}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Terms Checkbox */}
          <Controller
            control={control}
            name="agreeTerms"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => onChange(!value)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, value && styles.checkboxActive]}>
                  {value && (
                    <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                      ✓
                    </AppText>
                  )}
                </View>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1 }}>
                  I agree to the{' '}
                  <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
                    Terms of Service
                  </AppText>{' '}
                  and{' '}
                  <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>
                    Privacy Policy
                  </AppText>
                  .
                </AppText>
              </TouchableOpacity>
            )}
          />
          {errors.agreeTerms && (
            <AppText size="xs" color={ThemeColors.error} style={[styles.fieldError, { marginTop: 4 }]}>
              ⚠ {errors.agreeTerms.message}
            </AppText>
          )}

          {/* Create Account CTA */}
          <Button
            label={isSubmitting ? t('common.loading') : `${t('auth.register.submitBtn')} 🚀`}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
            size="lg"
            style={{ marginTop: ThemeSpacing.lg }}
          />

          {/* Sign In Link */}
          <View style={styles.signinPrompt}>
            <AppText size="sm" color={ThemeColors.textSecondary}>
              {t('auth.register.alreadyAccount')}{' '}
            </AppText>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <AppText size="sm" weight="bold" color={ThemeColors.accentDark}>
                {t('auth.register.loginLink')}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={{ height: ThemeSpacing.xxxl }} />
        </ScrollView>
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
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
  },
  headerInfo: {
    marginBottom: ThemeSpacing.md,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs + 2,
    marginBottom: ThemeSpacing.md,
  },
  accountTypeBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: ThemeSpacing.sm + 2,
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
  },
  accountTypeBtnActive: {
    backgroundColor: ThemeColors.surfaceElevated,
    borderColor: ThemeColors.accentDark,
    ...ThemeShadow.sm,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    backgroundColor: ThemeColors.errorSurface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: ThemeColors.errorBorder,
    marginBottom: ThemeSpacing.md,
  },
  sectionTitle: {
    marginTop: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: ThemeSpacing.sm + 2,
  },
  inputLabel: {
    marginBottom: 4,
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
  inputError: {
    borderColor: ThemeColors.error,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: ThemeSpacing.md,
    padding: ThemeSpacing.xs,
  },
  fieldError: {
    marginTop: 4,
  },
  gradeRow: {
    gap: ThemeSpacing.xs + 2,
    paddingVertical: 2,
  },
  gradeChip: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    backgroundColor: ThemeColors.surface,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
  },
  gradeChipSelected: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentDark,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ThemeSpacing.xs + 2,
    marginTop: ThemeSpacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surface,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: ThemeColors.accent,
    borderColor: ThemeColors.accentDark,
  },
  signinPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ThemeSpacing.lg,
  },
});
