/**
 * nena-man · frontend/types/session.ts
 * Firestore Schema & Data Types for Persisted Reading Sessions.
 *
 * Firestore Document Path: sessions/{sessionId}
 *
 * Encapsulates end-to-end reading execution records including:
 *   - Metadata: sessionId, childId, childName, textId, textContent, timestamps
 *   - Nested results from all four AI modules:
 *       1. M1: Speech reading error analysis & voice metrics
 *       2. M2: Sinhala text difficulty & simplification
 *       3. M4: Multimodal behavioral state & engagement detection
 *       4. M3: Adaptive recommendation engine & next activity rationale
 */

import type { DifficultyLevel, BehaviorState, Intervention } from './index';

export interface ErrorWordItem {
  text: string;
  status: 'correct' | 'error';
  expected: string;
  confidence: number;
}

export interface DetectedErrorItem {
  type: string;
  word: string;
  detected: string;
  severity: number;
  explanation?: string;
  tip?: string;
}

/** Nested results from Module 1 (Speech Classifier) */
export interface PersistedErrorAnalysisResult {
  accuracy: number; // 0 – 100 percentage
  severity: number; // 0.0 – 1.0 overall severity
  errorCount: number;
  readingSpeed: number; // words per minute (WPM)
  pauseDuration: number; // seconds
  hesitationCount: number;
  fluencyScore: number; // 0 – 100
  words: ErrorWordItem[];
  errors: DetectedErrorItem[];
  transcription?: string;
  raw?: any;
}

/** Nested results from Module 2 (Text Difficulty) */
export interface PersistedTextDifficultyResult {
  difficultyLevel: DifficultyLevel | 'Easy' | 'Medium' | 'Hard';
  support: string[];
  simplificationNeeded?: boolean;
  simplifiedText?: string | null;
  ruleApplied?: string;
  raw?: any;
}

/** Nested results from Module 4 (Behavioral Detection) */
export interface PersistedBehaviorStateResult {
  behavioralState: string | BehaviorState;
  predictionConfidence: number; // 0.0 – 1.0
  interventionRequired: boolean;
  recommendedIntervention: string | Intervention | null;
  engagementScore?: number;
  fatigueLevel?: number;
  voiceMetrics?: {
    readingSpeed?: number;
    hesitationCount?: number;
    pauseDuration?: number;
    fluencyScore?: number;
  };
  raw?: any;
}

/** Nested results from Module 3 (Recommendation Engine) */
export interface PersistedRecommendationResult {
  difficultyAction: 'Decrease' | 'Maintain' | 'Increase';
  nextActivity: string;
  recommendedActivities: Array<{
    activityId: string;
    title: string;
    rank: number;
  }>;
  rationale: string[];
  raw?: any;
}

/** Nested module results object inside sessions/{sessionId} */
export interface PersistedModuleResults {
  errorAnalysis: PersistedErrorAnalysisResult | null;
  textDifficulty: PersistedTextDifficultyResult | null;
  behaviorState: PersistedBehaviorStateResult | null;
  recommendation: PersistedRecommendationResult | null;
}

/**
 * Root Firestore document structure for collection `sessions/{sessionId}`
 */
export interface ReadingSessionRecord {
  /** Unique session ID (matches document ID in Firestore) */
  sessionId: string;
  /** ID of the child who completed the session */
  childId: string;
  /** Display name of the child (denormalized for faster parent/teacher dashboard queries) */
  childName?: string;
  /** Identifier of the text/sentence read (e.g. 'text_001') */
  textId: string;
  /** The original Sinhala sentence or passage content */
  textContent?: string;
  /** Session start timestamp in milliseconds since epoch */
  startTime: number;
  /** Session completion timestamp in milliseconds since epoch */
  endTime: number;
  /** Total reading session duration in seconds */
  durationSeconds: number;
  /** Overall session completion status */
  status: 'completed' | 'partial' | 'error';
  /** Stars awarded for this session (1 to 3) */
  starsEarned?: number;
  /** Overall accuracy score (0 - 100) denormalized from M1 for fast chart indexing */
  overallAccuracy?: number;
  /** ISO-8601 creation string for indexing and sorting */
  createdAt: string;
  /** Nested results from all 4 research modules */
  results: PersistedModuleResults;
  /** Offline synchronization flag */
  synced?: boolean;
}
