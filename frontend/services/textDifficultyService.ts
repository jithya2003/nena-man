/**
 * nena-man · frontend/services/textDifficultyService.ts
 * Mock Service Contract & Backend Transformer for Sinhala Text Difficulty
 * & Progressive Reading Support.
 *
 * NOTE: This mock service provides test scenarios for frontend validation.
 * When the Python ML backend (Random Forest classifier & NLP simplifier) is live,
 * replace the internal mock calls with `fetch` / `apiClient` requests to the backend.
 */

import {
  ReadingSupportItem,
  TextDifficultyBackendResponse,
  DifficultyLevel,
  SupportLevel,
} from '@/types/progressiveSupport';

// ── MOCK DATASET (Testing Scenarios A, B, C) ──────────────────────────────────
export const MOCK_SUPPORT_ITEMS: Record<string, ReadingSupportItem> = {
  // Scenario A: Easy Item (Highlight support only, maxSupportLevel = 1)
  'demo-easy-001': {
    id: 'demo-easy-001',
    originalText: 'ගස',
    gradeLevel: 2,
    difficultyLevel: 'easy',
    splitNeeded: false,
    simplificationNeeded: false,
    maxSupportLevel: 1,
    maxRetriesPerLevel: 2,
    splitParts: ['ග', 'ස'],
    pictureEmoji: '🌳',
  },

  // Scenario B: Medium Item (Split + Audio support, maxSupportLevel = 3)
  'demo-medium-002': {
    id: 'demo-medium-002',
    originalText: 'කුරුල්ලා අහසේ පියාඹයි',
    gradeLevel: 2,
    difficultyLevel: 'medium',
    splitNeeded: true,
    simplificationNeeded: false,
    maxSupportLevel: 3,
    maxRetriesPerLevel: 2,
    splitParts: ['කු', 'රු', 'ල්', 'ලා', 'අ', 'හ', 'සේ', 'පි', 'යා', 'ඹයි'],
    audioUri: 'file:///simulated/kurulla.mp3',
    pictureEmoji: '🐦',
  },

  // Scenario C: Hard Item (All support levels including Text Simplification, maxSupportLevel = 4)
  'demo-hard-003': {
    id: 'demo-hard-003',
    originalText: 'මම මගේ ලස්සන රටට ගොඩාක් ආදරෙයි',
    gradeLevel: 3,
    difficultyLevel: 'hard',
    splitNeeded: true,
    simplificationNeeded: true,
    maxSupportLevel: 4,
    maxRetriesPerLevel: 2,
    splitParts: ['ම', 'ම', 'ම', 'ගේ', 'ලස්', 'ස', 'න', 'ර', 'ට', 'ට', 'ගො', 'ඩාක්', 'ආ', 'ද', 'රෙයි'],
    simplifiedText: 'මම මගේ රටට ආදරෙයි',
    audioUri: 'file:///simulated/country.mp3',
    pictureEmoji: '🇱🇰',
  },
};

/**
 * Service API interface
 */
export const textDifficultyService = {
  /**
   * Fetch a reading support item by ID (or default hard scenario)
   */
  async getReadingSupportItem(id?: string): Promise<ReadingSupportItem> {
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (id && MOCK_SUPPORT_ITEMS[id]) {
      return MOCK_SUPPORT_ITEMS[id];
    }
    return MOCK_SUPPORT_ITEMS['demo-hard-003'];
  },

  /**
   * Get all test scenarios for UI testing
   */
  async getMockScenarios(): Promise<ReadingSupportItem[]> {
    return Object.values(MOCK_SUPPORT_ITEMS);
  },

  /**
   * Transformer: Converts raw backend API response (snake_case) to frontend ReadingSupportItem (camelCase)
   */
  transformBackendResponse(
    id: string,
    originalText: string,
    gradeLevel: 2 | 3,
    response: TextDifficultyBackendResponse
  ): ReadingSupportItem {
    return {
      id,
      originalText,
      gradeLevel,
      difficultyLevel: response.final_difficulty_level || 'medium',
      splitNeeded: Boolean(response.split_needed),
      simplificationNeeded: Boolean(response.simplification_needed),
      maxSupportLevel: (response.max_support_level ?? 4) as SupportLevel,
      maxRetriesPerLevel: response.max_retries_per_level ?? 2,
      splitParts: response.split_parts || [],
      audioUri: response.audio_url,
      simplifiedText: response.simplified_text,
    };
  },
};

export default textDifficultyService;
