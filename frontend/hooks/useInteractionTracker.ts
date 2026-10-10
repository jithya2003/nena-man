/**
 * nena-man · frontend/hooks/useInteractionTracker.ts
 * Module 4: Child UI Interaction & Telemetry Tracker (Pushpakumara · IT23177246)
 *
 * Tracks touch telemetry during reading/quiz sessions with ZERO React re-render overhead:
 *  - responseTime: latency (in seconds) between prompt display and first touch/action
 *  - tapSpeed: average inter-tap interval (in milliseconds)
 *  - retryCount: frequency of restarts/retries
 *  - missClicks: off-target or accidental taps
 *  - skipFrequency: questions or tasks skipped
 *  - idleTime: cumulative seconds without interaction
 *  - interactionPattern: classified behavioral pattern ('focused' | 'hesitant' | 'erratic' | 'normal')
 *
 * All state is ref-based to preserve 60 FPS touch responsiveness and eliminate touch lag.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';

export interface InteractionMetrics {
  responseTime: number; // in seconds
  tapSpeed: number; // in milliseconds (inter-tap interval)
  retryCount: number;
  missClicks: number;
  skipFrequency: number;
  idleTime: number; // in seconds
  taskCompletion: boolean;
  interactionPattern: 'focused' | 'hesitant' | 'erratic' | 'normal';
}

export interface UseInteractionTrackerOptions {
  autoStart?: boolean;
  idleThresholdSeconds?: number;
  onIdleWarning?: () => void;
}

export function useInteractionTracker(options: UseInteractionTrackerOptions = {}) {
  const { autoStart = true, idleThresholdSeconds = 4, onIdleWarning } = options;

  const metricsRef = useRef<InteractionMetrics>({
    responseTime: 0,
    tapSpeed: 280, // default baseline ~280ms
    retryCount: 0,
    missClicks: 0,
    skipFrequency: 0,
    idleTime: 0,
    taskCompletion: false,
    interactionPattern: 'focused',
  });

  const startTimeRef = useRef<number>(Date.now());
  const firstInteractionRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const tapHistoryRef = useRef<number[]>([]);
  const retryCountRef = useRef<number>(0);
  const missClicksRef = useRef<number>(0);
  const skipCountRef = useRef<number>(0);
  const idleTimeRef = useRef<number>(0);
  const taskCompletionRef = useRef<boolean>(false);
  const isTrackingActiveRef = useRef<boolean>(autoStart);

  // Helper: compute behavioral pattern from raw counters
  const computePattern = useCallback(
    (
      avgTapSpeed: number,
      idleSec: number,
      retries: number,
      misses: number
    ): 'focused' | 'hesitant' | 'erratic' | 'normal' => {
      if (misses >= 3 || (avgTapSpeed < 150 && misses >= 1)) {
        return 'erratic';
      }
      if (idleSec >= 6 || retries >= 3 || avgTapSpeed > 600) {
        return 'hesitant';
      }
      if (idleSec <= 2 && retries <= 1 && misses === 0) {
        return 'focused';
      }
      return 'normal';
    },
    []
  );

  // Periodic timer: accumulates idleTime silently in ref without triggering re-renders
  useEffect(() => {
    if (!isTrackingActiveRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAction = (now - lastInteractionRef.current) / 1000;

      if (timeSinceLastAction >= idleThresholdSeconds) {
        idleTimeRef.current += 1;
        metricsRef.current.idleTime = Math.round(idleTimeRef.current);
        metricsRef.current.interactionPattern = computePattern(
          metricsRef.current.tapSpeed,
          idleTimeRef.current,
          retryCountRef.current,
          missClicksRef.current
        );
        onIdleWarning?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [idleThresholdSeconds, onIdleWarning, computePattern]);

  // Record a standard UI tap (button click, word select, etc.) without re-rendering
  const recordTap = useCallback(() => {
    const now = Date.now();
    lastInteractionRef.current = now;

    // Record response time on first action
    if (firstInteractionRef.current === null) {
      firstInteractionRef.current = now;
      const initialResponseTimeSec = Math.max(
        0.3,
        Number(((now - startTimeRef.current) / 1000).toFixed(2))
      );
      metricsRef.current.responseTime = initialResponseTimeSec;
    }

    // Maintain recent tap timestamps (last 8 taps)
    tapHistoryRef.current.push(now);
    if (tapHistoryRef.current.length > 8) {
      tapHistoryRef.current.shift();
    }

    // Calculate inter-tap interval speed
    let calculatedTapSpeed = 280;
    if (tapHistoryRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapHistoryRef.current.length; i++) {
        intervals.push(tapHistoryRef.current[i] - tapHistoryRef.current[i - 1]);
      }
      const sum = intervals.reduce((a, b) => a + b, 0);
      calculatedTapSpeed = Math.round(sum / intervals.length);
    }

    metricsRef.current.tapSpeed = calculatedTapSpeed;
    metricsRef.current.interactionPattern = computePattern(
      calculatedTapSpeed,
      idleTimeRef.current,
      retryCountRef.current,
      missClicksRef.current
    );
  }, [computePattern]);

  // Record a retry action (audio re-record, card reset, etc.)
  const recordRetry = useCallback(() => {
    retryCountRef.current += 1;
    lastInteractionRef.current = Date.now();
    metricsRef.current.retryCount = retryCountRef.current;
    metricsRef.current.interactionPattern = computePattern(
      metricsRef.current.tapSpeed,
      idleTimeRef.current,
      retryCountRef.current,
      missClicksRef.current
    );
  }, [computePattern]);

  // Record miss-clicks (tapping empty container, wrong tile, outside boundary)
  const recordMissClick = useCallback(() => {
    missClicksRef.current += 1;
    lastInteractionRef.current = Date.now();
    metricsRef.current.missClicks = missClicksRef.current;
    metricsRef.current.interactionPattern = computePattern(
      metricsRef.current.tapSpeed,
      idleTimeRef.current,
      retryCountRef.current,
      missClicksRef.current
    );
  }, [computePattern]);

  // Record a skip action
  const recordSkip = useCallback(() => {
    skipCountRef.current += 1;
    lastInteractionRef.current = Date.now();
    metricsRef.current.skipFrequency = skipCountRef.current;
  }, []);

  // Mark task completion status
  const setTaskCompletion = useCallback((completed: boolean) => {
    taskCompletionRef.current = completed;
    metricsRef.current.taskCompletion = completed;
  }, []);

  // Reset tracking state (e.g. for next sentence or exercise)
  const resetTracker = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    firstInteractionRef.current = null;
    lastInteractionRef.current = now;
    tapHistoryRef.current = [];
    retryCountRef.current = 0;
    missClicksRef.current = 0;
    skipCountRef.current = 0;
    idleTimeRef.current = 0;
    taskCompletionRef.current = false;

    metricsRef.current = {
      responseTime: 0,
      tapSpeed: 280,
      retryCount: 0,
      missClicks: 0,
      skipFrequency: 0,
      idleTime: 0,
      taskCompletion: false,
      interactionPattern: 'focused',
    };
  }, []);

  // Export current snapshot ready for sessionPipeline / BehaviorStateInput
  const getTelemetry = useCallback((): InteractionMetrics => {
    const now = Date.now();
    const finalResponse =
      firstInteractionRef.current !== null
        ? Number(((firstInteractionRef.current - startTimeRef.current) / 1000).toFixed(2))
        : Number(((now - startTimeRef.current) / 1000).toFixed(2));

    return {
      responseTime: Math.max(0.2, finalResponse),
      tapSpeed: metricsRef.current.tapSpeed || 280,
      retryCount: retryCountRef.current,
      missClicks: missClicksRef.current,
      skipFrequency: skipCountRef.current,
      idleTime: Math.round(idleTimeRef.current),
      taskCompletion: taskCompletionRef.current,
      interactionPattern: metricsRef.current.interactionPattern,
    };
  }, []);

  const getMetrics = useCallback(() => metricsRef.current, []);

  return useMemo(
    () => ({
      metrics: metricsRef.current,
      getMetrics,
      recordTap,
      recordRetry,
      recordMissClick,
      recordSkip,
      setTaskCompletion,
      resetTracker,
      getTelemetry,
    }),
    [
      getMetrics,
      recordTap,
      recordRetry,
      recordMissClick,
      recordSkip,
      setTaskCompletion,
      resetTracker,
      getTelemetry,
    ]
  );
}

export default useInteractionTracker;
