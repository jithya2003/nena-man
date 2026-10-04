/**
 * nena-man · frontend/app/(auth)/login.tsx
 * Login screen using react-hook-form + zod for real-time validation.
 * Uses global LanguageContext for interface language switching.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from "@/constants/theme";
import AppText from "@/components/AppText";
import NenaManLogo from "@/components/NenaManLogo";
import { WelcomeStudentIllustration } from "@/components/Illustrations";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { loginSchema, LoginFormData } from "@/utils/validators";
import { auth } from "@/services/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const { role: initialRole } = useLocalSearchParams<{ role: string }>();
  const { login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // If user just registered (Firebase keeps them signed in) and email is unverified,
  // redirect straight to verify-email for all users (children, parents, teachers).
  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: currentUser.email || '', unverified: 'true' },
      });
    }
  }, []);

  const [currentRole, setCurrentRole] = useState<"child" | "parent">(
    initialRole === "parent" ? "parent" : "child"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const isParent = currentRole === "parent";

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      const result = await login(data.identifier, data.password, currentRole);

      if (result.needsVerification) {
        router.replace({
          pathname: "/(auth)/verify-email",
          params: {
            email: result.email || data.identifier,
            unverified: "true",
          },
        });
        return;
      }

      if (result.success) {
        // Enforce strict portal-to-role matching:
        // Case 1: Logging in on Parent/Teacher portal (currentRole === "parent") with Child credentials
        if (currentRole === "parent" && result.role === "child") {
          await logout();
          setServerError(
            language === "si"
              ? "මෙම ගිණුම ශිෂ්‍ය ගිණුමකි. දෙමාපිය/ගුරු පුවරුවෙන් පිවිසිය නොහැක. කරුණාකර 'ශිෂ්‍ය පිවිසුම' (Student Login) තෝරන්න."
              : "This is a Student account and cannot access the Parent/Teacher portal. Please switch to 'Student Login'."
          );
          return;
        }

        // Case 2: Logging in on Student portal (currentRole === "child") with Parent/Teacher credentials
        if (currentRole === "child" && (result.role === "parent" || result.role === "teacher")) {
          await logout();
          setServerError(
            language === "si"
              ? "මෙම ගිණුම දෙමාපිය/ගුරු ගිණුමකි. ශිෂ්‍ය පුවරුවෙන් පිවිසිය නොහැක. කරුණාකර 'දෙමාපිය / ගුරු පිවිසුම' (Parent/Teacher Login) තෝරන්න."
              : "This is a Parent/Teacher account and cannot access the Student portal. Please switch to 'Parent/Teacher Login'."
          );
          return;
        }

        // Roles match properly:
        if (result.role === "child") {
          router.replace("/(child)/home");
        } else {
          router.replace("/(parent)/dashboard");
        }
      } else {
        setServerError(
          language === "si"
            ? "පිවිසීම අසාර්ථක විය. කරුණාකර තොරතුරු පරීක්ෂා කරන්න."
            : "Login failed. Please check your credentials and try again."
        );
      }
    } catch (err: any) {
      setServerError(
        err?.message ||
        (language === "si"
          ? "දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න."
          : "An unexpected error occurred. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (newRole: "child" | "parent") => {
    setCurrentRole(newRole);
    setServerError("");
    setValue("identifier", "");
    setValue("password", "");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Top Bar with Logo & Global Language Switcher */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/role-select")}
              activeOpacity={0.7}
            >
              <NenaManLogo size="sm" showText={true} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langPill}
              onPress={() => setLanguage(language === "si" ? "en" : "si")}
              activeOpacity={0.8}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M 12 2 C 6.48 2 2 6.48 2 12 C 2 17.52 6.48 22 12 22 C 17.52 22 22 17.52 22 12 C 22 6.48 17.52 2 12 2 Z M 11 19.93 C 7.05 19.44 4 16.08 4 12 C 4 11.38 4.08 10.79 4.21 10.21 L 9 15 L 9 16 C 9 17.1 9.9 18 11 18 L 11 19.93 Z M 17.9 17.39 C 17.64 16.58 16.9 16 16 16 L 15 16 L 15 13 C 15 12.45 14.55 12 14 12 L 8 12 L 8 10 L 10 10 C 10.55 10 11 9.55 11 9 L 11 7 L 13 7 C 14.1 7 15 6.1 15 5 L 15 4.59 C 17.93 5.78 20 8.65 20 12 C 20 14.08 19.2 15.97 17.9 17.39 Z"
                  fill={ThemeColors.textPrimary}
                />
              </Svg>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                {language === "si" ? "සිංහල" : "English"}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Role Switcher Tabs */}
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[styles.roleTab, !isParent && styles.roleTabActive]}
              onPress={() => toggleRole("child")}
              activeOpacity={0.8}
            >
              <AppText size="sm">🌟</AppText>
              <AppText
                size="xs"
                weight="bold"
                color={!isParent ? ThemeColors.primary : ThemeColors.textSecondary}
                style={{ marginLeft: 6, flexShrink: 1 }}
              >
                {t('auth.login.studentTab')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, isParent && styles.roleTabActiveParent]}
              onPress={() => toggleRole("parent")}
              activeOpacity={0.8}
            >
              <AppText size="sm">👨‍👩‍👧‍👦</AppText>
              <AppText
                size="xs"
                weight="bold"
                color={isParent ? "#0369A1" : ThemeColors.textSecondary}
                style={{ marginLeft: 6, flexShrink: 1 }}
              >
                {t('auth.login.parentTab')}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          {!isParent ? (
            <>
              <View style={styles.illustrationWrapper}>
                <WelcomeStudentIllustration size={200} />
              </View>

              <View style={styles.welcomeHeadingWrap}>
                <View style={styles.greetingRow}>
                  <AppText
                    size="xxl"
                    weight="extrabold"
                    color={ThemeColors.primary}
                    align="center"
                  >
                    {t('auth.login.greeting')}
                  </AppText>
                  <AppText size="xxl" style={styles.clapEmoji}>
                    👏
                  </AppText>
                </View>

                <AppText
                  size="md"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  align="center"
                  style={styles.subGreeting}
                >
                  {t('auth.login.greetingSub')}
                </AppText>

                <AppText
                  size="xs"
                  color={ThemeColors.textSecondary}
                  align="center"
                  style={styles.taglineText}
                >
                  {t('auth.login.tagline')}
                </AppText>
              </View>
            </>
          ) : (
            <View style={styles.parentHeroWrap}>
              <View style={styles.parentBadge}>
                <AppText size="sm">📊</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color="#0369A1"
                  style={{ marginLeft: 6 }}
                >
                  {t('auth.login.parentHeroTag')}
                </AppText>
              </View>

              <AppText
                size="xxl"
                weight="extrabold"
                color="#0F172A"
                align="center"
                style={{ marginTop: 8 }}
              >
                {t('auth.login.parentHeroTitle')}
              </AppText>

              <AppText
                size="sm"
                color={ThemeColors.textSecondary}
                align="center"
                style={{ marginTop: 6, maxWidth: 320, lineHeight: 20 }}
              >
                {t('auth.login.parentHeroDesc')}
              </AppText>
            </View>
          )}

          {/* Login Card */}
          <View
            style={[
              styles.loginCard,
              isParent && styles.parentCard,
              ThemeShadow.md,
            ]}
          >
            <AppText
              size="lg"
              weight="extrabold"
              color={isParent ? "#0F172A" : ThemeColors.textPrimary}
              align="center"
              style={styles.loginCardTitle}
            >
              {isParent ? t('auth.login.parentTitle') : t('auth.login.studentTitle')}
            </AppText>

            {/* ID / Email Field */}
            <View style={styles.inputGroup}>
              <AppText
                size="xs"
                weight="bold"
                color={ThemeColors.textSecondary}
                style={styles.inputLabel}
              >
                {isParent ? t('auth.login.parentLabel') : t('auth.login.studentLabel')}
              </AppText>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputContainer,
                      errors.identifier && styles.inputContainerError,
                    ]}
                  >
                    <Svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={styles.inputIcon}
                    >
                      <Path
                        d="M 12 12 C 14.21 12 16 10.21 16 8 C 16 5.79 14.21 4 12 4 C 9.79 4 8 5.79 8 8 C 8 10.21 9.79 12 12 12 Z M 12 14 C 9.33 14 4 15.34 4 18 L 4 20 L 20 20 L 20 18 C 20 15.34 14.67 14 12 14 Z"
                        fill={ThemeColors.textSecondary}
                      />
                    </Svg>
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={
                        isParent ? "parent@example.com" : "student@example.com"
                      }
                      placeholderTextColor={ThemeColors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                )}
              />
              {errors.identifier && (
                <AppText size="xs" color={ThemeColors.error} style={styles.fieldErrorText}>
                  {errors.identifier.message}
                </AppText>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.textSecondary}
                  style={styles.inputLabel}
                >
                  {t('auth.login.passwordLabel')}
                </AppText>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                  activeOpacity={0.7}
                >
                  <AppText
                    size="xs"
                    weight="bold"
                    color={isParent ? "#0369A1" : ThemeColors.primary}
                  >
                    {t('auth.login.forgotPassword')}
                  </AppText>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password && styles.inputContainerError,
                    ]}
                  >
                    <Svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={styles.inputIcon}
                    >
                      <Path
                        d="M 18 8 L 17 8 L 17 6 C 17 3.24 14.76 1 12 1 C 9.24 1 7 3.24 7 6 L 7 8 L 6 8 C 4.9 8 4 8.9 4 10 L 4 20 C 4 21.1 4.9 22 6 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 10 C 20 8.9 19.1 8 18 8 Z M 12 17 C 10.9 17 10 16.1 10 15 C 10 13.9 10.9 13 12 13 C 13.1 13 14 13.9 14 15 C 14 16.1 13.1 17 12 17 Z M 15.1 8 L 8.9 8 L 8.9 6 C 8.9 4.29 10.29 2.9 12 2.9 C 13.71 2.9 15.1 4.29 15.1 6 L 15.1 8 Z"
                        fill={ThemeColors.textSecondary}
                      />
                    </Svg>
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="••••••••"
                      placeholderTextColor={ThemeColors.textMuted}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <AppText size="xs" color={ThemeColors.textMuted}>
                        {showPassword ? "🙈" : "👁️"}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <AppText size="xs" color={ThemeColors.error} style={styles.fieldErrorText}>
                  {errors.password.message}
                </AppText>
              )}
            </View>

            {/* Server Error Display */}
            {serverError ? (
              <View style={styles.serverErrorBox}>
                <AppText size="xs" color={ThemeColors.error} align="center">
                  ⚠️ {serverError}
                </AppText>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isParent && styles.submitBtnParent,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <AppText size="md" weight="extrabold" color="#FFFFFF">
                {isSubmitting ? t('common.loading') : t('auth.login.submitBtn')}
              </AppText>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerPromptRow}>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                {t('auth.login.noAccount')}{" "}
              </AppText>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/register",
                    params: { role: currentRole },
                  })
                }
                activeOpacity={0.7}
              >
                <AppText
                  size="xs"
                  weight="extrabold"
                  color={isParent ? "#0369A1" : ThemeColors.primary}
                >
                  {t('auth.login.registerNow')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.footerBranding}>
            <AppText size="xs" color={ThemeColors.textMuted} align="center">
              නැණ මං · SLIIT IT4010 Dyslexia Research Project
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === "web"
      ? { minHeight: "100vh" as any, height: "100vh" as any }
      : {}),
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ThemeSpacing.md,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ThemeColors.surfaceElevated,
    borderRadius: ThemeRadius.full,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    ...ThemeShadow.sm,
  },
  roleTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: ThemeRadius.lg,
    padding: 4,
    marginBottom: ThemeSpacing.lg,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
  },
  roleTabActive: {
    backgroundColor: "#FFFFFF",
    ...ThemeShadow.sm,
  },
  roleTabActiveParent: {
    backgroundColor: "#FFFFFF",
    ...ThemeShadow.sm,
  },
  illustrationWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ThemeSpacing.sm,
  },
  welcomeHeadingWrap: {
    alignItems: "center",
    marginBottom: ThemeSpacing.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clapEmoji: {
    marginLeft: ThemeSpacing.xs,
  },
  subGreeting: {
    marginTop: ThemeSpacing.xs,
  },
  taglineText: {
    marginTop: ThemeSpacing.xs,
  },
  parentHeroWrap: {
    alignItems: "center",
    marginBottom: ThemeSpacing.lg,
    paddingHorizontal: ThemeSpacing.sm,
  },
  parentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.full,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  parentCard: {
    borderColor: "#BAE6FD",
  },
  loginCardTitle: {
    marginBottom: ThemeSpacing.lg,
  },
  inputGroup: {
    marginBottom: ThemeSpacing.md,
  },
  inputLabel: {
    marginBottom: ThemeSpacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: ThemeSpacing.md,
    height: 48,
  },
  inputContainerError: {
    borderColor: ThemeColors.error,
  },
  inputIcon: {
    marginRight: ThemeSpacing.xs + 2,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: ThemeColors.textPrimary,
  },
  eyeBtn: {
    padding: ThemeSpacing.xs,
  },
  fieldErrorText: {
    marginTop: 4,
  },
  serverErrorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: ThemeRadius.sm,
    padding: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  submitBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ThemeSpacing.xs,
    ...ThemeShadow.sm,
  },
  submitBtnParent: {
    backgroundColor: "#0284C7",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  registerPromptRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: ThemeSpacing.lg,
  },
  footerBranding: {
    marginTop: ThemeSpacing.xl,
    alignItems: "center",
  },
});
