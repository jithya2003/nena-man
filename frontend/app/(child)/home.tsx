import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
import NenaManLogo from "@/components/NenaManLogo";
import {
  StudentAvatarPhoto,
  RelaxTreeIllustration,
} from "@/components/Illustrations";
import { useRouter as useRouterM2 } from "expo-router";

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
    }, 700);
  }, [simplified]);

  const original = "මම මගේ රටට ගොඩාක් ආදරෙයි";
  const simplifiedText = "මම මගේ රටට ආදරෙයි";

  return (
    <View style={m2Styles.card}>
      {/* Module Header */}
      <View style={m2Styles.headerRow}>
        <View style={m2Styles.moduleTag}>
          <View style={m2Styles.moduleDot} />
          <AppText size="xs" weight="bold" color={ThemeColors.accent}>
            ✨ AI ස්මාර්ට් වාක්‍ය සරල කිරීම
          </AppText>
        </View>
        <AppText size="xs" color={ThemeColors.textMuted}>
          ස්වයංක්‍රීය සහායක
        </AppText>
      </View>

      {/* Original Sentence */}
      <View style={m2Styles.sentenceBlock}>
        <AppText
          size="xs"
          weight="bold"
          color={ThemeColors.textMuted}
          style={{ marginBottom: 4 }}
        >
          📖 අද කියවිය යුතු වාක්‍යය:
        </AppText>
        <AppText
          size="xxl"
          weight="extrabold"
          color={ThemeColors.textPrimary}
          style={[
            m2Styles.sentenceText,
            simplified && { textDecorationLine: "line-through", opacity: 0.45 },
          ]}
        >
          {original}
        </AppText>
      </View>

      {/* AI Simplified Output */}
      {simplified && (
        <View style={m2Styles.simplifiedBlock}>
          <View style={m2Styles.simplifiedArrowRow}>
            <AppText size="xs" weight="bold" color={ThemeColors.accent}>
              ⬇ AI සරල කිරීම: 'ගොඩාක්' ඉවත් කර වඩාත් පහසු කළා
            </AppText>
          </View>
          <View style={m2Styles.simplifiedSentenceBox}>
            <AppText
              size="xs"
              weight="bold"
              color={ThemeColors.accent}
              style={{ marginBottom: 4 }}
            >
              ✨ සරල කළ වාක්‍යය:
            </AppText>
            <AppText
              size="xxl"
              weight="extrabold"
              color={ThemeColors.textPrimary}
            >
              {simplifiedText}
            </AppText>
            <AppText
              size="xs"
              color={ThemeColors.textSecondary}
              style={{ marginTop: 4 }}
            >
              I love my country
            </AppText>
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
          activeOpacity={0.85}
        >
          <AppText
            size="xs"
            weight="bold"
            color={simplified ? ThemeColors.accent : "#FFFFFF"}
          >
            {processing
              ? "⏳ AI සකසමින්..."
              : simplified
                ? "↩ මුල් වාක්‍යය"
                : "✨ AI මගින් සරල කරන්න"}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={m2Styles.practiceBtn}
          onPress={() => router.push("/(child)/m1-session")}
          activeOpacity={0.85}
        >
          <AppText size="xs" weight="bold" color="#FFFFFF">
            🎙️ ශබ්ද නගා කියවමු
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const m2Styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: "#EED9BE",
    shadowColor: "#0B381E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    gap: 6,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.accent,
  },
  sentenceBlock: {
    backgroundColor: ThemeColors.backgroundMuted,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.sm,
  },
  sentenceText: {
    lineHeight: 36,
  },
  simplifiedBlock: {
    marginBottom: ThemeSpacing.sm,
  },
  simplifiedArrowRow: {
    paddingVertical: ThemeSpacing.xs,
    alignItems: "center",
  },
  simplifiedSentenceBox: {
    backgroundColor: "#FDF4E9",
    borderWidth: 1,
    borderColor: "#EED9BE",
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.xs,
  },
  simplifyBtn: {
    flex: 1,
    backgroundColor: ThemeColors.accent,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ThemeColors.accentDark,
  },
  simplifyBtnActive: {
    backgroundColor: "#FDF4E9",
  },
  practiceBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    alignItems: "center",
  },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadgeCircle}>
            <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
              නැණ මං
            </AppText>
          </View>

          <View style={{ marginLeft: 8 }}>
            <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
              ආයුබෝවන්,
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
                සෙනුලි!
              </AppText>
              <AppText size="sm" style={{ marginLeft: 3 }}>
                👏
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell in soft blue pill */}
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
          >
            <StudentAvatarPhoto size={36} showEditBadge={false} />
          </TouchableOpacity>

          {/* Log Out Button (Exit Icon Only) */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.replace("/(auth)/role-select")}
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
        {/* ── SECTION 1: ✨ M2 AI Sentence Simplification — First Impression ── */}
        <M2SimplificationCard />

        {/* ── CARD 2: ⭐ අද ඔබේ ඉලක්කය (Today's Goal) ── */}
        <View style={[styles.goalCard, ThemeShadow.sm]}>
          <View style={styles.starWatermark}>
            <AppText
              size="display"
              color="#F3F4F6"
              style={{ fontSize: 64, opacity: 0.5 }}
            >
              ⭐
            </AppText>
          </View>

          <View style={styles.goalTitleRow}>
            <AppText size="sm">⭐</AppText>
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.primary}
              style={{ marginLeft: 6 }}
            >
              අද ඔබේ ඉලක්කය
            </AppText>
          </View>

          {/* Donut Chart 72% */}
          <View style={styles.donutContainer}>
            <Svg width={110} height={110} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10B981"
                strokeWidth="8"
                strokeDasharray="181, 251.3"
                strokeDashoffset="62.8"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <View style={styles.donutCenter}>
              <AppText
                size="xl"
                weight="extrabold"
                color={ThemeColors.textPrimary}
              >
                72%
              </AppText>
            </View>
          </View>

          <AppText
            size="xs"
            color={ThemeColors.textPrimary}
            align="center"
            style={styles.goalEncouragement}
          >
            නියමයි! අද ඉලක්කය සම්පූර්ණ කරන්න තව ටිකයි! 🚀
          </AppText>

          {/* Streak Flame Pill */}
          <View style={styles.streakPill}>
            <AppText size="xs">🔥</AppText>
            <AppText
              size="xs"
              color="#92400E"
              weight="bold"
              style={{ marginLeft: 6 }}
            >
              දින 5ක අඛණ්ඩ ඉගෙනුම් ගමනක්
            </AppText>
          </View>
        </View>

        {/* ── CARD 2: 🎮 නැණ මං අභියෝගය (Nena Man Challenge - Pink Theme) ── */}
        <View style={[styles.challengeCard, ThemeShadow.sm]}>
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
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              style={{ marginBottom: 4 }}
            >
              සරල වාක්‍ය කියවීම
            </AppText>

            <View style={styles.easyBadgePill}>
              <AppText size="xs" color="#047857" weight="bold">
                • පහසු මට්ටම
              </AppText>
            </View>

            <AppText
              size="xs"
              color={ThemeColors.textSecondary}
              style={{ marginVertical: 6 }}
            >
              සෙල්ලම් කරමින් අකුරු ඉගෙන ගනිමු! 🎲
            </AppText>

            <TouchableOpacity
              style={styles.challengeActionBtn}
              onPress={() => router.push("/(child)/reading-comprehension")}
              activeOpacity={0.85}
            >
              <AppText size="sm" weight="bold" color="#FFFFFF">
                ආරම්භ කරන්න
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              >
                →
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 3: 🎓 ඔබේ දක්ශතා (Your Skills) ── */}
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
          <View style={[styles.skillCardBox, ThemeShadow.sm]}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <AppText size="xs">💠</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 6 }}
                >
                  අකුරු හඳුනාගැනීම
                </AppText>
              </View>
              <AppText size="xs" weight="extrabold" color="#10B981">
                88%
              </AppText>
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
          <View style={[styles.skillCardBox, ThemeShadow.sm]}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <AppText size="xs">👥</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 6 }}
                >
                  ශබ්ද හඳුනාගැනීම
                </AppText>
              </View>
              <AppText size="xs" weight="extrabold" color="#F59E0B">
                80%
              </AppText>
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
          <View style={[styles.skillCardBox, ThemeShadow.sm]}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <AppText size="xs">📖</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 6 }}
                >
                  වචන කියවීම
                </AppText>
              </View>
              <AppText size="xs" weight="extrabold" color="#F43F5E">
                65%
              </AppText>
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
          <View style={[styles.skillCardBox, ThemeShadow.sm]}>
            <View style={styles.skillHeaderLine}>
              <View style={styles.skillTitleWithIcon}>
                <AppText size="xs">🗂️</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                  style={{ marginLeft: 6 }}
                >
                  වාක්‍ය කියවීම
                </AppText>
              </View>
              <AppText size="xs" weight="extrabold" color="#0284C7">
                36%
              </AppText>
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

        {/* ── SECTION 4: 🌿 විවේකයක් ගමු (Mindful Break) ── */}
        <TouchableOpacity
          style={[styles.breakCard, ThemeShadow.sm]}
          onPress={() => router.push("/(child)/cooldown")}
          activeOpacity={0.85}
        >
          <View style={styles.breakHeaderRow}>
            <AppText size="sm">🔔</AppText>
            <AppText
              size="md"
              weight="extrabold"
              color={ThemeColors.primary}
              style={{ marginLeft: 6 }}
            >
              විවේකයක් ගමු
            </AppText>
          </View>

          <View style={styles.breakIllustrationBox}>
            <RelaxTreeIllustration size={130} />
          </View>

          <AppText
            size="xs"
            color={ThemeColors.textSecondary}
            align="center"
            style={{ marginTop: 4 }}
          >
            මනසට පොඩි විවේකයක් දෙමු. 🌳
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
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === "web"
      ? { minHeight: "100vh" as any, height: "100vh" as any }
      : {}),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF7EE",
    borderWidth: 1.5,
    borderColor: "#C7EBD2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bellBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
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
  redDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
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
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    position: "relative",
    overflow: "hidden",
  },
  starWatermark: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
  },
  donutContainer: {
    width: 110,
    height: 110,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 4,
  },
  donutCenter: {
    position: "absolute",
  },
  goalEncouragement: {
    marginTop: 8,
    lineHeight: 18,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: ThemeRadius.full,
    paddingVertical: 6,
    paddingHorizontal: ThemeSpacing.md,
    marginTop: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  challengeCard: {
    backgroundColor: "#FFF1F2",
    borderRadius: 24,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  challengeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ThemeSpacing.sm,
  },
  challengeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  easyBadgePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  challengeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E11D48",
    borderRadius: ThemeRadius.md,
    height: 44,
    marginTop: 6,
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  skillCardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  skillHeaderLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  skillTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillTrackLine: {
    width: "100%",
    height: 7,
    backgroundColor: "#E5E7EB",
    borderRadius: ThemeRadius.full,
    overflow: "hidden",
  },
  skillFillLine: {
    height: 7,
    borderRadius: ThemeRadius.full,
  },
  breakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    alignItems: "center",
  },
  breakHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: ThemeSpacing.xs,
  },
  breakIllustrationBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});
