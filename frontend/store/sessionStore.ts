/**
 * nena-man · frontend/store/sessionStore.ts
 * In-memory store for one active reading session end-to-end.
 *
 * NOT persisted — a session is live, in-flight state only.
 * If the app restarts mid-recording the session is cleanly discarded.
 *
 * Lifecycle:
 *   1. startSession(textId)        — creates session ID + timestamps it
 *   2. setCurrentText(text)        — loads the text being read
 *   3. setRecordingStatus(status)  — tracks the audio pipeline state
 *   4. attachResult(module, data)  — stores each module's API response
 *   5. endSession()                — marks session complete (keeps results for review)
 *   6. resetSession()              — full wipe (called on logout or new session start)
 *
 * Usage:
 *   import { useSession } from '@/store/hooks';
 *   const { recordingStatus, setRecordingStatus } = useSession();
 */

import { create } from 'zustand';
import type {
  RecordingStatus,
  SessionText,
  SessionResults,
  ErrorAnalysisResult,
  TextDifficultyResult,
  BehaviorStateResult,
  RecommendationResult,
} from './types';

/** Maps module names to their result types for type-safe attachResult(). */
type ModuleResultMap = {
  errorAnalysis: ErrorAnalysisResult;
  textDifficulty: TextDifficultyResult;
  behaviorState: BehaviorStateResult;
  recommendation: RecommendationResult;
};

interface SessionState {
  /** Unique ID generated when a session starts. */
  sessionId: string | null;
  /** Unix timestamp (ms) when the session started. */
  startTime: number | null;
  /** The text item the child is reading in this session. */
  currentText: SessionText | null;
  /** Current state of the audio recording pipeline. */
  recordingStatus: RecordingStatus;
  /** Results from each of the four analysis modules. */
  results: SessionResults;

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Begin a new session for a given text ID.
   * Resets any previous session data first.
   */
  startSession: (textId: string) => void;

  /** Load the full text object once fetched from the API. */
  setCurrentText: (text: SessionText) => void;

  /** Update the audio pipeline status (idle → recording → uploading → done | error). */
  setRecordingStatus: (status: RecordingStatus) => void;

  /**
   * Attach a module's result to the session.
   * Type-safe: TypeScript infers the correct result shape from the module name.
   *
   * Example:
   *   attachResult('errorAnalysis', { words: [...], severity: 0.3 });
   */
  attachResult: <K extends keyof ModuleResultMap>(
    moduleName: K,
    data: ModuleResultMap[K]
  ) => void;

  /** Mark session as done. Keeps results in store for the results screen. */
  endSession: () => void;

  /** Full reset — clears all session data. Called on logout or new session start. */
  resetSession: () => void;
}

const EMPTY_RESULTS: SessionResults = {
  errorAnalysis: null,
  textDifficulty: null,
  behaviorState: null,
  recommendation: null,
};

/** Generates a lightweight session ID: timestamp + 4 random chars. */
const generateSessionId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useSessionStoreBase = create<SessionState>()((set) => ({
  sessionId: null,
  startTime: null,
  currentText: null,
  recordingStatus: 'idle',
  results: { ...EMPTY_RESULTS },

  startSession: (textId) =>
    set({
      sessionId: generateSessionId(),
      startTime: Date.now(),
      currentText: null, // set later via setCurrentText once text is loaded
      recordingStatus: 'idle',
      results: { ...EMPTY_RESULTS },
      // textId is embedded in the sessionId structure for tracing — store it
      // on currentText once available.
      _pendingTextId: textId,
    } as Partial<SessionState> & { _pendingTextId: string }),

  setCurrentText: (text) => set({ currentText: text }),

  setRecordingStatus: (status) => set({ recordingStatus: status }),

  attachResult: (moduleName, data) =>
    set((state) => ({
      results: {
        ...state.results,
        [moduleName]: data,
      },
    })),

  endSession: () => set({ recordingStatus: 'done' }),

  resetSession: () =>
    set({
      sessionId: null,
      startTime: null,
      currentText: null,
      recordingStatus: 'idle',
      results: { ...EMPTY_RESULTS },
    }),
}));
