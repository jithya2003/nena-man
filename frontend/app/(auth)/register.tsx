/**
 * nena-man · frontend/app/(auth)/register.tsx
 * Registration screen using react-hook-form + zod for real-time validation.
 * On success, redirects to verify-email screen (email verification required).
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
import { registerSchema, RegisterFormData } from '@/utils/validators';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();

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
    mode: 'onChange', // Validate on every keystroke for real-time feedback
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
      setServerError(err?.message || 'ගිණුම සෑදීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න. (Failed to create account. Please try again.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title="Create Account"
        subtitle="Set up your learning profile"
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
              Join Nena-Man 🌟
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
              Personalized Sinhala reading assistance powered by AI
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
              >
                Parent
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
              >
                Teacher / Specialist
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
            1. Your Information
          </AppText>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Full Name
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
              Email Address
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
              Password
            </AppText>
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }, errors.password && styles.inputError]}
                    placeholder="Min 8 chars, A-Z, a-z, 0-9, !@#$%"
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
              Confirm Password
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
            2. Child / Student Profile
          </AppText>

          {/* Child Name */}
          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Child's Name
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
              Grade Level
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
            label={isSubmitting ? 'Setting up profile...' : 'Create Account & Start 🚀'}
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
              Already have an account?{' '}
            </AppText>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <AppText size="sm" weight="bold" color={ThemeColors.accentDark}>
                Sign In
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
    paddingBottom: ThemeSpacing.xxxl,
  },
  headerInfo: {
    marginBottom: ThemeSpacing.md,
  },
  accountTypeRow: {
    flexDirection: 'row',
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeRadius.full,
    padding: 4,
    marginBottom: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  accountTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.xs,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
  },
  accountTypeBtnActive: {
    backgroundColor: ThemeColors.surfaceElevated,
    borderWidth: 1,
    borderColor: ThemeColors.accent,
    ...ThemeShadow.sm,
  },
  sectionTitle: {
    marginTop: ThemeSpacing.md,
    marginBottom: ThemeSpacing.sm,
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
  inputError: {
    borderColor: ThemeColors.error,
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    marginTop: 4,
    marginLeft: 2,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: ThemeSpacing.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
    paddingVertical: 2,
  },
  gradeChip: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
    backgroundColor: ThemeColors.surface,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  gradeChipSelected: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentDark,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: ThemeRadius.xs,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: ThemeColors.accent,
    borderColor: ThemeColors.accentDark,
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
    marginBottom: ThemeSpacing.sm,
  },
  signinPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ThemeSpacing.md,
  },
});
