/**
 * nena-man · frontend/hooks/useEntitlement.ts
 * The single hook screens use to ask "what is this account allowed to do?".
 *
 * Whose entitlement? The OWNER of the data being viewed:
 *   - parent / teacher  -> their own account
 *   - child (viewing the parent dashboard) -> the active guardian
 *     (`childStore.currentGuardian`), never the child's own account.
 *
 * LIMITATION: entitlement is checked client-side only; Firestore Spark plan has
 * no Cloud Functions for server-side verification. Acceptable for
 * mocked/research-phase subscriptions; would need Cloud Functions + Blaze plan,
 * or a separate backend check, for real payment enforcement.
 *
 * @example
 *   const { isPremium, canUse, canAddChild } = useEntitlement();
 *   if (!canUse('recommendations_hub')) return <PremiumGate feature="recommendations_hub" />;
 */

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChildStoreBase } from '@/store/childStore';
import { useSubscriptionStoreBase } from '@/store/subscriptionStore';
import { FREE_ENTITLEMENT } from '@/services/subscriptionService';
import { PREMIUM_FEATURES } from '@/constants/subscriptionPlans';
import type { Entitlement, PremiumFeature } from '@/types/subscription';

export interface UseEntitlementResult {
  entitlement: Entitlement;
  plan: Entitlement['plan'];
  isPremium: boolean;
  /** Max linkable child accounts (`Infinity` = unlimited). */
  childLimit: number;
  /** false until the first resolution for this owner has completed. */
  isResolved: boolean;
  isLoading: boolean;
  /** uid whose entitlement is being evaluated (undefined = nobody). */
  ownerUid?: string;
  canUse: (feature: PremiumFeature) => boolean;
  /** true if one more child can be linked given the current count. */
  canAddChild: (currentChildCount: number) => boolean;
  refresh: () => Promise<Entitlement | undefined>;
}

export function useEntitlement(ownerUidOverride?: string): UseEntitlementResult {
  const { user } = useAuth();
  const currentGuardian = useChildStoreBase((s) => s.currentGuardian);

  const ownerUid =
    ownerUidOverride ??
    (user?.role === 'child' && currentGuardian?.uid ? currentGuardian.uid : user?.uid);

  const resolved = useSubscriptionStoreBase((s) => (ownerUid ? s.entitlements[ownerUid] : undefined));
  const isLoading = useSubscriptionStoreBase((s) => (ownerUid ? !!s.loading[ownerUid] : false));
  const refreshStore = useSubscriptionStoreBase((s) => s.refresh);

  const refresh = useCallback(async () => {
    if (!ownerUid) return undefined;
    try {
      return await refreshStore(ownerUid);
    } catch (err) {
      console.warn('[useEntitlement] refresh failed:', err);
      return undefined;
    }
  }, [ownerUid, refreshStore]);

  useEffect(() => {
    if (ownerUid) void refresh();
  }, [ownerUid, refresh]);

  const entitlement = resolved ?? FREE_ENTITLEMENT;

  const canUse = useCallback(
    (feature: PremiumFeature) => entitlement.isPremium && PREMIUM_FEATURES.includes(feature),
    [entitlement]
  );

  const canAddChild = useCallback(
    (currentChildCount: number) => currentChildCount < entitlement.childLimit,
    [entitlement]
  );

  return {
    entitlement,
    plan: entitlement.plan,
    isPremium: entitlement.isPremium,
    childLimit: entitlement.childLimit,
    isResolved: !!resolved,
    isLoading,
    ownerUid,
    canUse,
    canAddChild,
    refresh,
  };
}

export default useEntitlement;
