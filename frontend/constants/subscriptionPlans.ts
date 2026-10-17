/**
 * nena-man · frontend/constants/subscriptionPlans.ts
 * Static plan catalog for the three-tier model.
 *
 * Feature access is identical for `premium` and `institution`; the ONLY
 * structural difference is the child-account limit (10 vs unlimited).
 * Human-readable names/descriptions come from translations.ts (t()), keyed
 * by `nameKey` / `taglineKey` — no display strings are hardcoded here.
 */

import type { PlanId, PremiumFeature } from '@/types/subscription';

export const SUBSCRIPTION_CURRENCY = 'Rs.';
export const SUBSCRIPTION_PERIOD_DAYS = 30;

export interface PlanDefinition {
  id: PlanId;
  /** Monthly price in LKR. */
  monthlyPrice: number;
  /** Max linked child accounts. `Infinity` = unlimited. */
  childLimit: number;
  nameKey: string;
  taglineKey: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    monthlyPrice: 0,
    childLimit: 1,
    nameKey: 'subscription.plan.free.name',
    taglineKey: 'subscription.plan.free.tagline',
  },
  premium: {
    id: 'premium',
    monthlyPrice: 999,
    childLimit: 10,
    nameKey: 'subscription.plan.premium.name',
    taglineKey: 'subscription.plan.premium.tagline',
  },
  institution: {
    id: 'institution',
    monthlyPrice: 3000,
    childLimit: Infinity,
    nameKey: 'subscription.plan.institution.name',
    taglineKey: 'subscription.plan.institution.tagline',
  },
};

/** Features unlocked by any active paid plan (premium or institution). */
export const PREMIUM_FEATURES: readonly PremiumFeature[] = [
  'recommendations_hub',
  'full_session_history',
  'error_deep_dive',
  'pdf_report_export',
  'teacher_analytics',
];

/** Number of most-recent sessions free users can still see in history. */
export const FREE_SESSION_HISTORY_LIMIT = 3;
