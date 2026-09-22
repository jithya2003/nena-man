import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

const QUESTIONS = [
  {
    id: 1,
    letter: 'අ',
    soundLabel: '"අ" ශබ්දය',
    options: ['අ', 'ආ', 'ඇ'],
    correctIndex: 0,
  },
  {
    id: 2,
    letter: 'ක',
    soundLabel: '"ක" ශබ්දය',
    options: ['ක', 'ග', 'න'],
    correctIndex: 0,
  },
  {
    id: 3,
    letter: 'ම',
    soundLabel: '"ම" ශබ්දය',
    options: ['ප', 'ම', 'ය'],
    correctIndex: 1,
  },
  {
    id: 4,
    letter: 'ර',
    soundLabel: '"ර" ශබ්දය',
    options: ['ර', 'ට', 'ද'],
    correctIndex: 0,
  },
  {
    id: 5,
    letter: 'ස',
    soundLabel: '"ස" ශබ්දය',
    options: ['හ', 'ස', 'ශ'],
    correctIndex: 1,
  },
];

export default function LetterRecognitionQuiz() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(1); // start on question 2 like mockup
  const [selectedOption, setSelectedOption] = useState<number | null>(0); // option 'ක' selected
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const currentQ = QUESTIONS[currentIndex];

  const handlePlaySound = () => {
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleVoiceSuccess = () => {
    setSelectedOption(currentQ.correctIndex);
    setFeedbackState('correct');
    setTimeout(() => {
      setFeedbackState('idle');
      if (currentIndex < QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        router.push('/(child)/reading');
      }
    }, 1000);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;

    if (selectedOption === currentQ.correctIndex) {
      setFeedbackState('correct');
      setTimeout(() => {
        setFeedbackState('idle');
        if (currentIndex < QUESTIONS.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedOption(null);
        } else {
          router.push('/(child)/reading');
        }
      }, 1200);
    } else {
      setFeedbackState('incorrect');
      setTimeout(() => setFeedbackState('idle'), 1200);
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
          අකුරු හඳුනාගැනීම
        </AppText>

        <View style={{ width: 36 }} />
      </View>

      {/* Progress Bar & Question Step */}
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            ප්‍රශ්නය {currentIndex + 1} / {QUESTIONS.length}
          </AppText>
          <AppText size="sm">⭐</AppText>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Question Prompt */}
        <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} align="center" style={styles.promptText}>
          මෙම අකුර හඳුනාගන්න.
        </AppText>

        {/* Big Letter Card */}
        <View style={[styles.letterCard, ThemeShadow.md]}>
          <AppText size="display" weight="extrabold" color={ThemeColors.primary} style={styles.bigLetter}>
            {currentQ.letter}
          </AppText>
        </View>

        {/* Audio Listen & Mic Buttons Row */}
        <View style={styles.audioActionsRow}>
          {/* Listen to Sound Button */}
          <TouchableOpacity
            style={[styles.listenSoundBtn, isPlayingAudio && styles.listenSoundBtnPlaying]}
            onPress={handlePlaySound}
            activeOpacity={0.8}
          >
            <AppText size="sm">🔊</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              {isPlayingAudio ? 'වාදනය වේ...' : 'ශබ්දය අසන්න'}
            </AppText>
          </TouchableOpacity>

          {/* Speak into Mic Button */}
          <TouchableOpacity
            style={styles.micActionBtn}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <AppText size="sm">🎙️</AppText>
            <AppText size="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
              ශබ්දය කියන්න
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <View style={styles.optionsWrap}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isConfirmedCorrect = feedbackState === 'correct' && isSelected;
            const isConfirmedIncorrect = feedbackState === 'incorrect' && isSelected;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isConfirmedCorrect && styles.optionCardCorrect,
                  isConfirmedIncorrect && styles.optionCardIncorrect,
                  ThemeShadow.sm,
                ]}
                onPress={() => setSelectedOption(idx)}
                activeOpacity={0.8}
              >
                <AppText
                  size="xl"
                  weight="bold"
                  color={
                    isConfirmedCorrect
                      ? '#FFFFFF'
                      : isSelected
                      ? ThemeColors.primary
                      : ThemeColors.textPrimary
                  }
                >
                  {opt}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Friendly Helper Note */}
        <View style={styles.helperRow}>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            හොඳින් බලලා තෝරන්න
          </AppText>
          <AppText size="xs" style={{ marginLeft: 4 }}>
            😉
          </AppText>
        </View>

        {/* Confirm Answer Button */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            selectedOption === null && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirmAnswer}
          disabled={selectedOption === null}
          activeOpacity={0.85}
        >
          <AppText size="md" weight="bold" color="#FFFFFF">
            පිළිතුර තහවුරු කරන්න
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* Voice Assessment & Phoneme Analysis Modal */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={currentQ.letter}
        mode="letter"
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
  progressHeader: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.sm,
    backgroundColor: '#FFFFFF',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#F97316',
    borderRadius: ThemeRadius.full,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    alignItems: 'center',
  },
  promptText: {
    marginBottom: ThemeSpacing.md,
  },
  letterCard: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.md,
  },
  bigLetter: {
    fontSize: 54,
  },
  audioActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: ThemeSpacing.lg,
  },
  listenSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1F8',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#D4E2EE',
  },
  listenSoundBtnPlaying: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  micActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    borderRadius: ThemeRadius.full,
  },
  optionsWrap: {
    width: '100%',
    maxWidth: 320,
    gap: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  optionCardSelected: {
    borderColor: ThemeColors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  optionCardCorrect: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  optionCardIncorrect: {
    backgroundColor: '#F87171',
    borderColor: '#EF4444',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: ThemeRadius.md,
    width: '100%',
    maxWidth: 320,
    height: 48,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
});
