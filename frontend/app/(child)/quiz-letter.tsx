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

  const [currentIndex, setCurrentIndex] = useState(1); // start on question 2
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
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.primary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
            අකුරු හඳුනාගැනීම
          </AppText>
          <AppText size="md" style={{ marginLeft: 6 }}>
            🔤
          </AppText>
        </View>

        <View style={styles.pointsBadge}>
          <AppText size="xs">⭐</AppText>
          <AppText size="xs" weight="extrabold" color="#92400E" style={{ marginLeft: 4 }}>
            10
          </AppText>
        </View>
      </View>

      {/* ── Progress Bar & Question Step ── */}
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <AppText size="xs" weight="extrabold" color="#64748B">
            ප්‍රශ්නය {currentIndex + 1} / {QUESTIONS.length}
          </AppText>
          <View style={styles.levelTag}>
            <AppText size="xs" weight="bold" color="#047857">
              🟢 පහසු මට්ටම
            </AppText>
          </View>
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
        <View style={styles.promptWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} align="center">
            මෙම අකුර හොඳින් බලා හඳුනාගන්න:
          </AppText>
        </View>

        {/* Big 3D Tactile Letter Card */}
        <View style={styles.letterCard}>
          <View style={styles.letterBadgeTag}>
            <AppText size="xs" weight="extrabold" color="#92400E">
              {currentQ.soundLabel}
            </AppText>
          </View>
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
            <AppText size="md">🔊</AppText>
            <AppText size="sm" weight="extrabold" color={isPlayingAudio ? '#047857' : ThemeColors.primary} style={{ marginLeft: 6 }}>
              {isPlayingAudio ? 'වාදනය වේ...' : 'ශබ්දයට සවන් දෙමු'}
            </AppText>
          </TouchableOpacity>

          {/* Speak into Mic Button */}
          <TouchableOpacity
            style={styles.micActionBtn}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <AppText size="md">🎙️</AppText>
            <AppText size="sm" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 6 }}>
              ශබ්දය කියමු
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Feedback Banner */}
        {feedbackState === 'correct' && (
          <View style={styles.feedbackBannerCorrect}>
            <AppText size="sm" weight="extrabold" color="#047857">
              🎉 නියමයි! නිවැරදි පිළිතුර! ⭐
            </AppText>
          </View>
        )}
        {feedbackState === 'incorrect' && (
          <View style={styles.feedbackBannerIncorrect}>
            <AppText size="sm" weight="extrabold" color="#BE123C">
              💪 තව පාරක් උත්සාහ කරමු! ඔබට පුළුවන්!
            </AppText>
          </View>
        )}

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
                ]}
                onPress={() => setSelectedOption(idx)}
                activeOpacity={0.8}
              >
                <AppText
                  size="xxl"
                  weight="extrabold"
                  color={
                    isConfirmedCorrect || isConfirmedIncorrect
                      ? '#FFFFFF'
                      : isSelected
                      ? '#065F46'
                      : ThemeColors.textPrimary
                  }
                  style={styles.optionText}
                >
                  {opt}
                </AppText>
                {isSelected && !isConfirmedCorrect && !isConfirmedIncorrect && (
                  <View style={styles.selectedCheckCircle}>
                    <AppText size="xs" weight="bold" color="#FFFFFF">✓</AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Friendly Helper Note */}
        <View style={styles.helperRow}>
          <AppText size="sm">💡</AppText>
          <AppText size="xs" color="#64748B" weight="semibold" style={{ marginLeft: 6 }}>
            සන්සුන්ව, හොඳින් බලලා නිවැරදි අකුර තෝරන්න.
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
          <AppText size="md" weight="extrabold" color="#FFFFFF">
            පිළිතුර තහවුරු කරන්න
          </AppText>
          <AppText size="md" color="#FFFFFF" style={{ marginLeft: 6 }}>
            ✅
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.xl }} />
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
    backgroundColor: '#F7FAF8',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2ECE6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  progressHeader: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.sm + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE6',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#10B981',
    borderRadius: ThemeRadius.full,
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    alignItems: 'center',
  },
  promptWrap: {
    marginBottom: ThemeSpacing.md,
  },
  letterCard: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFDF7',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderBottomWidth: 6,
    borderBottomColor: '#F59E0B',
    marginBottom: ThemeSpacing.md,
    position: 'relative',
    ...ThemeShadow.sm,
  },
  letterBadgeTag: {
    position: 'absolute',
    top: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bigLetter: {
    fontSize: 64,
    lineHeight: 74,
  },
  audioActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: ThemeSpacing.md,
  },
  listenSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#C7EBD2',
    borderBottomWidth: 3,
    borderBottomColor: '#A3D1BE',
  },
  listenSoundBtnPlaying: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderBottomColor: '#4ADE80',
  },
  micActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#047857',
    borderBottomWidth: 3,
    borderBottomColor: '#064E2A',
  },
  feedbackBannerCorrect: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: ThemeRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: ThemeSpacing.sm,
  },
  feedbackBannerIncorrect: {
    backgroundColor: '#FFE4E6',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderRadius: ThemeRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: ThemeSpacing.sm,
  },
  optionsWrap: {
    width: '100%',
    maxWidth: 340,
    gap: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.md,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    position: 'relative',
    ...ThemeShadow.sm,
  },
  optionCardSelected: {
    borderColor: '#059669',
    borderBottomColor: '#047857',
    backgroundColor: '#ECFDF5',
  },
  optionCardCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    borderBottomColor: '#047857',
  },
  optionCardIncorrect: {
    backgroundColor: '#F43F5E',
    borderColor: '#E11D48',
    borderBottomColor: '#BE123C',
  },
  optionText: {
    letterSpacing: 1,
  },
  selectedCheckCircle: {
    position: 'absolute',
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#059669',
    borderRadius: ThemeRadius.full,
    width: '100%',
    maxWidth: 340,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#047857',
    borderBottomWidth: 4,
    borderBottomColor: '#064E2A',
  },
  confirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
    borderColor: '#94A3B8',
    borderBottomColor: '#64748B',
    opacity: 0.7,
  },
});
