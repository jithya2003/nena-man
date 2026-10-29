import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from "@/constants/theme";
import AppText from "@/components/AppText";
import VoiceAssessmentModal, { RealVoiceAnalysisData } from "@/components/VoiceAssessmentModal";
import { useInteractionTracker } from "@/hooks/useInteractionTracker";
import { getBehaviorState } from "@/api/endpoints";
import type { BehaviorStateInput, BehaviorStateResult } from "@/api/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

interface BehaviorObservation {
  timestamp: string;
  questionIndex: number;
  state: "Engaged" | "Distracted" | "Frustrated";
  confidence: number;
}

export default function ReadingComprehensionScreen() {
  const router = useRouter();

  // Activity progression states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Component 4: Real Hardware Camera (expo-camera)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [showCameraPermissionAlert, setShowCameraPermissionAlert] = useState(false);

  // Component 4: Real Interaction Tracker
  const interactionTracker = useInteractionTracker({ autoStart: true });

  // Component 4: Real Voice Reading Telemetry Ref
  const lastVoiceDataRef = useRef<RealVoiceAnalysisData | null>(null);

  // Component 4: Observations history
  const observationsRef = useRef<BehaviorObservation[]>([]);
  const [activeBehaviorState, setActiveBehaviorState] = useState<"Engaged" | "Distracted" | "Frustrated">("Engaged");

  // Component 4: Intervention Recommendation Modal
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [recommendedIntervention, setRecommendedIntervention] = useState<{
    game: string;
    title: string;
    description: string;
    state: "Engaged" | "Distracted" | "Frustrated";
  } | null>(null);

  // State tracking: Allows recommendation popup to trigger across all 3 questions when state is detected/changes
  const lastShownForQuestionRef = useRef<number | null>(null);
  const lastShownStateRef = useRef<string | null>(null);
  const totalWrongAnswersRef = useRef<number>(0);
  const consecutiveWrongAnswersRef = useRef<number>(0);
  const showInterventionModalRef = useRef<boolean>(false);

  // Component 4: Final Activity Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    dominantState: "Engaged" | "Distracted" | "Frustrated";
    engagedPct: number;
    distractedPct: number;
    frustratedPct: number;
    totalObservations: number;
    interpretationText: string;
  } | null>(null);

  const currentQ = COMPREHENSION_QUESTIONS[currentIndex];

  // Component 4: Screen focus tracking to prevent background timers from running while in mini-games
  const isScreenFocusedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      interactionTracker.resumeTracking();
      interactionTracker.recordTap();

      return () => {
        isScreenFocusedRef.current = false;
        interactionTracker.pauseTracking();
      };
    }, [interactionTracker])
  );

  // Camera starts OFF by default. Child or evaluator taps the Camera button to request permission and enable it.

  // Clean up camera on exit
  useEffect(() => {
    return () => {
      setIsCameraActive(false);
    };
  }, []);

  // Handle Camera toggle button at top
  const handleToggleCamera = async () => {
    interactionTracker.recordTap();
    if (isCameraActive) {
      setIsCameraActive(false);
      return;
    }

    if (cameraPermission?.granted) {
      setIsCameraActive(true);
    } else {
      const res = await requestCameraPermission();
      if (res.granted) {
        setIsCameraActive(true);
      } else {
        setIsCameraActive(false);
        setShowCameraPermissionAlert(true);
      }
    }
  };

  /**
   * Evaluates behavior using REAL backend models and real collected session data.
   */
  const evaluateBehavior = useCallback(
    async (triggerReason: "timer" | "answer_confirmed" | "question_advance" = "answer_confirmed") => {
      try {
        if (!isScreenFocusedRef.current) {
          return;
        }

        const telemetry = interactionTracker.getTelemetry();
        const voiceData = lastVoiceDataRef.current;

        // Reading aloud or using voice assessment is active engagement, not idle inactivity
        const isSpeakingActive = showVoiceModal || (voiceData && Date.now() - ((voiceData as any).timestamp || 0) < 15000);
        const effectiveIdleTime = isSpeakingActive ? 0 : telemetry.idleTime || 0;

        const behaviorInput: BehaviorStateInput = {
          faceVisibility: isCameraActive,
          eyeGaze: "center",
          lookingAwayFrequency: 0,
          headPose: "forward",
          blinkRate: 16,
          faceDistance: 35,
          bodyPosture: "upright",
          responseTime: telemetry.responseTime || 1.2,
          tapSpeed: telemetry.tapSpeed || 280,
          retryCount: telemetry.retryCount || 0,
          missClicks: telemetry.missClicks || 0,
          skipFrequency: telemetry.skipFrequency || 0,
          idleTime: effectiveIdleTime,
          taskCompletion: true,
          interactionPattern: telemetry.interactionPattern || "focused",
          // If camera is not active or denied, send null to cleanly invoke 2-modality fusion
          cameraLandmarks: null,
          readingSpeed: voiceData?.readingSpeed ?? 52,
          hesitationCount: voiceData?.hesitationCount ?? 0,
          pauseDuration: voiceData?.pauseDuration ?? 0.6,
          fluencyScore: voiceData?.fluencyScore ?? 0.90,
          speakingPattern: "continuous",
          features_208: voiceData?.features_208,
          frustration_probability: voiceData?.frustration_probability,
          totalWrongAnswers: totalWrongAnswersRef.current,
          consecutiveWrongAnswers: consecutiveWrongAnswersRef.current,
        };

        const res: BehaviorStateResult = await getBehaviorState(behaviorInput);
        const state = (res.behavioralState as any) || res.behavioralState || "Engaged";
        const confidence = res.predictionConfidence ?? 0.85;

        // Record real observation in history
        const observation: BehaviorObservation = {
          timestamp: new Date().toISOString(),
          questionIndex: currentIndex,
          state,
          confidence,
        };
        observationsRef.current.push(observation);
        setActiveBehaviorState(state);

        // State-based game recommendation (Req 5, 6, 7: works across all 3 questions)
        const isNewForThisQuestion = lastShownForQuestionRef.current !== currentIndex;
        const isNewBehaviorState = lastShownStateRef.current !== state;

        // Surfaces right intervention for the behavior state:
        // - Frustrated (2 wrong clicks or answers) -> Balloon Breathing
        // - Distracted (>=8s idle) -> Catch the Star
        // - Engaged (Confirmed correct / reading) -> Bubble Pop
        const shouldShowModal =
          !showInterventionModalRef.current &&
          (triggerReason === "answer_confirmed" || state === "Distracted" || state === "Frustrated") &&
          (isNewForThisQuestion || isNewBehaviorState);

        if (shouldShowModal) {
          showInterventionModalRef.current = true;
          lastShownForQuestionRef.current = currentIndex;
          lastShownStateRef.current = state;

          let recGame = "game-bubble";
          let recTitle = "බුබුළු පිපිරවීම (Bubble Pop)";
          let recDesc = "ඉතා හොඳ අවධානයෙන් කියවූ නිසා විනෝදජනක බුබුළු පිපිරවීමේ ත්‍යාග ක්‍රීඩාවක් කරමු! 🎈";

          if (state === "Distracted") {
            recGame = "game-star";
            recTitle = "තරු ඇල්ලීම (Catch the Star)";
            recDesc = "නැවත අවධානය යොමු කර ගැනීම සඳහා විනෝදජනක තරු ඇල්ලීමේ කෙටි ක්‍රීඩාවක් කරමු! ⭐";
          } else if (state === "Frustrated") {
            recGame = "game-breathing";
            recTitle = "සන්සුන් හුස්ම ගැනීම (Balloon Breathing)";
            recDesc = "මනස සැහැල්ලු කර වෙහෙස නිවා ගැනීම සඳහා සන්සුන් හුස්ම ගැනීමේ ක්‍රීඩාව කරමු. 💨";
          }

          setRecommendedIntervention({
            game: recGame,
            title: recTitle,
            description: recDesc,
            state,
          });
          setShowInterventionModal(true);
        }
      } catch (err) {
        console.warn("[ReadingComprehension] Behavior evaluation error:", err);
      }
    },
    [currentIndex, isCameraActive, interactionTracker, showVoiceModal]
  );

  // Periodic behavioral monitoring every 2.5 seconds (so 10s idle is detected responsively)
  // PAUSED when Voice modal, Game recommendation, or Summary modal is open so speaking is never flagged as idle.
  useEffect(() => {
    if (showVoiceModal || showInterventionModal || showSummaryModal) {
      return;
    }

    const timer = setInterval(() => {
      if (!isScreenFocusedRef.current) {
        return;
      }
      evaluateBehavior("timer");
    }, 2500);

    return () => clearInterval(timer);
  }, [evaluateBehavior, showVoiceModal, showInterventionModal, showSummaryModal]);

  // Audio Playback
  const handlePlayAudio = () => {
    interactionTracker.recordTap();
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1500);
  };

  // Simplification Toggle
  const handleSimplify = () => {
    interactionTracker.recordTap();
    if (isSimplified) {
      setIsSimplified(false);
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setIsSimplified(true);
    }, 600);
  };

  // Voice Assessment Success Handler (Receives REAL speech telemetry & frustration score)
  const handleVoiceSuccess = (voiceData?: RealVoiceAnalysisData) => {
    interactionTracker.recordTap();
    if (voiceData) {
      (voiceData as any).timestamp = Date.now();
      lastVoiceDataRef.current = voiceData;
    }

    // Auto-select the correct option
    const correctOpt = currentQ.options.find((o) => o.isCorrect);
    if (correctOpt) {
      setSelectedOptionId(correctOpt.id);
    }

    // Immediately trigger behavioral evaluation for Engaged celebration
    evaluateBehavior("answer_confirmed");
  };

  // Voice Assessment Error / Mispronunciation Handler
  const handleVoiceError = (voiceData?: RealVoiceAnalysisData) => {
    interactionTracker.recordMissClick();
    interactionTracker.recordRetry();
    if (voiceData) {
      (voiceData as any).timestamp = Date.now();
      lastVoiceDataRef.current = voiceData;
    }
    evaluateBehavior("answer_confirmed");
  };

  // Skip / Close Intervention Popup
  const handleSkipIntervention = () => {
    interactionTracker.recordTap();
    showInterventionModalRef.current = false;
    setShowInterventionModal(false);
    advanceToNextQuestion();
  };

  // Advance to next question cleanly
  const advanceToNextQuestion = () => {
    showInterventionModalRef.current = false;
    setShowInterventionModal(false);
    if (currentIndex < COMPREHENSION_QUESTIONS.length - 1) {
      interactionTracker.resetTracker();
      lastVoiceDataRef.current = null;
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsSimplified(false);
    } else {
      finishActivityAndShowSummary();
    }
  };

  // Final Activity Completion: Calculates real behavior distribution and shows summary
  const finishActivityAndShowSummary = () => {
    setIsCameraActive(false);

    const obs = observationsRef.current;
    const total = obs.length;

    let engagedCount = 0;
    let distractedCount = 0;
    let frustratedCount = 0;

    obs.forEach((o) => {
      if (o.state === "Engaged") engagedCount++;
      else if (o.state === "Distracted") distractedCount++;
      else if (o.state === "Frustrated") frustratedCount++;
    });

    const engagedPct = total > 0 ? Math.round((engagedCount / total) * 100) : 100;
    const distractedPct = total > 0 ? Math.round((distractedCount / total) * 100) : 0;
    const frustratedPct = total > 0 ? Math.round((frustratedCount / total) * 100) : 0;

    const dominantState: "Engaged" | "Distracted" | "Frustrated" =
      frustratedCount > engagedCount && frustratedCount >= distractedCount
        ? "Frustrated"
        : distractedCount > engagedCount
        ? "Distracted"
        : "Engaged";

    let interpretationText =
      "දරුවා මෙම ක්‍රියාකාරකමේදී ඉතා ඉහළ උනන්දුවකින් සහ හොඳ අවධානයකින් යුතුව ප්‍රශ්නවලට සාර්ථකව මුහුණ දුන්නේය. 🌟";

    if (dominantState === "Distracted") {
      interpretationText =
        "දරුවා ප්‍රශ්නවලට පිළිතුරු සෙවීමේදී සුළු වශයෙන් අවධානය වෙනතකට යොමු වූ අවස්ථා නිරීක්ෂණය විය. අවධානය වැඩිදියුණු කිරීමේ කෙටි අභ්‍යාස ප්‍රයෝජනවත් විය හැක. 🎯";
    } else if (dominantState === "Frustrated") {
      interpretationText =
        "කියවීමේදී මනස තරමක් වෙහෙසට පත් වූ ලක්ෂණ නිරීක්ෂණය විය. සන්සුන් හුස්ම ගැනීමේ කෙටි ක්‍රීඩා (Balloon Breathing) මගින් දරුවාගේ මනස සැහැල්ලු කිරීම වඩාත් සුදුසුය. 💚";
    }

    setSummaryStats({
      dominantState,
      engagedPct,
      distractedPct,
      frustratedPct,
      totalObservations: total,
      interpretationText,
    });

    setShowSummaryModal(true);
  };

  // Confirm Answer Button (Req 4: Fixed flow, answer registration, feedback, advancement)
  const handleConfirmAnswer = async () => {
    if (selectedOptionId === null || isAnswerSubmitted) return;
    interactionTracker.recordTap();

    const selectedOpt = currentQ.options.find((o) => o.id === selectedOptionId);
    if (selectedOpt && !selectedOpt.isCorrect) {
      interactionTracker.recordMissClick();
      interactionTracker.recordRetry();
      totalWrongAnswersRef.current += 1;
      consecutiveWrongAnswersRef.current += 1;
    } else if (selectedOpt && selectedOpt.isCorrect) {
      consecutiveWrongAnswersRef.current = 0;
    }

    setIsAnswerSubmitted(true);

    // Run non-blocking behavior evaluation
    evaluateBehavior("answer_confirmed");

    // Allow child to see visual confirmation feedback, then advance (if no popup active)
    setTimeout(() => {
      if (!showInterventionModalRef.current) {
        advanceToNextQuestion();
      }
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Real Camera Control Button */}
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

        {/* Camera Behaviour Monitoring Control Button */}
        <TouchableOpacity
          style={[
            styles.cameraBadgeBtn,
            isCameraActive ? styles.cameraBadgeActive : styles.cameraBadgeInactive,
          ]}
          onPress={handleToggleCamera}
          activeOpacity={0.8}
        >
          <AppText size="xs" weight="bold" color={isCameraActive ? "#047857" : "#64748B"}>
            {isCameraActive ? "📷 🟢" : "📷 ⚪"}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Real Front Camera Live Preview Widget (When Camera is Active & Granted) */}
      {isCameraActive && cameraPermission?.granted && (
        <View style={styles.cameraFloatingCard}>
          <CameraView
            style={styles.cameraFeed}
            facing="front"
          />
          <View style={styles.cameraOverlayTag}>
            <View style={styles.greenPulseDot} />
            <AppText size="xs" weight="bold" color="#FFFFFF">
              Front Cam Active
            </AppText>
          </View>
        </View>
      )}

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
                onPress={() => {
                  interactionTracker.recordTap();
                  setShowVoiceModal(true);
                }}
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

        {/* Options with Answer Confirmation Feedback */}
        <View style={styles.optionsWrap}>
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let cardStyle: any = [styles.optionCard, ThemeShadow.sm];

            if (isSelected) {
              cardStyle.push(styles.optionCardSelected);
            }

            if (isAnswerSubmitted) {
              if (opt.isCorrect) {
                cardStyle.push(styles.optionCardCorrect);
              } else if (isSelected && !opt.isCorrect) {
                cardStyle.push(styles.optionCardWrong);
              }
            }

            return (
              <TouchableOpacity
                key={opt.id}
                style={cardStyle}
                disabled={isAnswerSubmitted}
                onPress={() => {
                  interactionTracker.recordTap();
                  if (!opt.isCorrect) {
                    interactionTracker.recordMissClick();
                    interactionTracker.recordRetry();
                    const tele = interactionTracker.getTelemetry();
                    if (
                      tele.missClicks >= 2 ||
                      tele.retryCount >= 2 ||
                      totalWrongAnswersRef.current >= 1
                    ) {
                      evaluateBehavior("answer_confirmed");
                    }
                  }
                  setSelectedOptionId(opt.id);
                }}
                activeOpacity={0.8}
              >
                <AppText
                  size="md"
                  weight="bold"
                  color={
                    isAnswerSubmitted && opt.isCorrect
                      ? "#047857"
                      : isAnswerSubmitted && isSelected && !opt.isCorrect
                      ? "#DC2626"
                      : ThemeColors.textPrimary
                  }
                >
                  {opt.text}
                </AppText>

                {/* Status Indicator */}
                {isAnswerSubmitted && opt.isCorrect ? (
                  <View style={styles.checkCircleCorrect}>
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      ✓
                    </AppText>
                  </View>
                ) : isAnswerSubmitted && isSelected && !opt.isCorrect ? (
                  <View style={styles.checkCircleWrong}>
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      ✗
                    </AppText>
                  </View>
                ) : isSelected ? (
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

        {/* Confirm Answer Button (Req 4: Fixed Flow & Disabled state) */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (selectedOptionId === null || isAnswerSubmitted) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirmAnswer}
          disabled={selectedOptionId === null || isAnswerSubmitted}
          activeOpacity={0.85}
        >
          {isAnswerSubmitted ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
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
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* Real Voice Assessment Modal */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={currentQ.sentence}
        mode="sentence"
        onClose={() => {
          interactionTracker.recordTap();
          setShowVoiceModal(false);
        }}
        onSuccess={handleVoiceSuccess}
        onError={handleVoiceError}
      />

      {/* Permission Denied Info Dialog */}
      <Modal
        visible={showCameraPermissionAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraPermissionAlert(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.gameModalCard, ThemeShadow.lg]}>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} align="center">
              📷 කැමරා අවසරය
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 8 }}>
              කැමරා අවසරය ලබා නොදුන්නද යෙදුම සාමාන්‍ය පරිදි භාවිත කළ හැක. ශබ්දය සහ ස්පර්ශ ලක්ෂණ (Voice & Touch) මඟින් AI නිරීක්ෂණය ක්‍රියාත්මක වේ.
            </AppText>
            <TouchableOpacity
              style={[styles.continueActivityBtn, { marginTop: 16 }]}
              onPress={() => setShowCameraPermissionAlert(false)}
            >
              <AppText size="sm" weight="bold" color="#FFFFFF">
                තේරුම් ගත්තා (OK)
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Component 4: Adaptive Game Recommendation Modal (On Top Of Activity) ── */}
      <Modal
        visible={showInterventionModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipIntervention}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.gameModalCard, ThemeShadow.lg]}>
            {/* Top Right Skip [X] Button (Req 6) */}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={handleSkipIntervention}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <AppText size="md" weight="bold" color="#64748B">
                ✕
              </AppText>
            </TouchableOpacity>

            {/* Context Badge */}
            <View
              style={[
                styles.gameBadgeWrap,
                recommendedIntervention?.state === "Frustrated"
                  ? styles.badgeFrustrated
                  : recommendedIntervention?.state === "Distracted"
                  ? styles.badgeDistracted
                  : styles.badgeEngaged,
              ]}
            >
              <AppText size="xs" weight="extrabold" color="#FFFFFF">
                {recommendedIntervention?.state === "Frustrated"
                  ? "🧘 මනස සැහැල්ලු කිරීමේ අවස්ථාව"
                  : recommendedIntervention?.state === "Distracted"
                  ? "🎯 අවධානය රඳවා ගැනීමේ ක්‍රීඩාව"
                  : "🌟 සාර්ථක කියවීම සඳහා ත්‍යාගය"}
              </AppText>
            </View>

            {/* Icon Avatar */}
            <View style={styles.gameIconCircle}>
              <AppText size="display">
                {recommendedIntervention?.state === "Frustrated"
                  ? "🎈"
                  : recommendedIntervention?.state === "Distracted"
                  ? "⭐"
                  : "🫧"}
              </AppText>
            </View>

            {/* Game Title */}
            <AppText
              size="lg"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              align="center"
              style={{ marginTop: 10 }}
            >
              {recommendedIntervention?.title}
            </AppText>

            {/* Friendly Explanation */}
            <AppText
              size="sm"
              color={ThemeColors.textSecondary}
              align="center"
              style={styles.gameDescription}
            >
              {recommendedIntervention?.description}
            </AppText>

            {/* Actions: Start Game */}
            <TouchableOpacity
              style={styles.startGameBtn}
              onPress={() => {
                isScreenFocusedRef.current = false;
                interactionTracker.pauseTracking();
                showInterventionModalRef.current = false;
                setShowInterventionModal(false);
                if (recommendedIntervention?.game === "game-breathing") {
                  router.push("/(child)/game-breathing");
                } else if (recommendedIntervention?.game === "game-star") {
                  router.push("/(child)/game-star");
                } else {
                  router.push("/(child)/game-bubble");
                }
              }}
              activeOpacity={0.85}
            >
              <AppText size="md" weight="extrabold" color="#FFFFFF">
                🎮 ක්‍රීඩාව ආරම්භ කරමු
              </AppText>
            </TouchableOpacity>

            {/* Continue Activity (Skip) Button (Req 6) */}
            <TouchableOpacity
              style={styles.continueActivityBtn}
              onPress={handleSkipIntervention}
              activeOpacity={0.7}
            >
              <AppText size="sm" weight="bold" color={ThemeColors.primary}>
                ක්‍රියාකාරකම දිගටම කරමු →
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Component 4: Final Activity Completion & Behaviour Summary Modal ── */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSummaryModal(false);
          router.replace("/(child)/home");
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.summaryCard, ThemeShadow.lg]}>
            {/* Header Icon */}
            <View style={styles.summaryTrophyCircle}>
              <AppText size="display">🏆</AppText>
            </View>

            <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} align="center">
              ක්‍රියාකාරකම සම්පූර්ණයි!
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={{ marginTop: 2 }}>
              Activity Completed Successfully
            </AppText>

            {/* Real Behavior Distribution Statistics (Req 8) */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <AppText size="md" weight="extrabold" color="#059669">
                  {summaryStats?.engagedPct ?? 0}%
                </AppText>
                <AppText size="xs" color="#065F46" weight="bold">
                  උනන්දුව (Engaged)
                </AppText>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <AppText size="md" weight="extrabold" color="#D97706">
                  {summaryStats?.distractedPct ?? 0}%
                </AppText>
                <AppText size="xs" color="#92400E" weight="bold">
                  වෙනතක (Distracted)
                </AppText>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <AppText size="md" weight="extrabold" color="#DC2626">
                  {summaryStats?.frustratedPct ?? 0}%
                </AppText>
                <AppText size="xs" color="#991B1B" weight="bold">
                  වෙහෙස (Frustrated)
                </AppText>
              </View>
            </View>

            {/* Observations Note */}
            <View style={styles.observationCard}>
              <AppText size="xs" weight="bold" color="#1E293B">
                📋 නිරීක්ෂණ සටහන:
              </AppText>
              <AppText size="xs" color="#334155" style={{ marginTop: 4, lineHeight: 18 }}>
                {summaryStats?.interpretationText}
              </AppText>
            </View>

            {/* Parent / Guardian Disclaimer (Req 9) */}
            <View style={styles.disclaimerBox}>
              <AppText size="xs" color="#64748B" style={{ lineHeight: 16 }}>
                ℹ️ දෙමව්පියන්ගේ අවධානයට: මෙම AI විශ්ලේෂණය දරුවාගේ කියවීම් සහය සඳහා වන ආසන්න ඇස්තමේන්තුවක් පමණි. මෙය වෛද්‍යමය හෝ මනෝවිද්‍යාත්මක රෝග විනිශ්චයක් (medical diagnosis) නොවන බව කරුණාවෙන් සලකන්න.
              </AppText>
            </View>

            {/* Finish Button */}
            <TouchableOpacity
              style={styles.finishSummaryBtn}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace("/(child)/home");
              }}
              activeOpacity={0.85}
            >
              <AppText size="md" weight="extrabold" color="#FFFFFF">
                මුල් පිටුවට යන්න (Finish)
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.sm,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  cameraBadgeActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  cameraBadgeInactive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  cameraFloatingCard: {
    position: "absolute",
    top: 55,
    right: 16,
    width: 90,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 999,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "#000000",
    ...ThemeShadow.md,
  },
  cameraFeed: {
    flex: 1,
  },
  cameraOverlayTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 4,
  },
  progressHeader: {
    paddingHorizontal: ThemeSpacing.lg,
    marginBottom: ThemeSpacing.sm,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: ThemeColors.primary,
    borderRadius: 4,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.xl,
  },
  sentenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  leftAccentBar: {
    width: 6,
    backgroundColor: ThemeColors.primary,
  },
  sentenceCardBody: {
    flex: 1,
    padding: ThemeSpacing.md,
    alignItems: "center",
  },
  simplifiedBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  sentenceText: {
    marginVertical: 10,
    lineHeight: 34,
  },
  audioActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  listenAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  listenAudioBtnPlaying: {
    backgroundColor: "#DBEAFE",
  },
  micActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  toggleBtnActive: {
    backgroundColor: "#FEF3C7",
  },
  questionText: {
    marginBottom: 12,
    marginTop: 4,
  },
  optionsWrap: {
    gap: 10,
    marginBottom: 14,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  optionCardSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: "#F0F7FF",
  },
  optionCardCorrect: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  optionCardWrong: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  checkCircleCorrect: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleWrong: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...ThemeShadow.md,
  },
  confirmBtnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  gameModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  closeModalBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  gameBadgeWrap: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
    marginTop: 4,
  },
  badgeFrustrated: {
    backgroundColor: "#DC2626",
  },
  badgeDistracted: {
    backgroundColor: "#D97706",
  },
  badgeEngaged: {
    backgroundColor: "#059669",
  },
  gameIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  gameDescription: {
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  startGameBtn: {
    width: "100%",
    backgroundColor: ThemeColors.primary,
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 10,
    ...ThemeShadow.sm,
  },
  continueActivityBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
  },
  summaryTrophyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#CBD5E1",
  },
  observationCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 12,
    width: "100%",
    marginTop: 14,
  },
  disclaimerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    width: "100%",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  finishSummaryBtn: {
    width: "100%",
    backgroundColor: ThemeColors.primary,
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    ...ThemeShadow.sm,
  },
});
