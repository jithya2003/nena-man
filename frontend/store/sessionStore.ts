/**
 * nena-man · frontend/store/sessionStore.ts
 * Persisted store for active reading session end-to-end.
 *
 * Persisted via Zustand's `persist` middleware using AppStorage so an
 * active session survives an app restart or page refresh without losing in-flight state.
 *
 * Lifecycle:
 *   1. startSession(textId)        — creates session ID + timestamps it
 *   2. setCurrentText(text)        — loads the text being read
 *   3. setRecordingStatus(status)  — tracks the audio pipeline state
 *   4. attachResult(module, data)  — stores each module's API response
 *   5. endSession()                — marks session complete (keeps results for review)
 *   6. markAsSaved(sessionId)     — flags that the session has been persisted to Firestore
 *   7. resetSession()              — clears active session state for next run
 *
 * Usage:
 *   import { useSession } from '@/store/hooks';
 *   const { recordingStatus, setRecordingStatus } = useSession();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  RecordingStatus,
  SessionText,
  SessionResults,
  ErrorAnalysisResult,
  TextDifficultyResult,
  BehaviorStateResult,
  RecommendationResult,
} from './types';
import { zustandStorage } from './_storageAdapter';

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
  /** ID of the session after being persisted to Firestore */
  lastSavedSessionId: string | null;
  /** Whether the current session results have been written to Firestore/local storage */
  isSavedToCloud: boolean;

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
   */
  attachResult: <K extends keyof ModuleResultMap>(
    moduleName: K,
    data: ModuleResultMap[K]
  ) => void;

  /** Mark session as done. Keeps results in store for the results screen. */
  endSession: () => void;

  /** Mark that this session has been persisted to Firestore/local DB. */
  markAsSaved: (sessionId: string) => void;

  /** Full reset — clears active session data. Called on logout or new session start. */
  resetSession: () => void;
}

const EMPTY_RESULTS: SessionResults = {
  errorAnalysis: null,
  textDifficulty: null,
  behaviorState: null,
  recommendation: null,
};

/** Generates a unique session ID: timestamp + random alphanumeric chars. */
export const generateSessionId = (): string =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useSessionStoreBase = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      startTime: null,
      currentText: null,
      recordingStatus: 'idle',
      results: { ...EMPTY_RESULTS },
      lastSavedSessionId: null,
      isSavedToCloud: false,

      startSession: (textId) =>
        set({
          sessionId: generateSessionId(),
          startTime: Date.now(),
          currentText: null,
          recordingStatus: 'idle',
          results: { ...EMPTY_RESULTS },
          lastSavedSessionId: null,
          isSavedToCloud: false,
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

      markAsSaved: (savedId: string) =>
        set({
          lastSavedSessionId: savedId,
          isSavedToCloud: true,
        }),

      resetSession: () =>
        set({
          sessionId: null,
          startTime: null,
          currentText: null,
          recordingStatus: 'idle',
          results: { ...EMPTY_RESULTS },
          isSavedToCloud: false,
        }),
    }),
    {
      name: '@nena_man_session_store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        startTime: state.startTime,
        currentText: state.currentText,
        recordingStatus: state.recordingStatus,
        results: state.results,
        lastSavedSessionId: state.lastSavedSessionId,
        isSavedToCloud: state.isSavedToCloud,
      }),
    }
  )
);
