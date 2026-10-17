/**
 * nena-man · frontend/api/endpoints.ts
 * Module-level endpoint dispatchers.
 *
 * Each function checks its respective feature flag from config/flags.ts:
 *   - If flag is true (default): calls the local ~800ms mock generator.
 *   - If flag is false: dispatches a real HTTP POST request via apiClient.
 *
 * Real endpoint paths are placeholders until model hosting paths are finalized.
 */

import { apiClient } from './client';
import { ENV } from '@/config/env';
import {
  USE_MOCK_READING_ANALYSIS,
  USE_MOCK_TEXT_DIFFICULTY,
  USE_MOCK_BEHAVIOR_STATE,
  USE_MOCK_RECOMMENDATION,
} from '@/config/flags';
import type {
  ReadingAnalysisResult,
  TextDifficultyResult,
  BehaviorStateInput,
  BehaviorStateResult,
  RecommendationInput,
  RecommendationResult,
} from './types';

// Mock implementations
import { mockAnalyzeReading } from './mocks/readingAnalysisMock';
import { mockAnalyzeText } from './mocks/textDifficultyMock';
import { mockGetBehaviorState } from './mocks/behaviorStateMock';
import { mockGetRecommendation } from './mocks/recommendationMock';

// =============================================================================
// Module 1: Reading Error Analysis (Kulathilaka · IT23175198)
// =============================================================================

/**
 * Analyzes audio recording of child reading Sinhala text to classify speech errors.
 *
 * @param audioData - Audio payload (base64, URI, FormData, or Blob)
 * @returns Promise<ReadingAnalysisResult>
 */
export async function analyzeReading(audioData: any): Promise<ReadingAnalysisResult> {
  if (USE_MOCK_READING_ANALYSIS) {
    return mockAnalyzeReading(audioData);
  }

  // Real backend endpoint placeholder
  return apiClient.post('/analyze-reading', { audio: audioData });
}

// =============================================================================
// Module 2: Sinhala Text Difficulty (Edirisooriya · IT23179844)
// =============================================================================

/**
 * Evaluates text complexity against grade standards and computes simplification if needed.
 *
 * @param text - The Sinhala reading sentence or passage
 * @param gradeLevel - Student grade level (e.g. 2, "Grade 2")
 * @returns Promise<TextDifficultyResult>
 */
export async function analyzeText(
  text: string,
  gradeLevel: number | string
): Promise<TextDifficultyResult> {
  if (USE_MOCK_TEXT_DIFFICULTY) {
    return mockAnalyzeText(text, gradeLevel);
  }

  // Real backend endpoint placeholder
  return apiClient.post('/analyze-text', { text, gradeLevel });
}

// =============================================================================
// Module 4: Behavioral State Detection (Pushpakumara · IT23177246)
// =============================================================================

/**
 * Detects child's emotional/cognitive state (Engaged, Distracted, Frustrated, etc.)
 * using multimodal camera, touch latency, and speech fluency inputs.
 *
 * @param input - Multimodal inputs from camera tracking, UI events, and speech metrics
 * @returns Promise<BehaviorStateResult>
 */
export async function getBehaviorState(
  input: BehaviorStateInput
): Promise<BehaviorStateResult> {
  if (USE_MOCK_BEHAVIOR_STATE) {
    return mockGetBehaviorState(input);
  }

  // Real backend endpoint placeholder
  return apiClient.post('/behavior-state', input);
}

// =============================================================================
// Module 3: Next Activity Recommendation Engine (Ranaweera · IT23199712)
// =============================================================================

/**
 * Generates personalized, ranked next activities based on reading performance,
 * text difficulty, and behavioral state.
 *
 * @param input - Aggregated performance and state metrics
 * @returns Promise<RecommendationResult>
 */
export async function getRecommendation(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const isMock = USE_MOCK_RECOMMENDATION;
  const endpointUrl = `${ENV.API_BASE_URL}/recommend`;

  if (__DEV__) {
    console.log(
      `[M3 Recommendation] Mode: ${isMock ? 'MOCK' : 'LIVE'} | Target: ${isMock ? 'local mock generator' : endpointUrl}`
    );
  }

  if (isMock) {
    return mockGetRecommendation(input);
  }

  if (__DEV__) {
    console.log(`[M3 Recommendation] Live request started -> POST ${endpointUrl}`);
  }

  try {
    const response: any = await apiClient.post('/recommend', input);
    if (__DEV__) {
      const recId =
        response?.nextActivityId ||
        response?.recommendedActivities?.[0]?.activityId ||
        'unknown';
      console.log(
        `[M3 Recommendation] Live request succeeded (HTTP 200) -> Next Activity: ${recId} (${response?.difficultyAction || 'Action'})`
      );
    }
    return response as RecommendationResult;
  } catch (error: any) {
    if (__DEV__) {
      const errMsg = error?.message || String(error);
      const status = error?.status || error?.response?.status || 'Network / CORS Error';
      console.warn(
        `[M3 Recommendation] Live request failed (status: ${status}) -> ${errMsg}`
      );
    }
    throw error;
  }
}
