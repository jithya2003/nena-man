/**
 * nena-man · frontend/hooks/useReadingSession.ts
 * End-to-end reading session orchestration hook.
 *
 * Implements the full reading session lifecycle:
 *   1. Session start: resets & initializes sessionStore with selected text
 *   2. Recording: manages audio recording via useAudioRecorder
 *   3. Offline gating: checks connectivity, queues processing on reconnect
 *   4. Pipeline dispatch: triggers runReadingSessionPipeline on recording completion
 *   5. Progressive loading UX: reactively computes 3-stage loading messages
 *   6. Partial failure handling: non-blocking failure tolerance & individual step retry
 *   7. Session cleanup: cleans up state on finish or screen exit
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSessionStoreBase } from '@/store/sessionStore';
import { useSessionResults, useIsOnline, useCurrentChild } from '@/store/hooks';
import { runReadingSessionPipeline, PipelineResult } from '@/api/sessionPipeline';
import {
  analyzeReading,
  analyzeText,
  getBehaviorState,
  getRecommendation,
} from '@/api/endpoints';
import type {
  ApiError,
  BehaviorStateInput,
  RecommendationInput,
} from '@/api/types';
import { useAudioRecorder } from './useAudioRecorder';
import { useLanguage } from '@/context/LanguageContext';

export type SessionFlowStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'done'
  | 'partial_error'
  | 'error';

export type PipelineModule =
  | 'readingAnalysis'
  | 'textDifficulty'
  | 'behaviorState'
  | 'recommendation';

export interface UseReadingSessionParams {
  text: {
    id: string;
    content: string;
    difficulty?: string;
  };
  gradeLevel?: number | string;
  onSuccess?: () => void;
}

export interface UseReadingSessionReturn {
  // Session State
  sessionStatus: SessionFlowStatus;
  isRecording: boolean;
  isProcessing: boolean;
  isOffline: boolean;
  isOfflineBlocked: boolean;
  loadingStage: 1 | 2 | 3;
  loadingMessage: string;

  // Audio Recording Info
  audioUri: string | null;

  // Pipeline Results & Failures
  results: ReturnType<typeof useSessionResults>;
  errors: Record<PipelineModule, ApiError | undefined>;
  hasIntervention: boolean;
  interventionType: string | null;

  // Actions
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  retryStep: (moduleName: PipelineModule) => Promise<boolean>;
  retryPipeline: () => Promise<void>;
  endSession: () => void;
  resetSession: () => void;
}

export function useReadingSession({
  text,
  gradeLevel: propGradeLevel,
  onSuccess,
}: UseReadingSessionParams): UseReadingSessionReturn {
  const { t } = useLanguage();
  const isOnline = useIsOnline();
  const { currentChild } = useCurrentChild();

  const results = useSessionResults();
  const audioRecorder = useAudioRecorder();

  const [sessionStatus, setSessionStatus] = useState<SessionFlowStatus>('idle');
  const [pipelineErrors, setPipelineErrors] = useState<
    Record<PipelineModule, ApiError | undefined>
  >({
    readingAnalysis: undefined,
    textDifficulty: undefined,
    behaviorState: undefined,
    recommendation: undefined,
  });

  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);
  const [pendingOfflineAudioUri, setPendingOfflineAudioUri] = useState<string | null>(null);
  const [isRetryingModule, setIsRetryingModule] = useState<PipelineModule | null>(null);

  // Resolved grade level (from props, child profile, or default to Grade 2)
  const effectiveGradeLevel = useMemo(() => {
    if (propGradeLevel !== undefined) return propGradeLevel;
    if (currentChild?.gradeLevel) return currentChild.gradeLevel;
    return 2;
  }, [propGradeLevel, currentChild?.gradeLevel]);

  // ---------------------------------------------------------------------------
  // 1. Reactive Progressive Loading Stage Calculation
  // ---------------------------------------------------------------------------
  // Stage 1: analyzeReading and analyzeText running in parallel
  // Stage 2: getBehaviorState running (requires M1 voice metrics)
  // Stage 3: getRecommendation running (requires M1, M2, M4)
  const loadingStage: 1 | 2 | 3 = useMemo(() => {
    if (results.behaviorState) return 3;
    if (results.errorAnalysis || results.textDifficulty) return 2;
    return 1;
  }, [results.errorAnalysis, results.textDifficulty, results.behaviorState]);

  const loadingMessage = useMemo(() => {
    switch (loadingStage) {
      case 1:
        return t('session.loading.stage1');
      case 2:
        return t('session.loading.stage2');
      case 3:
        return t('session.loading.stage3');
      default:
        return t('state.loading.default');
    }
  }, [loadingStage, t]);

  // ---------------------------------------------------------------------------
  // 2. Behavioral Intervention Detection
  // ---------------------------------------------------------------------------
  const hasIntervention = Boolean(
    results.behaviorState?.intervention ||
      (results.behaviorState?.raw as any)?.interventionRequired
  );

  const interventionType = useMemo(() => {
    if (!results.behaviorState) return null;
    return (
      (results.behaviorState.intervention as string) ||
      (results.behaviorState.raw as any)?.recommendedIntervention ||
      null
    );
  }, [results.behaviorState]);

  // ---------------------------------------------------------------------------
  // 3. Pipeline Execution Trigger
  // ---------------------------------------------------------------------------
  const executePipeline = useCallback(
    async (audioUriToProcess: string) => {
      setSessionStatus('processing');
      useSessionStoreBase.getState().setRecordingStatus('uploading');

      try {
        const pipelineResult: PipelineResult = await runReadingSessionPipeline(
          audioUriToProcess,
          { id: text.id, content: text.content },
          effectiveGradeLevel,
          // TODO: Pushpakumara's module owns populating this camera/interaction telemetry later
          {}
        );

        setPipelineErrors({
          readingAnalysis: pipelineResult.errors.readingAnalysis,
          textDifficulty: pipelineResult.errors.textDifficulty,
          behaviorState: pipelineResult.errors.behaviorState,
          recommendation: pipelineResult.errors.recommendation,
        });

        // Evaluate partial failure rules:
        // Rule 1: If analyzeReading succeeded, always show reading results regardless of downstream failures
        if (pipelineResult.readingAnalysis) {
          useSessionStoreBase.getState().setRecordingStatus('done');

          // If recommendation failed, set partial_error so UI can show inline retry without blocking
          if (pipelineResult.errors.recommendation) {
            setSessionStatus('partial_error');
          } else {
            setSessionStatus('done');
          }

          onSuccess?.();
        } else {
          // Reading analysis itself failed — block to full error state
          useSessionStoreBase.getState().setRecordingStatus('error');
          setSessionStatus('error');
        }
      } catch (err: any) {
        console.error('Unhandled session pipeline execution error:', err);
        useSessionStoreBase.getState().setRecordingStatus('error');
        setSessionStatus('error');
      }
    },
    [text.id, text.content, effectiveGradeLevel, onSuccess]
  );

  // ---------------------------------------------------------------------------
  // 4. Session Start & Audio Recording
  // ---------------------------------------------------------------------------
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Initialize session in store if starting anew
    useSessionStoreBase.getState().startSession(text.id);
    useSessionStoreBase.getState().setCurrentText({
      id: text.id,
      content: text.content,
      difficulty: (text.difficulty as any) || 'medium',
    });

    setPipelineErrors({
      readingAnalysis: undefined,
      textDifficulty: undefined,
      behaviorState: undefined,
      recommendation: undefined,
    });

    const started = await audioRecorder.startRecording();
    if (started) {
      setSessionStatus('recording');
      useSessionStoreBase.getState().setRecordingStatus('recording');
      return true;
    }
    return false;
  }, [text.id, text.content, text.difficulty, audioRecorder]);

  const stopRecording = useCallback(async () => {
    const uri = await audioRecorder.stopRecording();
    if (!uri) return;

    setLastAudioUri(uri);

    // Offline check: If offline, don't attempt pipeline. Queue attempt and show offline state.
    if (!isOnline) {
      setPendingOfflineAudioUri(uri);
      setSessionStatus('idle');
      return;
    }

    // Online: automatically trigger pipeline
    await executePipeline(uri);
  }, [audioRecorder, isOnline, executePipeline]);

  // ---------------------------------------------------------------------------
  // 5. Offline Auto-Resume when Connectivity Restored
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isOnline && pendingOfflineAudioUri && sessionStatus === 'idle') {
      const uriToRetry = pendingOfflineAudioUri;
      setPendingOfflineAudioUri(null);
      executePipeline(uriToRetry);
    }
  }, [isOnline, pendingOfflineAudioUri, sessionStatus, executePipeline]);

  // ---------------------------------------------------------------------------
  // 6. Granular Partial Failure Step Retry
  // ---------------------------------------------------------------------------
  const retryStep = useCallback(
    async (moduleName: PipelineModule): Promise<boolean> => {
      setIsRetryingModule(moduleName);

      try {
        switch (moduleName) {
          case 'readingAnalysis': {
            if (!lastAudioUri) return false;
            const res = await analyzeReading(lastAudioUri);
            useSessionStoreBase.getState().attachResult('errorAnalysis', {
              words: res.words.map((w) => ({
                text: w.text,
                status: w.status === 'correct' ? 'correct' : 'error',
                expected: w.expected,
                confidence: w.confidence,
              })),
              severity: res.severity,
              raw: res as any,
            });
            setPipelineErrors((prev) => ({ ...prev, readingAnalysis: undefined }));
            if (sessionStatus === 'error') {
              setSessionStatus('done');
            }
            return true;
          }

          case 'textDifficulty': {
            const res = await analyzeText(text.content, effectiveGradeLevel);
            useSessionStoreBase.getState().attachResult('textDifficulty', {
              difficulty: res.difficultyLevel,
              support:
                res.simplificationNeeded && res.simplifiedText
                  ? [res.simplifiedText]
                  : [],
              raw: res as any,
            });
            setPipelineErrors((prev) => ({ ...prev, textDifficulty: undefined }));
            return true;
          }

          case 'behaviorState': {
            const currentResults = useSessionStoreBase.getState().results;
            const m1Raw = currentResults.errorAnalysis?.raw;
            const behaviorInput: BehaviorStateInput = {
              faceVisibility: true,
              eyeGaze: 'center',
              lookingAwayFrequency: 0,
              headPose: 'forward',
              blinkRate: 16,
              faceDistance: 35,
              bodyPosture: 'upright',
              readingSpeed: m1Raw?.readingSpeed ?? 30,
              hesitationCount: m1Raw?.hesitationCount ?? 1,
              pauseDuration: m1Raw?.pauseDuration ?? 1.2,
              fluencyScore: m1Raw?.fluencyScore ?? 75,
              speakingPattern: 'continuous',
              responseTime: 1.2,
              tapSpeed: 280,
              retryCount: 0,
              missClicks: 0,
              skipFrequency: 0,
              idleTime: 0,
              taskCompletion: true,
              interactionPattern: 'focused',
            };

            const res = await getBehaviorState(behaviorInput);
            useSessionStoreBase.getState().attachResult('behaviorState', {
              state: res.behavioralState as any,
              confidence: res.predictionConfidence,
              intervention: (res.recommendedIntervention as any) || null,
              raw: res as any,
            });
            setPipelineErrors((prev) => ({ ...prev, behaviorState: undefined }));
            return true;
          }

          case 'recommendation': {
            const currentResults = useSessionStoreBase.getState().results;
            const m1Raw = currentResults.errorAnalysis?.raw;
            const m2Raw = currentResults.textDifficulty?.raw;
            const m4Raw = currentResults.behaviorState?.raw;

            const recInput: RecommendationInput = {
              readingAccuracy: m1Raw?.readingAccuracy ?? 80,
              errorPatternSummary: m1Raw?.errorPatternSummary ?? 'Mild hesitation',
              difficultyLevel: m2Raw?.difficultyLevel ?? 'Medium',
              behavioralState: m4Raw?.behavioralState ?? 'Engaged',
              responseLatency: 1.2,
              previousAccuracy: m1Raw?.readingAccuracy ?? 80,
              activityHistory: [text.id],
              difficultyHistory: ['Maintain'],
            };

            const res = await getRecommendation(recInput);
            useSessionStoreBase.getState().attachResult('recommendation', {
              transition: res.difficultyAction,
              nextActivity: res.recommendedActivities[0]?.title || 'Next Activity',
              rationale: res.rationale,
              raw: res as any,
            });
            setPipelineErrors((prev) => ({ ...prev, recommendation: undefined }));
            setSessionStatus('done');
            return true;
          }
        }
      } catch (err: any) {
        console.error(`Retry failed for module ${moduleName}:`, err);
        setPipelineErrors((prev) => ({ ...prev, [moduleName]: err }));
        return false;
      } finally {
        setIsRetryingModule(null);
      }
    },
    [lastAudioUri, text.id, text.content, effectiveGradeLevel, sessionStatus]
  );

  const retryPipeline = useCallback(async () => {
    if (lastAudioUri) {
      await executePipeline(lastAudioUri);
    }
  }, [lastAudioUri, executePipeline]);

  // ---------------------------------------------------------------------------
  // 7. Session Completion and Reset
  // ---------------------------------------------------------------------------
  const endSession = useCallback(() => {
    useSessionStoreBase.getState().endSession();
  }, []);

  const resetSession = useCallback(() => {
    useSessionStoreBase.getState().resetSession();
    audioRecorder.resetRecording();
    setSessionStatus('idle');
    setLastAudioUri(null);
    setPendingOfflineAudioUri(null);
    setPipelineErrors({
      readingAnalysis: undefined,
      textDifficulty: undefined,
      behaviorState: undefined,
      recommendation: undefined,
    });
  }, [audioRecorder]);

  return {
    sessionStatus,
    isRecording: sessionStatus === 'recording' || audioRecorder.isRecording,
    isProcessing: sessionStatus === 'processing',
    isOffline: !isOnline,
    isOfflineBlocked: Boolean(pendingOfflineAudioUri && !isOnline),
    loadingStage,
    loadingMessage,
    audioUri: lastAudioUri,
    results,
    errors: pipelineErrors,
    hasIntervention,
    interventionType,
    startRecording,
    stopRecording,
    retryStep,
    retryPipeline,
    endSession,
    resetSession,
  };
}

export default useReadingSession;
