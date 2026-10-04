/**
 * nena-man · frontend/api/sessionPipeline.ts
 * Multi-Module Reading Session Pipeline Orchestrator.
 *
 * Enforces the strict, dependent sequencing order across all four AI modules:
 *
 *   Step 1 (Parallel):
 *     ├── M1: analyzeReading(audioData)
 *     └── M2: analyzeText(textMeta.content, gradeLevel)
 *
 *   Step 2:
 *     └── M4: getBehaviorState(...)
 *         Requires: voice metrics { readingSpeed, hesitationCount, pauseDuration, fluencyScore }
 *                   from M1 merged with camera & touch interaction data.
 *
 *   Step 3:
 *     └── M3: getRecommendation(...)
 *         Requires: readingAccuracy & errorPatternSummary (from M1),
 *                   difficultyLevel (from M2),
 *                   behavioralState (from M4).
 *
 * Automatically attaches each module's result to Zustand's sessionStore as soon
 * as each step resolves, without waiting for the full pipeline to finish.
 * Gracefully handles partial failures instead of throwing on the first error.
 */

import { useSessionStoreBase } from '@/store/sessionStore';
import {
  analyzeReading,
  analyzeText,
  getBehaviorState,
  getRecommendation,
} from './endpoints';
import type {
  ApiError,
  ReadingAnalysisResult,
  TextDifficultyResult,
  BehaviorStateInput,
  BehaviorStateResult,
  RecommendationInput,
  RecommendationResult,
  DifficultyTransition,
} from './types';

export interface CameraInteractionData
  extends Omit<
    BehaviorStateInput,
    'readingSpeed' | 'hesitationCount' | 'pauseDuration' | 'fluencyScore'
  > {}

export interface RecommendationHistoryMeta {
  previousAccuracy?: number;
  responseLatency?: number;
  activityHistory?: string[];
  difficultyHistory?: DifficultyTransition[];
}

export interface PipelineResult {
  readingAnalysis: ReadingAnalysisResult | null;
  textDifficulty: TextDifficultyResult | null;
  behaviorState: BehaviorStateResult | null;
  recommendation: RecommendationResult | null;
  errors: {
    readingAnalysis?: ApiError;
    textDifficulty?: ApiError;
    behaviorState?: ApiError;
    recommendation?: ApiError;
  };
  success: boolean;
}

/**
 * Runs the end-to-end multi-module pipeline for an active reading session.
 *
 * @param audioData - Recorded student voice audio (FormData, Blob, base64, or URI)
 * @param textMeta - The text item being read { id?: string; content: string }
 * @param gradeLevel - Student grade level (e.g. 2, "Grade 2")
 * @param cameraInteractionData - Face tracking, pose, and UI interaction telemetry
 * @param historyMeta - Optional historical accuracy and activity arrays for M3
 * @returns Promise<PipelineResult> with all four results and any step errors
 */
export async function runReadingSessionPipeline(
  audioData: any,
  textMeta: { id?: string; content: string },
  gradeLevel: number | string,
  cameraInteractionData: Partial<CameraInteractionData> = {},
  historyMeta?: RecommendationHistoryMeta
): Promise<PipelineResult> {
  const result: PipelineResult = {
    readingAnalysis: null,
    textDifficulty: null,
    behaviorState: null,
    recommendation: null,
    errors: {},
    success: false,
  };

  // ---------------------------------------------------------------------------
  // Step 1: Run Text Difficulty & Reading Analysis in Parallel
  // ---------------------------------------------------------------------------
  const [textPromise, readingPromise] = await Promise.allSettled([
    analyzeText(textMeta.content, gradeLevel),
    analyzeReading(audioData),
  ]);

  // Handle M2 Text Difficulty result
  if (textPromise.status === 'fulfilled') {
    result.textDifficulty = textPromise.value;
    // Attach to sessionStore as soon as it resolves
    useSessionStoreBase.getState().attachResult('textDifficulty', {
      difficulty: textPromise.value.difficultyLevel,
      support:
        textPromise.value.simplificationNeeded && textPromise.value.simplifiedText
          ? [textPromise.value.simplifiedText]
          : [],
      raw: textPromise.value as any,
    });
  } else {
    result.errors.textDifficulty = textPromise.reason as ApiError;
  }

  // Handle M1 Reading Analysis result
  if (readingPromise.status === 'fulfilled') {
    result.readingAnalysis = readingPromise.value;
    // Attach to sessionStore as soon as it resolves
    useSessionStoreBase.getState().attachResult('errorAnalysis', {
      words: readingPromise.value.words.map((w) => ({
        text: w.text,
        status: w.status === 'correct' ? 'correct' : 'error',
        expected: w.expected,
        confidence: w.confidence,
      })),
      severity: readingPromise.value.severity,
      raw: readingPromise.value as any,
    });
  } else {
    result.errors.readingAnalysis = readingPromise.reason as ApiError;
  }

  // ---------------------------------------------------------------------------
  // Step 2: Behavioral State Detection (Requires M1 voice metrics)
  // ---------------------------------------------------------------------------
  if (result.readingAnalysis) {
    try {
      const behaviorInput: BehaviorStateInput = {
        // Camera / telemetry defaults + overrides
        faceVisibility: cameraInteractionData.faceVisibility ?? true,
        eyeGaze: cameraInteractionData.eyeGaze ?? 'center',
        lookingAwayFrequency: cameraInteractionData.lookingAwayFrequency ?? 0,
        headPose: cameraInteractionData.headPose ?? 'forward',
        blinkRate: cameraInteractionData.blinkRate ?? 16,
        faceDistance: cameraInteractionData.faceDistance ?? 35,
        bodyPosture: cameraInteractionData.bodyPosture ?? 'upright',

        // Voice metrics sourced directly from M1
        readingSpeed: result.readingAnalysis.readingSpeed,
        hesitationCount: result.readingAnalysis.hesitationCount,
        pauseDuration: result.readingAnalysis.pauseDuration,
        fluencyScore: result.readingAnalysis.fluencyScore,
        speakingPattern: cameraInteractionData.speakingPattern ?? 'continuous',

        // Interaction metrics
        responseTime: cameraInteractionData.responseTime ?? 1.2,
        tapSpeed: cameraInteractionData.tapSpeed ?? 280,
        retryCount: cameraInteractionData.retryCount ?? 0,
        missClicks: cameraInteractionData.missClicks ?? 0,
        skipFrequency: cameraInteractionData.skipFrequency ?? 0,
        idleTime: cameraInteractionData.idleTime ?? 0,
        taskCompletion: cameraInteractionData.taskCompletion ?? true,
        interactionPattern: cameraInteractionData.interactionPattern ?? 'focused',
      };

      const behaviorResult = await getBehaviorState(behaviorInput);
      result.behaviorState = behaviorResult;

      // Attach to sessionStore as soon as it resolves
      useSessionStoreBase.getState().attachResult('behaviorState', {
        state: behaviorResult.behavioralState as any,
        confidence: behaviorResult.predictionConfidence,
        intervention: (behaviorResult.recommendedIntervention as any) || null,
        raw: behaviorResult as any,
      });
    } catch (err: any) {
      result.errors.behaviorState = err as ApiError;
    }
  } else {
    // Reading analysis failed — behavior state cannot be computed without acoustic metrics
    result.errors.behaviorState = {
      message: 'Skipped: Behavioral state detection requires reading speech metrics from Module 1',
      isNetworkError: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 3: Recommendation Engine (Requires M1, M2, and M4 results)
  // ---------------------------------------------------------------------------
  const hasReading = Boolean(result.readingAnalysis);
  const hasText = Boolean(result.textDifficulty);
  const hasBehavior = Boolean(result.behaviorState);

  if (hasReading && hasText && hasBehavior) {
    try {
      const recInput: RecommendationInput = {
        readingAccuracy: result.readingAnalysis!.readingAccuracy,
        errorPatternSummary: result.readingAnalysis!.errorPatternSummary,
        difficultyLevel: result.textDifficulty!.difficultyLevel,
        behavioralState: result.behaviorState!.behavioralState,
        responseLatency: historyMeta?.responseLatency ?? 1.2,
        previousAccuracy:
          historyMeta?.previousAccuracy ?? result.readingAnalysis!.readingAccuracy,
        activityHistory: historyMeta?.activityHistory ?? [textMeta.id || 'current_text'],
        difficultyHistory: historyMeta?.difficultyHistory ?? ['Maintain'],
      };

      const recResult = await getRecommendation(recInput);
      result.recommendation = recResult;

      // Attach to sessionStore as soon as it resolves
      useSessionStoreBase.getState().attachResult('recommendation', {
        transition: recResult.difficultyAction,
        nextActivity: recResult.recommendedActivities[0]?.title || 'Next Activity',
        rationale: recResult.rationale,
        raw: recResult as any,
      });
    } catch (err: any) {
      result.errors.recommendation = err as ApiError;
    }
  } else {
    const missing: string[] = [];
    if (!hasReading) missing.push('Reading Analysis (M1)');
    if (!hasText) missing.push('Text Difficulty (M2)');
    if (!hasBehavior) missing.push('Behavior State (M4)');

    result.errors.recommendation = {
      message: `Skipped: Recommendation engine requires missing inputs: ${missing.join(', ')}`,
      isNetworkError: false,
    };
  }

  // Success is true only when all four module steps resolved cleanly
  result.success = Boolean(
    result.readingAnalysis &&
      result.textDifficulty &&
      result.behaviorState &&
      result.recommendation
  );

  return result;
}

export default runReadingSessionPipeline;
