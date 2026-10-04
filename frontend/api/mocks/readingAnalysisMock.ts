/**
 * nena-man · frontend/api/mocks/readingAnalysisMock.ts
 * Module 1: Reading Error Analysis Mock Implementation (Kulathilaka · IT23175198).
 *
 * Simulates speech-to-text alignment and acoustic error classification for Sinhala sentences.
 * Delays ~800ms and randomly returns 1 of 3 realistic diagnostic profiles.
 */

import type { ReadingAnalysisResult } from '../types';

const MOCK_PROFILES: ReadingAnalysisResult[] = [
  // Profile 1: High fluency / mild hesitation
  {
    words: [
      { text: 'අපි', status: 'correct', expected: 'අපි', confidence: 0.96 },
      { text: 'පාසල්', status: 'hesitation', expected: 'පාසල්', confidence: 0.82 },
      { text: 'යමු', status: 'correct', expected: 'යමු', confidence: 0.94 },
    ],
    severity: 0.15,
    readingAccuracy: 0.88,
    errorPatternSummary: {
      substitution: 0,
      omission: 0,
      reversal: 0,
      hesitation: 1,
    },
    readingSpeed: 48, // words per minute
    hesitationCount: 1,
    pauseDuration: 1.4, // total seconds
    fluencyScore: 0.85,
  },
  // Profile 2: Moderate dyslexia with letter reversal (e.g. බ / ඩ reversal) and hesitation
  {
    words: [
      { text: 'කුරුල්ලා', status: 'correct', expected: 'කුරුල්ලා', confidence: 0.92 },
      { text: 'ගස', status: 'reversal', expected: 'ගස', confidence: 0.74 },
      { text: 'උඩ', status: 'hesitation', expected: 'උඩ', confidence: 0.68 },
      { text: 'ඉඳියි', status: 'substitution', expected: 'ඉඳියි', confidence: 0.65 },
    ],
    severity: 0.42,
    readingAccuracy: 0.72,
    errorPatternSummary: {
      substitution: 1,
      omission: 0,
      reversal: 1,
      hesitation: 1,
    },
    readingSpeed: 32,
    hesitationCount: 2,
    pauseDuration: 3.2,
    fluencyScore: 0.68,
  },
  // Profile 3: Struggling reader with word omissions and long pauses
  {
    words: [
      { text: 'සුදු', status: 'correct', expected: 'සුදු', confidence: 0.85 },
      { text: 'හාවා', status: 'hesitation', expected: 'හාවා', confidence: 0.61 },
      { text: 'තණකොළ', status: 'omission', expected: 'තණකොළ', confidence: 0.35 },
      { text: 'කයි', status: 'substitution', expected: 'කයි', confidence: 0.58 },
    ],
    severity: 0.68,
    readingAccuracy: 0.54,
    errorPatternSummary: {
      substitution: 1,
      omission: 1,
      reversal: 0,
      hesitation: 2,
    },
    readingSpeed: 21,
    hesitationCount: 3,
    pauseDuration: 5.8,
    fluencyScore: 0.48,
  },
];

/**
 * Mock speech reading analysis endpoint.
 *
 * @param _audioData - Voice recording payload (ignored in mock mode)
 * @returns Promise resolving to a realistic ReadingAnalysisResult after 800ms
 */
export async function mockAnalyzeReading(_audioData: any): Promise<ReadingAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const randomIndex = Math.floor(Math.random() * MOCK_PROFILES.length);
  return JSON.parse(JSON.stringify(MOCK_PROFILES[randomIndex]));
}

export default mockAnalyzeReading;
