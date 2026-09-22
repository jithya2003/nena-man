import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import VoiceAssessmentModal from "@/components/VoiceAssessmentModal";

const COMPREHENSION_QUESTIONS = [
  {
    id: 1,
    sentence: "අමා මලක් අරගෙන පාසලට ගියා .",
    simplifiedSentence: "අමා මලක් ගෙනාවා .",
    question: "❓ අමා පාසලට රැගෙන ගියේ කුමක්ද?",
    options: [
      { id: 1, text: "පොතක්", isCorrect: false },
      { id: 2, text: "මලක්", isCorrect: true },
      { id: 3, text: "පෑනක්", isCorrect: false },
    ],
  },
  {
    id: 2,
    sentence: "සුදු පූසා කිරි බොනවා .",
    simplifiedSentence: "පූසා කිරි බොනවා .",
    question: "❓ කිරි බොන්නේ කවුද?",
    options: [
      { id: 1, text: "සුදු බල්ලා", isCorrect: false },
      { id: 2, text: "සුදු පූසා", isCorrect: true },
      { id: 3, text: "ලේනා", isCorrect: false },
    ],
  },
  {
    id: 3,
    sentence: "ළමයි පිට්ටනියේ පන්දු කෙළිති .",
    simplifiedSentence: "ළමයි පිට්ටනියේ කෙළිති .",
    question: "❓ ළමයි සෙල්ලම් කරන්නේ කොහේද?",
    options: [
      { id: 1, text: "පිට්ටනියේ", isCorrect: true },
      { id: 2, text: "ගෙදර", isCorrect: false },
      { id: 3, text: "පන්තියේ", isCorrect: false },
    ],
  },
];

export default function ReadingComprehensionScreen() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(2);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSimplify = () => {
    if (isSimplified) {
      setIsSimplified(false);
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setIsSimplified(true);
    }, 700);
  };

  const currentQ = COMPREHENSION_QUESTIONS[currentIndex];

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1500);
  };

  const handleVoiceSuccess = () => {
    const correctOpt = currentQ.options.find((o) => o.isCorrect);
    if (correctOpt) {
      setSelectedOptionId(correctOpt.id);
    }
    setTimeout(() => {
      if (currentIndex < COMPREHENSION_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOptionId(null);
      } else {
        router.push("/(child)/result");
      }
    }, 1000);
  };

  const handleConfirmAnswer = () => {
    if (selectedOptionId === null) return;

    if (currentIndex < COMPREHENSION_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionId(null);
    } else {
      router.push("/(child)/result");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.primary}
            />
          </Svg>
        </TouchableOpacity>

        <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
          සරල වාක්‍ය කියවමු
        </AppText>

        <View style={{ width: 36 }} />
      </View>

      {/* Progress step */}
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            ප්‍රශ්නය {currentIndex + 1} / {COMPREHENSION_QUESTIONS.length}
          </AppText>
          <AppText size="sm">⭐</AppText>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${((currentIndex + 1) / COMPREHENSION_QUESTIONS.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Sentence / Story Card with left blue highlight */}
        <View style={[styles.sentenceCard, ThemeShadow.sm]}>
          <View style={styles.leftAccentBar} />

          <View style={styles.sentenceCardBody}>
            {/* Sentence text with AI simplified option */}
            {isSimplified && (
              <View style={styles.simplifiedBadge}>
                <AppText size="xs" weight="bold" color="#965B20">
                  ✨ AI සරල කළ වාක්‍යය
                </AppText>
              </View>
            )}
            <AppText
              size="xxl"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              align="center"
              style={styles.sentenceText}
            >
              {isSimplified ? currentQ.simplifiedSentence : currentQ.sentence}
            </AppText>

            {/* Audio & Mic Actions Row */}
            <View style={styles.audioActionsRow}>
              <TouchableOpacity
                style={[
                  styles.listenAudioBtn,
                  isPlayingAudio && styles.listenAudioBtnPlaying,
                ]}
                onPress={handlePlayAudio}
                activeOpacity={0.8}
              >
                <AppText size="sm">🔊</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color={ThemeColors.primary}
                  style={{ marginLeft: 6 }}
                >
                  {isPlayingAudio ? "වාදනය වේ..." : "අසන්න"}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.micActionBtn}
                onPress={() => setShowVoiceModal(true)}
                activeOpacity={0.8}
              >
                <AppText size="sm">🎙️</AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                >
                  කියවන්න
                </AppText>
              </TouchableOpacity>
            </View>

            {/* AI Simplification Toggle */}
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                isSimplified && styles.toggleBtnActive,
              ]}
              onPress={handleSimplify}
              activeOpacity={0.8}
            >
              <AppText
                size="xs"
                weight="bold"
                color={isSimplified ? "#965B20" : ThemeColors.primary}
              >
                {processing
                  ? "⏳ AI සකසමින්..."
                  : isSimplified
                    ? "↩ මුල් වාක්‍යය පෙන්වන්න"
                    : "✨ AI මගින් වාක්‍යය සරල කරන්න"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Prompt */}
        <AppText
          size="md"
          weight="extrabold"
          color={ThemeColors.textPrimary}
          style={styles.questionText}
        >
          {currentQ.question}
        </AppText>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  ThemeShadow.sm,
                ]}
                onPress={() => setSelectedOptionId(opt.id)}
                activeOpacity={0.8}
              >
                <AppText
                  size="md"
                  weight="bold"
                  color={ThemeColors.textPrimary}
                >
                  {opt.text}
                </AppText>

                {/* Radio Circle or Green Check badge */}
                {isSelected ? (
                  <View style={styles.checkCircle}>
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      ✓
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.radioCircle} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Helper Encouragement text */}
        <View style={styles.helperRow}>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            හෙමින් කියවන්න. ඉක්මන් වෙන්න අවශ්‍ය නැහැ.
          </AppText>
          <AppText size="xs" style={{ marginLeft: 4 }}>
            💚
          </AppText>
        </View>

        {/* Confirm Answer Button */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            selectedOptionId === null && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirmAnswer}
          disabled={selectedOptionId === null}
          activeOpacity={0.85}
        >
          <AppText size="md" weight="bold" color="#FFFFFF">
            පිළිතුර තහවුරු කරන්න
          </AppText>
          <AppText
            size="md"
            weight="bold"
            color="#FFFFFF"
            style={{ marginLeft: 6 }}
          >
            →
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* Voice Assessment Modal */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={currentQ.sentence}
        mode="sentence"
        onClose={() => setShowVoiceModal(false)}
        onSuccess={handleVoiceSuccess}
      />
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  progressHeader: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.sm,
    backgroundColor: "#FFFFFF",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: ThemeRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#F97316",
    borderRadius: ThemeRadius.full,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    alignItems: "center",
  },
  sentenceCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.lg,
  },
  leftAccentBar: {
    width: 8,
    backgroundColor: "#3B82F6",
  },
  sentenceCardBody: {
    flex: 1,
    padding: ThemeSpacing.lg,
    alignItems: "center",
  },
  sentenceText: {
    marginBottom: ThemeSpacing.lg,
    lineHeight: 32,
  },
  audioActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listenAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F1F8",
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs + 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: "#D4E2EE",
  },
  listenAudioBtnPlaying: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  micActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    borderRadius: ThemeRadius.full,
  },
  questionText: {
    alignSelf: "flex-start",
    marginBottom: ThemeSpacing.md,
    lineHeight: 24,
  },
  optionsWrap: {
    width: "100%",
    gap: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: ThemeSpacing.sm + 4,
    paddingHorizontal: ThemeSpacing.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  optionCardSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: ThemeColors.primary,
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ThemeColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ThemeSpacing.md,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    width: "100%",
    height: 48,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  simplifiedBadge: {
    alignSelf: "center",
    backgroundColor: "#FDF4E9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#EED9BE",
  },
  toggleBtn: {
    marginTop: ThemeSpacing.sm,
    backgroundColor: "#E8F6ED",
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryBorder,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.xs + 2,
    paddingHorizontal: ThemeSpacing.md,
    alignItems: "center",
    width: "100%",
  },
  toggleBtnActive: {
    backgroundColor: "#FDF4E9",
    borderColor: "#EED9BE",
  },
});
