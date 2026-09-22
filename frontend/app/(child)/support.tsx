import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import {
  MOCK_READING_TEXTS,
  MOCK_M2_RESPONSE,
  MOCK_M3_RESPONSE,
} from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import type { SupportType } from '@/types';

interface SupportLevel {
  key: SupportType;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

const SUPPORT_LEVELS: SupportLevel[] = [
  {
    key: 'simplification',
    label: 'Level 1 · AI වාක්‍ය සරල කිරීම',
    icon: '✨',
    description: 'ස්වයංක්‍රීය AI භාෂා ආකෘතිය මගින් සංකීර්ණ වාක්‍ය රටා වඩාත් පැහැදිලි, සරල සිංහල වාක්‍ය බවට පත්කරයි.',
    color: ThemeColors.m2,
    bg: ThemeColors.m2Surface,
  },
  {
    key: 'highlight',
    label: 'Level 2 · Word Focus',
    icon: '🌟',
    description: 'Key words are gently highlighted to guide eye tracking without harsh contrast.',
    color: ThemeColors.accentDark,
    bg: ThemeColors.accentLight,
  },
  {
    key: 'syllable_split',
    label: 'Level 3 · Syllable Split',
    icon: '🔤',
    description: 'Words are split into smaller sound units (අකුරු/පිල්ලම්) to assist decoding.',
    color: ThemeColors.m1,
    bg: ThemeColors.m1Surface,
  },
  {
    key: 'audio',
    label: 'Level 4 · Audio Assistance',
    icon: '🔊',
    description: 'Listen to clear audio pronunciation to connect phonemes to graphemes.',
    color: ThemeColors.success,
    bg: ThemeColors.successSurface,
  },
  {
    key: 'picture',
    label: 'Level 5 · Visual Cue',
    icon: '🖼️',
    description: 'A visual cue is provided to activate vocabulary context and reduce hesitation.',
    color: ThemeColors.info,
    bg: ThemeColors.infoSurface,
  },
];

function HighlightedText({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <View style={styles.hlRow}>
      {words.map((w, i) => (
        <View key={i} style={styles.hlWrap}>
          <AppText size="xxl" weight="extrabold" color={ThemeColors.textPrimary}>
            {w}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function SyllableSplitText({ syllables }: { syllables: string[] }) {
  return (
    <View style={styles.syllableRow}>
      {syllables.map((s, i) => (
        <View key={i} style={styles.syllableWrap}>
          <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={styles.syllableText}>
            {s}
          </AppText>
          {i < syllables.length - 1 && (
            <AppText size="xl" weight="bold" color={ThemeColors.accentDark} style={styles.syllableDash}>
              -
            </AppText>
          )}
        </View>
      ))}
    </View>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const { textId } = useLocalSearchParams<{ textId: string }>();
  const text =
    MOCK_READING_TEXTS.find((t) => t.id === textId) ?? MOCK_READING_TEXTS[0];
  const m2 = MOCK_M2_RESPONSE;
  const m3 = MOCK_M3_RESPONSE;

  const [activeLevel, setActiveLevel] = useState<number>(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const activeLevelData = SUPPORT_LEVELS[activeLevel];

  const handleTabChange = (idx: number) => {
    setActiveLevel(idx);
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: false }).start();
  };

  const handleAudioPlay = () => {
    setAudioPlaying(true);
    setTimeout(() => setAudioPlaying(false), 2000);
  };

  const simplifiedText = text.simplifiedSinhala || 'මම මගේ රටට ආදරෙයි';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar with safe back */}
      <NavBar
        title="Progressive Support"
        subtitle="AI-guided reading assistance ladder"
        showBack={true}
        fallbackRoute="/(child)/reading"
        showHome={true}
        homeRoute="/(child)/home"
        showSettings={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Text display with active support applied */}
        <Card variant="elevated" style={styles.textCard}>
          <View
            style={[
              styles.supportLevelBadge,
              { backgroundColor: activeLevelData.bg, borderColor: ThemeColors.borderLight },
            ]}
          >
            <AppText size="xs" weight="bold" color={activeLevelData.color}>
              {activeLevelData.icon} {activeLevelData.label}
            </AppText>
          </View>

          {/* Level 0 / 1: AI Sentence Simplification Rendering */}
          {activeLevel === 0 && (
            <View style={styles.simplificationContainer}>
              <View style={styles.sentenceBox}>
                <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                  Original Sentence:
                </AppText>
                <AppText size="xl" weight="bold" color={ThemeColors.textSecondary} style={{ textDecorationLine: 'line-through' }}>
                  {text.sinhala}
                </AppText>
              </View>

              <View style={styles.aiArrowWrap}>
                <AppText size="xs" weight="bold" color={ThemeColors.m2}>
                  ⬇ AI ස්මාර්ට් සරල කිරීම ('ගොඩාක්' ඉවත් කර වඩාත් පහසු කළා)
                </AppText>
              </View>

              <View style={styles.simplifiedSentenceBox}>
                <AppText size="xs" weight="bold" color={ThemeColors.m2}>
                  ✨ AI සරල කළ ප්‍රතිදානය:
                </AppText>
                <AppText size="xxxl" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 4 }}>
                  {simplifiedText}
                </AppText>
                <AppText size="sm" color={ThemeColors.textSecondary}>
                  {text.simplifiedEnglish || 'I love my country'}
                </AppText>
              </View>
            </View>
          )}

          {/* Level 2: Highlight */}
          {activeLevel === 1 && <HighlightedText text={simplifiedText} />}

          {/* Level 3: Syllable Split */}
          {activeLevel === 2 && <SyllableSplitText syllables={text.syllables} />}

          {/* Level 4: Audio Cue */}
          {activeLevel === 3 && (
            <View style={styles.audioSection}>
              <AppText size="xxxl" weight="extrabold" color={ThemeColors.textPrimary}>
                {simplifiedText}
              </AppText>
              <TouchableOpacity
                style={styles.audioBtn}
                onPress={handleAudioPlay}
                activeOpacity={0.85}
              >
                <View style={[styles.audioBtnInner, ThemeShadow.md]}>
                  <AppText size="lg" color={ThemeColors.background}>
                    {audioPlaying ? '⏸' : '▶'}
                  </AppText>
                  <AppText size="md" weight="bold" color={ThemeColors.background}>
                    {audioPlaying ? 'Playing pronunciation…' : 'Play audio cue'}
                  </AppText>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Level 5: Picture Cue */}
          {activeLevel === 4 && (
            <View style={styles.pictureSection}>
              <AppText size="display">{text.pictureEmoji || '🖼️'}</AppText>
              <AppText size="md" weight="semibold" color={ThemeColors.textSecondary}>
                {text.english}
              </AppText>
              <AppText size="xxl" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 4 }}>
                {simplifiedText}
              </AppText>
            </View>
          )}

          <AppText
            size="sm"
            color={ThemeColors.textSecondary}
            align="center"
            style={styles.supportDescription}
          >
            {activeLevelData.description}
          </AppText>
        </Card>

        {/* Level selector tabs */}
        <AppText size="md" weight="bold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          Support Ladder Levels
        </AppText>
        <View style={styles.levelTabs}>
          {SUPPORT_LEVELS.map((level, idx) => {
            const isActive = idx === activeLevel;
            return (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.levelTab,
                  {
                    backgroundColor: isActive ? level.bg : ThemeColors.surface,
                    borderColor: isActive ? ThemeColors.accentDark : ThemeColors.borderLight,
                  },
                ]}
                onPress={() => handleTabChange(idx)}
                activeOpacity={0.8}
              >
                <AppText size="lg">{level.icon}</AppText>
                <AppText
                  size="xs"
                  weight={isActive ? 'bold' : 'medium'}
                  color={isActive ? ThemeColors.textPrimary : ThemeColors.textSecondary}
                >
                  {`L${idx + 1}`}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NLP Analysis Card */}
        <Card style={styles.m2Card}>
          <View style={styles.moduleTag}>
            <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m2 }]} />
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              AI Text Difficulty & Simplification Analysis
            </AppText>
          </View>
          <AppText size="sm" color={ThemeColors.textPrimary}>
            Predicted Difficulty:{' '}
            <AppText size="sm" weight="bold" color={ThemeColors.m2}>
              {m2.difficultyLevel}
            </AppText>
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2, lineHeight: 18 }}>
            AI Strategy: {m2.simplificationRule}
          </AppText>
        </Card>

        {/* Adaptive Recommendation Card */}
        <Card style={styles.m3Card}>
          <View style={styles.moduleTag}>
            <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m3 }]} />
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              Adaptive Learning & Next Step Guidance
            </AppText>
          </View>
          <AppText size="sm" color={ThemeColors.textPrimary}>
            Next Adaptation:{' '}
            <AppText size="sm" weight="bold" color={ThemeColors.m3}>
              {m3.recommendation}
            </AppText>{' '}
            → {m3.nextActivityLabel}
          </AppText>
          <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 4, lineHeight: 18 }}>
            {m3.rationale}
          </AppText>
        </Card>

        {/* Action Buttons */}
        <Button
          label="✅ I can read it now! (Complete)"
          onPress={() => router.replace('/(child)/home')}
          fullWidth
          size="lg"
          style={{ marginTop: ThemeSpacing.lg }}
        />
        <Button
          label="🎤 Try reading with this support"
          onPress={() => router.back()}
          variant="secondary"
          fullWidth
          size="lg"
          style={{ marginTop: ThemeSpacing.sm }}
        />
        <Button
          label="← Return to Home"
          onPress={() => router.replace('/(child)/home')}
          variant="ghost"
          fullWidth
          style={{ marginTop: ThemeSpacing.sm }}
        />

        <View style={{ height: ThemeSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.xxxl,
  },
  textCard: {
    alignItems: 'center',
    padding: ThemeSpacing.xl,
    marginTop: ThemeSpacing.md,
  },
  supportLevelBadge: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xxs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    marginBottom: ThemeSpacing.md,
  },
  simplificationContainer: {
    width: '100%',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  sentenceBox: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  aiArrowWrap: {
    paddingVertical: ThemeSpacing.xs,
  },
  simplifiedSentenceBox: {
    backgroundColor: ThemeColors.accentLight,
    borderColor: ThemeColors.accentDark,
    borderWidth: 1.5,
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  hlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
    justifyContent: 'center',
  },
  hlWrap: {
    backgroundColor: ThemeColors.accentLight,
    borderRadius: ThemeRadius.sm,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: ThemeColors.warningBorder,
  },
  syllableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  syllableWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syllableText: {
    paddingHorizontal: 2,
  },
  syllableDash: {
    paddingHorizontal: 2,
  },
  audioSection: {
    alignItems: 'center',
    gap: ThemeSpacing.lg,
  },
  audioBtn: {
    width: '85%',
  },
  audioBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.sm,
    backgroundColor: ThemeColors.success,
    paddingVertical: ThemeSpacing.md,
    borderRadius: ThemeRadius.full,
  },
  pictureSection: {
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  supportDescription: {
    marginTop: ThemeSpacing.lg,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: ThemeSpacing.xl,
    marginBottom: ThemeSpacing.sm,
  },
  levelTabs: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
  },
  levelTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    ...ThemeShadow.sm,
  },
  m2Card: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.lg,
    backgroundColor: ThemeColors.m2Surface,
    borderColor: ThemeColors.warningBorder,
  },
  m3Card: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.sm,
    backgroundColor: ThemeColors.m3Surface,
    borderColor: ThemeColors.successBorder,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    marginBottom: ThemeSpacing.xs,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: ThemeRadius.full,
  },
});
