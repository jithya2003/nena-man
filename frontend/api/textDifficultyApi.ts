/**
 * nena-man · frontend/api/textDifficultyApi.ts
 * Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
 * Researcher: Edirisooriya H. S. (IT23179844)
 *
 * Dispatches text difficulty analysis requests to the Flask backend endpoint:
 *   POST /api/text-difficulty/analyze
 *
 * Source of truth:
 *   - ML predicted difficulty: Easy / Medium / Hard
 *   - Progressive support policy: split_needed, simplification_needed, max_support_level, support_path
 *
 * Note: akuru_count, pillam_count, and word_frequency_level are computed on the backend.
 * Do NOT calculate them locally or send them in the request payload.
 */

import { apiClient } from './client';
import type {
  TextDifficultyRequest,
  TextDifficultyResponse,
  TextDifficultySuccessResponse,
  TextDifficultyOOVResponse,
} from './types';

/**
 * Calls M2 inference endpoint to classify difficulty and evaluate progressive support path.
 *
 * @param params { text, grade_level, text_type }
 * @returns Promise<TextDifficultyResponse>
 */
export async function analyzeTextDifficulty(
  params: TextDifficultyRequest
): Promise<TextDifficultyResponse> {
  const { text, grade_level, text_type } = params;

  const trimmedText = (text || '').trim();
  if (!trimmedText) {
    throw new Error('කරුණාකර සිංහල පාඨයක් ඇතුළත් කරන්න (Please enter Sinhala text).');
  }

  const payload: TextDifficultyRequest = {
    text: trimmedText,
    grade_level: Number(grade_level) as 1 | 2 | 3,
    text_type,
  };

  try {
    // apiClient baseURL is configured from ENV.API_BASE_URL (never hardcoded localhost)
    // Both /api/text-difficulty/analyze and /api/v1/text-difficulty/analyze are registered
    const response = await apiClient.post<any, any>('/text-difficulty/analyze', payload);

    // Normalize envelope if backend returns { success: true, data: { ... }, ... }
    if (response && response.analysis_status) {
      return response as TextDifficultyResponse;
    }
    if (response && response.data && response.data.analysis_status) {
      return response.data as TextDifficultyResponse;
    }
    return response as TextDifficultyResponse;
  } catch (error: any) {
    // If the error response itself contains an OOV response payload with analysis_status:
    if (
      error?.data?.analysis_status === 'needs_word_confirmation' ||
      error?.data?.data?.analysis_status === 'needs_word_confirmation'
    ) {
      return (error.data.analysis_status
        ? error.data
        : error.data.data) as TextDifficultyOOVResponse;
    }
    throw error;
  }
}

export default {
  analyzeTextDifficulty,
};
