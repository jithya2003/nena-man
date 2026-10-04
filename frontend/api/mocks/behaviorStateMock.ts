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
  await new Promise((resolve) => setTimeout(resolve, 800));

  // If input shows very high pause duration or low fluency, bias towards Frustrated/Distracted
  if (input.pauseDuration > 4 || input.fluencyScore < 0.5) {
    return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[2])); // Frustrated
  }

  if (input.lookingAwayFrequency > 3 || input.idleTime > 5) {
    return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[1])); // Distracted
  }

  const randomIndex = Math.floor(Math.random() * MOCK_BEHAVIOR_PROFILES.length);
  return JSON.parse(JSON.stringify(MOCK_BEHAVIOR_PROFILES[randomIndex]));
}

export default mockGetBehaviorState;
