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
            වචන ගැලපමු
          </AppText>
          <AppText size="md" style={{ marginLeft: 6 }}>
            🧩
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
            ප්‍රශ්නය {currentIndex + 1} / {WORD_QUESTIONS.length}
          </AppText>
          <View style={styles.levelTag}>
            <AppText size="xs" weight="bold" color="#D97706">
              🟡 මධ්‍යම මට්ටම
            </AppText>
          </View>
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
        <View style={styles.promptWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} align="center">
            පින්තූරයට ගැලපෙන වචනය තෝරන්න:
          </AppText>
        </View>

        {/* Big 3D Tactile Picture Card */}
        <View style={styles.pictureCard}>
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
            <AppText size="md">🔊</AppText>
            <AppText size="sm" weight="extrabold" color={isPlayingAudio ? '#047857' : ThemeColors.primary} style={{ marginLeft: 6 }}>
              {isPlayingAudio ? 'වාදනය වේ...' : 'වචනය අසන්න'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.micActionBtn}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <AppText size="md">🎙️</AppText>
            <AppText size="sm" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 6 }}>
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
                ]}
                onPress={() => setSelectedOption(idx)}
                activeOpacity={0.8}
              >
                <AppText
                  size="xl"
                  weight="extrabold"
                  color={isSelected ? '#065F46' : ThemeColors.textPrimary}
                  style={styles.optionText}
                >
                  {opt}
                </AppText>

                {isSelected && (
                  <View style={styles.checkWrap}>
                    <AppText size="xs" weight="extrabold" color="#FFFFFF">
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
          <AppText size="md" weight="extrabold" color="#FFFFFF">
            පිළිතුර තහවුරු කරන්න
          </AppText>
          <AppText size="md" color="#FFFFFF" style={{ marginLeft: 6 }}>
            →
          </AppText>
        </TouchableOpacity>

        {/* Encouraging Footer */}
        <View style={styles.encouragementRow}>
          <AppText size="sm">🌱</AppText>
          <AppText size="xs" color="#64748B" weight="semibold" style={{ marginLeft: 6 }}>
            නියමයි! ඔබට මෙය පහසුවෙන්ම කරන්න පුළුවන්!
          </AppText>
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    backgroundColor: '#F59E0B',
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
  pictureCard: {
    width: 220,
    height: 180,
    backgroundColor: '#FFFDF7',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderBottomWidth: 6,
    borderBottomColor: '#F59E0B',
    marginBottom: ThemeSpacing.md,
    ...ThemeShadow.sm,
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
  optionText: {
    letterSpacing: 1,
  },
  checkWrap: {
    position: 'absolute',
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
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
  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ThemeSpacing.md,
  },
});
