/**
 * nena-man · frontend/api/mocks/textDifficultyMock.ts
 * Module 2: Sinhala Text Difficulty & Simplification Mock (Edirisooriya · IT23179844).
 *
 * Analyzes Sinhala text complexity against grade standards and suggests sentence splitting/simplification.
 * Delays ~800ms and returns 1 of 3 realistic difficulty classifications.
 */

import type { TextDifficultyResult } from '../types';
import { getTextDifficulty } from '@/services/readingTextService';

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
 * @param text - Sinhala reading passage or sentence
 * @param gradeLevel - Student grade level (e.g. 2, 3, "Grade 2")
 * @returns Promise resolving to a realistic TextDifficultyResult after 800ms
 */
export async function mockAnalyzeText(
  text: string,
  gradeLevel: number | string
): Promise<TextDifficultyResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const numGrade = typeof gradeLevel === 'number' ? gradeLevel : parseInt(String(gradeLevel).replace(/\D/g, ''), 10) || 2;
  const res = getTextDifficulty(text, numGrade);

  return {
    difficultyLevel: (res.finalDifficultyLevel.charAt(0).toUpperCase() + res.finalDifficultyLevel.slice(1)) as any,
    splitNeeded: res.splitNeeded,
    simplificationNeeded: res.simplificationNeeded,
    simplifiedText: res.simplifiedText || null,
    maxSupportLevel: res.maxSupportLevel,
    maxRetriesPerLevel: res.maxRetriesPerLevel,
    highlightUnits: res.highlightUnits,
    splitParts: res.splitParts,
  };
}

export default mockAnalyzeText;
