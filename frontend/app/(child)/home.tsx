import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { connectionService } from "@/services/connectionService";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from "@/constants/theme";
import AppText from "@/components/AppText";
import BottomNav from "@/components/BottomNav";
import {
  StudentAvatarPhoto,
  RelaxTreeIllustration,
} from "@/components/Illustrations";
import { useRouter as useRouterM2 } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useChildStoreBase } from "@/store/childStore";
import { CHARACTER_AVATAR_SOURCES } from "@/assets/avatars";
import DevicePermissionModal from "@/components/DevicePermissionModal";
import { useConsentPrivacy } from "@/hooks/useConsentPrivacy";

import ReadingTextSelectModal, { countSinhalaWords } from "@/components/ReadingTextSelectModal";
import { analyzeTextDifficulty } from "@/api/textDifficultyApi";
import type { TextType } from "@/api/types";

// ── M2 AI Simplification Card ─────────────────────────────────────────────────
function M2SimplificationCard() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedReadingText, setSelectedReadingText] = useState("මම මගේ රටට ගොඩාක් ආදරෙයි");
  const [selectedOptionId, setSelectedOptionId] = useState("case_c");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<1 | 2 | 3>(2);
  const [selectedTextType, setSelectedTextType] = useState<TextType>("short sentence");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [oovModalVisible, setOovModalVisible] = useState(false);
  const [oovTokens, setOovTokens] = useState<string[]>([]);
  const [oovMessage, setOovMessage] = useState("");
  const { hasActiveConsent } = useConsentPrivacy();
  const router = useRouterM2();
  const { t } = useLanguage();

  const handleStartReading = async () => {
    if (isAnalyzing) return;

    const trimmed = (selectedReadingText || "").trim();
    if (!trimmed) {
      Alert.alert("දැනුම්දීම", "කරුණාකර කියවීම සඳහා සිංහල පාඨයක් තෝරන්න.");
      return;
    }

    const isCustomText = selectedOptionId.startsWith('custom_');
    if (isCustomText && (!selectedGradeLevel || (selectedGradeLevel !== 1 && selectedGradeLevel !== 2 && selectedGradeLevel !== 3))) {
      Alert.alert(
        "ශ්‍රේණිය අවශ්‍යයි (Grade Required)",
        "අභිරුචි පාඨ විශ්ලේෂණය කිරීමට පෙර කරුණාකර ඔබගේ පැතිකඩෙහි (Profile) ශ්‍රේණිය (Grade 1-3) සකසන්න."
      );
      return;
    }

    if (selectedTextType === 'short sentence') {
      const wordCount = countSinhalaWords(trimmed);
      if (wordCount > 18) {
        Alert.alert("දැනුම්දීම", "කෙටි වාක්‍යයක් සඳහා උපරිම වචන 18ක් පමණක් ඇතුළත් කළ හැක.");
        return;
      }
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeTextDifficulty({
        text: trimmed,
        grade_level: selectedGradeLevel,
        text_type: selectedTextType,
      });

      if (result.analysis_status === "needs_word_confirmation") {
        setIsAnalyzing(false);
        setOovTokens(result.unknown_tokens || []);
        setOovMessage(
          result.message || "එක් හෝ කිහිපයක් වචන ශබ්දකෝෂයේ හඳුනාගත නොහැකි විය."
        );
        setOovModalVisible(true);
        return;
      }

      if (result.analysis_status === "success") {
        setIsAnalyzing(false);
        router.push({
          pathname: "/(child)/m1-session",
          params: {
            selectedText: trimmed,
            textId: selectedOptionId,
            m2Data: JSON.stringify(result),
          },
        });
        return;
      }

      setIsAnalyzing(false);
      Alert.alert(
        "දෝෂයක්",
        "පාඨය විශ්ලේෂණය කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න."
      );
    } catch (err: any) {
      setIsAnalyzing(false);
      const isNetwork = err?.isNetworkError || !err?.status;
      const friendlyMsg = isNetwork
        ? "ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න. AI සේවාදායකය හා සම්බන්ධ වීමට නොහැක."
        : err?.status === 503
        ? "AI ආකෘතිය මේ මොහොතේ සූදානම් නැත. කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න."
        : "විශ්ලේෂණය අතරතුර දෝෂයක් සිදුවිය. කරුණාකර පාඨය පරීක්ෂා කර නැවත උත්සාහ කරන්න.";
      Alert.alert("සම්බන්ධතා ගැටලුවක්", friendlyMsg);
    }
  };

  return (
    <View style={m2Styles.card}>
      {/* Module Header */}
      <View style={m2Styles.headerRow}>
        <View style={m2Styles.moduleTag}>
          <View style={m2Styles.moduleDot} />
          <AppText size="sm" weight="extrabold" color="#92400E">
            🪄 AI මැජික් සහායකයා
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={() => router.push("/(child)/consent-privacy")}
            style={m2Styles.privacyBadge}
            activeOpacity={0.7}
          >
            <AppText size="xs" weight="bold" color="#047857">
              🛡️ දෙමාපිය අවසර
            </AppText>
          </TouchableOpacity>
          <View style={m2Styles.badgePill}>
            <AppText size="xs" weight="bold" color="#B45309">
              ✨ පහසු කියවීම
            </AppText>
          </View>
        </View>
      </View>

      {/* Target Sentence Block */}
      <View style={m2Styles.sentenceBlock}>
        <View style={m2Styles.labelRow}>
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            📖 අද කියවිය යුතු පාඨය:
          </AppText>
          <TouchableOpacity
            onPress={() => setShowTextModal(true)}
            style={m2Styles.changeTextBtn}
            activeOpacity={0.7}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.primary}>
              ✏️ වෙනත් පාඨයක් තෝරන්න
            </AppText>
          </TouchableOpacity>
        </View>
        <AppText
          size="xxl"
          weight="extrabold"
          color={ThemeColors.textPrimary}
          style={m2Styles.sentenceText}
        >
          {selectedReadingText}
        </AppText>
      </View>

      {/* Action Buttons Row */}
      <View style={m2Styles.actionRow}>
        <TouchableOpacity
          style={[m2Styles.practiceBtn, isAnalyzing && { opacity: 0.75 }]}
          disabled={isAnalyzing}
          onPress={() => {
            if (!hasActiveConsent) {
              setShowPermissionModal(true);
            } else {
              handleStartReading();
            }
          }}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <AppText
                size="sm"
                weight="extrabold"
                color="#FFFFFF"
                align="center"
                style={m2Styles.btnText}
              >
                විශ්ලේෂණය කරමින්...
              </AppText>
            </View>
          ) : (
            <AppText
              size="sm"
              weight="extrabold"
              color="#FFFFFF"
              align="center"
              style={m2Styles.btnText}
            >
              {t("child.home.readOutLoudBtn")}
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {/* Camera & Microphone Permission Dialog */}
      <DevicePermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onGranted={handleStartReading}
        onDenied={() => {
          Alert.alert(
            "දැනුම්දීම",
            "කැමරා සහ මයික්‍රෆෝන අවසර නොමැතිව මූලික කියවීමේ සැසිය ආරම්භ වේ.",
            [
              { text: "අවලංගු කරන්න", style: "cancel" },
              { text: "ඉදිරියට යන්න", onPress: handleStartReading },
            ]
          );
        }}
      />

      {/* Reading Text Selection Modal (List & Custom Input) */}
      <ReadingTextSelectModal
        visible={showTextModal}
        onClose={() => setShowTextModal(false)}
        selectedText={selectedReadingText}
        onSelectText={(text, optionId, gradeLevel, textType) => {
          setSelectedReadingText(text);
          if (optionId) setSelectedOptionId(optionId);
          if (gradeLevel) setSelectedGradeLevel(gradeLevel);
          if (textType) setSelectedTextType(textType);
        }}
      />

      {/* OOV / needs_word_confirmation Dialog */}
      <Modal
        visible={oovModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOovModalVisible(false)}
      >
        <View style={m2Styles.modalBackdrop}>
          <View style={[m2Styles.oovModalCard, ThemeShadow.lg]}>
            <View style={m2Styles.oovIconBadge}>
              <AppText size="display">⚠️</AppText>
            </View>
            <AppText
              size="lg"
              weight="extrabold"
              color="#DC2626"
              align="center"
              style={{ marginTop: 10 }}
            >
              හඳුනා නොගත් වචන හමුවිය
            </AppText>
            <AppText
              size="xs"
              color={ThemeColors.textSecondary}
              align="center"
              style={{ marginTop: 6, lineHeight: 18, paddingHorizontal: 4 }}
            >
              පහත දැක්වෙන වචන ශබ්දකෝෂයේ හඳුනාගත නොහැකි විය. කරුණාකර අක්ෂර වින්‍යාසය පරීක්ෂා කර පාඨය සංස්කරණය කරන්න:
            </AppText>

            {/* Unknown Tokens Chips */}
            <View style={m2Styles.oovTokensRow}>
              {oovTokens.map((token, idx) => (
                <View key={`oov-${idx}`} style={m2Styles.oovTokenChip}>
                  <AppText size="sm" weight="extrabold" color="#991B1B">
                    {token}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Actions: Edit Text and Close */}
            <View style={m2Styles.oovActionCol}>
              <TouchableOpacity
                style={m2Styles.oovEditBtn}
                onPress={() => {
                  setOovModalVisible(false);
                  setShowTextModal(true);
                }}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  ✏️ පාඨය සංස්කරණය කරන්න (Edit Text)
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={m2Styles.oovCloseBtn}
                onPress={() => setOovModalVisible(false)}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                  වසන්න (Close)
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const m2Styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF7",
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderBottomWidth: 4,
    borderBottomColor: "#F59E0B",
    ...ThemeShadow.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
    flexWrap: "wrap",
    gap: 6,
  },
  moduleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moduleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
  },
  badgePill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  privacyBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 6,
  },
  changeTextBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#EAF7EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BCE6CB",
  },
  sentenceBlock: {
    backgroundColor: "#FFFFFF",
    padding: ThemeSpacing.md,
    borderRadius: 18,
    marginBottom: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: "#E2ECE6",
  },
  sentenceBlockFaded: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  sentenceText: {
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  originalTextStriked: {
    textDecorationLine: "line-through",
    opacity: 0.45,
  },
  simplifiedBlock: {
    marginBottom: ThemeSpacing.sm,
  },
  simplifiedArrowRow: {
    paddingVertical: 4,
    alignItems: "center",
  },
  magicPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  simplifiedSentenceBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 18,
    padding: ThemeSpacing.md,
  },
  simplifiedText: {
    lineHeight: 38,
    letterSpacing: 0.5,
    color: "#065F46",
  },
  translationRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#DCFCE7",
  },
  actionRow: {
    flexDirection: "row",
    gap: ThemeSpacing.sm,
    marginTop: 4,
  },
  simplifyBtn: {
    flex: 1,
    backgroundColor: "#F59E0B",
    borderRadius: ThemeRadius.full,
    paddingVertical: ThemeSpacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D97706",
    borderBottomWidth: 4,
    borderBottomColor: "#B45309",
    minHeight: 48,
  },
  simplifyBtnActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    borderBottomColor: "#F59E0B",
  },
  practiceBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.full,
    paddingVertical: ThemeSpacing.sm + 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryDark,
    borderBottomWidth: 4,
    borderBottomColor: "#064E2A",
    minHeight: 48,
  },
  btnText: {
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: ThemeSpacing.md,
  },
  oovModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  oovIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  oovTokensRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginVertical: ThemeSpacing.md,
  },
  oovTokenChip: {
    backgroundColor: "#FEE2E2",
    borderRadius: ThemeRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
  },
  oovActionCol: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  oovEditBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.full,
    paddingVertical: 12,
    alignItems: "center",
    ...ThemeShadow.sm,
  },
  oovCloseBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('[HomeScreen] Logout error:', e);
    }
    router.replace("/(auth)/role-select");
  };

  const handleSwitchToParent = async () => {
    if (user?.role === 'parent' || user?.role === 'teacher') {
      router.replace('/(parent)/dashboard');
      return;
    }

    try {
      const guardians = user?.uid ? await connectionService.getLinkedGuardians(user.uid, user.email) : [];
      if (guardians.length === 0) {
        if (Platform.OS === 'web') {
          const confirm = window.confirm(
            'තවමත් ඔබගේ ගිණුමට කිසිදු දෙමාපිය හෝ ගුරු ගිණුමක් සම්බන්ධ කර නැත.\n\nදෙමාපියන්ට ලබාදීමට ඔබගේ ශිෂ්‍ය කේතය (Student Code) බැලීමට පැතිකඩ වෙත යන්නද?'
          );
          if (confirm) {
            router.push('/(child)/profile');
          }
        } else {
          Alert.alert(
            'දෙමාපිය ගිණුමක් නැත',
            'තවමත් ඔබගේ ගිණුමට කිසිදු දෙමාපිය හෝ ගුරු ගිණුමක් සම්බන්ධ කර නැත. කරුණාකර ඔබගේ ශිෂ්‍ය කේතය දෙමාපියන්ට ලබාදී සම්බන්ධ වීමේ ඉල්ලීමක් එවන්න.',
            [
              { text: 'හරි' },
              { text: 'ශිෂ්‍ය කේතය බලන්න', onPress: () => router.push('/(child)/profile') },
            ]
          );
        }
        return;
      }

      const activeGuardian = guardians[0];
      useChildStoreBase.getState().setCurrentGuardian(activeGuardian);

      if (user) {
        const activeAvatar = currentChild?.avatar || user.avatar;
        useChildStoreBase.getState().setCurrentChild({
          id: user.uid,
          name: user.displayName || 'ශිෂ්‍යයා',
          age: user.age || 7,
          grade: user.grade || 2,
          readingLevel: 'medium',
          streak: 1,
          stars: 10,
          totalSessions: 0,
          avatarColor: '#4F46E5',
          avatar: activeAvatar,
        });
      }

      router.replace('/(parent)/dashboard');
    } catch (err) {
      console.warn('[HomeScreen] Switch error:', err);
    }
  };

  const currentChild = useChildStoreBase((s) => s.currentChild);
  const isParentOrTeacher = user?.role === 'parent' || user?.role === 'teacher';

  // Ensure currentChild is populated in childStore when a child user is active
  useEffect(() => {
    if (!currentChild && user?.uid && !isParentOrTeacher) {
      useChildStoreBase.getState().setCurrentChild({
        id: user.uid,
        name: user.displayName || 'ශිෂ්‍යයා',
        age: user.age || 7,
        grade: user.grade || 2,
        readingLevel: 'medium',
        streak: 1,
        stars: 10,
        totalSessions: 0,
        avatarColor: '#4F46E5',
        avatar: user.avatar,
      });
    }
  }, [currentChild, user, isParentOrTeacher]);

  const childAvatar = currentChild?.avatar || user?.avatar;
  const rawProfileName = user?.role === 'child'
    ? (user?.displayName || user?.fullName || '')
    : (currentChild?.name || user?.displayName || user?.fullName || '');

  const greetingName = rawProfileName.trim()
    ? rawProfileName.trim().split(" ")[0]
    : t('dashboard.defaultStudentName');

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER (Brand & Quick Actions) ── */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View style={styles.logoBadgeCircle}>
            <Image
              source={require("@/assets/logo-icon.png")}
              style={styles.brandLogoImg}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginLeft: 8 }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ letterSpacing: 0.3 }}>
              නැණ මං
            </AppText>
            <AppText size="xs" color="#64748B" style={{ fontSize: 10, marginTop: -3, fontWeight: "600" }}>
              Nena Man
            </AppText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Star Counter Pill */}
          <View style={styles.scorePill}>
            <AppText size="xs">⭐</AppText>
            <AppText size="xs" weight="extrabold" color="#92400E" style={{ marginLeft: 3 }}>
              120
            </AppText>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(child)/notifications")}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <AppText size="sm">🔔</AppText>
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Switch between Child Account and related Parent/Teacher Dashboard */}
          <TouchableOpacity
            style={styles.parentBackBtn}
            onPress={handleSwitchToParent}
            activeOpacity={0.75}
            accessibilityLabel="Switch to Parent / Educator Dashboard"
          >
            <AppText size="xs" weight="bold" color="#0369A1">👨‍👩‍👧‍👦</AppText>
          </TouchableOpacity>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.75}
            accessibilityLabel="Log Out"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 9 21 H 5 C 3.89543 21 3 20.1046 3 19 V 5 C 3 3.89543 3.89543 3 5 3 H 9 M 16 17 L 21 12 M 21 12 L 16 7 M 21 12 H 9"
                stroke="#DC2626"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── WELCOME HERO CARD (Spacious & Friendly) ── */}
        <View style={styles.welcomeHeroCard}>
          <View style={styles.welcomeHeroText}>
            <View style={styles.greetingPill}>
              <AppText size="xs" weight="bold" color="#047857">
                ☀️ {t('dashboard.greeting')}
              </AppText>
            </View>
            <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={styles.welcomeNameText}>
              {t('dashboard.welcomeFriend', { name: greetingName })}
            </AppText>
            <AppText size="xs" color="#64748B" style={{ marginTop: 2 }}>
              {t('dashboard.welcomeSubtitle')}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(child)/profile")}
            activeOpacity={0.8}
            style={styles.welcomeAvatarTouch}
            accessibilityLabel="Go to Profile"
          >
            {childAvatar?.type === 'character' && CHARACTER_AVATAR_SOURCES[childAvatar.value] ? (
              <Image
                source={CHARACTER_AVATAR_SOURCES[childAvatar.value]}
                style={styles.homeAvatarImage}
                resizeMode="cover"
              />
            ) : childAvatar?.type === 'photo' && childAvatar.value ? (
              <Image
                source={{ uri: childAvatar.value }}
                style={styles.homeAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <StudentAvatarPhoto size={48} showEditBadge={false} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── SECTION 1: ✨ M2 AI Sentence Simplification ── */}
        <M2SimplificationCard />

        {/* ── CARD 2: ⭐ අද ඔබේ ඉලක්කය (Today's Goal) ── */}
        <View style={styles.goalCard}>
          <View style={styles.starWatermark}>
            <AppText
              size="display"
              color="#F1F5F9"
              style={{ fontSize: 72, opacity: 0.6 }}
            >
              ⭐
            </AppText>
          </View>

          <View style={styles.goalTitleRow}>
            <View style={styles.goalIconCircle}>
              <AppText size="sm">🎯</AppText>
            </View>
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.primary}
              style={{ marginLeft: 8 }}
            >
              අද ඔබේ ඉලක්කය
            </AppText>
          </View>

          {/* Donut Chart 72% */}
          <View style={styles.donutContainer}>
            <Svg width={120} height={120} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="9"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10B981"
                strokeWidth="9"
                strokeDasharray="181, 251.3"
                strokeDashoffset="62.8"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <View style={styles.donutCenter}>
              <AppText
                size="xxl"
                weight="extrabold"
                color={ThemeColors.textPrimary}
              >
                72%
              </AppText>
              <AppText size="xs" color="#10B981" weight="bold">
                ජයග්‍රාහීයි!
              </AppText>
            </View>
          </View>

          <AppText
            size="sm"
            weight="semibold"
            color={ThemeColors.textPrimary}
            align="center"
            style={styles.goalEncouragement}
          >
            නියමයි! අද ඉලක්කය සම්පූර්ණ කරන්න තව ටිකයි! 🚀
          </AppText>

          {/* Streak Flame Pill */}
          <View style={styles.streakPill}>
            <AppText size="sm">🔥</AppText>
            <AppText
              size="xs"
              color="#92400E"
              weight="extrabold"
              style={{ marginLeft: 6 }}
            >
              දින 5ක අඛණ්ඩ ඉගෙනුම් ගමනක්
            </AppText>
          </View>
        </View>

        {/* ── CARD 3: 🎮 නැණ මං අභියෝගය (Nena Man Challenge) ── */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeaderRow}>
            <View style={styles.challengeIconCircle}>
              <AppText size="sm">🎮</AppText>
            </View>
            <AppText
              size="md"
              weight="extrabold"
              color="#BE123C"
              style={{ marginLeft: 8 }}
            >
              නැණ මං අභියෝගය
            </AppText>
          </View>

          <View style={styles.challengeInnerCard}>
            <View style={styles.challengeMetaRow}>
              <AppText
                size="md"
                weight="extrabold"
                color={ThemeColors.textPrimary}
              >
                සරල වාක්‍ය කියවීම
              </AppText>
              <View style={styles.easyBadgePill}>
                <AppText size="xs" color="#047857" weight="extrabold">
                  ⭐ පහසු මට්ටම
                </AppText>
              </View>
            </View>

            <AppText
              size="sm"
              color={ThemeColors.textSecondary}
              style={{ marginVertical: 8, lineHeight: 22 }}
            >
              සෙල්ලම් කරමින් අලුත් අකුරු ඉගෙන ගනිමු! 🎲
            </AppText>

            <TouchableOpacity
              style={styles.challengeActionBtn}
              onPress={() => router.push("/(child)/reading-comprehension")}
              activeOpacity={0.8}
            >
              <AppText size="md" weight="extrabold" color="#FFFFFF">
                ආරම්භ කරමු
              </AppText>
              <AppText
                size="md"
                weight="extrabold"
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              >
                🚀
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 4: 🎓 ඔබේ දක්ශතා (Your Skills) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="sm">🎓</AppText>
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.primary}
              style={{ marginLeft: 6 }}
            >
              ඔබේ දක්ශතා
            </AppText>
          </View>

          {/* Skill 1: අකුරු හඳුනාගැනීම */}
          <View style={styles.skillCardBox}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <View style={[styles.skillIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <AppText size="xs">🔤</AppText>
                </View>
                <AppText
                  size="sm"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 8 }}
                >
                  අකුරු හඳුනාගැනීම
                </AppText>
              </View>
              <View style={[styles.skillBadge, { backgroundColor: '#ECFDF5' }]}>
                <AppText size="xs" weight="extrabold" color="#059669">
                  88%
                </AppText>
              </View>
            </View>
            <View style={styles.skillTrackLine}>
              <View
                style={[
                  styles.skillFillLine,
                  { width: "88%", backgroundColor: "#10B981" },
                ]}
              />
            </View>
          </View>

          {/* Skill 2: ශබ්ද හඳුනාගැනීම */}
          <View style={styles.skillCardBox}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <View style={[styles.skillIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <AppText size="xs">👂</AppText>
                </View>
                <AppText
                  size="sm"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 8 }}
                >
                  ශබ්ද හඳුනාගැනීම
                </AppText>
              </View>
              <View style={[styles.skillBadge, { backgroundColor: '#FEF3C7' }]}>
                <AppText size="xs" weight="extrabold" color="#D97706">
                  80%
                </AppText>
              </View>
            </View>
            <View style={styles.skillTrackLine}>
              <View
                style={[
                  styles.skillFillLine,
                  { width: "80%", backgroundColor: "#F59E0B" },
                ]}
              />
            </View>
          </View>

          {/* Skill 3: වචන කියවීම */}
          <View style={styles.skillCardBox}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <View style={[styles.skillIconCircle, { backgroundColor: '#FFE4E6' }]}>
                  <AppText size="xs">📖</AppText>
                </View>
                <AppText
                  size="sm"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 8 }}
                >
                  වචන කියවීම
                </AppText>
              </View>
              <View style={[styles.skillBadge, { backgroundColor: '#FFE4E6' }]}>
                <AppText size="xs" weight="extrabold" color="#E11D48">
                  65%
                </AppText>
              </View>
            </View>
            <View style={styles.skillTrackLine}>
              <View
                style={[
                  styles.skillFillLine,
                  { width: "65%", backgroundColor: "#F43F5E" },
                ]}
              />
            </View>
          </View>

          {/* Skill 4: වාක්‍ය කියවීම */}
          <View style={styles.skillCardBox}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <View style={[styles.skillIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <AppText size="xs">🗂️</AppText>
                </View>
                <AppText
                  size="sm"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 8 }}
                >
                  වාක්‍ය කියවීම
                </AppText>
              </View>
              <View style={[styles.skillBadge, { backgroundColor: '#E0F2FE' }]}>
                <AppText size="xs" weight="extrabold" color="#0284C7">
                  36%
                </AppText>
              </View>
            </View>
            <View style={styles.skillTrackLine}>
              <View
                style={[
                  styles.skillFillLine,
                  { width: "36%", backgroundColor: "#0284C7" },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ── SECTION 5: 🌿 විවේකයක් ගමු (Mindful Break) ── */}
        <TouchableOpacity
          style={styles.breakCard}
          onPress={() => router.push("/(child)/cooldown")}
          activeOpacity={0.85}
        >
          <View style={styles.breakHeaderRow}>
            <View style={styles.breakIconCircle}>
              <AppText size="sm">🌿</AppText>
            </View>
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.primary}
              style={{ marginLeft: 8 }}
            >
              විවේකයක් ගමු
            </AppText>
          </View>

          <View style={styles.breakIllustrationBox}>
            <RelaxTreeIllustration size={130} />
          </View>

          <AppText
            size="sm"
            color={ThemeColors.textPrimary}
            weight="bold"
            align="center"
            style={{ marginTop: 6 }}
          >
            මනසට පොඩි විවේකයක් දෙමු 🌳
          </AppText>
          <AppText
            size="xs"
            color={ThemeColors.textSecondary}
            align="center"
            style={{ marginTop: 2 }}
          >
            සන්සුන්ව හුස්ම ගනිමින් විනෝද වෙමු!
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* 5-Tab Sinhala Bottom Navigation with Home Active */}
      <BottomNav role="child" activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF8",
    ...(Platform.OS === "web"
      ? { minHeight: "100vh" as any, height: "100vh" as any }
      : {}),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 3,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2ECE6",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  brandLogoImg: {
    width: "100%",
    height: "100%",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  bellBtn: {
    position: "relative",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  parentBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  welcomeHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: "#E2ECE6",
    borderLeftWidth: 5,
    borderLeftColor: ThemeColors.primary,
    ...ThemeShadow.sm,
    marginBottom: 4,
  },
  welcomeHeroText: {
    flex: 1,
    paddingRight: 10,
  },
  greetingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    marginBottom: 4,
  },
  welcomeNameText: {
    lineHeight: 28,
  },
  welcomeAvatarTouch: {
    padding: 2,
    borderRadius: 30,
    backgroundColor: "#EAF7EE",
    borderWidth: 2,
    borderColor: "#A7F3D0",
  },
  homeAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  redDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: "#E2ECE6",
    borderBottomWidth: 4,
    borderBottomColor: "#CBD5E1",
    position: "relative",
    overflow: "hidden",
    ...ThemeShadow.sm,
  },
  starWatermark: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
  },
  goalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  donutContainer: {
    width: 120,
    height: 120,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 4,
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
  },
  goalEncouragement: {
    marginTop: 8,
    lineHeight: 22,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: ThemeRadius.full,
    paddingVertical: 8,
    paddingHorizontal: ThemeSpacing.md,
    marginTop: ThemeSpacing.sm,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderBottomWidth: 3,
    borderBottomColor: "#F59E0B",
  },
  challengeCard: {
    backgroundColor: "#FFF1F2",
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    borderBottomWidth: 4,
    borderBottomColor: "#FDA4AF",
    ...ThemeShadow.sm,
  },
  challengeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
  },
  challengeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDA4AF",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeInnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  challengeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  easyBadgePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  challengeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E11D48",
    borderRadius: ThemeRadius.full,
    minHeight: 48,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#BE123C",
    borderBottomWidth: 4,
    borderBottomColor: "#9F1239",
  },
  sectionWrap: {
    gap: ThemeSpacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  skillCardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: "#E2ECE6",
    borderBottomWidth: 3,
    borderBottomColor: "#CBD5E1",
    ...ThemeShadow.sm,
  },
  skillHeaderLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skillTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  skillTrackLine: {
    width: "100%",
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: ThemeRadius.full,
    overflow: "hidden",
  },
  skillFillLine: {
    height: 10,
    borderRadius: ThemeRadius.full,
  },
  breakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: ThemeSpacing.md + 2,
    borderWidth: 1.5,
    borderColor: "#D1E7DD",
    borderBottomWidth: 4,
    borderBottomColor: "#A3D1BE",
    alignItems: "center",
    ...ThemeShadow.sm,
  },
  breakHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: ThemeSpacing.xs,
  },
  breakIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  breakIllustrationBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    borderWidth: 2,
  },
});
