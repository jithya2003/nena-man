/**
 * nena-man · frontend/store/types.ts
 * Shared TypeScript types for all Zustand stores.
 * Re-uses existing types/index.ts where possible — no duplication.
 */

// Re-export existing types used across stores
export type {
  UserRole,
  Child,
  DifficultyLevel,
  BehaviorState,
  Intervention,
  M1Response,
  M2Response,
  M3Response,
  M4Response,
} from '@/types';

// ── Auth Store ────────────────────────────────────────────────────────────────

/** Lightweight user snapshot held by authStore (no Firebase internals). */
export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: 'parent' | 'teacher' | 'child';
}

// ── Child Store ───────────────────────────────────────────────────────────────

/** Matches the existing Child interface from types/index.ts exactly. */
export type { Child as ChildProfile } from '@/types';

// ── Session Store ─────────────────────────────────────────────────────────────

export type RecordingStatus = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

/** A reading text item loaded for an active session. */
export interface SessionText {
  id: string;
  content: string;
  difficulty: import('@/types').DifficultyLevel;
}

/** Four module result shapes — aliases to the full M1–M4 response types. */

/** M1: Speech Error Classifier results. */
export interface ErrorAnalysisResult {
  words: Array<{
    text: string;
    status: 'correct' | 'error';
    expected: string;
    confidence: number;
  }>;
  /** 0.0 – 1.0 overall reading severity */
  severity: number;
  /** Full M1 payload for screens that need more detail */
  raw?: import('@/types').M1Response;
}

/** M2: Text Difficulty & Simplification results. */
export interface TextDifficultyResult {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  support: string[];
  /** Full M2 payload for screens that need more detail */
  raw?: import('@/types').M2Response;
}

/** M4: Behavioral State Detection results. */
export interface BehaviorStateResult {
  state: import('@/types').BehaviorState;
  confidence: number;
  intervention: import('@/types').Intervention | null;
  /** Full M4 payload for screens that need more detail */
  raw?: import('@/types').M4Response;
}

/** M3: Adaptive Recommendation Engine results. */
export interface RecommendationResult {
  transition: 'Decrease' | 'Maintain' | 'Increase';
  nextActivity: string;
  rationale: string[];
  /** Full M3 payload for screens that need more detail */
  raw?: import('@/types').M3Response;
}

/** All four module results bundled inside a session. */
export interface SessionResults {
  errorAnalysis: ErrorAnalysisResult | null;
  textDifficulty: TextDifficultyResult | null;
  behaviorState: BehaviorStateResult | null;
  recommendation: RecommendationResult | null;
}

// ── Settings Store ────────────────────────────────────────────────────────────

export interface AccessibilitySettings {
  highContrast: boolean;
  dyslexiaFont: boolean;
}
