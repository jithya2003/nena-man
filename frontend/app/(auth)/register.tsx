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

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const [accountType, setAccountType] = useState<'parent' | 'educator'>(
    params.role === 'educator' ? 'educator' : 'parent'
  );

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Child Profile Fields
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('7');
  const [selectedGrade, setSelectedGrade] = useState('Grade 2');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!childName.trim()) {
      setErrorMessage("Please enter your student's or child's name.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/(parent)/dashboard');
    }, 500);
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
          {/* Header Info */}
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

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorAlert}>
              <AppText size="sm">⚠️</AppText>
              <AppText size="xs" weight="bold" color={ThemeColors.error} style={{ flex: 1 }}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          {/* ── SECTION 1: GUARDIAN DETAILS ── */}
          <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
            1. Your Information
          </AppText>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Full Name
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. Priyanthi Perera"
              placeholderTextColor={ThemeColors.textMuted}
              value={fullName}
              onChangeText={(val) => {
                setFullName(val);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Email Address
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. priyanthi@example.com"
              placeholderTextColor={ThemeColors.textMuted}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Password
            </AppText>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="At least 6 characters"
                placeholderTextColor={ThemeColors.textMuted}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <AppText size="sm">{showPassword ? '👁️' : '🙈'}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Confirm Password
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={ThemeColors.textMuted}
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* ── SECTION 2: CHILD PROFILE ── */}
          <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
            2. Child / Student Profile
          </AppText>

          <View style={styles.inputGroup}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={styles.inputLabel}>
              Child's Name
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nimasha"
              placeholderTextColor={ThemeColors.textMuted}
              value={childName}
              onChangeText={(val) => {
                setChildName(val);
                if (errorMessage) setErrorMessage('');
              }}
            />
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
                    style={[
                      styles.gradeChip,
                      isSelected && styles.gradeChipSelected,
                    ]}
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
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms && (
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  ✓
                </AppText>
              )}
            </View>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ flex: 1 }}>
              I agree to the <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>Terms of Service</AppText> and <AppText size="xs" weight="bold" color={ThemeColors.accentDark}>Privacy Policy</AppText>.
            </AppText>
          </TouchableOpacity>

          {/* Create Account CTA */}
          <Button
            label={isSubmitting ? 'Setting up profile...' : 'Create Account & Start 🚀'}
            onPress={handleRegister}
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
