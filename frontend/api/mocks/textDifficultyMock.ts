/**
 * nena-man · frontend/api/mocks/textDifficultyMock.ts
 * Module 2: Sinhala Text Difficulty & Simplification Mock (Edirisooriya · IT23179844).
 *
 * Analyzes Sinhala text complexity against grade standards and suggests sentence splitting/simplification.
 * Delays ~800ms and returns 1 of 3 realistic difficulty classifications.
 */

import type { TextDifficultyResult } from '../types';

const MOCK_DIFFICULTY_PROFILES: TextDifficultyResult[] = [
  // Profile 1: Easy sentence for younger grades — no breakdown needed
  {
    difficultyLevel: 'Easy',
    splitNeeded: false,
    simplificationNeeded: false,
    simplifiedText: null,
    maxSupportLevel: 1,
    maxRetriesPerLevel: 3,
  },
  // Profile 2: Medium complexity — compound clauses suggest sentence splitting
  {
    difficultyLevel: 'Medium',
    splitNeeded: true,
    simplificationNeeded: false,
    simplifiedText: null,
    maxSupportLevel: 2,
    maxRetriesPerLevel: 2,
  },
  // Profile 3: Hard complexity — dense vocabulary requires simplified vocabulary substitute
  {
    difficultyLevel: 'Hard',
    splitNeeded: true,
    simplificationNeeded: true,
    simplifiedText: 'කුඩා කුරුල්ලා ගසේ අත්තක ලස්සනට ගීත ගයයි.',
    maxSupportLevel: 4,
    maxRetriesPerLevel: 2,
  },
];

/**
 * Mock Sinhala text difficulty endpoint.
 *
 * @param _text - Sinhala reading passage or sentence
 * @param _gradeLevel - Student grade level (e.g. 2, 3, "Grade 2")
 * @returns Promise resolving to a realistic TextDifficultyResult after 800ms
 */
export async function mockAnalyzeText(
  _text: string,
  _gradeLevel: number | string
): Promise<TextDifficultyResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const randomIndex = Math.floor(Math.random() * MOCK_DIFFICULTY_PROFILES.length);
  return JSON.parse(JSON.stringify(MOCK_DIFFICULTY_PROFILES[randomIndex]));
}

export default mockAnalyzeText;
