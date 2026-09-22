import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from "@/constants/theme";
import AppText from "@/components/AppText";
import NenaManLogo from "@/components/NenaManLogo";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        {/* Logo + Name stacked vertically, centered */}
        <Animated.View
          style={[
            styles.logoBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* SVG Icon */}
          <NenaManLogo size="xl" showText={false} color={ThemeColors.primary} />

          {/* App Name below icon */}
          <AppText
            size="xxxl"
            weight="extrabold"
            color={ThemeColors.primary}
            align="center"
            style={styles.appName}
          >
            නැණ මං
          </AppText>
          <AppText
            size="sm"
            weight="semibold"
            color={ThemeColors.textSecondary}
            align="center"
            style={styles.tagline}
          >
            Sinhala Dyslexia Learning Companion
          </AppText>

          {/* Pill badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                🎙️ Speech Analysis
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                ✨ NLP Simplification
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                🤖 Behavioral State Detection
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                🧠 Adaptive Learning Engine
              </AppText>
            </View>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View style={[styles.btnWrap, { opacity: btnAnim }]}>
          <TouchableOpacity
            style={[styles.startBtn, ThemeShadow.md]}
            onPress={() => router.replace("/(auth)/role-select")}
            activeOpacity={0.85}
          >
            <AppText size="lg" weight="extrabold" color="#FFFFFF">
              ආරම්භ කරන්න
            </AppText>
            <AppText size="md" color="#FFFFFF" style={{ marginLeft: 8 }}>
              →
            </AppText>
          </TouchableOpacity>

          <AppText
            size="xs"
            color={ThemeColors.textMuted}
            align="center"
            style={{ marginTop: 16 }}
          >
            Grade 1–5 · Sinhala Reading · Dyslexia-Friendly
          </AppText>
        </Animated.View>
      </View>

      {/* Bottom version watermark */}
      <AppText
        size="xs"
        color={ThemeColors.textMuted}
        align="center"
        style={styles.version}
      >
        v1.0.0 Prototype · නැණ මං Team
      </AppText>
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
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ThemeSpacing.lg,
    gap: ThemeSpacing.xl,
  },
  logoBlock: {
    alignItems: "center",
    gap: ThemeSpacing.sm,
  },
  appName: {
    marginTop: ThemeSpacing.md,
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 4,
    letterSpacing: 0.3,
  },
  badgeRow: {
    flexDirection: "row",
    gap: ThemeSpacing.xs,
    marginTop: ThemeSpacing.md,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: ThemeColors.primaryLight,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  btnWrap: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.lg,
    width: "100%",
    height: 58,
    gap: 4,
  },
  version: {
    paddingBottom: ThemeSpacing.md,
  },
});
