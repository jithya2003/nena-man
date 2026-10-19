/**
 * nena-man · frontend/api/types.ts
 * Final TypeScript contracts for all four AI modules' API interfaces.
 *
 * NOTE: Fields marked with TODO are pending final enum/shape confirmation
 * from respective module owners. They are kept as loosely-typed strings
 * per team agreement. Do NOT guess or restrict them.
 */

// =============================================================================
// 0. Generic API Client Types
// =============================================================================

export interface ApiError {
  /** User-safe or developer-readable error message */
  message: string;
  /** HTTP status code (e.g. 400, 401, 500) if available */
  status?: number;
  /** True if the request failed due to no internet/offline or connection timeout */
  isNetworkError: boolean;
  /** Original response payload if returned by the server */
  data?: any;
}

// =============================================================================
// 1. Reading Error Analysis (Kulathilaka · IT23175198 — Finalized)
// =============================================================================

export type WordStatus = 'correct' | 'substitution' | 'omission' | 'reversal' | 'hesitation';

export interface WordResult {
  text: string;
  status: WordStatus;
  expected: string;
  confidence: number; // 0-1
}

export interface ErrorPatternSummary {
  substitution: number;
  omission: number;
  reversal: number;
  hesitation: number;
}

export interface ReadingAnalysisResult {
  words: WordResult[];
  severity: number; // 0-1
  readingAccuracy: number; // 0-1
  errorPatternSummary: ErrorPatternSummary;
  readingSpeed: number; // words per minute
  hesitationCount: number;
  pauseDuration: number; // total seconds across the session (confirmed)
  fluencyScore: number; // 0-1
}

// =============================================================================
// 2. Sinhala Text Difficulty (Edirisooriya · IT23179844 — Finalized)
// =============================================================================

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type TextType = 'word' | 'short sentence';

export interface TextDifficultyFeatures {
  akuru_count: number;
  pillam_count: number;
  word_frequency_level: number;
}

export interface TextDifficultyPrediction {
  predicted: DifficultyLevel;
  probabilities: Record<string, number>;
}

export interface TextDifficultySupportPolicy {
  split_needed: boolean;
  simplification_needed: boolean;
  max_support_level: 3 | 4;
  support_path: number[];
}

export interface TextDifficultySimplification {
  needed: boolean;
  available: boolean;
  simplified_text: string | null;
}

export interface TextDifficultySuccessResponse {
  analysis_status: 'success';
  text: string;
  grade_level: 1 | 2 | 3;
  text_type: TextType;
  features: TextDifficultyFeatures;
  difficulty: TextDifficultyPrediction;
  support: TextDifficultySupportPolicy;
  simplification: TextDifficultySimplification;
  model_status: string;
  _inference_latency_ms?: number;
  success?: boolean;
  message?: string;
  timestamp?: string;
}

export interface TextDifficultyOOVResponse {
  analysis_status: 'needs_word_confirmation';
  text: string;
  unknown_tokens: string[];
  message: string;
  model_status?: string;
  success?: boolean;
  timestamp?: string;
}

export type TextDifficultyResponse =
  | TextDifficultySuccessResponse
  | TextDifficultyOOVResponse;

export interface TextDifficultyRequest {
  text: string;
  grade_level: 1 | 2 | 3;
  text_type: TextType;
}

export interface SplitWord {
  word: string;
  parts: string[];
}

export type SupportLevelNumber = 1 | 2 | 3 | 4;

export interface TextDifficultyResult {
  difficultyLevel: DifficultyLevel;
  splitNeeded: boolean;
  simplificationNeeded: boolean;
  simplifiedText: string | null; // present only if simplificationNeeded is true
  maxSupportLevel: number; // 1-4
  maxRetriesPerLevel?: number;
  highlightUnits?: string[];
  splitParts?: string[];
  splitWords?: SplitWord[];
  applicableSupportLevels?: SupportLevelNumber[];
}

// =============================================================================
// 3. Behavioral State Detection (Pushpakumara · IT23177246)
// =============================================================================

export type BehavioralState = 'Engaged' | 'Distracted' | 'Frustrated' | 'Overwhelmed' | 'Overloaded';
export type InterventionType = 'focus_game' | 'calming_game' | 'cooldown_activity' | 'break_relaxation' | 'continue_reading';

export interface BehaviorStateInput {
  // Camera/Video inputs — field names from his spec document
  faceVisibility: boolean;
  eyeGaze: string;              // TODO: confirm exact allowed values with Pushpakumara
  lookingAwayFrequency: number;
  headPose: string;             // TODO: confirm exact allowed values with Pushpakumara
  blinkRate: number;            // blinks per minute
  faceDistance: number;
  bodyPosture: string;          // TODO: confirm exact allowed values with Pushpakumara

  // Voice/Audio inputs — sourced from MY reading module, not re-extracted
  readingSpeed: number;
  hesitationCount: number;
  pauseDuration: number;
  fluencyScore: number;
  speakingPattern: string;      // TODO: confirm with Pushpakumara whether this is distinct from fluencyScore or redundant

  // Interaction/Application inputs
  responseTime: number;
  tapSpeed: number;
  retryCount: number;
  missClicks: number;
  skipFrequency: number;
  idleTime: number;             // seconds
  taskCompletion: boolean;      // TODO: confirm boolean vs percentage with Pushpakumara
  interactionPattern: string;   // TODO: confirm exact allowed values with Pushpakumara
}

export interface BehaviorStateResult {
  behavioralState: BehavioralState;
  predictionConfidence: number; // 0-1
  interventionRequired: boolean;
  recommendedIntervention: InterventionType | null;
}

// =============================================================================
// 4. Recommendation Engine (Ranaweera · IT23199712)
// =============================================================================

export type DifficultyTransition = 'Decrease' | 'Maintain' | 'Increase';

export interface RecommendedActivity {
  activityId: string;
  title: string;
  rank: number;
}

export interface RecommendationInput {
  readingAccuracy: number;           // from my reading module
  errorPatternSummary: ErrorPatternSummary; // from my reading module
  difficultyLevel: DifficultyLevel;  // from text difficulty module
  behavioralState: BehavioralState;  // from behavior module
  responseLatency: number;
  previousAccuracy: number;
  activityHistory: string[];         // TODO: confirm shape with Ranaweera
  difficultyHistory: DifficultyTransition[]; // TODO: confirm with Ranaweera
}

export interface RecommendationResult {
  difficultyAction: DifficultyTransition;
  recommendedActivities: RecommendedActivity[]; // top-K, ranked
  rationale: string[]; // human-readable explanation lines
  nextActivityId?: string;
  nextActivityLabel?: string;
  targetPhonemeSkill?: string;
  confidence?: number;
  xaiFactors?: any[];
  shapExplanation?: any;
  meta?: any;
}
