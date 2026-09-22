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
import NavBar from "@/components/NavBar";

interface RoleCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
  border: string;
  accentColor: string;
  onPress: () => void;
  delay: number;
}

function RoleCard({
  emoji,
  title,
  subtitle,
  bg,
  border,
  accentColor,
  onPress,
  delay,
}: RoleCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.card,
          { backgroundColor: bg, borderColor: border },
          ThemeShadow.md,
        ]}
      >
        <View style={styles.cardHeader}>
          <AppText size="display">{emoji}</AppText>
          <View style={[styles.cardArrow, { backgroundColor: accentColor }]}>
            <AppText size="md" weight="bold" color={ThemeColors.textPrimary}>
              →
            </AppText>
          </View>
        </View>
        <View>
          <AppText
            size="xl"
            weight="extrabold"
            color={ThemeColors.textPrimary}
            style={{ marginBottom: ThemeSpacing.xs }}
          >
            {title}
          </AppText>
          <AppText size="sm" color={ThemeColors.textSecondary}>
            {subtitle}
          </AppText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <NavBar
        title="Role Selection"
        subtitle="Choose your profile"
        showBack={true}
        fallbackRoute="/"
        showSettings={true}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AppText
            size="xxl"
            weight="extrabold"
            color={ThemeColors.textPrimary}
            style={{ marginBottom: ThemeSpacing.xs }}
          >
            Who is reading today?
          </AppText>
          <AppText size="md" color={ThemeColors.textSecondary}>
            Choose your role to get the right experience
          </AppText>
        </View>

        {/* Role Cards */}
        <View style={styles.cards}>
          <RoleCard
            emoji="🌟"
            title="I'm a Student"
            subtitle="Start your reading adventure! Practice Sinhala words and earn stars."
            bg={ThemeColors.surfaceElevated}
            border={ThemeColors.accent}
            accentColor={ThemeColors.accent}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { role: "child" },
              })
            }
            delay={80}
          />
          <RoleCard
            emoji="👩‍🏫"
            title="I'm a Parent / Teacher"
            subtitle="View reading progress, clinical error reports, and AI recommendations."
            bg={ThemeColors.infoSurface}
            border={ThemeColors.infoBorder}
            accentColor={ThemeColors.surface}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { role: "parent" },
              })
            }
            delay={180}
          />
        </View>

        {/* Auth Quick Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={styles.registerBtn}
            activeOpacity={0.7}
          >
            <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
              New to Nena-Man? Create an Account →
            </AppText>
          </TouchableOpacity>

          <AppText
            size="xs"
            color={ThemeColors.textMuted}
            align="center"
            style={{ marginTop: ThemeSpacing.md }}
          >
            Nena-Man · SLIIT IT4010 · Dyslexia Assistant
          </AppText>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: ThemeSpacing.lg,
    justifyContent: "space-between",
    paddingBottom: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
  },
  header: {
    marginTop: ThemeSpacing.xs,
  },
  cards: {
    gap: ThemeSpacing.md,
    marginVertical: ThemeSpacing.md,
  },
  card: {
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    minHeight: 165,
    justifyContent: "space-between",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ThemeSpacing.sm,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: ThemeRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  footerLinks: {
    alignItems: "center",
  },
  registerBtn: {
    backgroundColor: ThemeColors.surface,
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.lg,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    ...ThemeShadow.sm,
  },
});
