/**
 * nena-man · frontend/types/progressiveSupport.ts
 * Type definitions & backend API contracts for the Sinhala Text Difficulty
 * & Progressive Reading Support research component.
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Support Level:
 * 0 = Independent attempt (No assistance)
 * 1 = Level 1: Highlight
 * 2 = Level 2: Akuru / Syllable split (if splitNeeded)
 * 3 = Level 3: Audio support
 * 4 = Level 4: Text simplification (if simplificationNeeded)
 */
export type SupportLevel = 0 | 1 | 2 | 3 | 4;

export interface ReadingSupportItem {
  id: string;
  originalText: string;
  gradeLevel: 2 | 3;
  difficultyLevel: DifficultyLevel;

  splitNeeded: boolean;
  simplificationNeeded: boolean;

  maxSupportLevel: SupportLevel;
  maxRetriesPerLevel: number;

  splitParts?: string[];
  audioUri?: string;
  simplifiedText?: string;

  /**
   * Optional extension: Picture cue emoji/uri.
   * Preserved for project compatibility (used in existing mock data/support tabs),
   * but NOT part of the primary ML model output pipeline.
   */
  pictureEmoji?: string;
}

/**
 * Future API response format from Python ML Backend (Random Forest / FastAPI)
 */
export interface TextDifficultyBackendResponse {
  final_difficulty_level: DifficultyLevel;
  split_needed: boolean;
  simplification_needed: boolean;
  max_support_level: SupportLevel;
  split_parts?: string[];
  simplified_text?: string;
  audio_url?: string;
  max_retries_per_level?: number;
}

/**
 * Frontend state tracking for the progressive support workflow
 */
export interface ProgressiveSupportState {
  currentSupportLevel: SupportLevel;
  retryCount: number;
  completed: boolean;
  lastAttemptCorrect: boolean | null;
  history: Array<{
    level: SupportLevel;
    attemptIndex: number;
    correct: boolean;
    timestamp: number;
  }>;
}
