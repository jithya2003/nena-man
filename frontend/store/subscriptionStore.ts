/**
 * nena-man · frontend/store/subscriptionStore.ts
 * In-memory cache of resolved entitlements, keyed by owner uid.
 *
 * Intentionally NOT persisted: the source of truth is the Firestore document
 * (read through subscriptionService, which keeps its own offline cache).
 * Persisting entitlements here would let a plain local-storage edit unlock
 * premium features, and `Infinity` (unlimited child limit) does not survive
 * JSON serialization.
 *
 * Keyed by uid so a child viewing a guardian's dashboard, or one user logging
 * out and another logging in, can never read someone else's entitlement.
 *
 * This is a NEW store; no existing store is modified.
 */

import { create } from 'zustand';
import type { Entitlement } from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';

interface SubscriptionState {
  /** Resolved entitlements by owner uid. */
  entitlements: Record<string, Entitlement>;
  /** Owner uids with a refresh currently in flight. */
  loading: Record<string, boolean>;

  /** Re-resolve the entitlement for `uid` from Firestore (cache fallback). */
  refresh: (uid: string) => Promise<Entitlement>;
  /** Set a known entitlement (e.g. straight after a mock checkout). */
  setEntitlement: (uid: string, entitlement: Entitlement) => void;
  /** Drop everything (e.g. on logout). */
  clear: () => void;
}

export const useSubscriptionStoreBase = create<SubscriptionState>()((set) => ({
  entitlements: {},
  loading: {},

  refresh: async (uid) => {
    set((s) => ({ loading: { ...s.loading, [uid]: true } }));
    try {
      const entitlement = await subscriptionService.resolveEntitlement(uid);
      set((s) => ({
        entitlements: { ...s.entitlements, [uid]: entitlement },
        loading: { ...s.loading, [uid]: false },
      }));
      return entitlement;
    } catch (err) {
      set((s) => ({ loading: { ...s.loading, [uid]: false } }));
      throw err;
    }
  },

  setEntitlement: (uid, entitlement) =>
    set((s) => ({ entitlements: { ...s.entitlements, [uid]: entitlement } })),

  clear: () => set({ entitlements: {}, loading: {} }),
}));
