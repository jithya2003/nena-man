/**
 * nena-man · frontend/api/mocks/recommendationMock.ts
 * Module 3: Next Activity Recommendation Engine Mock (Ranaweera · IT23199712).
 *
 * Recommends optimal next learning activities, games, or texts based on speech errors,
 * text difficulty standard, and detected behavioral engagement.
 * Delays ~800ms and returns 1 of 3 realistic recommendation bundles.
 */

import type { RecommendationInput, RecommendationResult } from '../types';

const MOCK_RECOMMENDATION_PROFILES: RecommendationResult[] = [
  // Profile 1: High performance -> Increase difficulty
  {
    difficultyAction: 'Increase',
    recommendedActivities: [
      { activityId: 'act-story-005', title: 'වනාන්තරයේ වික්‍රමය (Adventure Story)', rank: 1 },
      { activityId: 'act-quiz-003', title: 'වේගවත් වචන ගැලපීම (Speed Matching Quiz)', rank: 2 },
      { activityId: 'act-badge-002', title: 'ශූර කියවන්නා පදක්කම (Master Reader Challenge)', rank: 3 },
    ],
    rationale: [
      'කියවීමේ නිරවද්‍යතාවය 85% ට වඩා ඉහළ මට්ටමක පවතී (High accuracy over 85%).',
      'දරුවා උද්‍යෝගිමත් මනෝභාවයකින් (Engaged) පසුවන බැවින් ඊළඟ මට්ටමට යාමට නිර්දේශ කෙරේ.',
      'අලුත් වචන මාලාවක් සහිත කතාවක් තෝරා දී ඇත.',
    ],
  },
  // Profile 2: Balanced / Steady performance -> Maintain difficulty
  {
    difficultyAction: 'Maintain',
    recommendedActivities: [
      { activityId: 'act-drill-002', title: 'අකුරු ශබ්ද අභ්‍යාසය (Letter Phonics Drill)', rank: 1 },
      { activityId: 'act-story-002', title: 'පුංචි හාවාගේ ගෙවත්ත (Story Level 2)', rank: 2 },
      { activityId: 'act-game-puzzle', title: 'අකුරු ගළපමු (Letter Match Puzzle)', rank: 3 },
    ],
    rationale: [
      'කියවීමේ වේගය ස්ථාවර මට්ටමක පවතී (Steady reading pace).',
      'අකුරු පෙරළීම් (Letter reversals) වැඩිදුර පුහුණුව සඳහා ශබ්ද අභ්‍යාස ලබා දේ.',
      'දැනට පවතින අපහසුතා මට්ටම (Maintain level) පවත්වා ගෙන යාම යෝග්‍ය වේ.',
    ],
  },
  // Profile 3: Struggling / Frustrated -> Decrease difficulty + Cooldown
  {
    difficultyAction: 'Decrease',
    recommendedActivities: [
      { activityId: 'act-game-color', title: 'වර්ණ ගළපමු (Calming Color Match)', rank: 1 },
      { activityId: 'act-cooldown-tree', title: 'හුස්ම ගැනීමේ විවේකය (Breathing Tree Cooldown)', rank: 2 },
      { activityId: 'act-story-easy-001', title: 'සරල අකුරු පාඩම (Easy Starter Story)', rank: 3 },
    ],
    rationale: [
      'දරුවා වෙහෙසට පත්ව ඇති බව (Frustrated/Overwhelmed) හඳුනා ගැනිණි.',
      'කියවීමේ පීඩනය ලිහිල් කිරීමට විනාඩි 2ක සන්සුන් ක්‍රීඩාවක් (Cooldown activity) ලබා දේ.',
      'ඊළඟ කියවීම සඳහා වඩාත් සරල කෙටි පාඨයක් (Easy text) නිර්දේශ කෙරේ.',
    ],
  },
];

/**
 * Mock recommendation engine endpoint.
 *
 * Note on TODO fields in input:
 * - activityHistory: placeholder string IDs e.g. ['act-story-001'] (provisional pending Ranaweera confirmation)
 * - difficultyHistory: placeholder ['Maintain'] (provisional pending Ranaweera confirmation)
 *
 * @param input - Multimodal inputs from reading analysis, text difficulty, and behavioral state
 * @returns Promise resolving to a RecommendationResult after 800ms
 */
export async function mockGetRecommendation(
  input: RecommendationInput
): Promise<RecommendationResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // If child is frustrated or reading accuracy < 60%, recommend decreasing difficulty
  if (
    input.behavioralState === 'Frustrated' ||
    input.behavioralState === 'Overwhelmed' ||
    input.readingAccuracy < 0.6
  ) {
    return JSON.parse(JSON.stringify(MOCK_RECOMMENDATION_PROFILES[2])); // Decrease
  }

  // If reading accuracy is high and child is engaged, recommend increasing difficulty
  if (input.readingAccuracy >= 0.85 && input.behavioralState === 'Engaged') {
    return JSON.parse(JSON.stringify(MOCK_RECOMMENDATION_PROFILES[0])); // Increase
  }

  // Default steady profile
  return JSON.parse(JSON.stringify(MOCK_RECOMMENDATION_PROFILES[1])); // Maintain
}

export default mockGetRecommendation;
