import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
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

// ── M2 AI Simplification Card ─────────────────────────────────────────────────
function M2SimplificationCard() {
  const [simplified, setSimplified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouterM2();

  const handleSimplify = useCallback(() => {
    if (simplified) {
      setSimplified(false);
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSimplified(true);
    }, 600);
  }, [simplified]);

  const original = "මම මගේ රටට ගොඩාක් ආදරෙයි";
  const simplifiedText = "මම මගේ රටට ආදරෙයි";

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
        <View style={m2Styles.badgePill}>
          <AppText size="xs" weight="bold" color="#B45309">
            ✨ පහසු කියවීම
          </AppText>
        </View>
      </View>

      {/* Original Sentence Block */}
      <View style={[m2Styles.sentenceBlock, simplified && m2Styles.sentenceBlockFaded]}>
        <View style={m2Styles.labelRow}>
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            📖 අද කියවිය යුතු වාක්‍යය:
          </AppText>
        </View>
        <AppText
          size="xxl"
          weight="extrabold"
          color={ThemeColors.textPrimary}
          style={[
            m2Styles.sentenceText,
            simplified && m2Styles.originalTextStriked,
          ]}
        >
          {original}
        </AppText>
      </View>

      {/* AI Simplified Output */}
      {simplified && (
        <View style={m2Styles.simplifiedBlock}>
          <View style={m2Styles.simplifiedArrowRow}>
            <View style={m2Styles.magicPill}>
              <AppText size="xs" weight="extrabold" color="#047857">
                ⬇️ 'ගොඩාක්' ඉවත් කර වඩාත් පහසු කළා!
              </AppText>
            </View>
          </View>
          <View style={m2Styles.simplifiedSentenceBox}>
            <View style={m2Styles.labelRow}>
              <AppText size="xs" weight="extrabold" color="#047857">
                ✨ සරල කළ වාක්‍යය:
              </AppText>
            </View>
            <AppText
              size="xxl"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              style={m2Styles.simplifiedText}
            >
              {simplifiedText}
            </AppText>
            <View style={m2Styles.translationRow}>
              <AppText size="xs" color="#64748B" weight="medium">
                🇬🇧 "I love my country"
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={m2Styles.actionRow}>
        <TouchableOpacity
          style={[
            m2Styles.simplifyBtn,
            simplified && m2Styles.simplifyBtnActive,
          ]}
          onPress={handleSimplify}
          activeOpacity={0.8}
        >
          <AppText
            size="sm"
            weight="extrabold"
            color={simplified ? "#92400E" : "#FFFFFF"}
          >
            {processing
              ? "⏳ AI සකසමින්..."
              : simplified
                ? "↩️ මුල් වාක්‍යය"
                : "✨ සරල කරමු"}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={m2Styles.practiceBtn}
          onPress={() => router.push("/(child)/m1-session")}
          activeOpacity={0.8}
        >
          <AppText size="sm" weight="extrabold" color="#FFFFFF">
            🎙️ ශබ්ද නගා කියවමු
          </AppText>
        </TouchableOpacity>
      </View>
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
  labelRow: {
    marginBottom: 6,
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
        });
      }

      router.replace('/(parent)/dashboard');
    } catch (err) {
      console.warn('[HomeScreen] Switch error:', err);
    }
  };

  const currentChild = useChildStoreBase((s) => s.currentChild);
  const greetingName = (user?.role === 'child' ? user.displayName : currentChild?.name)
    ? (user?.role === 'child' ? user.displayName : currentChild?.name)!.split(" ")[0]
    : user?.displayName
      ? user.displayName.split(" ")[0]
      : "ශිෂ්‍යයා";

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadgeCircle}>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
              නැණ
            </AppText>
          </View>

          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <AppText size="xs" weight="bold" color="#64748B">
              {t('dashboard.greeting')},
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                {greetingName}!
              </AppText>
              <AppText size="md" style={{ marginLeft: 4 }}>
                👋
              </AppText>
            </View>
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
          >
            <AppText size="sm">🔔</AppText>
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Student Avatar */}
          <TouchableOpacity
            onPress={() => router.push("/(child)/profile")}
            activeOpacity={0.8}
            style={styles.avatarWrap}
          >
            <StudentAvatarPhoto size={36} showEditBadge={false} />
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
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
    paddingVertical: ThemeSpacing.xs + 4,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2ECE6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF7EE",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  bellBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  avatarWrap: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#10B981",
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  parentBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
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
