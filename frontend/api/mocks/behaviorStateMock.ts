/**
 * nena-man · frontend/api/mocks/behaviorStateMock.ts
 * Module 4: Behavioral State Detection Mock (Pushpakumara · IT23177246).
 *
 * Integrates camera/face pose metrics, touch interaction latency, and speech fluency
 * to detect child engagement, frustration, or cognitive overload.
 * Delays ~800ms and returns 1 of 3 realistic behavioral classifications.
 */

import type { BehaviorStateInput, BehaviorStateResult } from '../types';

const MOCK_BEHAVIOR_PROFILES: BehaviorStateResult[] = [
  // Profile 1: Attentive & Engaged — no intervention needed
  {
    behavioralState: 'Engaged',
    predictionConfidence: 0.94,
    interventionRequired: false,
    recommendedIntervention: null,
  },
  // Profile 2: Distracted (eyes looking away, high tap intervals) — suggest quick focus game
  {
    behavioralState: 'Distracted',
    predictionConfidence: 0.85,
    interventionRequired: true,
    recommendedIntervention: 'focus_game',
  },
  // Profile 3: Frustrated / Overwhelmed (rapid taps, hesitation, frowning) — suggest calming cooldown
  {
    behavioralState: 'Frustrated',
    predictionConfidence: 0.89,
    interventionRequired: true,
    recommendedIntervention: 'cooldown_activity',
  },
];

/**
 * Mock behavioral state detection endpoint.
 *
 * Note on TODO fields in input:
 * - eyeGaze: placeholder 'center' | 'left' (provisional pending Pushpakumara confirmation)
 * - headPose: placeholder 'forward' (provisional)
 * - bodyPosture: placeholder 'upright' (provisional)
 * - taskCompletion: boolean true/false (provisional)
 *
 * @param input - Multimodal inputs from camera tracking, UI events, and speech metrics
 * @returns Promise resolving to a BehaviorStateResult after 800ms
 */
export async function mockGetBehaviorState(
  input: BehaviorStateInput
): Promise<BehaviorStateResult> {
  // Fast, responsive delay for demo screen recording
  await new Promise((resolve) => setTimeout(resolve, 200));

  const misses = Number(input.missClicks || 0);
  const retries = Number(input.retryCount || 0);
  const wrongAnswers = Number((input as any).totalWrongAnswers || (input as any).consecutiveWrongAnswers || 0);
  const idle = Number(input.idleTime || 0);
  const pauses = Number(input.pauseDuration || 0);
  const fluency = Number(input.fluencyScore ?? 1.0);
  const frustrationProb = Number((input as any).frustration_probability || 0);

  // 1. Priority 1 — Frustrated (Child struggling: 2 wrong answers/miss-clicks, retries, or speech hesitation)
  if (
    misses >= 2 ||
    retries >= 2 ||
    wrongAnswers >= 2 ||
    frustrationProb > 0.5 ||
    pauses > 3.5 ||
    fluency < 0.6
  ) {
    return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[2])); // Frustrated -> Balloon Breathing
  }

  // 2. Priority 2 — Distracted (Inactivity / prolonged idle without touching screen >= 8s)
  if (
    idle >= 8 ||
    (input.lookingAwayFrequency && input.lookingAwayFrequency > 2) ||
    (input.skipFrequency && input.skipFrequency > 0.3)
  ) {
    return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[1])); // Distracted -> Catch the Star
  }

  // 3. Priority 3 — Engaged (Active focused reading / correct answers)
  return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[0])); // Engaged -> Bubble Pop
}

export default mockGetBehaviorState;
