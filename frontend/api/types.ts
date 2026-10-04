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

export interface TextDifficultyResult {
  difficultyLevel: DifficultyLevel;
  splitNeeded: boolean;
  simplificationNeeded: boolean;
  simplifiedText: string | null; // present only if simplificationNeeded is true
  maxSupportLevel: number; // 1-4
  maxRetriesPerLevel: number;
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
}
