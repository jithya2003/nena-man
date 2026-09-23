import React, { useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const { role: initialRole } = useLocalSearchParams<{ role: string }>();
  const { login } = useAuth();

  const [currentRole, setCurrentRole] = useState<"child" | "parent">(
    initialRole === "parent" ? "parent" : "child",
  );

  const [studentId, setStudentId] = useState(
    currentRole === "parent" ? "perera.parent@neman.lk" : "child@gmail.com",
  );
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"si" | "en">("si");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isParent = currentRole === "parent";

  const handleSignIn = async () => {
    setErrorMessage("");

    const id = studentId.trim();
    if (!id) {
      setErrorMessage(
        selectedLanguage === "si" 
          ? "කරුණාකර ඔබගේ පිවිසුම් අංකය හෝ විද්‍යුත් තැපෑල ඇතුළත් කරන්න." 
          : "Please enter your ID or Email."
      );
      return;
    }
    if (isParent && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
      setErrorMessage(
        selectedLanguage === "si" 
          ? "කරුණාකර නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න." 
          : "Please enter a valid email address."
      );
      return;
    }
    if (!password) {
      setErrorMessage(
        selectedLanguage === "si" 
          ? "කරුණාකර ඔබගේ මුරපදය ඇතුළත් කරන්න." 
          : "Please enter your password."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(id, password, currentRole);
      if (success) {
        if (isParent) {
          router.replace("/(parent)/dashboard");
        } else {
          router.replace("/(child)/home");
        }
      } else {
        setErrorMessage(
          selectedLanguage === "si"
            ? "පිවිසීම අසාර්ථක විය. කරුණාකර තොරතුරු පරීක්ෂා කරන්න."
            : "Login failed. Please check credentials and try again."
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (selectedLanguage === "si"
            ? "දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න."
            : "An unexpected error occurred. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    router.push({
      pathname: "/(auth)/register",
      params: { role: currentRole },
    });
  };

  const toggleRole = (newRole: "child" | "parent") => {
    setCurrentRole(newRole);
    setErrorMessage("");
    if (newRole === "parent") {
      setStudentId("perera.parent@neman.lk");
    } else {
      setStudentId("child@gmail.com");
    }
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
          {/* Top Bar with Logo & Language / Back */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/role-select")}
              activeOpacity={0.7}
            >
              <NenaManLogo size="sm" showText={true} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langPill}
              onPress={() =>
                setSelectedLanguage(selectedLanguage === "si" ? "en" : "si")
              }
              activeOpacity={0.8}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M 12 2 C 6.48 2 2 6.48 2 12 C 2 17.52 6.48 22 12 22 C 17.52 22 22 17.52 22 12 C 22 6.48 17.52 2 12 2 Z M 11 19.93 C 7.05 19.44 4 16.08 4 12 C 4 11.38 4.08 10.79 4.21 10.21 L 9 15 L 9 16 C 9 17.1 9.9 18 11 18 L 11 19.93 Z M 17.9 17.39 C 17.64 16.58 16.9 16 16 16 L 15 16 L 15 13 C 15 12.45 14.55 12 14 12 L 8 12 L 8 10 L 10 10 C 10.55 10 11 9.55 11 9 L 11 7 L 13 7 C 14.1 7 15 6.1 15 5 L 15 4.59 C 17.93 5.78 20 8.65 20 12 C 20 14.08 19.2 15.97 17.9 17.39 Z"
                  fill={ThemeColors.textPrimary}
                />
              </Svg>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                {selectedLanguage === "si" ? "සිංහල" : "English"}
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
                color={
                  !isParent ? ThemeColors.primary : ThemeColors.textSecondary
                }
                style={{ marginLeft: 6 }}
              >
                ශිෂ්‍ය පිවිසුම
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
                style={{ marginLeft: 6 }}
              >
                දෙමාපිය / ගුරු පිවිසුම
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
                    ආයුබෝවන්!
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
                  ඔබේ ඉගෙනුම් ගමන අදින් ආරම්භ කරමු.
                </AppText>

                <AppText
                  size="xs"
                  color={ThemeColors.textSecondary}
                  align="center"
                  style={styles.taglineText}
                >
                  නැණ මං · සිංහල කියවීමේ සහායක
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
                  Guardian & Educator Portal
                </AppText>
              </View>

              <AppText
                size="xxl"
                weight="extrabold"
                color="#0F172A"
                align="center"
                style={{ marginTop: 8 }}
              >
                දෙමාපිය / ගුරු පුවරුව
              </AppText>

              <AppText
                size="sm"
                color={ThemeColors.textSecondary}
                align="center"
                style={{ marginTop: 6, maxWidth: 320, lineHeight: 20 }}
              >
                ළමයාගේ දෛනික කියවීමේ ප්‍රගතිය, උච්චාරණ දෝෂ වාර්තා සහ AI නිර්දේශ
                අධීක්ෂණය සඳහා පිවිසෙන්න.
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
              {isParent ? "ගිණුමට පිවිසෙන්න" : "ශිෂ්‍ය ගිණුමට පිවිසෙන්න"}
            </AppText>

            {/* ID / Email Field */}
            <View style={styles.inputGroup}>
              <AppText
                size="xs"
                weight="bold"
                color={ThemeColors.textSecondary}
                style={styles.inputLabel}
              >
                {isParent
                  ? "විද්‍යුත් තැපෑල හෝ දුරකථන අංකය"
                  : "ශිෂ්‍ය අංකය හෝ විද්‍යුත් තැපෑල"}
              </AppText>
              <View style={styles.inputContainer}>
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
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder={
                    isParent ? "parent@example.com" : "ශිෂ්‍ය අංකය ඇතුළත් කරන්න"
                  }
                  placeholderTextColor={ThemeColors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <AppText
                size="xs"
                weight="bold"
                color={ThemeColors.textSecondary}
                style={styles.inputLabel}
              >
                මුරපදය
              </AppText>
              <View style={styles.inputContainer}>
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  style={styles.inputIcon}
                >
                  <Path
                    d="M 18 8 L 17 8 L 17 6 C 17 3.24 14.76 1 12 1 C 9.24 1 7 3.24 7 6 L 7 8 L 6 8 C 4.9 8 4 8.9 4 10 L 4 20 C 4 21.1 4.9 22 6 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 10 C 20 8.9 19.1 8 18 8 Z M 12 17 C 10.9 17 10 16.1 10 15 C 10 13.9 10.9 13 12 13 C 13.1 13 14 13.9 14 15 C 14 16.1 13.1 17 12 17 Z M 9 8 L 9 6 C 9 4.34 10.34 3 12 3 C 13.66 3 15 4.34 15 6 L 15 8 L 9 8 Z"
                    fill={ThemeColors.textSecondary}
                  />
                </Svg>
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="මුරපදය ඇතුළත් කරන්න"
                  placeholderTextColor={ThemeColors.textMuted}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M 12 4.5 C 7 4.5 2.73 7.61 1 12 C 2.73 16.39 7 19.5 12 19.5 C 17 19.5 21.27 16.39 23 12 C 21.27 7.61 17 4.5 12 4.5 Z M 12 17 C 9.24 17 7 14.76 7 12 C 7 9.24 9.24 7 12 7 C 14.76 7 17 9.24 17 12 C 17 14.76 14.76 17 12 17 Z M 12 9 C 10.34 9 9 10.34 9 12 C 9 13.66 10.34 15 12 15 C 13.66 15 15 13.66 15 12 C 15 10.34 13.66 9 12 9 Z"
                      fill={ThemeColors.textSecondary}
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPassLink}
                onPress={() => router.push("/(auth)/forgot-password")}
                activeOpacity={0.7}
              >
                <AppText
                  size="xs"
                  weight="medium"
                  color={ThemeColors.textSecondary}
                >
                  මුරපදය අමතකද?
                </AppText>
              </TouchableOpacity>

              {/* Error Message */}
              {errorMessage ? (
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    borderRadius: ThemeRadius.md,
                    padding: ThemeSpacing.sm,
                    marginTop: ThemeSpacing.sm,
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                  }}
                >
                  <AppText
                    size="xs"
                    weight="bold"
                    color="#DC2626"
                    align="center"
                  >
                    ⚠️ {errorMessage}
                  </AppText>
                </View>
              ) : null}
            </View>

            {/* Primary Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton,
                isParent && styles.signInButtonParent,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSignIn}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <AppText size="md" weight="bold" color="#FFFFFF">
                {isSubmitting
                  ? "මඳක් රැඳෙන්න..."
                  : isParent
                    ? "දෙමාපිය පුවරුවට පිවිසෙන්න"
                    : "පිවිසෙන්න"}
              </AppText>
              {!isSubmitting && (
                <AppText
                  size="md"
                  weight="bold"
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                >
                  →
                </AppText>
              )}
            </TouchableOpacity>

            {/* Secondary Register Button */}
            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <AppText
                size="sm"
                weight="semibold"
                color={ThemeColors.textPrimary}
              >
                ගිණුමක් සාදන්න
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Footer Assistance Section */}
          <View style={styles.footerWrap}>
            <View style={styles.footerTextRow}>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                නැණ මං සහායක සේවාව ඔබ සමඟයි
              </AppText>
              <AppText size="xs" style={{ marginLeft: 4 }}>
                💚
              </AppText>
            </View>

            {/* Help Button */}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => router.push("/(child)/support")}
              activeOpacity={0.8}
            >
              <AppText size="xs">❓</AppText>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                උදව් සහ මගපෙන්වීම්
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={{ height: ThemeSpacing.lg }} />
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
    paddingTop: ThemeSpacing.sm,
    paddingBottom: ThemeSpacing.xl,
    alignItems: "center",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.xs,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F1F8",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#D4E2EE",
  },
  roleTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: ThemeRadius.full,
    padding: 3,
    marginVertical: ThemeSpacing.sm,
    width: "100%",
    maxWidth: 360,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: ThemeRadius.full,
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
    marginVertical: ThemeSpacing.xs,
    ...ThemeShadow.sm,
  },
  parentHeroWrap: {
    alignItems: "center",
    marginVertical: ThemeSpacing.md,
  },
  parentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  welcomeHeadingWrap: {
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clapEmoji: {
    marginLeft: 6,
  },
  subGreeting: {
    marginTop: 4,
    maxWidth: 320,
    lineHeight: 22,
  },
  taglineText: {
    marginTop: 4,
  },
  loginCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginTop: ThemeSpacing.xs,
  },
  parentCard: {
    borderColor: "#BAE6FD",
    borderTopWidth: 4,
    borderTopColor: "#0284C7",
  },
  loginCardTitle: {
    marginBottom: ThemeSpacing.md,
  },
  inputGroup: {
    marginBottom: ThemeSpacing.md,
  },
  inputLabel: {
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F1F8",
    borderRadius: ThemeRadius.md,
    paddingHorizontal: ThemeSpacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: "#D8E5F0",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: ThemeColors.textPrimary,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassLink: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
    marginTop: ThemeSpacing.xs,
    ...ThemeShadow.sm,
  },
  signInButtonParent: {
    backgroundColor: "#0284C7",
  },
  createAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F1F8",
    borderRadius: ThemeRadius.md,
    height: 48,
    marginTop: ThemeSpacing.sm,
  },
  footerWrap: {
    alignItems: "center",
    marginTop: ThemeSpacing.lg,
    gap: ThemeSpacing.sm,
  },
  footerTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F1F8",
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#D4E2EE",
  },
});
