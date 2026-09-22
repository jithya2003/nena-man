import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import VoiceAssessmentModal from '@/components/VoiceAssessmentModal';

// Curated 3 Core Sentences for Interactive Demo with Reading Rate & Audio Comparison Metadata
const PRACTICE_SENTENCES = [
  {
    id: 'text_001',
    sinhala: 'මම මගේ රටට ගොඩාක් ආදරෙයි',
    simplifiedSinhala: 'මම මගේ රටට ආදරෙයි',
    english: 'I love my country very much',
    simplifiedEnglish: 'I love my country',
    syllables: ['ම', 'ම', 'ම', 'ගේ', 'ර', 'ට', 'ට', 'ආ', 'ද', 'රෙ', 'යි'],
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
    syllables: ['ල', 'ස්ස', 'න', 'ව', 'නා', 'න්', 'ත', 'ර', 'යේ'],
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

// Support options ladder
const SUPPORT_OPTIONS = [
  {
    key: 'simplification',
    icon: '✨',
    label: 'AI වාක්‍ය සරල කිරීම',
    sublabel: 'Smart Sentence Simplification',
    color: ThemeColors.accent,
    bg: '#FDF4E9',
    border: '#EED9BE',
    level: 'simplification',
  },
  {
    key: 'syllable',
    icon: '🔤',
    label: 'අකුරු වෙන් කිරීම',
    sublabel: 'Syllable Breakdown',
    color: ThemeColors.m1,
    bg: '#EAF7EE',
    border: '#BCE6CB',
    level: 'syllable_split',
  },
  {
    key: 'highlight',
    icon: '🌟',
    label: 'වචන ඉස්මතු කිරීම',
    sublabel: 'Word Focus Highlight',
    color: ThemeColors.accentDark,
    bg: '#FDF3E7',
    border: '#EED9BE',
    level: 'highlight',
  },
  {
    key: 'audio',
    icon: '🔊',
    label: 'ශබ්ද ශ්‍රවණය',
    sublabel: 'Audio Pronunciation',
    color: ThemeColors.success,
    bg: '#EAF7EE',
    border: '#BCE6CB',
    level: 'audio',
  },
  {
    key: 'picture',
    icon: '🖼️',
    label: 'චිත්‍ර සහාය',
    sublabel: 'Visual Picture Cue',
    color: ThemeColors.info,
    bg: '#EFF6FF',
    border: '#BFDBFE',
    level: 'picture',
  },
];

type SessionState = 'pre' | 'recording' | 'analyzing' | 'result';

export default function SpeechSessionScreen() {
  const router = useRouter();

  const [currentTextIndex, setCurrentTextIndex] = useState(2); // Default to 3rd sentence as requested by user
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('pre');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showGamePopup, setShowGamePopup] = useState(false);

  // Audio Comparison Player State
  const [playingAudio, setPlayingAudio] = useState<'child' | 'target' | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '0.75x'>('1.0x');
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    accuracy: number;
    transcription: string;
    errors: typeof PRACTICE_SENTENCES[0]['simulatedErrors'];
    isAccurate: boolean;
    wpm: number;
    fluencyScore: number;
    avgPauseDuration: string;
    syllablesPerSec: string;
    targetWord: string;
    spokenWord: string;
    phoneticBreakdown: string;
  } | null>(null);

  const resultAnim = useRef(new Animated.Value(0)).current;
  const currentSentence = PRACTICE_SENTENCES[currentTextIndex];

  const displaySinhala = isSimplified && currentSentence.simplifiedSinhala
    ? currentSentence.simplifiedSinhala
    : currentSentence.sinhala;

  // AI Simplify Handler
  const handleSimplify = useCallback(() => {
    if (isSimplified) {
      setIsSimplified(false);
      return;
    }
    setSimplifying(true);
    setTimeout(() => {
      setSimplifying(false);
      setIsSimplified(true);
    }, 700);
  }, [isSimplified]);

  // Audio Playback simulation handler
  const handlePlayAudio = (type: 'child' | 'target') => {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    setPlayingAudio(type);
    const duration = playbackSpeed === '0.75x' ? 2200 : 1500;
    audioTimerRef.current = setTimeout(() => {
      setPlayingAudio(null);
    }, duration);
  };

  // Execute speech simulation
  const executeSimulation = (accurate: boolean) => {
    setSessionState('analyzing');
    setTimeout(() => {
      if (accurate) {
        setAnalysisResult({
          accuracy: 96,
          transcription: currentSentence.sinhala,
          errors: [],
          isAccurate: true,
          wpm: Math.round(currentSentence.wpm * 1.25),
          fluencyScore: 92,
          avgPauseDuration: '0.6s',
          syllablesPerSec: '3.0 syl/s',
          targetWord: currentSentence.targetWord,
          spokenWord: currentSentence.targetWord,
          phoneticBreakdown: currentSentence.phoneticBreakdown,
        });
      } else {
        setAnalysisResult({
          accuracy: 78,
          transcription: currentSentence.simulatedSpoken,
          errors: currentSentence.simulatedErrors,
          isAccurate: false,
          wpm: currentSentence.wpm,
          fluencyScore: currentSentence.fluencyScore,
          avgPauseDuration: currentSentence.avgPauseDuration,
          syllablesPerSec: currentSentence.syllablesPerSec,
          targetWord: currentSentence.targetWord,
          spokenWord: currentSentence.spokenWord,
          phoneticBreakdown: currentSentence.phoneticBreakdown,
        });
        // Auto trigger the "අපි සෙල්ලමක් කරමුද?" pop-up after a brief moment
        setTimeout(() => {
          setShowGamePopup(true);
        }, 1100);
      }
      setSessionState('result');
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 900);
  };

  const handleVoiceModalSuccess = () => {
    setShowVoiceModal(false);
    executeSimulation(false);
  };

  const handleReset = () => {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    setSessionState('pre');
    setAnalysisResult(null);
    setIsSimplified(false);
    setShowGamePopup(false);
    setPlayingAudio(null);
    resultAnim.setValue(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top App Bar ────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(child)/home'))}
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

        {/* AI Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <AppText size="xs" weight="bold" color={ThemeColors.primary}>
            AI සක්‍රීයයි
          </AppText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Sentence Card with AI Simplify Toggle ──────────────────────── */}
        <View style={[styles.sentenceCard, ThemeShadow.sm]}>
          {/* Sentence selector pills */}
          <View style={styles.textSelectorRow}>
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

          {/* Main Sentence Display Box */}
          <View style={styles.sentenceDisplay}>
            {isSimplified && (
              <View style={styles.simplifiedBadge}>
                <AppText size="xs" weight="bold" color={ThemeColors.accent}>
                  ✨ AI සරල කළ වාක්‍යය
                </AppText>
              </View>
            )}
            <AppText
              size="xxl"
              weight="extrabold"
              color={ThemeColors.textPrimary}
              style={[
                styles.sentenceText,
                isSimplified && { color: ThemeColors.primary },
              ]}
            >
              {displaySinhala}
            </AppText>
            <AppText size="sm" color={ThemeColors.textSecondary} style={{ marginTop: 6 }}>
              {isSimplified ? currentSentence.simplifiedEnglish : currentSentence.english}
            </AppText>
          </View>

          {/* AI Simplification toggle button */}
          <TouchableOpacity
            style={[styles.simplifyToggleBtn, isSimplified && styles.simplifyToggleBtnActive]}
            onPress={handleSimplify}
            activeOpacity={0.8}
          >
            <AppText
              size="xs"
              weight="bold"
              color={isSimplified ? ThemeColors.accent : ThemeColors.primary}
            >
              {simplifying
                ? '⏳ AI සකසමින්...'
                : isSimplified
                ? '↩ මුල් වාක්‍යය පෙන්වන්න'
                : '✨ AI මගින් වාක්‍යය සරල කරන්න'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── Speech Recording Section ────────────────────────────────────────── */}
        {sessionState === 'pre' && (
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

            {/* Clean Center Mic Button with Ripple Effect */}
            <View style={styles.micButtonContainer}>
              <TouchableOpacity
                style={styles.circleMicButton}
                onPress={() => executeSimulation(false)}
                activeOpacity={0.85}
              >
                <AppText size="display" style={{ fontSize: 38 }}>
                  🎙️
                </AppText>
              </TouchableOpacity>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 12 }}>
                පටිගත කිරීම ආරම්භ කිරීමට ස්පර්ශ කරන්න
              </AppText>
              <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 4 }}>
                (ශබ්ද නගා කියවා AI විශ්ලේෂණය ලබාගන්න)
              </AppText>
            </View>
          </View>
        )}

        {/* ── Analyzing State ───────────────────────────────────────────── */}
        {sessionState === 'analyzing' && (
          <View style={[styles.analyzingCard, ThemeShadow.sm]}>
            <AppText size="display">🧠</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginTop: 10 }}>
              AI කථන සහ උච්චාරණ විශ්ලේෂණය...
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4 }}>
              අකුරු නිරවද්‍යතාව, කියවීමේ වේගය (WPM) සහ චතුරතාව පරීක්ෂා කරමින් පවතී
            </AppText>
          </View>
        )}

        {/* ── Result Dashboard ──────────────────────────────────────────── */}
        {sessionState === 'result' && analysisResult && (
          <Animated.View
            style={[
              styles.resultCard,
              ThemeShadow.md,
              { opacity: resultAnim, transform: [{ scale: resultAnim }] },
            ]}
          >
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
                {analysisResult.errors.map((err, idx) => {
                  const meta = ERROR_META[err.type];
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText size="sm">🔊</AppText>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
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

                {/* Audio 2: Target Correct Teacher Voice */}
                <View style={[styles.audioTrackBox, styles.audioTrackTarget]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                      {playingAudio === 'target' ? '🔊 වාදනය වේ...' : '▶ ගුරු හඬ'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.resultActionsRow}>
              <TouchableOpacity style={styles.retryActionBtn} onPress={handleReset} activeOpacity={0.85}>
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🔄 නැවත කියවන්න
                </AppText>
              </TouchableOpacity>

              {analysisResult.errors.length > 0 && (
                <TouchableOpacity
                  style={styles.gameActionBtn}
                  onPress={() => router.push('/(child)/cooldown')}
                  activeOpacity={0.85}
                >
                  <AppText size="xs" weight="bold" color="#FFFFFF">
                    🎮 සන්සුන් ක්‍රීඩා
                  </AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.nextSentenceBtn}
                onPress={() => {
                  setCurrentTextIndex((prev) => (prev + 1) % PRACTICE_SENTENCES.length);
                  handleReset();
                }}
                activeOpacity={0.85}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  ඊළඟ වාක්‍යය →
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Progressive Support Options Panel (Ladder) ─────── */}
        {sessionState === 'result' && analysisResult && (
          <View style={styles.ladderContainer}>
            <View style={styles.ladderHeader}>
              <AppText size="xs">📊</AppText>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                ක්‍රමවේදී සහාය ශ්‍රේණිය — Learning Support Ladder
              </AppText>
            </View>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ paddingHorizontal: 12, paddingTop: 8 }}>
              ඔබට අවශ්‍ය සහාය මට්ටම තෝරාගෙන පියවරෙන් පියවර චතුරතාව වැඩිදියුණු කරගන්න:
            </AppText>

            <View style={styles.ladderGrid}>
              {SUPPORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.ladderCard, { backgroundColor: opt.bg, borderColor: opt.border }]}
                  onPress={() =>
                    router.push({
                      pathname: '/(child)/support',
                      params: { textId: currentSentence.id, level: opt.level },
                    })
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.ladderCardIcon}>
                    <AppText size="md">{opt.icon}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size="xs" weight="extrabold" color={opt.color}>
                      {opt.label}
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textMuted}>
                      {opt.sublabel}
                    </AppText>
                  </View>
                  <AppText size="md" color={opt.color}>
                    ›
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Syllable Breakdown Chip Preview */}
            <View style={styles.syllablePreviewSection}>
              <AppText size="xs" weight="bold" color={ThemeColors.textMuted} style={{ marginBottom: 6 }}>
                🔤 අකුරු සහ පිල්ලම් වෙන් කිරීම (Syllable Breakdown):
              </AppText>
              <View style={styles.syllablesRow}>
                {currentSentence.syllables.map((syl, i) => (
                  <View key={i} style={styles.syllableChip}>
                    <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                      {syl}
                    </AppText>
                    {i < currentSentence.syllables.length - 1 && (
                      <AppText size="sm" color={ThemeColors.accent} style={{ marginLeft: 2 }}>
                        -
                      </AppText>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* ── Gamified Pop-up: "අපි සෙල්ලමක් කරමුද?" (Routes to CoolDown) ────────────────── */}
      <Modal
        visible={showGamePopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGamePopup(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.gameModalCard, ThemeShadow.lg]}>
            {/* Mascot / Icon Badge */}
            <View style={styles.gameModalIconCircle}>
              <AppText size="display">🎮</AppText>
            </View>

            <AppText size="xl" weight="extrabold" color={ThemeColors.primary} align="center" style={{ marginTop: 10 }}>
              අපි සෙල්ලමක් කරමුද?
            </AppText>

            <View style={styles.gamePillTag}>
              <AppText size="xs" weight="bold" color="#92400E">
                🎲 විනෝදජනක සන්සුන් ක්‍රීඩා (CoolDown)
              </AppText>
            </View>

            <AppText
              size="sm"
              color={ThemeColors.textPrimary}
              align="center"
              style={{ marginTop: 10, lineHeight: 22, paddingHorizontal: 4 }}
            >
              කියවීමෙන් පසු මනස සැහැල්ලු කර ගැනීමට සහ{' '}
              <AppText size="sm" weight="extrabold" color="#DC2626">
                '{currentSentence.targetLetterToPractice}'
              </AppText>{' '}
              ශබ්දය විනෝදයෙන් පුහුණු වීමට ක්‍රීඩාවක් කරමුද?
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
                  router.push('/(child)/cooldown');
                }}
                activeOpacity={0.85}
              >
                <AppText size="md" weight="bold" color="#FFFFFF">
                  🎮 ඔව්, සෙල්ලම් කරමු!
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueReadingBtn}
                onPress={() => setShowGamePopup(false)}
                activeOpacity={0.8}
              >
                <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
                  📖 තව ටිකක් කියවමු
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Assessment Modal for live mic recording */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={displaySinhala}
        mode="sentence"
        onClose={() => setShowVoiceModal(false)}
        onSuccess={handleVoiceModalSuccess}
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
  sentenceDisplay: {
    backgroundColor: ThemeColors.backgroundMuted,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.sm,
    minHeight: 88,
    justifyContent: 'center',
  },
  simplifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF4E9',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EED9BE',
  },
  sentenceText: {
    lineHeight: 38,
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
    marginBottom: ThemeSpacing.sm,
  },
  speedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    padding: 2,
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
    gap: ThemeSpacing.xs + 2,
    padding: ThemeSpacing.md,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
  },
  retryActionBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameActionBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSentenceBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: ThemeSpacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
  },
  ladderCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  syllablePreviewSection: {
    padding: ThemeSpacing.md,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    backgroundColor: ThemeColors.backgroundMuted,
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
});
