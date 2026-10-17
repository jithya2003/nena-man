/**
 * nena-man · frontend/types/subscription.ts
 * Types for the three-tier subscription model (free / premium / institution).
 *
 * Firestore shape:
 *   users/{uid}.subscription          -> Subscription   (optional; absent = free)
 *   institutions/{institutionId}      -> Institution
 */

/** The three plans. The only structural difference between `premium` and
 *  `institution` is the child-account limit (10 vs unlimited). */
export type PlanId = 'free' | 'premium' | 'institution';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

/** Where the entitlement comes from. */
export type SubscriptionSource = 'individual' | 'institution';

/** Role of the user inside an institution license. */
export type InstitutionRole = 'admin' | 'member';

/** Individually-gated capabilities. Free users have none of these. */
export type PremiumFeature =
  | 'recommendations_hub'
  | 'full_session_history'
  | 'error_deep_dive'
  | 'pdf_report_export'
  | 'teacher_analytics';

/** Stored on `users/{uid}.subscription`. */
export interface Subscription {
  plan: PlanId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  /** Present when source === 'institution'. */
  institutionId?: string;
  institutionRole?: InstitutionRole;
  /** ISO-8601 strings. */
  startedAt: string;
  expiresAt: string;
  /** True while payments are simulated (no real payment processing). */
  mock: boolean;
}

export interface InstitutionMember {
  uid: string;
  name: string;
  email?: string;
  role: 'parent' | 'teacher';
  joinedAt: string;
}

/** Stored on `institutions/{institutionId}`. */
export interface Institution {
  id: string;
  name: string;
  adminUid: string;
  /** Short code members enter to join the license. */
  inviteCode: string;
  status: SubscriptionStatus;
  members: InstitutionMember[];
  createdAt: string;
  expiresAt: string;
  mock: boolean;
}

/**
 * The resolved, ready-to-use view of what a user may access.
 * Computed by `resolveEntitlement` — never stored directly.
 */
export interface Entitlement {
  plan: PlanId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  /** true for any paid, active plan (premium or institution). */
  isPremium: boolean;
  /** Max child accounts that may be linked. `Infinity` = unlimited. */
  childLimit: number;
  institutionId?: string;
  institutionName?: string;
  institutionRole?: InstitutionRole;
  expiresAt?: string;
  /** True if this entitlement was inherited from a linked parent or teacher account. */
  inheritedFromGuardian?: boolean;
  guardianUid?: string;
  guardianName?: string;
  guardianRole?: string;
}
