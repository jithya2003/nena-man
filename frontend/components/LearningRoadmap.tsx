import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import type { RoadmapStage } from '@/types';
import { MOCK_ROADMAP_STAGES } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';
import { useLanguage } from '@/context/LanguageContext';

interface LearningRoadmapProps {
  stages?: RoadmapStage[];
  onSelectStage?: (stage: RoadmapStage) => void;
}

interface StageLocalization {
  titleSi: string;
  subtitleSi: string;
  skillsSi: string[];
  titleEn: string;
  subtitleEn: string;
  skillsEn: string[];
}

const STAGE_LOCALIZATIONS: Record<number, StageLocalization> = {
  1: {
    titleSi: 'මූලික සිංහල අකුරු හඳුනාගැනීම',
    subtitleSi: 'තනි අකුරු සහ මූලික ස්වර ශබ්ද හඳුනාගැනීම',
    skillsSi: ['පැහැදිලි ස්වර ශබ්ද උච්චාරණය', 'අකුරු මාරුවීම් අවම කිරීම (බ/ඩ)'],
    titleEn: 'Basic Sinhala Letter Recognition',
    subtitleEn: 'Isolated letters and basic vowel sound recognition',
    skillsEn: ['Clear vowel distinction', 'Zero letter reversals (බ/ඩ)'],
  },
  2: {
    titleSi: 'පිල්ලම් සහ කොම්බුව (ෙ) සහිත අකුරු',
    subtitleSi: 'ව්‍යංජන සමඟ පිල්ලම් සහ කොම්බුව නිවැරදිව කියවීම',
    skillsSi: ['කොම්බුව (ෙ) සහිත අකුරු හඳුනාගැනීම', 'අල් අකුරු (්) නිවැරදිව නැවතීම', 'සරල අක්ෂර දෙකේ වචන'],
    titleEn: 'Syllable Decoding & Kombuwa (ෙ)',
    subtitleEn: 'Connecting consonants with vowel signs (පිල්ලම්)',
    skillsEn: ['Kombuwa (ෙ) decoding', 'Al-lakuna (්) pauses', '2-syllable blends'],
  },
  3: {
    titleSi: 'බැඳි අකුරු සහ සරල වාක්‍ය කියවීම',
    subtitleSi: 'බැඳි අකුරු සහ බහු-අක්ෂර වචන අඩංගු සරල වාක්‍ය කියවීම',
    skillsSi: ['බැඳි අකුරු නිවැරදිව කියවීම', 'සරල වාක්‍ය රටා අවබෝධය'],
    titleEn: 'Compound Words & Sentence Simplification',
    subtitleEn: 'Multi-syllable Sinhala words in contextual reading',
    skillsEn: ['Bandhi Akuru', 'Sentence structure comprehension'],
  },
  4: {
    titleSi: 'සම්බන්ධිත වාක්‍ය චතුර ලෙස කියවීම',
    subtitleSi: 'නැවතීම් සහ රිද්මය සහිතව සම්පූර්ණ වාක්‍ය චතුරව කියවීම',
    skillsSi: ['මිනිත්තුවට වචන 35+ ක කියවීමේ වේගය', 'වැරදීම් ස්වයංව නිවැරදි කරගැනීම'],
    titleEn: 'Connected Sinhala Sentence Fluency',
    subtitleEn: 'Reading full natural sentences with rhythm and expression',
    skillsEn: ['Pacing > 35 WPM', 'Self-correction on hesitation'],
  },
  5: {
    titleSi: 'කෙටි කතන්දර තනිව කියවා තේරුම් ගැනීම',
    subtitleSi: 'ඡේද මට්ටමේ කියවීම සහ කියවූ කරුණු තේරුම් ගැනීමේ හැකියාව',
    skillsSi: ['කියවූ කතාවේ අදහස නැවත පැහැදිලි කිරීම', 'සහයෝගයකින් තොරව තනිව කියවීම'],
    titleEn: 'Independent Story Comprehension',
    subtitleEn: 'Paragraph-level reading with full comprehension',
    skillsEn: ['Passage recall', 'Independent reading without scaffolding'],
  },
};

export default function LearningRoadmap({
  stages = MOCK_ROADMAP_STAGES,
  onSelectStage,
}: LearningRoadmapProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isSi = language === 'si';

  const [selectedStageId, setSelectedStageId] = useState<string>(
    stages.find((s) => s.status === 'current')?.id ?? stages[0].id
  );

  const selectedStage =
    stages.find((s) => s.id === selectedStageId) ?? stages[0];

  const selectedLoc = STAGE_LOCALIZATIONS[selectedStage.stageNumber];
  const selectedTitle = isSi && selectedLoc ? selectedLoc.titleSi : (selectedLoc?.titleEn || selectedStage.title);
  const selectedSubtitle = isSi && selectedLoc ? selectedLoc.subtitleSi : (selectedLoc?.subtitleEn || selectedStage.subtitle);
  const selectedSkills = isSi && selectedLoc ? selectedLoc.skillsSi : (selectedLoc?.skillsEn || selectedStage.targetSkills);

  const getStatusBadge = (status: RoadmapStage['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: isSi ? 'සම්පූර්ණයි' : 'Completed',
          icon: '✅',
          color: ThemeColors.success,
          bg: ThemeColors.successSurface,
        };
      case 'current':
        return {
          label: isSi ? 'වත්මන් පුහුණුව' : 'Current Focus',
          icon: '🎯',
          color: ThemeColors.accentDark,
          bg: ThemeColors.accentLight,
        };
      case 'locked':
        return {
          label: isSi ? 'මීළඟ පියවර' : 'Upcoming',
          icon: '🔒',
          color: ThemeColors.textMuted,
          bg: ThemeColors.surface,
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* Visual Roadmap Node Chain */}
      <View style={styles.chainContainer}>
        {stages.map((stage, idx) => {
          const isSelected = stage.id === selectedStageId;
          const statusMeta = getStatusBadge(stage.status);
          const isLast = idx === stages.length - 1;
          const loc = STAGE_LOCALIZATIONS[stage.stageNumber];
          const displayTitle = isSi && loc ? loc.titleSi : (loc?.titleEn || stage.title);

          return (
            <View key={stage.id} style={styles.nodeWrapper}>
              <TouchableOpacity
                style={[
                  styles.nodeItem,
                  isSelected && styles.nodeItemSelected,
                  stage.status === 'current' && styles.nodeItemCurrent,
                  ThemeShadow.sm,
                ]}
                onPress={() => {
                  setSelectedStageId(stage.id);
                  if (onSelectStage) onSelectStage(stage);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.nodeIconCircle, { backgroundColor: statusMeta.bg }]}>
                  <AppText size="md">{statusMeta.icon}</AppText>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nodeTitleRow}>
                    <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
                      {isSi ? `පියවර ${stage.stageNumber}` : `STAGE ${stage.stageNumber}`}
                    </AppText>
                    <AppText size="xs" weight="bold" color={statusMeta.color}>
                      {stage.progressPercentage}%
                    </AppText>
                  </View>
                  <AppText
                    size="sm"
                    weight={isSelected ? 'extrabold' : 'bold'}
                    color={ThemeColors.textPrimary}
                    numberOfLines={1}
                  >
                    {displayTitle}
                  </AppText>
                  <ProgressBar
                    value={stage.progressPercentage}
                    color={statusMeta.color}
                    height={4}
                    style={{ marginTop: 4 }}
                  />
                </View>
              </TouchableOpacity>

              {/* Connecting path line */}
              {!isLast && (
                <View
                  style={[
                    styles.pathLine,
                    {
                      backgroundColor:
                        stage.status === 'completed'
                          ? ThemeColors.success
                          : ThemeColors.borderLight,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Selected Stage Detail Section */}
      <Card variant="elevated" style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View>
            <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
              {isSi
                ? `පියවර ${selectedStage.stageNumber} · මෙම පියවරේ විස්තර`
                : `STAGE ${selectedStage.stageNumber} DETAILS`}
            </AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginVertical: 2 }}>
              {selectedTitle}
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              {selectedSubtitle}
            </AppText>
          </View>
        </View>

        {/* Target Reading Skills Checklist */}
        <View style={styles.skillsSection}>
          <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 4 }}>
            🎯 {isSi ? 'පුහුණු කළ යුතු කියවීමේ කුසලතා:' : 'Target Reading Skills:'}
          </AppText>
          {selectedSkills.map((skill, i) => (
            <View key={i} style={styles.skillRow}>
              <AppText size="xs" color={ThemeColors.accentDark}>
                ✓
              </AppText>
              <AppText size="xs" color={ThemeColors.textPrimary}>
                {skill}
              </AppText>
            </View>
          ))}
        </View>

        {selectedStage.status === 'current' && (
          <View style={styles.estimatePill}>
            <AppText size="xs" color={ThemeColors.accentDark} weight="bold">
              ⏱ {isSi
                ? `ඇස්තමේන්තුගත පුහුණු කාලය: දින ${selectedStage.estimatedDaysLeft}ක් පමණ (වත්මන් කියවීමේ වේගය අනුව)`
                : `Estimated Practice Time: ~${selectedStage.estimatedDaysLeft} days at current reading velocity`}
            </AppText>
          </View>
        )}

        {selectedStage.status !== 'locked' && (
          <Button
            label={isSi ? `පියවර ${selectedStage.stageNumber} අභ්‍යාස ආරම්භ කරන්න →` : `Practice Stage ${selectedStage.stageNumber} Activities →`}
            onPress={() => router.push('/(child)/reading')}
            fullWidth
            size="md"
            style={{ marginTop: ThemeSpacing.md }}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chainContainer: {
    paddingVertical: ThemeSpacing.xs,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.sm,
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
    width: '100%',
  },
  nodeItemSelected: {
    borderColor: ThemeColors.accentDark,
    backgroundColor: ThemeColors.surfaceElevated,
    borderWidth: 2,
  },
  nodeItemCurrent: {
    borderColor: ThemeColors.accent,
  },
  nodeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pathLine: {
    width: 3,
    height: 16,
    marginVertical: 2,
    borderRadius: 1.5,
  },
  detailCard: {
    padding: ThemeSpacing.md,
    marginTop: ThemeSpacing.md,
    backgroundColor: ThemeColors.surfaceElevated,
  },
  detailHeader: {
    marginBottom: ThemeSpacing.sm,
  },
  skillsSection: {
    backgroundColor: ThemeColors.surface,
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    marginVertical: ThemeSpacing.xs,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
    marginTop: 2,
  },
  estimatePill: {
    backgroundColor: ThemeColors.accentLight,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.xs,
    borderRadius: ThemeRadius.sm,
    marginTop: ThemeSpacing.xs,
    borderWidth: 1,
    borderColor: ThemeColors.warningBorder,
  },
});
