/**
 * nena-man · frontend/config/subscriptionFlags.ts
 * Feature flag for mocked vs. real subscription payments.
 *
 * Deliberately a SEPARATE file from config/flags.ts: subscriptions are
 * orthogonal to the AI-module mock flags and must never interfere with them.
 *
 * Defaults to true (mock). Real payment processing is not implemented.
 */

function parseMockFlag(envValue: string | undefined): boolean {
  if (envValue === undefined || envValue === '') {
    return true; // Default to mock mode
  }
  return envValue.trim().toLowerCase() !== 'false';
}

/** When true, "checkout" is simulated and no real payment is processed. */
export const USE_MOCK_SUBSCRIPTION: boolean = parseMockFlag(
  process.env.EXPO_PUBLIC_USE_MOCK_SUBSCRIPTION
);

export const SUBSCRIPTION_FLAGS = {
  USE_MOCK_SUBSCRIPTION,
} as const;

export default SUBSCRIPTION_FLAGS;
