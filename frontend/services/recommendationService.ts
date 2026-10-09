/**
 * nena-man · frontend/services/recommendationService.ts
 * Module 3: Adaptive Learning Recommendation Engine & Explainable AI (XAI) Service.
 *
 * Implements the client-side interface for M3 recommendations.
 * Architecture:
 *   - When EXPO_PUBLIC_USE_MOCK_RECOMMENDATION !== 'false', computes adaptive
 *     recommendations locally using multi-signal telemetry (M1 accuracy, M2 text
 *     complexity, M4 engagement & voice pauses) with dual-mode explainability
 *     (Parent-Friendly Guidance & Clinical Feature Importances).
 *   - When backend models are deployed, seamlessly switches to Flask endpoint
 *     POST /api/v1/recommendation/next without requiring UI changes.
 */

import axios from 'axios';
import type {
  M3Response,
  ReadingSessionRecord,
  DifficultyTransition,
  XAIFactor,
} from '@/types';
import { MOCK_M3_RESPONSE } from '@/mock/data';

const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK_RECOMMENDATION !== 'false';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface ParentRecommendationInsight {
  title: string;
  recommendation: DifficultyTransition;
  plainLanguageReason: string;
  plainLanguageReasonSi: string;
  homeTip: string;
  homeTipSi: string;
  targetSkill: string;
  confidencePercent: number;
}

export const recommendationService = {
  /**
   * Fetch next adaptive recommendation for a child based on their latest session.
   */
  async getNextRecommendation(
    childId: string,
    latestSession?: ReadingSessionRecord | null
  ): Promise<M3Response> {
    if (!USE_MOCK) {
      try {
        const payload = {
          child_id: childId,
          speech_errors: latestSession?.results?.errorAnalysis || {},
          text_difficulty: latestSession?.results?.textDifficulty?.difficultyLevel || 'medium',
          behavior_state: latestSession?.results?.behaviorState?.behavioralState || 'focused',
          response_latency_ms: (latestSession?.results?.errorAnalysis?.pauseDuration || 1.2) * 1000,
        };

        const res = await axios.post(`${API_BASE_URL}/api/v1/recommendation/next`, payload, {
          timeout: 7000,
        });

        if (res.data) {
          return res.data as M3Response;
        }
      } catch (apiErr) {
        console.warn('[recommendationService] Live API request failed, falling back to local adaptive generator:', apiErr);
      }
    }

    // Adaptive generator based on session telemetry
    return this.generateAdaptiveResponse(latestSession);
  },

  /**
   * Synthesizes realistic M3 output tailored to the child's actual reading telemetry.
   */
  generateAdaptiveResponse(session?: ReadingSessionRecord | null): M3Response {
    if (!session) {
      return MOCK_M3_RESPONSE;
    }

    const accuracy = session.overallAccuracy ?? session.results.errorAnalysis?.accuracy ?? 80;
    const errorCount = session.results.errorAnalysis?.errorCount ?? 1;
    const errors = session.results.errorAnalysis?.errors || [];
    const hesitationCount = session.results.errorAnalysis?.hesitationCount ?? 1;
    const behavior = session.results.behaviorState?.behavioralState || 'focused';

    // Decide difficulty transition based on rule-based multi-signal fusion (pre-ML proxy)
    let transition: DifficultyTransition = 'Maintain';
    let nextActivityId = 'act_02';
    let nextActivityLabel = 'Level 2 Syllable & Long Vowel Practice';
    let targetSkill = 'ස්වර දිගු කිරීම් (Long Vowels: ඩා, පා, මා)';
    let rationale = 'Consistent performance above 80% accuracy. Recommend targeted practice on long vowel sounds.';

    // Check specific error patterns
    const hasReversal = errors.some((e) => e.type === 'reversal');
    const hasSubstitution = errors.some((e) => e.type === 'substitution');

    if (accuracy < 60 || hesitationCount >= 3 || behavior === 'frustrated') {
      transition = 'Decrease';
      nextActivityId = 'act_01';
      nextActivityLabel = 'Picture-Supported Word Building (L1)';
      targetSkill = 'පින්තූර ආශ්‍රිත වචන හඳුනාගැනීම (Visual Word Association)';
      rationale = 'Cognitive load is currently elevated with multiple hesitations. Reducing complexity and activating visual picture scaffolding to restore confidence.';
    } else if (accuracy >= 88 && errorCount <= 1 && behavior === 'focused') {
      transition = 'Increase';
      nextActivityId = 'act_04';
      nextActivityLabel = 'Short Story Comprehension & Fluency (L3)';
      targetSkill = 'කෙටි ඡේද කියවීම සහ අවබෝධය (Passage Reading)';
      rationale = 'High reading accuracy (≥88%) and high engagement detected. Ready for paragraph-level progression with multi-syllable vocabulary.';
    } else if (hasReversal) {
      transition = 'Maintain';
      nextActivityId = 'act_03';
      nextActivityLabel = 'Kombuwa & Al-Lakuna Order Mastery';
      targetSkill = 'කොම්බුව සහ ඇලපිල්ල පිහිටීම (Vowel Modifier Sequencing)';
      rationale = 'Letter and diacritic sequencing errors detected. Reinforcing modifier stroke order before advancing difficulty.';
    } else if (hasSubstitution) {
      transition = 'Maintain';
      nextActivityId = 'act_02';
      nextActivityLabel = 'Phoneme Discrimination (ර/ල & ත/ට)';
      targetSkill = 'අක්ෂර උච්චාරණ විභේදනය (Consonant Discrimination)';
      rationale = 'Mild word substitutions observed. Maintain level while targeting minimal word pair discrimination.';
    }

    const xaiFactors: XAIFactor[] = [
      {
        name: 'උච්චාරණ නිරවද්‍යතාව (Speech Accuracy)',
        weight: Math.min(100, Math.round(accuracy)),
        direction: accuracy >= 75 ? 'positive' : 'negative',
        description: `සැසියේ නිරවද්‍යතාවය ${accuracy}% කි.`,
      },
      {
        name: 'කියවීමේ චකිතය (Cognitive Hesitation)',
        weight: Math.min(100, Math.max(15, hesitationCount * 25)),
        direction: hesitationCount <= 1 ? 'positive' : 'negative',
        description: `වචන කියවීමේදී සිදු වූ නැවතීම් ${hesitationCount} කි.`,
      },
      {
        name: 'අවධානය සහ මානසික තත්ත්වය (Engagement)',
        weight: session.results.behaviorState?.engagementScore ?? (behavior === 'focused' ? 88 : 65),
        direction: behavior === 'focused' ? 'positive' : 'neutral',
        description: `දරුවාගේ ක්‍රියාකාරී සහභාගීත්වය (${behavior}).`,
      },
      {
        name: 'පාඨයේ භාෂාමය සංකීර්ණතාව (Text Complexity)',
        weight: 60,
        direction: 'neutral',
        description: 'වාක්‍යයේ අක්ෂර සංඛ්‍යාව සහ පිල්ලම් බහුලතාව.',
      },
    ];

    return {
      recommendation: transition,
      nextActivityId,
      nextActivityLabel,
      targetPhonemeSkill: targetSkill,
      rationale,
      confidence: 0.89,
      xaiFactors,
      peerBenchmark: {
        cohortName: 'ශ්‍රේණිය 2 — සිංහල කියවීමේ සම වයස් කණ්ඩායම',
        similarityScore: 86,
        averageGrowthRate: '+14% වර්ධනයක් (පසුගිය සති 2 තුළ)',
        comparisonNote: 'සම වයස් සිසුන් අතරින් 74% ක්ම මෙම අභ්‍යාසය මගින් සාර්ථක ප්‍රතිඵල ලබා ඇත.',
      },
      roadmapStages: MOCK_M3_RESPONSE.roadmapStages,
      skillDimensions: MOCK_M3_RESPONSE.skillDimensions,
    };
  },

  /**
   * Generates a plain-language explanation specifically written for parents.
   */
  getParentExplanation(m3: M3Response): ParentRecommendationInsight {
    let title = 'සාමාන්‍ය අභ්‍යාස මට්ටම පවත්වා ගැනීම';
    let plainReasonEn = m3.rationale;
    let plainReasonSi = 'දරුවාගේ වත්මන් කියවීමේ මට්ටම හොඳින් පවත්වා ගෙන යමින් අසීරු අකුරු ශබ්ද තහවුරු කිරීම සුදුසුය.';
    let homeTipEn = 'Practice reading 5 target words together using finger tracking.';
    let homeTipSi = 'අද රාත්‍රියේ විනාඩි 10ක් දරුවා සමඟ පොතක් පෙරලා ඇඟිල්ලෙන් අකුරු පෙන්වමින් සෙමින් කියවන්න.';

    if (m3.recommendation === 'Increase') {
      title = 'ඊළඟ ඉගෙනුම් මට්ටමට පිවිසීම (Level Up)';
      plainReasonSi = 'දරුවා ඉතා ඉහළ නිරවද්‍යතාවයකින් හා උනන්දුවකින් කියවයි. මීළඟ සංකීර්ණ වාක්‍ය කියවීමට දරුවා සූදානම්ය!';
      homeTipSi = 'දරුවාගේ දක්ෂතාව අගය කර කුඩා තෑග්ගක් හෝ තරු ප්‍රදානය කර කෙටි කතන්දර පොතක් කියවීමට දෙන්න.';
    } else if (m3.recommendation === 'Decrease') {
      title = 'පාඩම සරල කර සහාය ලබා දීම (Gentle Support)';
      plainReasonSi = 'දිගු වචන කියවීමේදී දරුවා තරමක් පසුබට විය. දරුවා අධෛර්යමත් වීම වැළැක්වීමට කෙටි වචන සහ පින්තූර ආශ්‍රිත අභ්‍යාස ලබාදීම සුදුසුය.';
      homeTipSi = 'අකුරු කියවීමට බල නොකර, පින්තූර දෙස බලා කතා කිරීමට දරුවා උනන්දු කරවන්න.';
    }

    return {
      title,
      recommendation: m3.recommendation,
      plainLanguageReason: plainReasonEn,
      plainLanguageReasonSi: plainReasonSi,
      homeTip: homeTipEn,
      homeTipSi: homeTipSi,
      targetSkill: m3.targetPhonemeSkill,
      confidencePercent: Math.round((m3.confidence || 0.88) * 100),
    };
  },
};

export default recommendationService;
