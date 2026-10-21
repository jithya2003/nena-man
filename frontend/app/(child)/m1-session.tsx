import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import {
  getTextDifficulty,
  TextDifficultyResult,
  splitSinhalaGraphemes,
  SplitWord,
  getApplicableSupportLevels,
  getNextValidSupportLevel,
  SupportLevelNumber,
} from '@/services/readingTextService';
import type { TextDifficultySuccessResponse, DifficultyLevel } from '@/api/types';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import VoiceAssessmentModal from '@/components/VoiceAssessmentModal';
import RewardsModal from '@/components/RewardsModal';
import DevicePermissionModal from '@/components/DevicePermissionModal';
import { useReadingSession } from '@/hooks/useReadingSession';
import { useInteractionTracker } from '@/hooks/useInteractionTracker';
import { useConsentPrivacy } from '@/hooks/useConsentPrivacy';
import { cameraLandmarkService } from '@/services/cameraLandmarkService';
import { useLanguage } from '@/context/LanguageContext';
import { LoadingView, ErrorView, OfflineBanner } from '@/components/shared-states';

// Curated 3 Core Sentences for Interactive Demo with Reading Rate & Audio Comparison Metadata
const PRACTICE_SENTENCES = [
  {
    id: 'text_001',
    sinhala: 'මම මගේ රටට ගොඩාක් ආදරෙයි',
    simplifiedSinhala: 'මම මගේ රටට ආදරෙයි',
    english: 'I love my country very much',
    simplifiedEnglish: 'I love my country',
    syllables: ['ම', 'ම', 'ම', 'ගේ', 'ර', 'ට', 'ට', 'ගො', 'ඩා', 'ක්', 'ආ', 'ද', 'රෙ', 'යි'],
    splitWords: [
      { word: 'මම', parts: ['ම', 'ම'] },
      { word: 'මගේ', parts: ['ම', 'ගේ'] },
      { word: 'රටට', parts: ['ර', 'ට', 'ට'] },
      { word: 'ගොඩාක්', parts: ['ගො', 'ඩා', 'ක්'] },
      { word: 'ආදරෙයි', parts: ['ආ', 'ද', 'රෙ', 'යි'] },
    ],
    // Realistic simulated error for sentence 1
    simulatedSpoken: 'මම මගේ රටට ගොඩක් ආදරෙයි',
    simulatedErrors: [
      {
        type: 'substitution' as const,
        word: 'ගොඩාක්',
        detected: 'ගොඩක්',
        severity: 0.4,
        explanation: "'ගොඩාක්' වචනයේ 'ඩා' ස්වරය දිගු කර පැහැදිලිව ශබ්ද කළ යුතුය.",
        tip: "🗣️ 'ඩා' ශබ්දය දිගු කර 'ගොඩාක්' ලෙස උච්චාරණය කරන්න.",
      },
    ],
    targetLetterToPractice: 'ආ',
    practiceGameRoute: '/(child)/cooldown',
    // Feature 1: Reading Rate & Fluency Metrics
    wpm: 32,
    fluencyScore: 84,
    avgPauseDuration: '1.1s',
    syllablesPerSec: '2.4 syl/s',
    // Feature 2: Audio Comparison Metadata
    targetWord: 'ගොඩාක්',
    spokenWord: 'ගොඩක්',
    phoneticBreakdown: 'ගො-ඩා-ක් [go-daa-k]',
  },
  {
    id: 'text_002',
    sinhala: 'ලස්සන වනාන්තරයේ ගස් සහ මල් තිබේ',
    simplifiedSinhala: 'ලස්සන වනයේ ගස් තිබේ',
    english: 'There are trees and flowers in the beautiful forest',
    simplifiedEnglish: 'There are trees in the beautiful forest',
    syllables: ['ල', 'ස්ස', 'න', 'ව', 'නා', 'න්', 'ත', 'ර', 'යේ', 'ග', 'ස්', 'ස', 'හ', 'ම', 'ල්', 'ති', 'බේ'],
    splitWords: [
      { word: 'ලස්සන', parts: ['ල', 'ස්ස', 'න'] },
      { word: 'වනාන්තරයේ', parts: ['ව', 'නා', 'න්', 'ත', 'ර', 'යේ'] },
      { word: 'ගස්', parts: ['ග', 'ස්'] },
      { word: 'සහ', parts: ['ස', 'හ'] },
      { word: 'මල්', parts: ['ම', 'ල්'] },
      { word: 'තිබේ', parts: ['ති', 'බේ'] },
    ],
    // Realistic simulated error for sentence 2
    simulatedSpoken: 'ලස්සන වනන්තරයේ ගස් සහ මල් තිබේ',
    simulatedErrors: [
      {
        type: 'omission' as const,
        word: 'වනාන්තරයේ',
        detected: 'වනන්තරයේ',
        severity: 0.45,
        explanation: "'නා' අකුරේ ආ-කාර පිල්ලම මඟහැරී ඇත.",
        tip: "🗣️ 'නා' ශබ්දය පැහැදිලිව ඇසෙන සේ කියන්න.",
      },
    ],
    targetLetterToPractice: 'න',
    practiceGameRoute: '/(child)/cooldown',
    // Feature 1: Reading Rate & Fluency Metrics
    wpm: 25,
    fluencyScore: 68,
    avgPauseDuration: '1.6s',
    syllablesPerSec: '1.8 syl/s',
    // Feature 2: Audio Comparison Metadata
    targetWord: 'වනාන්තරයේ',
    spokenWord: 'වනන්තරයේ',
    phoneticBreakdown: 'ව-නා-න්-ත-ර-යේ [wa-naa-n-tha-ra-ye]',
  },
  {
    id: 'text_003',
    sinhala: 'කුඩා ළමයා රසවත් නැවුම් කිරි බොනවා',
    simplifiedSinhala: 'ළමයා කිරි බොනවා',
    english: 'The small child is drinking fresh tasty milk',
    simplifiedEnglish: 'The child drinks milk',
    syllables: ['කු', 'ඩා', 'ළ', 'ම', 'යා', 'කි', 'රි', 'බො', 'න', 'වා'],
    splitWords: [
      { word: 'කුඩා', parts: ['කු', 'ඩා'] },
      { word: 'ළමයා', parts: ['ළ', 'ම', 'යා'] },
      { word: 'රසවත්', parts: ['ර', 'ස', 'ව', 'ත්'] },
      { word: 'නැවුම්', parts: ['නැ', 'වු', 'ම්'] },
      { word: 'කිරි', parts: ['කි', 'රි'] },
      { word: 'බොනවා', parts: ['බො', 'න', 'වා'] },
    ],
    // Realistic simulated substitution error: 'කිරි' spoken as 'කිලි' (ර/ල confusion in dyslexia)
    simulatedSpoken: 'කුඩා ළමයා රසවත් නැවුම් කිලි බොනවා',
    simulatedErrors: [
      {
        type: 'substitution' as const,
        word: 'කිරි',
        detected: 'කිලි',
        severity: 0.52,
        explanation: "අකුරු මාරුව: 'කිරි' වෙනුවට 'කිලි' කියවීම (ර/ල අකුරු ශබ්ද පැටලීම).",
        tip: "🗣️ දිවේ අග උඩුතල්ලේ මෘදුව කම්පනය කර 'කිරි' ('ර') ලෙස උච්චාරණය කරන්න 👅",
      },
    ],
    targetLetterToPractice: 'ර',
    practiceGameRoute: '/(child)/cooldown',
    // Feature 1: Reading Rate & Fluency Metrics
    wpm: 28,
    fluencyScore: 74,
    avgPauseDuration: '1.4s',
    syllablesPerSec: '2.1 syl/s',
    // Feature 2: Audio Comparison Metadata
    targetWord: 'කිරි',
    spokenWord: 'කිලි',
    phoneticBreakdown: 'කි-රි [ki-ri]',
  },
];

// Error type metadata with colorblind-safe shape icons
const ERROR_META = {
  substitution: { icon: '🔷', label: 'අකුරු මාරුව (Substitution)', desc: 'වැරදි ශබ්දයක් හෝ අකුරක් ආදේශ වීම', color: '#7C3AED', bg: '#F5F3FF' },
  omission:     { icon: '⬜', label: 'පිල්ලම් මඟහැරීම (Omission)',  desc: 'අකුරක් හෝ පිල්ලමක් කියවීමේදී මඟහැරීම', color: '#B45309', bg: '#FEF3C7' },
  reversal:     { icon: '🔄', label: 'අකුරු පෙරළිය (Reversal)',    desc: 'අකුරු පිහිටීමේ අනුපිළිවෙල මාරුවීම', color: '#DC2626', bg: '#FEF2F2' },
  hesitation:   { icon: '⏸️', label: 'පැකිලීම (Hesitation)',       desc: 'වචනයක් කියවීමේදී දිගු වේලාවක් පැකිලීම', color: '#0369A1', bg: '#EFF6FF' },
} as const;

// Progressive Learning Support Ladder (Component: Sinhala Text Difficulty & Progressive Support)
// Approved progression sequence: 1. Highlight, 2. Akuru / Syllable Split, 3. Audio, 4. Text Simplification
// Visual Picture Cue has been removed per research specifications
interface SupportLadderConfig {
  level: 1 | 2 | 3 | 4;
  key: 'highlight' | 'syllable' | 'audio' | 'simplification';
  icon: string;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
}

const SUPPORT_LADDER_ITEMS: SupportLadderConfig[] = [
  {
    level: 1,
    key: 'highlight',
    icon: '🌟',
    label: 'වචන ඉස්මතු කිරීම',
    sublabel: 'Word Focus Highlight',
    color: ThemeColors.accentDark,
    bg: '#FDF3E7',
    border: '#EED9BE',
  },
  {
    level: 2,
    key: 'syllable',
    icon: '🔤',
    label: 'අකුරු වෙන් කිරීම',
    sublabel: 'Akuru / Syllable Split',
    color: ThemeColors.m1,
    bg: '#EAF7EE',
    border: '#BCE6CB',
  },
  {
    level: 3,
    key: 'audio',
    icon: '🔊',
    label: 'ශ්‍රව්‍ය සහාය',
    sublabel: 'Audio Support',
    color: ThemeColors.success,
    bg: '#EAF7EE',
    border: '#BCE6CB',
  },
  {
    level: 4,
    key: 'simplification',
    icon: '✨',
    label: 'AI වාක්‍ය සරල කිරීම',
    sublabel: 'Text Simplification',
    color: ThemeColors.accent,
    bg: '#FDF4E9',
    border: '#EED9BE',
  },
];

/**
 * Safely resolves an available Sinhala Web SpeechSynthesisVoice in the browser.
 * Handles asynchronous voice population via `onvoiceschanged` if voices are not populated yet.
 * Returns { voice, availableLangs }.
 */
const getSinhalaWebVoice = async (): Promise<{
  voice: SpeechSynthesisVoice | null;
  availableLangs: string[];
}> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, availableLangs: [] };
  }

  const findVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    // Prefer exact 'si-LK'
    const exact = voices.find(
      (v) => v.lang.toLowerCase() === 'si-lk' || v.lang.toLowerCase() === 'si_lk'
    );
    if (exact) return exact;
    // Prefer any starting with 'si'
    return voices.find((v) => v.lang.toLowerCase().startsWith('si')) || null;
  };

  let voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const langs = Array.from(new Set(voices.map((v) => v.lang)));
    return { voice: findVoice(voices), availableLangs: langs };
  }

  // Handle asynchronous voice population
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const currentVoices = window.speechSynthesis.getVoices() || [];
        const langs = Array.from(new Set(currentVoices.map((v) => v.lang)));
        resolve({ voice: findVoice(currentVoices), availableLangs: langs });
      }
    }, 600);

    const onVoicesChanged = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        window.speechSynthesis.onvoiceschanged = null;
        const currentVoices = window.speechSynthesis.getVoices() || [];
        const langs = Array.from(new Set(currentVoices.map((v) => v.lang)));
        resolve({ voice: findVoice(currentVoices), availableLangs: langs });
      }
    };

    window.speechSynthesis.onvoiceschanged = onVoicesChanged;
  });
};

export default function SpeechSessionScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const params = useLocalSearchParams<{ selectedText?: string; textId?: string; m2Data?: string }>();

  // Parse incoming M2 backend analysis data (Source of Truth for difficulty & progressive support)
  const m2Analysis: TextDifficultySuccessResponse | null = useMemo(() => {
    if (!params.m2Data) return null;
    try {
      const parsed = JSON.parse(params.m2Data);
      if (parsed && (parsed.analysis_status === 'success' || parsed.difficulty)) {
        return parsed as TextDifficultySuccessResponse;
      }
      return null;
    } catch (e) {
      console.warn('[M1Session] Error parsing m2Data param:', e);
      return null;
    }
  }, [params.m2Data]);

  // Resolve matching practice sentence index based on incoming navigation parameters
  const matchedSentenceIndex = useMemo(() => {
    if (params.textId) {
      const idx = PRACTICE_SENTENCES.findIndex(
        (s) =>
          s.id === params.textId ||
          (params.textId === 'case_c' && s.id === 'text_001') ||
          (params.textId === 'case_a' && s.id === 'text_001') ||
          (params.textId === 'opt_forest' && s.id === 'text_002') ||
          (params.textId === 'case_d' && s.id === 'text_003')
      );
      if (idx !== -1) return idx;
    }
    if (params.selectedText) {
      const trimmed = params.selectedText.trim();
      const idx = PRACTICE_SENTENCES.findIndex(
        (s) =>
          s.sinhala.trim() === trimmed ||
          trimmed.includes(s.sinhala.trim()) ||
          s.sinhala.trim().includes(trimmed)
      );
      if (idx !== -1) return idx;
    }
    return 2; // Default to 3rd sentence if opened directly without params
  }, [params.selectedText, params.textId]);

  const [currentTextIndex, setCurrentTextIndex] = useState(matchedSentenceIndex);

  // Sync currentTextIndex if navigation params change
  useEffect(() => {
    setCurrentTextIndex(matchedSentenceIndex);
  }, [matchedSentenceIndex]);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showGamePopup, setShowGamePopup] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { consentState, hasActiveConsent } = useConsentPrivacy();

  // Progressive Support Ladder state (Levels: 0 = Independent, 1 = Highlight, 2 = Syllable, 3 = Audio, 4 = Simplification)
  const [currentSupportLevel, setCurrentSupportLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([0]);
  const [retryCount, setRetryCount] = useState(0);
  // Tracks whether the current recording/attempt result has already triggered support ladder progression
  const attemptHandledRef = useRef<boolean>(false);

  // Keep track of all levels that have been unlocked so previous supports remain usable
  useEffect(() => {
    setUnlockedLevels((prev) => {
      if (!prev.includes(currentSupportLevel)) {
        return [...prev, currentSupportLevel];
      }
      return prev;
    });
  }, [currentSupportLevel]);

  // Interaction telemetry tracker for Module 4 (Pushpakumara)
  const interactionTracker = useInteractionTracker();

  // Audio Comparison Player & TTS State
  const [playingAudio, setPlayingAudio] = useState<'child' | 'target' | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '0.75x'>('1.0x');
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safely stop and cancel any active speech utterance or fallback timer
  const stopActiveSpeech = useCallback(() => {
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (err) {
          // Safe fallback
        }
      }
    } else {
      try {
        Speech.stop();
      } catch (err) {
        // Safe fallback
      }
    }
    setPlayingAudio(null);
  }, []);

  // Cleanup active speech and fallback timers on screen unmount
  useEffect(() => {
    return () => {
      stopActiveSpeech();
    };
  }, [stopActiveSpeech]);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const currentSentence = PRACTICE_SENTENCES[currentTextIndex] || PRACTICE_SENTENCES[0];

  // If user changed sentence on-screen (e.g. Next or pill), honor currentSentence; otherwise use params.selectedText
  const hasUserSwitched = currentTextIndex !== matchedSentenceIndex;
  const targetSinhala = (hasUserSwitched ? currentSentence.sinhala : (params.selectedText || currentSentence.sinhala)).trim();
  const targetTextId = hasUserSwitched ? currentSentence.id : (params.textId || currentSentence.id);

  // Checks if the active target text actually corresponds to currentSentence
  const isPracticeSentenceMatch =
    Boolean(currentSentence) &&
    (currentSentence.sinhala.trim() === targetSinhala ||
      targetSinhala.includes(currentSentence.sinhala.trim()) ||
      currentSentence.sinhala.trim().includes(targetSinhala));

  // Text Difficulty analysis fallback if opened directly without M2 params
  const difficultyResult = useMemo(() => {
    return getTextDifficulty(targetSinhala);
  }, [targetSinhala]);

  // SOURCE OF TRUTH: Backend support.support_path if m2Analysis is available!
  const applicableSupportLevels: SupportLevelNumber[] = useMemo(() => {
    if (m2Analysis && m2Analysis.support && Array.isArray(m2Analysis.support.support_path)) {
      return m2Analysis.support.support_path as SupportLevelNumber[];
    }
    return (
      difficultyResult.applicableSupportLevels ||
      getApplicableSupportLevels({
        maxSupportLevel: difficultyResult.maxSupportLevel,
        splitNeeded: difficultyResult.splitNeeded,
        simplificationNeeded: difficultyResult.simplificationNeeded,
        simplifiedText:
          difficultyResult.simplifiedText ||
          (isPracticeSentenceMatch ? currentSentence?.simplifiedSinhala : undefined) ||
          null,
      })
    );
  }, [m2Analysis, difficultyResult, isPracticeSentenceMatch, currentSentence]);

  // SOURCE OF TRUTH: Backend predicted difficulty level
  const predictedDifficulty: DifficultyLevel = useMemo(() => {
    if (m2Analysis?.difficulty?.predicted) {
      return m2Analysis.difficulty.predicted;
    }
    return (difficultyResult.difficultyLevel as DifficultyLevel) || 'Medium';
  }, [m2Analysis, difficultyResult]);

  // Section 8: Linguistically safe highlight units (never naive text.split(''))
  const highlightUnits: string[] = useMemo(() => {
    if (difficultyResult.highlightUnits && difficultyResult.highlightUnits.length > 0) {
      return difficultyResult.highlightUnits;
    }
    const words = targetSinhala.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return words;
    }
    return [targetSinhala];
  }, [difficultyResult, targetSinhala]);

  // Level 1 Focus Highlight progression index
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);

  // Automatically cycle active highlighted unit (akuru or word) when Level 1 is active
  useEffect(() => {
    if (currentSupportLevel !== 1) {
      setActiveHighlightIndex(0);
      return;
    }

    const words = targetSinhala.trim().split(/\s+/).filter(Boolean);
    const isWord = (m2Analysis?.text_type === 'word') || words.length <= 1;
    const units = isWord ? splitSinhalaGraphemes(targetSinhala.trim()) : highlightUnits;

    if (units.length <= 1) {
      setActiveHighlightIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev + 1) % units.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [currentSupportLevel, targetSinhala, m2Analysis?.text_type, highlightUnits]);

  // Reset support ladder whenever the target reading text changes
  useEffect(() => {
    setCurrentSupportLevel(0);
    setUnlockedLevels([0]);
    setRetryCount(0);
    setActiveHighlightIndex(0);
    attemptHandledRef.current = false;
    stopActiveSpeech();
    setTtsError(null);
  }, [targetSinhala, stopActiveSpeech]);

  // ── Central Reading Session Hook ───────────────────────────────────────────
  const session = useReadingSession({
    text: {
      id: targetTextId,
      content: targetSinhala,
      difficulty: 'medium',
    },
    interactionData: () => ({
      ...interactionTracker.getTelemetry(),
      cameraLandmarks: cameraLandmarkService.getLandmarkSequence(hasActiveConsent),
    }),
    onSuccess: () => {
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
  });

  // Feature 3: Auto-prompt cooldown when behavioral intervention is required
  useEffect(() => {
    if (
      (session.sessionStatus === 'done' || session.sessionStatus === 'partial_error') &&
      session.interventionRequired
    ) {
      setShowGamePopup(true);
    }
  }, [session.sessionStatus, session.interventionRequired]);

  // End session cleanly when leaving the screen
  useEffect(() => {
    return () => {
      session.endSession();
    };
  }, []);

  // Compute presentation analysis metrics from store results
  const analysisResult = useMemo(() => {
    if (session.sessionStatus !== 'done' && session.sessionStatus !== 'partial_error') {
      return null;
    }

    const m1 = session.results.errorAnalysis;
    const m1Raw: any = m1?.raw;

    const accuracy =
      m1Raw?.readingAccuracy ??
      (m1?.severity !== undefined ? Math.round((1 - m1.severity) * 100) : 80);

    const isAccurate = accuracy >= 85;

    const errors =
      m1Raw?.detectedErrors && m1Raw.detectedErrors.length > 0
        ? m1Raw.detectedErrors.map((e: any) => ({
            type: (e.type || 'substitution') as any,
            word: e.word || (isPracticeSentenceMatch ? currentSentence.targetWord : ''),
            detected: e.detected || (isPracticeSentenceMatch ? currentSentence.spokenWord : ''),
            severity: e.severity || 0.4,
            explanation: e.explanation || (isPracticeSentenceMatch ? currentSentence.simulatedErrors?.[0]?.explanation : ''),
            tip: e.tip || (isPracticeSentenceMatch ? currentSentence.simulatedErrors?.[0]?.tip : ''),
          }))
        : isAccurate
        ? []
        : (isPracticeSentenceMatch ? currentSentence.simulatedErrors : []);

    return {
      accuracy,
      transcription: m1Raw?.transcription || (isPracticeSentenceMatch ? currentSentence.sinhala : targetSinhala),
      errors,
      isAccurate,
      wpm: m1Raw?.readingSpeed ?? (isPracticeSentenceMatch ? currentSentence.wpm : 30),
      fluencyScore: m1Raw?.fluencyScore ?? (isPracticeSentenceMatch ? currentSentence.fluencyScore : 80),
      avgPauseDuration: m1Raw?.pauseDuration ? `${m1Raw.pauseDuration}s` : (isPracticeSentenceMatch ? currentSentence.avgPauseDuration : '1.2s'),
      syllablesPerSec: isPracticeSentenceMatch ? currentSentence.syllablesPerSec : '2.0 syl/s',
      targetWord: isPracticeSentenceMatch ? currentSentence.targetWord : '',
      spokenWord: isPracticeSentenceMatch ? currentSentence.spokenWord : '',
      phoneticBreakdown: isPracticeSentenceMatch ? currentSentence.phoneticBreakdown : '',
    };
  }, [session.sessionStatus, session.results.errorAnalysis, currentSentence, isPracticeSentenceMatch, targetSinhala]);

  // Advance to next valid progressive support level respecting applicableSupportLevels
  const advanceSupportLevel = useCallback(
    (fromLevel: number) => {
      const nextLevel = getNextValidSupportLevel(fromLevel, applicableSupportLevels);
      if (nextLevel !== null) {
        setCurrentSupportLevel(nextLevel);
        setRetryCount(0);
      }
    },
    [applicableSupportLevels]
  );

  const currentSupportLevelRef = useRef(currentSupportLevel);
  currentSupportLevelRef.current = currentSupportLevel;

  const retryCountRef = useRef(retryCount);
  retryCountRef.current = retryCount;

  // Integration interface: consumes attempt result from speech/session pipeline
  const handleAttemptResult = useCallback(
    (correct: boolean) => {
      if (correct) {
        // Correct reading result marks success
        setRetryCount(0);
      } else {
        // Child struggles: smoothly advance to next support level along support_path
        advanceSupportLevel(currentSupportLevelRef.current);
        setRetryCount((prev) => prev + 1);
      }
    },
    [advanceSupportLevel]
  );

  // Reset attempt handled flag whenever a new recording cycle begins or session resets
  useEffect(() => {
    if (
      session.sessionStatus === 'idle' ||
      session.sessionStatus === 'recording' ||
      session.sessionStatus === 'processing'
    ) {
      attemptHandledRef.current = false;
    }
  }, [session.sessionStatus]);

  useEffect(() => {
    if (
      (session.sessionStatus === 'done' || session.sessionStatus === 'partial_error') &&
      analysisResult &&
      !attemptHandledRef.current
    ) {
      attemptHandledRef.current = true;
      handleAttemptResult(analysisResult.isAccurate);
    }
  }, [session.sessionStatus, analysisResult, handleAttemptResult]);

  const getLadderItemStatus = (lvl: 1 | 2 | 3 | 4): 'completed' | 'current' | 'locked' | 'skipped' => {
    if (!applicableSupportLevels.includes(lvl)) {
      return 'skipped';
    }
    if (analysisResult?.isAccurate && currentSupportLevel === lvl) {
      return 'completed';
    }
    if (currentSupportLevel === lvl) {
      return 'current';
    }
    if (unlockedLevels.includes(lvl)) {
      return 'completed';
    }
    return 'locked';
  };

  // Audio Playback handler: Web SpeechSynthesis + Native Expo Speech for Sinhala
  const handlePlayAudio = async (type: 'child' | 'target') => {
    // Interruption handling: stop/cancel any active utterance safely before starting anew
    stopActiveSpeech();
    setTtsError(null);

    if (type === 'child') {
      setPlayingAudio('child');
      const duration = playbackSpeed === '0.75x' ? 2200 : 1500;
      audioTimerRef.current = setTimeout(() => {
        setPlayingAudio(null);
      }, duration);
      return;
    }

    if (type === 'target') {
      const textToSpeak = targetSinhala;
      if (!textToSpeak || !textToSpeak.trim()) {
        return;
      }

      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // 1. Cancel any active speech
            window.speechSynthesis.cancel();

            // 2. Load available speechSynthesis voices (handling async voiceschanged)
            const { voice: sinhalaVoice, availableLangs } = await getSinhalaWebVoice();

            // 3. If no Sinhala voice is available, do NOT silently fake or fall back to English
            if (!sinhalaVoice) {
              console.warn(
                '[SpeechSynthesis Web] Sinhala Web TTS voice unavailable. Available voice languages:',
                availableLangs
              );
              setPlayingAudio(null);
              setTtsError('මෙම උපාංගයේ සිංහල හඬ ලබාගත නොහැක.');
              return;
            }

            // 4. Assign that voice explicitly to SpeechSynthesisUtterance
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.voice = sinhalaVoice;

            // 5. Set utterance.lang = "si-LK"
            utterance.lang = 'si-LK';
            utterance.rate = playbackSpeed === '0.75x' ? 0.75 : 1.0;

            // 7. Use actual onstart / onend / onerror callbacks
            utterance.onstart = () => {
              setPlayingAudio('target');
            };
            utterance.onend = () => {
              if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
              setPlayingAudio(null);
            };
            utterance.onerror = (e) => {
              console.warn('[SpeechSynthesis Web] TTS Error:', e);
              if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
              setPlayingAudio(null);
              setTtsError('ශ්‍රව්‍ය ධාවනය දෝෂයක් (Speech synthesis error)');
            };

            window.speechSynthesis.speak(utterance);

            // Safety timeout in case browser drops onend event
            const duration = playbackSpeed === '0.75x' ? 4500 : 3000;
            audioTimerRef.current = setTimeout(() => {
              setPlayingAudio((prev) => (prev === 'target' ? null : prev));
            }, duration);
          } else {
            setPlayingAudio(null);
            setTtsError('මෙම උපාංගයේ සිංහල හඬ ලබාගත නොහැක.');
          }
        } catch (err) {
          console.warn('[SpeechSynthesis Web] TTS Exception:', err);
          if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
          setPlayingAudio(null);
          setTtsError('ශ්‍රව්‍ය දෝෂයක් (Audio error)');
        }
      } else {
        // Native / Mobile: iOS and Android using expo-speech
        try {
          await Speech.stop();
          const rate = playbackSpeed === '0.75x' ? 0.75 : 1.0;
          Speech.speak(textToSpeak, {
            language: 'si-LK',
            rate,
            onStart: () => {
              setPlayingAudio('target');
            },
            onDone: () => {
              if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
              setPlayingAudio(null);
            },
            onStopped: () => {
              if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
              setPlayingAudio(null);
            },
            onError: (err) => {
              console.warn('[Expo Speech Native] Sinhala TTS Error:', err);
              if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
              setPlayingAudio(null);
              setTtsError('ශ්‍රව්‍ය ධාවනය කළ නොහැකි විය (Audio unavailable on device)');
            },
          });

          // Safety timeout in case native TTS driver drops completion callback
          const duration = playbackSpeed === '0.75x' ? 5000 : 3500;
          audioTimerRef.current = setTimeout(() => {
            setPlayingAudio((prev) => (prev === 'target' ? null : prev));
          }, duration);
        } catch (err) {
          console.warn('[Expo Speech Native] Failed to initialize TTS:', err);
          if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
          setPlayingAudio(null);
          setTtsError('ශ්‍රව්‍ය ධාවනය කළ නොහැකි විය (Audio unavailable on device)');
        }
      }
    }
  };

  const handleVoiceModalSuccess = () => {
    setShowVoiceModal(false);
    session.stopRecording();
  };

  const handleReset = useCallback(() => {
    stopActiveSpeech();
    attemptHandledRef.current = false;
    interactionTracker.recordRetry();
    // NOTE: do not resetTracker() here — retries must accumulate for M4 frustration detection
    session.resetSession();
    setShowGamePopup(false);
    resultAnim.setValue(0);
  }, [session, resultAnim, interactionTracker, stopActiveSpeech]);

  // Dedicated Active Support Renderer (Research Component: M2)
  const renderActiveSupport = (showTryAgain: boolean = false) => {
    if (currentSupportLevel === 0) {
      if (showTryAgain && !analysisResult?.isAccurate) {
        return (
          <View
            style={[
              styles.ladderCard,
              ThemeShadow.sm,
              styles.ladderCardCurrent,
              { marginBottom: ThemeSpacing.sm },
            ]}
          >
            <TouchableOpacity
              style={styles.ladderTryAgainBtn}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <AppText size="xs" weight="extrabold" color="#FFFFFF">
                → නැවත කියවමු (Try Again) 🎙️
              </AppText>
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    }

    if (!applicableSupportLevels.includes(currentSupportLevel as any)) {
      return null;
    }

    if (currentSupportLevel === 1) {
      const words = targetSinhala.trim().split(/\s+/).filter(Boolean);
      const isWord = (m2Analysis?.text_type === 'word') || words.length <= 1;

      return (
        <View
          style={[
            styles.ladderCard,
            ThemeShadow.sm,
            styles.ladderCardCurrent,
            { marginBottom: ThemeSpacing.sm },
          ]}
        >
          <View style={styles.syllablesInsideSection}>
            <View style={styles.highlightPill}>
              <AppText size="xs" weight="extrabold" color="#92400E">
                🌟 වචන ඉස්මතු කිරීම (Focus Highlight)
              </AppText>
            </View>

            {isWord ? (
              // Level 1 Focus Highlight for Word: akuru-by-akuru focus while keeping word visually together
              <View style={[styles.inlineWordFocusRow, { marginTop: 8 }]}>
                {splitSinhalaGraphemes(targetSinhala.trim()).map((akuru, idx) => {
                  const isFocused = idx === activeHighlightIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setActiveHighlightIndex(idx)}
                      style={[
                        styles.inlineAkuruFocusBox,
                        isFocused && styles.inlineAkuruFocusBoxActive,
                      ]}
                    >
                      <AppText
                        size="xxl"
                        weight="extrabold"
                        color={isFocused ? '#B45309' : '#1F2937'}
                        style={styles.sentenceText}
                      >
                        {akuru}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              // Level 1 Focus Highlight for Short Sentence: word-level progression
              <View style={[styles.highlightUnitsRow, { marginTop: 6 }]}>
                {highlightUnits.map((unit, idx) => {
                  const isFocused = idx === activeHighlightIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setActiveHighlightIndex(idx)}
                      style={[
                        styles.highlightUnitChip,
                        isFocused && styles.highlightUnitChipActive,
                      ]}
                    >
                      <AppText
                        size="xxl"
                        weight="extrabold"
                        color={isFocused ? '#92400E' : '#78350F'}
                        style={styles.sentenceText}
                      >
                        {unit}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {showTryAgain && !analysisResult?.isAccurate && (
              <TouchableOpacity
                style={styles.ladderTryAgainBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  → නැවත කියවමු (Try Again) 🎙️
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (currentSupportLevel === 2) {
      const words = targetSinhala.trim().split(/\s+/).filter(Boolean);
      const isMultiWord = words.length > 1;

      const segmentedWords: SplitWord[] =
        (isPracticeSentenceMatch && currentSentence?.splitWords && currentSentence.splitWords.length > 0)
          ? currentSentence.splitWords
          : words.map((w) => ({
              word: w,
              parts: splitSinhalaGraphemes(w),
            }));

      const fallbackParts: string[] =
        (isPracticeSentenceMatch && currentSentence?.syllables && currentSentence.syllables.length > 1)
          ? currentSentence.syllables
          : (difficultyResult.splitParts && difficultyResult.splitParts.length > 0)
          ? difficultyResult.splitParts
          : splitSinhalaGraphemes(targetSinhala);

      return (
        <View
          style={[
            styles.ladderCard,
            ThemeShadow.sm,
            styles.ladderCardCurrent,
            { marginBottom: ThemeSpacing.sm },
          ]}
        >
          <View style={styles.syllablesInsideSection}>
            <AppText size="xs" weight="bold" color="#047857" style={{ marginBottom: 6 }}>
              🔤 වෙන් කළ කොටස් (Akuru / Orthographic Units):
            </AppText>
            {isMultiWord ? (
              <View style={styles.sentenceGroups}>
                {segmentedWords.map((wordGroup, wIdx) => (
                  <View key={`word-${wIdx}-${wordGroup.word}`} style={styles.wordGroup}>
                    <View style={styles.wordPartsRow}>
                      {wordGroup.parts.map((part, pIdx) => (
                        <View key={`part-${wIdx}-${pIdx}`} style={styles.syllableChip}>
                          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                            {part}
                          </AppText>
                        </View>
                      ))}
                    </View>
                    <AppText size="xs" weight="semibold" color={ThemeColors.textMuted} style={styles.wordSubLabel}>
                      {wordGroup.word}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.syllablesRow}>
                {fallbackParts.map((part, i) => (
                  <View key={i} style={styles.syllableChip}>
                    <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                      {part}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
            {showTryAgain && !analysisResult?.isAccurate && (
              <TouchableOpacity
                style={styles.ladderTryAgainBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  → නැවත කියවමු (Try Again) 🎙️
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (currentSupportLevel === 3) {
      return (
        <View
          style={[
            styles.ladderCard,
            ThemeShadow.sm,
            styles.ladderCardCurrent,
            { marginBottom: ThemeSpacing.sm },
          ]}
        >
          <View style={styles.audioSupportInsideSection}>
            <AppText size="xs" weight="bold" color="#047857" style={{ marginBottom: 6 }}>
              🔊 ශ්‍රව්‍ය සහාය (Audio Support):
            </AppText>
            <TouchableOpacity
              style={[
                styles.audioSupportActionBtn,
                playingAudio === 'target' && styles.audioSupportActionBtnActive,
              ]}
              onPress={() => handlePlayAudio('target')}
              activeOpacity={0.8}
            >
              <AppText
                size="xs"
                weight="extrabold"
                color={playingAudio === 'target' ? '#FFFFFF' : '#047857'}
              >
                {playingAudio === 'target'
                  ? `🔊 ${t('support.audio.playing')}`
                  : '🔊 හඬ අසමු'}
              </AppText>
            </TouchableOpacity>
            {ttsError && (
              <AppText size="xs" color="#DC2626" weight="bold" style={{ marginTop: 6 }}>
                ⚠️ {ttsError}
              </AppText>
            )}
            <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 6 }}>
              ඔබට අවශ්‍ය වාර ගණනක් ශ්‍රවණය කළ හැක (Replay as many times as you like).
            </AppText>
            {showTryAgain && !analysisResult?.isAccurate && (
              <TouchableOpacity
                style={styles.ladderTryAgainBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  → නැවත කියවමු (Try Again) 🎙️
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (currentSupportLevel === 4) {
      const simplificationNeeded = Boolean(
        m2Analysis?.simplification?.needed ??
        m2Analysis?.support?.simplification_needed ??
        difficultyResult?.simplificationNeeded
      );
      const isSimpAvailable = Boolean(
        m2Analysis?.simplification?.available && m2Analysis?.simplification?.simplified_text
      ) || Boolean(
        !m2Analysis && (difficultyResult?.simplifiedText || (isPracticeSentenceMatch && currentSentence?.simplifiedSinhala))
      );
      const simplifiedText =
        m2Analysis?.simplification?.simplified_text ||
        (m2Analysis
          ? null
          : difficultyResult.simplifiedText ||
            (isPracticeSentenceMatch ? currentSentence?.simplifiedSinhala : undefined));

      return (
        <View
          style={[
            styles.ladderCard,
            ThemeShadow.sm,
            styles.ladderCardCurrent,
            { marginBottom: ThemeSpacing.sm },
          ]}
        >
          <View style={styles.simplificationInsideSection}>
            <View style={styles.simplificationBox}>
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                Original:
              </AppText>
              <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                {targetSinhala}
              </AppText>
            </View>

            {isSimpAvailable && simplifiedText ? (
              <View style={[styles.simplificationBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', marginTop: 6 }]}>
                <AppText size="xs" weight="extrabold" color="#047857">
                  සරල කළ වාක්‍යය:
                </AppText>
                <AppText size="md" weight="extrabold" color="#047857" style={{ marginTop: 2 }}>
                  {simplifiedText}
                </AppText>
              </View>
            ) : (
              <View style={[styles.simplificationBox, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', marginTop: 6 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText size="sm">ℹ️</AppText>
                  <AppText size="xs" weight="extrabold" color="#334155">
                    AI වාක්‍ය සරල කිරීම
                  </AppText>
                </View>
                <AppText size="xs" color="#475569" style={{ marginTop: 4, lineHeight: 18 }}>
                  {simplificationNeeded
                    ? 'මෙම වාක්‍යය සඳහා විශ්වාසදායක සරල කිරීමක් ලබා දිය නොහැක. වෙනත් වාක්‍යයක් උත්සාහ කරන්න.'
                    : 'මෙම වාක්‍යයට සරල කිරීම අවශ්‍ය නොවේ. සංකීර්ණ හෝ දිගු වාක්‍ය සඳහා AI සරල කිරීමේ සහාය ලබා දේ.'}
                </AppText>
              </View>
            )}

            {showTryAgain && !analysisResult?.isAccurate && (
              <TouchableOpacity
                style={styles.ladderTryAgainBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  → නැවත කියවමු (Try Again) 🎙️
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top App Bar ────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            stopActiveSpeech();
            router.canGoBack() ? router.back() : router.replace('/(child)/home');
          }}
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

        <View style={styles.titleBlock}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            AI කථන පුහුණු සැසිය
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            ස්වයංක්‍රීය කථන සහ උච්චාරණ විශ්ලේෂකය
          </AppText>
        </View>

        {/* AI Status Badge & Camera Permission Link */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={[
              styles.statusBadge,
              hasActiveConsent ? styles.cameraBadgeActive : styles.cameraBadgeInactive,
            ]}
            onPress={() => setShowPermissionModal(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: hasActiveConsent ? '#10B981' : '#94A3B8' },
              ]}
            />
            <AppText
              size="xs"
              weight="bold"
              color={hasActiveConsent ? '#047857' : '#64748B'}
            >
              {hasActiveConsent ? '📷 Cam AI' : '📷 Cam Off'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.privacyIconBtn}
            onPress={() => setShowPermissionModal(true)}
            activeOpacity={0.8}
          >
            <AppText size="xs">🛡️</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Sentence Card with Progressive Support (M2) ─────────────────── */}
        <View style={[styles.sentenceCard, ThemeShadow.sm]}>
          {/* Target Text Header */}
          <View style={styles.textSelectorRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              <View style={styles.targetLabelBadge}>
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  📖 කියවිය යුතු පාඨය:
                </AppText>
              </View>

              {/* Child-Friendly Difficulty Badge (M2 Backend Source of Truth) */}
              <View
                style={[
                  styles.difficultyBadge,
                  predictedDifficulty === 'Easy' && styles.difficultyBadgeEasy,
                  predictedDifficulty === 'Medium' && styles.difficultyBadgeMedium,
                  predictedDifficulty === 'Hard' && styles.difficultyBadgeHard,
                ]}
              >
                <AppText
                  size="xs"
                  weight="extrabold"
                  color={
                    predictedDifficulty === 'Easy'
                      ? '#047857'
                      : predictedDifficulty === 'Medium'
                      ? '#B45309'
                      : '#DC2626'
                  }
                >
                  {predictedDifficulty === 'Easy'
                    ? '🟢 පහසු (Easy)'
                    : predictedDifficulty === 'Medium'
                    ? '🟡 මධ්‍යම (Medium)'
                    : '🔴 අභියෝගාත්මක (Hard)'}
                </AppText>
              </View>
            </View>

            {/* Need Help Button if further supports are available along support_path */}
            {getNextValidSupportLevel(currentSupportLevel, applicableSupportLevels) !== null && (
              <TouchableOpacity
                style={styles.needHelpBtn}
                onPress={() => advanceSupportLevel(currentSupportLevel)}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  💡 උදව් අවශ්‍යයි (Need Help)
                </AppText>
              </TouchableOpacity>
            )}

            {!params.selectedText && !m2Analysis && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {PRACTICE_SENTENCES.map((t, i) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.textPill, currentTextIndex === i && styles.textPillActive]}
                    onPress={() => {
                      setCurrentTextIndex(i);
                      handleReset();
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      size="xs"
                      weight={currentTextIndex === i ? 'extrabold' : 'semibold'}
                      color={currentTextIndex === i ? '#FFFFFF' : ThemeColors.textSecondary}
                    >
                      {i + 1}
                    </AppText>
                  </TouchableOpacity>
                ))}
                <AppText size="xs" color={ThemeColors.textMuted} style={{ marginLeft: 8 }}>
                  වාක්‍යය තෝරන්න
                </AppText>
              </View>
            )}
          </View>

          {/* Main Sentence Display Box */}
          <View style={styles.sentenceDisplay}>
            <AppText
              size="xxl"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              style={styles.sentenceText}
            >
              {targetSinhala}
            </AppText>
          </View>
        </View>

        {/* Top Active Support Detail Area on Reading Screen */}
        {session.sessionStatus !== 'done' && session.sessionStatus !== 'partial_error' && renderActiveSupport(false)}

        {/* ── Offline Alert Banner ─────────────────────────────────────────── */}
        {session.isOffline && (
          <OfflineBanner
            forceShow={true}
            message={t('session.offline.alert')}
            onRetry={session.retryPipeline}
            style={{ marginBottom: ThemeSpacing.sm }}
          />
        )}

        {/* ── Speech Recording Section ────────────────────────────────────────── */}
        {(session.sessionStatus === 'idle' || session.sessionStatus === 'recording') && (
          <View style={[styles.recordSection, ThemeShadow.sm]}>
            <View style={styles.sectionHeaderLine}>
              <AppText size="sm">🎙️</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                ශබ්ද නගා කියවන්න
              </AppText>
            </View>

            <AppText size="xs" color={ThemeColors.textSecondary} align="center" style={styles.readingPrompt}>
              ඉහත වාක්‍යය පැහැදිලිව කියවන්න. AI මගින් ඔබේ උච්චාරණය, වේගය සහ චතුරතාව ක්ෂණිකව විශ්ලේෂණය කරයි.
            </AppText>

            {/* Center Mic Button with Live Recording State */}
            <View style={styles.micButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.circleMicButton,
                  session.isRecording && styles.circleMicButtonRecording,
                ]}
                onPress={() => {
                  interactionTracker.recordTap();
                  if (session.isRecording) {
                    session.stopRecording();
                  } else {
                    stopActiveSpeech();
                    session.startRecording();
                  }
                }}
                activeOpacity={0.85}
              >
                <AppText size="display" style={{ fontSize: 38 }}>
                  {session.isRecording ? '⏹️' : '🎙️'}
                </AppText>
              </TouchableOpacity>
              <AppText
                size="sm"
                weight="extrabold"
                color={session.isRecording ? '#DC2626' : ThemeColors.primary}
                style={{ marginTop: 12 }}
              >
                {session.isRecording
                  ? 'පටිගත වෙමින් පවතී... නැවැත්වීමට ඔබන්න'
                  : 'පටිගත කිරීම ආරම්භ කිරීමට ස්පර්ශ කරන්න'}
              </AppText>
              <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 4 }}>
                {session.isRecording
                  ? '(කියවා අවසන් වූ පසු ස්පර්ශ කරන්න)'
                  : '(ශබ්ද නගා කියවා AI විශ්ලේෂණය ලබාගන්න)'}
              </AppText>
            </View>
          </View>
        )}

        {/* ── Progressive Loading State (feat/shared-states LoadingView) ───── */}
        {session.isProcessing && (
          <View style={[styles.analyzingCard, ThemeShadow.sm]}>
            <LoadingView
              variant="card"
              message={session.loadingMessage}
              subtitle={`AI විශ්ලේෂණය සක්‍රීයයි · පියවර ${session.loadingStage} / 3`}
            />
          </View>
        )}

        {/* ── Error State (feat/shared-states ErrorView) ────────────────────── */}
        {session.sessionStatus === 'error' && (
          <View style={[styles.analyzingCard, ThemeShadow.sm]}>
            <ErrorView
              title={t('state.error.title')}
              message={t('session.error.readingAnalysis')}
              onRetry={() => session.retryStep('readingAnalysis')}
              retryLabel={t('state.error.retry')}
              secondaryLabel={t('common.back')}
              onSecondaryAction={handleReset}
            />
          </View>
        )}

        {/* ── Result Dashboard ──────────────────────────────────────────── */}
        {(session.sessionStatus === 'done' || session.sessionStatus === 'partial_error') && analysisResult && (
          <Animated.View
            style={[
              styles.resultCard,
              ThemeShadow.md,
              { opacity: resultAnim, transform: [{ scale: resultAnim }] },
            ]}
          >
            {/* Top Dedicated Support Detail Area for Active Support */}
            {renderActiveSupport(true)}

            {/* ── Progressive Reading Support Ladder (Research Component: M2) ── */}
            <View style={[styles.ladderContainer, ThemeShadow.sm, { marginBottom: ThemeSpacing.sm }]}>
              <View style={styles.ladderHeader}>
                <AppText size="xs">📊</AppText>
                <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                  කියවීමේ සහාය ශ්‍රේණිය — Reading Support Ladder
                </AppText>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ paddingHorizontal: 12, paddingTop: 8 }}>
                ඔබට අවශ්‍ය සහාය මට්ටම අනුව පියවරෙන් පියවර චතුරතාව වැඩිදියුණු කරගන්න:
              </AppText>

              <View style={styles.ladderGrid}>
                {/* Level 0: Independent Attempt State */}
                <TouchableOpacity
                  onPress={() => setCurrentSupportLevel(0)}
                  activeOpacity={0.8}
                  style={[
                    styles.ladderCard,
                    currentSupportLevel === 0
                      ? styles.ladderCardCurrent
                      : styles.ladderCardCompleted,
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: ThemeSpacing.sm }}>
                    <View
                      style={[
                        styles.ladderCardIcon,
                        currentSupportLevel > 0 && { backgroundColor: '#ECFDF5' },
                      ]}
                    >
                      <AppText size="md">{currentSupportLevel > 0 ? '✓' : '🎯'}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        size="xs"
                        weight="extrabold"
                        color={currentSupportLevel === 0 ? ThemeColors.primary : '#047857'}
                      >
                        ස්වාධීන උත්සාහය (Independent Attempt)
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textMuted}>
                        {currentSupportLevel > 0
                          ? 'පළමු ස්වාධීන කියවීමේ උත්සාහය අවසන් විය'
                          : 'සහායකින් තොරව කියවීමේ ආරම්භක උත්සාහය'}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.ladderStatusBadge,
                        currentSupportLevel === 0
                          ? styles.ladderStatusBadgeActive
                          : styles.ladderStatusBadgeDone,
                      ]}
                    >
                      <AppText
                        size="xs"
                        weight="bold"
                        color={currentSupportLevel === 0 ? ThemeColors.primary : '#047857'}
                      >
                        {currentSupportLevel === 0 ? '→ ක්‍රියාකාරී' : '✓ සම්පූර්ණයි'}
                      </AppText>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Levels 1 to 4: Progressive Support Options */}
                {SUPPORT_LADDER_ITEMS.map((opt) => {
                  const status = getLadderItemStatus(opt.level);
                  if (status === 'skipped') return null;

                  const isCurrent = status === 'current';
                  const isCompleted = status === 'completed';
                  const isLocked = status === 'locked';

                  const itemLabel = opt.key === 'audio' ? t('support.ladder.audio.label') : opt.label;
                  const itemSublabel = opt.key === 'audio' ? t('support.ladder.audio.sublabel') : opt.sublabel;

                  return (
                    <TouchableOpacity
                      key={opt.key}
                      disabled={isLocked}
                      onPress={() => {
                        if (!isLocked) {
                          setCurrentSupportLevel(opt.level);
                        }
                      }}
                      activeOpacity={isLocked ? 1 : 0.8}
                      style={[
                        styles.ladderCard,
                        {
                          backgroundColor: isLocked ? '#F8FAFC' : opt.bg,
                          borderColor: isCurrent ? opt.color : isCompleted ? '#BCE6CB' : '#E2E8F0',
                        },
                        isCurrent && styles.ladderCardActiveBorder,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: ThemeSpacing.sm }}>
                        <View
                          style={[
                            styles.ladderCardIcon,
                            isLocked && { opacity: 0.5, backgroundColor: '#EDF2F7' },
                            isCompleted && { backgroundColor: '#ECFDF5' },
                          ]}
                        >
                          <AppText size="md">{isCompleted ? '✓' : isLocked ? '🔒' : opt.icon}</AppText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText
                            size="xs"
                            weight="extrabold"
                            color={isLocked ? ThemeColors.textMuted : opt.color}
                          >
                            පියවර {opt.level}: {itemLabel}
                          </AppText>
                          <AppText size="xs" color={ThemeColors.textMuted}>
                            {itemSublabel}
                          </AppText>
                        </View>
                        <View
                          style={[
                            styles.ladderStatusBadge,
                            isCurrent && styles.ladderStatusBadgeActive,
                            isCompleted && styles.ladderStatusBadgeDone,
                            isLocked && styles.ladderStatusBadgeLocked,
                          ]}
                        >
                          <AppText
                            size="xs"
                            weight="bold"
                            color={isCurrent ? opt.color : isCompleted ? '#047857' : ThemeColors.textMuted}
                          >
                            {isCurrent ? '→ ක්‍රියාකාරී' : isCompleted ? '✓ සම්පූර්ණයි' : '🔒 අගුළුලා ඇත'}
                          </AppText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Accuracy Header */}
            <View
              style={[
                styles.accuracyHeader,
                { backgroundColor: analysisResult.isAccurate ? '#EAF7EE' : '#FEF3C7' },
              ]}
            >
              <AppText
                size="xxl"
                weight="extrabold"
                color={analysisResult.isAccurate ? ThemeColors.primary : '#B45309'}
              >
                {analysisResult.accuracy}%
              </AppText>
              <AppText
                size="xs"
                weight="bold"
                color={analysisResult.isAccurate ? ThemeColors.primary : '#B45309'}
              >
                {analysisResult.isAccurate
                  ? '✅ විශිෂ්ටයි! ඉතා පැහැදිලි නිවැරදි උච්චාරණයක්'
                  : '⚠️ උච්චාරණ දෝෂ හඳුනාගැනීමක් සිදුකරන ලදී'}
              </AppText>
            </View>

            {/* Behavioral Intervention Banner (Displayed on results per spec) */}
            {session.hasIntervention && (
              <View style={[styles.interventionBannerCard, ThemeShadow.sm]}>
                <View style={styles.interventionHeaderRow}>
                  <AppText size="lg">🌿</AppText>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <AppText size="sm" weight="extrabold" color="#065F46">
                      {t('session.intervention.bannerTitle')}
                    </AppText>
                    <AppText size="xs" color="#047857" style={{ marginTop: 2 }}>
                      {t('session.intervention.bannerDesc')}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={styles.interventionPlayBtn}
                    onPress={() => router.push('/(child)/cooldown')}
                    activeOpacity={0.85}
                  >
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      {t('session.intervention.playBtn')}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Recommendation Failure Inline Retry (Non-blocking partial failure) */}
            {session.errors.recommendation && (
              <View style={[styles.recRetryBanner, ThemeShadow.sm]}>
                <View style={{ flex: 1 }}>
                  <AppText size="xs" weight="bold" color="#92400E">
                    ⚠️ {t('session.error.recommendationRetry')}
                  </AppText>
                </View>
                <TouchableOpacity
                  style={styles.recRetryBtn}
                  onPress={() => session.retryStep('recommendation')}
                  activeOpacity={0.8}
                >
                  <AppText size="xs" weight="bold" color="#FFFFFF">
                    නැවත කරමු 🚀
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Recommendation Success Highlights */}
            {session.results.recommendation && (
              <View style={[styles.recSuccessBanner, ThemeShadow.sm]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="sm">✨</AppText>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                    ඊළඟ නිර්දේශය: {session.results.recommendation.nextActivity} ({session.results.recommendation.transition})
                  </AppText>
                </View>
                {session.results.recommendation.rationale.length > 0 && (
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
                    {session.results.recommendation.rationale.join(' • ')}
                  </AppText>
                )}
              </View>
            )}

            {/* Session Persistence Status Badge */}
            <View style={styles.persistedBadgeRow}>
              <View style={[styles.persistedDot, session.isPersisting && { backgroundColor: '#F59E0B' }]} />
              <AppText size="xs" weight="bold" color="#059669">
                {session.isPersisting
                  ? '⏳ සැසිය Firestore වෙත සුරකිමින්...'
                  : session.savedSessionId
                  ? '☁️ සැසිය Firestore හි සුරැකිණි (Session Persisted)'
                  : '☁️ සැසිය සාර්ථකව සුරැකිණි'}
              </AppText>
            </View>

            {/* Transcription Box */}
            <View style={styles.transcriptionBox}>
              <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                හඳුනාගත් කථනය (Detected Speech):
              </AppText>
              <AppText size="md" weight="bold" color={ThemeColors.textPrimary} style={{ marginTop: 4 }}>
                "{analysisResult.transcription}"
              </AppText>
            </View>

            {/* ── FEATURE 1: FLUENCY & READING RATE METRICS (WPM & චතුරතාව) ── */}
            <View style={styles.fluencySection}>
              <View style={styles.fluencyHeaderRow}>
                <AppText size="sm">⏱️</AppText>
                <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                  කියවීමේ චතුරතාව & වේගය (Fluency & Reading Rate)
                </AppText>
              </View>

              <View style={styles.metricsRowGrid}>
                {/* Metric 1: WPM */}
                <View style={styles.fluencyMetricCard}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                    කියවීමේ වේගය
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <AppText size="xl" weight="extrabold" color={ThemeColors.primary}>
                      {analysisResult.wpm}
                    </AppText>
                    <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginLeft: 3 }}>
                      WPM
                    </AppText>
                  </View>
                  <View style={styles.targetRatePill}>
                    <AppText size="xs" color="#0369A1">
                      ඉලක්කය: 40-55
                    </AppText>
                  </View>
                </View>

                {/* Metric 2: Fluency Index */}
                <View style={styles.fluencyMetricCard}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                    චතුරතා දර්ශකය
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <AppText size="xl" weight="extrabold" color="#D97706">
                      {analysisResult.fluencyScore}%
                    </AppText>
                  </View>
                  <View style={styles.miniProgressBarTrack}>
                    <View
                      style={[
                        styles.miniProgressBarFill,
                        {
                          width: `${analysisResult.fluencyScore}%`,
                          backgroundColor:
                            analysisResult.fluencyScore >= 80 ? '#10B981' : '#F59E0B',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Metric 3: Avg Pause Duration */}
                <View style={styles.fluencyMetricCard}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                    සාමාන්‍ය පැකිලීම
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <AppText size="lg" weight="extrabold" color="#DC2626">
                      {analysisResult.avgPauseDuration}
                    </AppText>
                  </View>
                  <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 2 }}>
                    පෙර විරාමය
                  </AppText>
                </View>

                {/* Metric 4: Syllables / Sec */}
                <View style={styles.fluencyMetricCard}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                    අක්ෂර වේගය
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                    <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                      {analysisResult.syllablesPerSec}
                    </AppText>
                  </View>
                  <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 2 }}>
                    තත්පරයට
                  </AppText>
                </View>
              </View>
            </View>

            {/* Error Breakdown Section */}
            {analysisResult.errors.length > 0 ? (
              <View style={styles.errorsSection}>
                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary} style={{ marginBottom: 6 }}>
                  🔍 හඳුනාගත් උච්චාරණ දෝෂ වර්ගීකරණය:
                </AppText>
                {analysisResult.errors.map((err: any, idx: number) => {
                  const meta = ERROR_META[(err.type as keyof typeof ERROR_META) || 'substitution'] || ERROR_META.substitution;
                  return (
                    <View key={idx} style={[styles.errorCardRow, { backgroundColor: meta.bg }]}>
                      <View style={styles.errorIconWrap}>
                        <AppText size="md">{meta.icon}</AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.errorLabelLine}>
                          <AppText size="xs" weight="extrabold" color={meta.color}>
                            {meta.label}
                          </AppText>
                          <View style={styles.severityTag}>
                            <AppText size="xs" weight="bold" color={meta.color}>
                              දෝෂ බරපතලකම: {Math.round(err.severity * 100)}%
                            </AppText>
                          </View>
                        </View>
                        <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginTop: 2 }}>
                          {err.explanation}
                        </AppText>
                        <View style={styles.tipInnerBox}>
                          <AppText size="xs" color="#0369A1">
                            {err.tip}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noErrorBox}>
                <AppText size="sm">🌟</AppText>
                <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginLeft: 8 }}>
                  කිසිදු දෝෂයක් නොමැත! සියලු වචන ඉතා නිවැරදියි!
                </AppText>
              </View>
            )}

            {/* ── FEATURE 2: SLOW-MOTION AUDIO COMPARISON PLAYER ── */}
            <View style={styles.audioCompareCard}>
              <View style={styles.audioCompareTopHeader}>
                <View style={styles.audioCompareTitleRow}>
                  <AppText size="sm">🔊</AppText>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.primary} style={styles.audioCompareTitleText}>
                    ශ්‍රව්‍ය සංසන්දනය & මන්දගාමී වාදනය (Audio Compare)
                  </AppText>
                </View>

                {/* Speed Toggle Pills (1.0x vs 0.75x) */}
                <View style={styles.speedToggleContainer}>
                  <TouchableOpacity
                    style={[styles.speedPill, playbackSpeed === '1.0x' && styles.speedPillActive]}
                    onPress={() => setPlaybackSpeed('1.0x')}
                    activeOpacity={0.7}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={playbackSpeed === '1.0x' ? '#FFFFFF' : ThemeColors.textSecondary}
                    >
                      1.0x
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.speedPill, playbackSpeed === '0.75x' && styles.speedPillActive]}
                    onPress={() => setPlaybackSpeed('0.75x')}
                    activeOpacity={0.7}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={playbackSpeed === '0.75x' ? '#FFFFFF' : ThemeColors.textSecondary}
                    >
                      0.75x මන්දගාමී
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.audioPlayersWrapper}>
                {/* Audio 1: Spoken Voice (Child) */}
                <View style={styles.audioTrackBox}>
                  <View style={{ flex: 1 }}>
                    <AppText size="xs" color={ThemeColors.textMuted} weight="bold">
                      🎙️ ඔබ කියවූ ශබ්දය:
                    </AppText>
                    <AppText size="md" weight="extrabold" color="#DC2626" style={{ marginTop: 2 }}>
                      "{analysisResult.spokenWord}"
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={[styles.audioPlayBtn, playingAudio === 'child' && styles.audioPlayBtnActive]}
                    onPress={() => handlePlayAudio('child')}
                    activeOpacity={0.8}
                  >
                    <AppText size="xs" weight="bold" color={playingAudio === 'child' ? '#FFFFFF' : ThemeColors.primary}>
                      {playingAudio === 'child' ? '🔊 වාදනය වේ...' : '▶ ශ්‍රවණය'}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Audio 2: Target Correct Audio (Audio Support) */}
                <View style={[styles.audioTrackBox, styles.audioTrackTarget]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <AppText size="xs" color="#047857" weight="bold">
                        🌟 නිවැරදි උච්චාරණය:
                      </AppText>
                      {playbackSpeed === '0.75x' && (
                        <View style={styles.slowBadge}>
                          <AppText size="xs" color="#047857" weight="bold">
                            0.75x
                          </AppText>
                        </View>
                      )}
                    </View>
                    <AppText size="md" weight="extrabold" color="#047857" style={{ marginTop: 2 }}>
                      "{analysisResult.targetWord}"
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 1 }}>
                      {analysisResult.phoneticBreakdown}
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={[styles.audioPlayBtnSuccess, playingAudio === 'target' && styles.audioPlayBtnSuccessActive]}
                    onPress={() => handlePlayAudio('target')}
                    activeOpacity={0.8}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={playingAudio === 'target' ? '#FFFFFF' : '#047857'}
                    >
                      {playingAudio === 'target' ? '🔊 වාදනය වේ...' : '🔊 හඬ අසමු'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.resultActionsRow}>
              <TouchableOpacity style={styles.retryActionBtn} onPress={handleReset} activeOpacity={0.85}>
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🔄 නැවත
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rewardsActionBtn}
                onPress={() => setShowRewardsModal(true)}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🏆 ජයග්‍රහණ
                </AppText>
              </TouchableOpacity>

              {analysisResult.errors.length > 0 && (
                <TouchableOpacity
                  style={styles.gameActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(child)/cooldown',
                      params: {
                        intervention: session.interventionType || 'cooldown_activity',
                        mode: session.interventionType === 'focus_game' ? 'focus' : 'calm',
                      },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <AppText size="xs" weight="bold" color="#FFFFFF">
                    🎮 සන්සුන්
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.nextSentenceBtn}
                onPress={() => {
                  interactionTracker.recordTap();
                  setCurrentTextIndex((prev) => (prev + 1) % PRACTICE_SENTENCES.length);
                  handleReset();
                  // New sentence => fresh telemetry window
                  interactionTracker.resetTracker();
                }}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  ඊළඟ →
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* ── Gamified Pop-up: Behavior-Aware Adaptive Game Route ────────────────── */}
      <Modal
        visible={showGamePopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGamePopup(false)}
      >
        {(() => {
          const detectedState = session.results.behaviorState?.state || (session.results.behaviorState?.raw as any)?.behaviour_state || 'Engaged';
          const isFrustrated = detectedState === 'Frustrated' || session.interventionType === 'game-breathing';
          const isDistracted = detectedState === 'Distracted' || session.interventionType === 'game-star';
          const isEngaged = detectedState === 'Engaged' || session.interventionType === 'game-bubble';

          const modalIcon = isFrustrated ? '🎈' : isDistracted ? '⭐' : isEngaged ? '🫧' : '🎮';
          const modalTitle = isFrustrated
            ? 'හුස්ම ගනිමින් සන්සුන් වෙමුද?'
            : isDistracted
            ? 'අවධානය නැවත ලබා ගනිමුද?'
            : isEngaged
            ? 'නියමයි! අද ඉතාම හොඳින් කියෙව්වා! 🌟'
            : 'අපි සෙල්ලමක් කරමුද?';
          const pillText = isFrustrated
            ? '🌿 සන්සුන් වීමේ ක්‍රීඩාව (Balloon Breathing)'
            : isDistracted
            ? '🎯 අවධානය රඳවා ගැනීමේ ක්‍රීඩාව (Catch the Star)'
            : isEngaged
            ? '🎉 ජයග්‍රහණ සැමරීමේ ක්‍රීඩාව (Bubble Pop)'
            : '🎲 විනෝදජනක සන්සුන් ක්‍රීඩා (CoolDown)';
          const promptText = isFrustrated
            ? 'කියවීමේදී මනස තරමක් වෙහෙසට පත් වූ විට සන්සුන් හුස්ම ගැනීමේ ක්‍රීඩාවක් කිරීමෙන් මනස සැහැල්ලු කරගත හැක.'
            : isDistracted
            ? 'කියවීමට නැවත අවධානය යොමු කර ගැනීම සඳහා විනෝදජනක තරු ඇල්ලීමේ ක්‍රීඩාවක් කරමු.'
            : isEngaged
            ? 'ඔබ අද ඉතාම උනන්දුවෙන් සහ සාර්ථකව කියෙව්වා! ජයග්‍රහණය සැමරීමට සහ මනස සැහැල්ලු කර ගැනීමට විනෝදජනක Bubble Pop ක්‍රීඩාවක් කරමුද?'
            : `කියවීමෙන් පසු මනස සැහැල්ලු කර ගැනීමට සහ '${currentSentence.targetLetterToPractice}' ශබ්දය විනෝදයෙන් පුහුණු වීමට ක්‍රීඩාවක් කරමුද?`;
          const directRoute = isFrustrated
            ? '/(child)/game-breathing'
            : isDistracted
            ? '/(child)/game-star'
            : isEngaged
            ? '/(child)/game-bubble'
            : '/(child)/cooldown';
          const buttonLabel = isFrustrated
            ? '🎈 Balloon Breathing කරමු!'
            : isDistracted
            ? '⭐ Catch the Star කරමු!'
            : isEngaged
            ? '🫧 Bubble Pop කරමු!'
            : '🎮 ඔව්, සෙල්ලම් කරමු!';

          return (
            <View style={styles.modalBackdrop}>
              <View style={[styles.gameModalCard, ThemeShadow.lg]}>
                {/* Mascot / Icon Badge */}
                <View style={styles.gameModalIconCircle}>
                  <AppText size="display">{modalIcon}</AppText>
                </View>

                <AppText size="xl" weight="extrabold" color={ThemeColors.primary} align="center" style={{ marginTop: 10 }}>
                  {modalTitle}
                </AppText>

                <View style={styles.gamePillTag}>
                  <AppText size="xs" weight="bold" color="#92400E">
                    {pillText}
                  </AppText>
                </View>

                <AppText
                  size="sm"
                  color={ThemeColors.textPrimary}
                  align="center"
                  style={{ marginTop: 10, lineHeight: 22, paddingHorizontal: 4 }}
                >
                  {promptText}
                </AppText>

                <View style={styles.soundPracticeBox}>
                  <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                    ඉලක්ක අකුර: '{currentSentence.targetLetterToPractice}' ශබ්දය සහ විවේක ක්‍රීඩා
                  </AppText>
                </View>

                {/* Modal Buttons */}
                <View style={styles.gameModalButtons}>
                  <TouchableOpacity
                    style={styles.playGameBtn}
                    onPress={() => {
                      setShowGamePopup(false);
                      router.push({
                        pathname: directRoute as any,
                        params: {
                          state: detectedState,
                          intervention: session.interventionType || (isFrustrated ? 'game-breathing' : isDistracted ? 'game-star' : 'game-bubble'),
                          mode: isFrustrated ? 'calm' : isDistracted ? 'focus' : 'celebrate',
                        },
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <AppText size="md" weight="bold" color="#FFFFFF">
                      {buttonLabel}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.continueReadingBtn}
                    onPress={() => {
                      setShowGamePopup(false);
                      router.push({
                        pathname: '/(child)/cooldown',
                        params: {
                          state: detectedState,
                          intervention: session.interventionType || 'cooldown_activity',
                          mode: isFrustrated ? 'calm' : isDistracted ? 'focus' : 'celebrate',
                        },
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
                      🎲 සියලුම ක්‍රීඩා බලන්න (CoolDown Hub)
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* Rewards & Badges Modal */}
      <RewardsModal
        visible={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
      />

      {/* Voice Assessment Modal for live mic recording */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={targetSinhala}
        mode="sentence"
        onClose={() => setShowVoiceModal(false)}
        onSuccess={handleVoiceModalSuccess}
      />

      {/* Module 4: Under-Popup Camera Permission Bottom Sheet */}
      <DevicePermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onGranted={() => {
          // Camera telemetry active
        }}
        onDenied={() => {
          // Fallback active
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    marginLeft: ThemeSpacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ThemeColors.primaryLight,
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: 5,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  cameraBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cameraBadgeInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.primary,
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxxl,
  },
  sentenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  textSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  textPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  targetLabelBadge: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#BCE6CB',
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
  },
  difficultyBadgeEasy: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  difficultyBadgeMedium: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  difficultyBadgeHard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  needHelpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 'auto',
  },
  sentenceDisplay: {
    backgroundColor: ThemeColors.backgroundMuted,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.sm,
    minHeight: 88,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sentenceDisplayHighlighted: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F59E0B',
    borderWidth: 2,
    ...ThemeShadow.sm,
  },
  sentenceDisplayHighlightedContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: ThemeRadius.md,
  },
  highlightUnitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  highlightUnitChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    ...ThemeShadow.sm,
  },
  highlightUnitChipActive: {
    backgroundColor: '#FDE68A',
    borderColor: '#D97706',
    borderWidth: 2,
  },
  inlineWordFocusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  inlineAkuruFocusBox: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: ThemeRadius.sm,
  },
  inlineAkuruFocusBoxActive: {
    backgroundColor: '#FDE68A',
    borderBottomWidth: 3,
    borderBottomColor: '#D97706',
  },
  highlightPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sentenceText: {
    lineHeight: 38,
  },
  sentenceTextHighlighted: {
    color: '#78350F',
  },
  simplifyToggleBtn: {
    backgroundColor: ThemeColors.primaryLight,
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryBorder,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simplifyToggleBtnActive: {
    backgroundColor: '#FDF4E9',
    borderColor: '#EED9BE',
  },
  recordSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  readingPrompt: {
    lineHeight: 20,
    maxWidth: 320,
    marginTop: 4,
    marginBottom: ThemeSpacing.md,
  },
  micButtonContainer: {
    alignItems: 'center',
    marginVertical: ThemeSpacing.xs,
  },
  circleMicButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.md,
  },
  analyzingCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  accuracyHeader: {
    padding: ThemeSpacing.md,
    alignItems: 'center',
    gap: 4,
  },
  transcriptionBox: {
    padding: ThemeSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    backgroundColor: '#F8FAFC',
  },
  // Fluency Metrics Grid
  fluencySection: {
    padding: ThemeSpacing.md,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  fluencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  metricsRowGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  fluencyMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetRatePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  miniProgressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  // Errors Section
  errorsSection: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.sm,
  },
  errorCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ThemeSpacing.sm,
    padding: ThemeSpacing.sm + 2,
    borderRadius: ThemeRadius.md,
  },
  errorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: ThemeRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorLabelLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  severityTag: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  tipInnerBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  noErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ThemeSpacing.md,
    margin: ThemeSpacing.md,
    backgroundColor: ThemeColors.successSurface,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.successBorder,
  },
  // Audio Compare Section
  audioCompareCard: {
    margin: ThemeSpacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioCompareTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: ThemeSpacing.sm,
  },
  audioCompareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 200,
    gap: 6,
  },
  audioCompareTitleText: {
    flexShrink: 1,
  },
  speedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    padding: 2,
    alignSelf: 'flex-start',
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  speedPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  audioPlayersWrapper: {
    gap: 8,
  },
  audioTrackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioTrackTarget: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  slowBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  audioPlayBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  audioPlayBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  audioPlayBtnSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  audioPlayBtnSuccessActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: ThemeSpacing.sm + 2,
    paddingVertical: ThemeSpacing.md,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  retryActionBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsActionBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gameActionBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSentenceBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ladderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  ladderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ThemeSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    backgroundColor: ThemeColors.primaryLight,
  },
  ladderGrid: {
    padding: ThemeSpacing.sm,
    gap: ThemeSpacing.xs,
  },
  ladderCard: {
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
  },
  ladderCardActiveBorder: {
    borderWidth: 2,
    ...ThemeShadow.sm,
  },
  ladderCardCurrent: {
    backgroundColor: '#EAF7EE',
    borderColor: ThemeColors.primary,
    borderWidth: 2,
  },
  ladderCardCompleted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BCE6CB',
  },
  ladderCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  ladderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    backgroundColor: '#F1F5F9',
  },
  ladderStatusBadgeActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ladderStatusBadgeDone: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ladderStatusBadgeLocked: {
    backgroundColor: '#F1F5F9',
  },
  syllablesInsideSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  audioSupportInsideSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  audioSupportActionBtn: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1.5,
    borderColor: '#BCE6CB',
    borderRadius: ThemeRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  audioSupportActionBtnActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  simplificationInsideSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  simplificationBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sentenceGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 28,
    rowGap: 16,
    alignItems: 'flex-start',
  },
  wordGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  wordPartsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 5,
    alignItems: 'center',
  },
  wordSubLabel: {
    marginTop: 3,
    opacity: 0.8,
  },
  syllablesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  syllableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  ladderTryAgainBtn: {
    marginTop: 10,
    backgroundColor: ThemeColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.lg,
  },
  gameModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
  },
  gameModalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D8B4FE',
  },
  gamePillTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    marginTop: 6,
  },
  soundPracticeBox: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ThemeRadius.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BCE6CB',
  },
  gameModalButtons: {
    width: '100%',
    gap: 8,
    marginTop: 18,
  },
  playGameBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.sm,
  },
  continueReadingBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: ThemeRadius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMicButtonRecording: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 3,
    shadowColor: '#DC2626',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  interventionBannerCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.md,
  },
  interventionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interventionPlayBtn: {
    backgroundColor: '#059669',
    borderRadius: ThemeRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  recRetryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
  },
  recRetryBtn: {
    backgroundColor: '#D97706',
    borderRadius: ThemeRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  recSuccessBanner: {
    backgroundColor: '#F5F3FF',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
  },
  persistedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: ThemeSpacing.sm,
    alignSelf: 'flex-start',
  },
  persistedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
});
