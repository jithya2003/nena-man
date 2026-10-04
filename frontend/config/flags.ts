/**
 * nena-man · frontend/config/flags.ts
 * Feature flags for toggling mock vs. real backend AI model endpoints.
 *
 * Each of the four AI modules can be independently flipped between mock and real
 * using environment variables. Defaults to true (mock) for all modules.
 */

function parseMockFlag(envValue: string | undefined): boolean {
  if (envValue === undefined || envValue === '') {
    return true; // Default to mock mode
  }
  return envValue.trim().toLowerCase() !== 'false';
}

/** Module 1: Reading Error Analysis (Kulathilaka · IT23175198) */
export const USE_MOCK_READING_ANALYSIS: boolean = parseMockFlag(
  process.env.EXPO_PUBLIC_USE_MOCK_READING_ANALYSIS
);

/** Module 2: Sinhala Text Difficulty (Edirisooriya · IT23179844) */
export const USE_MOCK_TEXT_DIFFICULTY: boolean = parseMockFlag(
  process.env.EXPO_PUBLIC_USE_MOCK_TEXT_DIFFICULTY
);

/** Module 4: Behavioral State Detection (Pushpakumara · IT23177246) */
export const USE_MOCK_BEHAVIOR_STATE: boolean = parseMockFlag(
  process.env.EXPO_PUBLIC_USE_MOCK_BEHAVIOR_STATE
);

/** Module 3: Recommendation Engine (Ranaweera · IT23199712) */
export const USE_MOCK_RECOMMENDATION: boolean = parseMockFlag(
  process.env.EXPO_PUBLIC_USE_MOCK_RECOMMENDATION
);

export const FLAGS = {
  USE_MOCK_READING_ANALYSIS,
  USE_MOCK_TEXT_DIFFICULTY,
  USE_MOCK_BEHAVIOR_STATE,
  USE_MOCK_RECOMMENDATION,
} as const;

export default FLAGS;
