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
import { FishIllustration, FlowerIllustration } from '@/components/QuizIllustrations';
import VoiceAssessmentModal from '@/components/VoiceAssessmentModal';

const WORD_QUESTIONS = [
  {
    id: 1,
    type: 'flower',
    correctWord: 'මල',
    options: ['ගස', 'මල', 'කොළය'],
    correctIndex: 1,
  },
  {
    id: 2,
    type: 'tree',
    correctWord: 'ගස',
    options: ['ගස', 'මල', 'මාළු'],
    correctIndex: 0,
  },
  {
    id: 3,
    type: 'fish',
    correctWord: 'මාළු',
    options: ['මාළු', 'මල', 'ගස'],
    correctIndex: 0,
  },
  {
    id: 4,
    type: 'book',
    correctWord: 'පොත',
    options: ['පෑන', 'පොත', 'මේසය'],
    correctIndex: 1,
  },
  {
    id: 5,
    type: 'sun',
    correctWord: 'ඉර',
    options: ['ඉර', 'හඳ', 'තරුව'],
    correctIndex: 0,
  },
];

export default function WordMatchingQuiz() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(2); // start on question 3 like mockup
  const [selectedOption, setSelectedOption] = useState<number | null>(0); // option 0 ('මාළු') selected
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const currentQ = WORD_QUESTIONS[currentIndex];

  const handlePlaySound = () => {
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  const handleVoiceSuccess = () => {
    setSelectedOption(currentQ.correctIndex);
    setTimeout(() => {
      if (currentIndex < WORD_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        router.push('/(child)/reading');
      }
    }, 1000);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;

    if (currentIndex < WORD_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      router.push('/(child)/reading');
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
          වචන ගැලපමු
        </AppText>

        <View style={{ width: 36 }} />
      </View>

      {/* Progress Bar & Question Step */}
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelRow}>
          <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
            ප්‍රශ්නය {currentIndex + 1} / {WORD_QUESTIONS.length}
          </AppText>
          <AppText size="sm">⭐</AppText>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / WORD_QUESTIONS.length) * 100}%` },
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
          පින්තූරයට ගැලපෙන වචනය තෝරන්න.
        </AppText>

        {/* Big Picture Card */}
        <View style={[styles.pictureCard, ThemeShadow.md]}>
          {currentQ.type === 'fish' ? (
            <FishIllustration size={160} />
          ) : (
            <FlowerIllustration size={160} />
          )}
        </View>

        {/* Listen to Word & Speak Buttons Row */}
        <View style={styles.audioActionsRow}>
          <TouchableOpacity
            style={[styles.listenSoundBtn, isPlayingAudio && styles.listenSoundBtnPlaying]}
            onPress={handlePlaySound}
            activeOpacity={0.8}
          >
            <AppText size="sm">🔊</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              {isPlayingAudio ? 'වාදනය වේ...' : 'වචනය අසන්න'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.micActionBtn}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <AppText size="sm">🎙️</AppText>
            <AppText size="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
              වචනය කියන්න
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <View style={styles.optionsWrap}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  ThemeShadow.sm,
                ]}
                onPress={() => setSelectedOption(idx)}
                activeOpacity={0.8}
              >
                <AppText
                  size="md"
                  weight="bold"
                  color={isSelected ? '#FFFFFF' : ThemeColors.textPrimary}
                >
                  {opt}
                </AppText>

                {isSelected && (
                  <View style={styles.checkWrap}>
                    <AppText size="xs" weight="bold" color="#FFFFFF">
                      ✓
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
          <AppText size="md" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
            →
          </AppText>
        </TouchableOpacity>

        {/* Encouraging Footer */}
        <View style={styles.encouragementRow}>
          <AppText size="xs" color={ThemeColors.textSecondary}>
            ඔබට පුළුවන්!
          </AppText>
          <AppText size="xs" style={{ marginLeft: 4 }}>
            🌱
          </AppText>
        </View>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* Voice Assessment & Phoneme Analysis Modal */}
      <VoiceAssessmentModal
        visible={showVoiceModal}
        targetText={currentQ.correctWord}
        mode="word"
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
  pictureCard: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: ThemeSpacing.md,
    padding: ThemeSpacing.sm,
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  optionCardSelected: {
    borderColor: ThemeColors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: ThemeSpacing.xs,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ThemeSpacing.sm,
  },
});
