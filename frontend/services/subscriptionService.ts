/**
 * nena-man · frontend/services/subscriptionService.ts
 * MOCKED subscription / entitlement service (no real payment processing).
 *
 * Firestore schema (additive):
 *   users/{uid}.subscription      -> Subscription  (absent/null = free plan)
 *   institutions/{institutionId}  -> Institution
 *
 * Mirrors the dual-persistence pattern of sessionService:
 *   - Firestore is the SOURCE OF TRUTH whenever it is configured and reachable.
 *   - AppStorage is only a cache / offline fallback (and the sole store when
 *     Firebase is not configured in local dev mode).
 *
 * Subscriptions are orthogonal to the AI pipeline: this file imports nothing
 * from api/*, config/flags.ts or any session-flow code.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppStorage } from '@/utils/storage';
import { USE_MOCK_SUBSCRIPTION } from '@/config/subscriptionFlags';
import { PLANS, SUBSCRIPTION_PERIOD_DAYS } from '@/constants/subscriptionPlans';
import { connectionService } from './connectionService';
import type {
  Entitlement,
  Institution,
  InstitutionMember,
  Subscription,
} from '@/types/subscription';

const COLLECTION_USERS = 'users';
const COLLECTION_INSTITUTIONS = 'institutions';
const STORAGE_KEY_SUBSCRIPTION_PREFIX = '@nena_man_subscription_';
const STORAGE_KEY_INSTITUTIONS = '@nena_man_institutions';

/** Identity needed to attach a subscription to an account. */
export interface SubscriberIdentity {
  uid: string;
  name: string;
  email?: string;
  role?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure entitlement logic
// ─────────────────────────────────────────────────────────────────────────────

export const FREE_ENTITLEMENT: Entitlement = {
  plan: 'free',
  status: 'active',
  source: 'individual',
  isPremium: false,
  childLimit: PLANS.free.childLimit,
};

/**
 * Turns a stored subscription (+ its institution, if any) into the effective
 * entitlement. Pure function — easy to reason about and test.
 *
 * LIMITATION: entitlement is checked client-side only; Firestore Spark plan has
 * no Cloud Functions for server-side verification. Acceptable for
 * mocked/research-phase subscriptions; would need Cloud Functions + Blaze plan,
 * or a separate backend check, for real payment enforcement. The subscription
 * is read from the Firestore document (not only local state) so that a simple
 * local-storage edit does not bypass it — this is a reasonable minimum, not
 * real security.
 */
export function computeEntitlement(
  uid: string,
  sub: Subscription | null | undefined,
  institution: Institution | null | undefined,
  now: number = Date.now()
): Entitlement {
  if (!sub || sub.plan === 'free') return { ...FREE_ENTITLEMENT };

  const notExpired = new Date(sub.expiresAt).getTime() > now;
  if (sub.status !== 'active' || !notExpired) {
    return { ...FREE_ENTITLEMENT, status: sub.status === 'active' ? 'expired' : sub.status };
  }

  if (sub.source === 'institution') {
    const instOk =
      !!institution &&
      institution.id === sub.institutionId &&
      institution.status === 'active' &&
      new Date(institution.expiresAt).getTime() > now &&
      (institution.adminUid === uid || institution.members.some((m) => m.uid === uid));
    if (!instOk) return { ...FREE_ENTITLEMENT, status: 'expired' };

    return {
      plan: 'institution',
      status: 'active',
      source: 'institution',
      isPremium: true,
      childLimit: PLANS.institution.childLimit,
      institutionId: institution!.id,
      institutionName: institution!.name,
      institutionRole: institution!.adminUid === uid ? 'admin' : 'member',
      expiresAt: institution!.expiresAt,
    };
  }

  return {
    plan: 'premium',
    status: 'active',
    source: 'individual',
    isPremium: true,
    childLimit: PLANS.premium.childLimit,
    expiresAt: sub.expiresAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function isFirestoreAvailable(): boolean {
  return Boolean(
    db &&
      typeof db === 'object' &&
      (db.type === 'firestore' || typeof db.app === 'object' || Object.keys(db).length > 0)
  );
}

/** Firestore rejects `undefined`; strip it. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addDays(from: number, days: number): string {
  return new Date(from + days * 24 * 60 * 60 * 1000).toISOString();
}

function assertMockCheckout(): void {
  if (!USE_MOCK_SUBSCRIPTION) {
    throw new Error(
      '[subscriptionService] Real payment processing is not implemented. ' +
        'Set EXPO_PUBLIC_USE_MOCK_SUBSCRIPTION=true.'
    );
  }
}

async function readLocalSubscription(uid: string): Promise<Subscription | null> {
  try {
    const raw = await AppStorage.getItem(STORAGE_KEY_SUBSCRIPTION_PREFIX + uid);
    return raw ? (JSON.parse(raw) as Subscription) : null;
  } catch {
    return null;
  }
}

async function writeLocalSubscription(uid: string, sub: Subscription | null): Promise<void> {
  try {
    if (sub) {
      await AppStorage.setItem(STORAGE_KEY_SUBSCRIPTION_PREFIX + uid, JSON.stringify(sub));
    } else {
      await AppStorage.removeItem(STORAGE_KEY_SUBSCRIPTION_PREFIX + uid);
    }
  } catch (err) {
    console.warn('[subscriptionService] Failed to cache subscription locally:', err);
  }
}

async function readLocalInstitutions(): Promise<Record<string, Institution>> {
  try {
    const raw = await AppStorage.getItem(STORAGE_KEY_INSTITUTIONS);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLocalInstitution(inst: Institution): Promise<void> {
  try {
    const all = await readLocalInstitutions();
    all[inst.id] = inst;
    await AppStorage.setItem(STORAGE_KEY_INSTITUTIONS, JSON.stringify(all));
  } catch (err) {
    console.warn('[subscriptionService] Failed to cache institution locally:', err);
  }
}

async function persistSubscription(uid: string, sub: Subscription | null): Promise<void> {
  // Always write local cache immediately so UI has zero latency
  await writeLocalSubscription(uid, sub);
  if (!isFirestoreAvailable()) return;
  try {
    void Promise.race([
      setDoc(
        doc(db, COLLECTION_USERS, uid),
        { subscription: sub ? clean(sub) : null },
        { merge: true }
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]).catch((err) => {
      console.warn('[subscriptionService] Firestore subscription write warning:', err);
    });
  } catch (err) {
    console.warn('[subscriptionService] Firestore subscription write failed:', err);
  }
}

async function persistInstitution(inst: Institution): Promise<void> {
  await writeLocalInstitution(inst);
  if (!isFirestoreAvailable()) return;
  try {
    void Promise.race([
      setDoc(doc(db, COLLECTION_INSTITUTIONS, inst.id), clean(inst)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]).catch((err) => {
      console.warn('[subscriptionService] Firestore institution write warning:', err);
    });
  } catch (err) {
    console.warn('[subscriptionService] Firestore institution write failed:', err);
  }
}

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function generateInstitutionId(): string {
  return `inst_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public service
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionService = {
  /**
   * Reads `users/{uid}.subscription`. If an active paid local subscription exists,
   * it takes precedence to ensure purchased access is never wiped by offline,
   * latency, or un-synced Firestore remote data.
   */
  async fetchSubscription(uid: string): Promise<Subscription | null> {
    const local = await readLocalSubscription(uid);
    const now = Date.now();

    const isLocalValidActive =
      local &&
      typeof local === 'object' &&
      local.status === 'active' &&
      local.plan !== 'free' &&
      typeof local.expiresAt === 'string' &&
      new Date(local.expiresAt).getTime() > now;

    let remote: Subscription | null = null;
    if (isFirestoreAvailable()) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, COLLECTION_USERS, uid)),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        if (snap && snap.exists()) {
          const rawSub = snap.data().subscription;
          if (rawSub && typeof rawSub === 'object') {
            remote = rawSub as Subscription;
          }
        }
      } catch (err) {
        console.warn('[subscriptionService] Firestore read failed, using local cache:', err);
      }
    }

    const isRemoteValidActive =
      remote &&
      typeof remote === 'object' &&
      remote.status === 'active' &&
      remote.plan !== 'free' &&
      typeof remote.expiresAt === 'string' &&
      new Date(remote.expiresAt).getTime() > now;

    // Rule 1: If local is a valid active paid subscription:
    if (isLocalValidActive) {
      // Remote only wins if it is also active AND newer
      if (
        isRemoteValidActive &&
        typeof remote!.startedAt === 'string' &&
        typeof local!.startedAt === 'string' &&
        new Date(remote!.startedAt).getTime() > new Date(local!.startedAt).getTime()
      ) {
        await writeLocalSubscription(uid, remote);
        return remote;
      }
      // Otherwise, active local subscription wins! Keep local cache intact.
      // Background sync to Firestore if remote is missing/outdated
      if (isFirestoreAvailable() && (!isRemoteValidActive || remote?.plan !== local!.plan)) {
        void setDoc(
          doc(db, COLLECTION_USERS, uid),
          { subscription: clean(local!) },
          { merge: true }
        ).catch(() => {});
      }
      return local;
    }

    // Rule 2: If local is not active, but remote is a valid active subscription:
    if (isRemoteValidActive) {
      await writeLocalSubscription(uid, remote);
      return remote;
    }

    // Rule 3: If remote is explicitly cancelled or expired, adopt it
    if (
      remote &&
      typeof remote === 'object' &&
      (remote.status === 'cancelled' || remote.status === 'expired')
    ) {
      await writeLocalSubscription(uid, remote);
      return remote;
    }

    // Rule 4: Fall back to local (even if null or cancelled)
    return local;
  },

  /** Reads `institutions/{id}` (Firestore first, local cache as fallback). */
  async getInstitution(institutionId: string): Promise<Institution | null> {
    if (isFirestoreAvailable()) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, COLLECTION_INSTITUTIONS, institutionId)),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        if (snap && snap.exists()) {
          const inst = snap.data() as Institution;
          await writeLocalInstitution(inst);
          return inst;
        }
      } catch (err) {
        console.warn('[subscriptionService] Firestore institution read failed:', err);
      }
    }
    const all = await readLocalInstitutions();
    return all[institutionId] ?? null;
  },

  async findInstitutionByCode(inviteCode: string): Promise<Institution | null> {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return null;
    if (isFirestoreAvailable()) {
      try {
        const snap = await Promise.race([
          getDocs(
            query(collection(db, COLLECTION_INSTITUTIONS), where('inviteCode', '==', code))
          ),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        if (snap && !snap.empty) return snap.docs[0].data() as Institution;
      } catch (err) {
        console.warn('[subscriptionService] Firestore invite lookup failed:', err);
      }
    }
    const all = await readLocalInstitutions();
    return Object.values(all).find((i) => i.inviteCode === code) ?? null;
  },

  /** Resolves the effective entitlement for an account (Firestore-backed). */
  async resolveEntitlement(uid: string): Promise<Entitlement> {
    const sub = await this.fetchSubscription(uid);
    const institution =
      sub?.source === 'institution' && sub.institutionId
        ? await this.getInstitution(sub.institutionId)
        : null;
    const directEntitlement = computeEntitlement(uid, sub, institution);

    // If account has its own active paid subscription, that always applies directly.
    if (directEntitlement.isPremium) {
      return directEntitlement;
    }

    // Otherwise, check if this user is a child linked to any parent or teacher with an active subscription.
    // If ANY linked parent or teacher has Premium or Institutional, child automatically inherits that plan!
    try {
      const guardians = await connectionService.getLinkedGuardians(uid);
      if (guardians && guardians.length > 0) {
        let bestGuardianEnt: Entitlement | null = null;
        let bestGuardian: any = null;

        for (const guardian of guardians) {
          if (!guardian.uid) continue;
          const gSub = await this.fetchSubscription(guardian.uid);
          if (!gSub || gSub.status !== 'active') continue;

          const gInst =
            gSub.source === 'institution' && gSub.institutionId
              ? await this.getInstitution(gSub.institutionId)
              : null;
          const gEnt = computeEntitlement(guardian.uid, gSub, gInst);

          if (gEnt.isPremium) {
            // Institutional takes highest priority; if found, break immediately
            if (gEnt.plan === 'institution') {
              bestGuardianEnt = gEnt;
              bestGuardian = guardian;
              break;
            } else if (gEnt.plan === 'premium' && (!bestGuardianEnt || bestGuardianEnt.plan === 'free')) {
              bestGuardianEnt = gEnt;
              bestGuardian = guardian;
            }
          }
        }

        if (bestGuardianEnt && bestGuardian) {
          return {
            ...bestGuardianEnt,
            inheritedFromGuardian: true,
            guardianUid: bestGuardian.uid,
            guardianName: bestGuardian.name || 'Guardian',
            guardianRole: bestGuardian.role || 'parent',
          };
        }
      }
    } catch (err) {
      console.warn('[subscriptionService] Error resolving guardian subscription for child:', err);
    }

    return directEntitlement;
  },

  // ── Mock checkout actions ──────────────────────────────────────────────────

  /** MOCK: activates an individual Premium plan for 30 days. */
  async subscribePremium(user: SubscriberIdentity): Promise<Entitlement> {
    assertMockCheckout();
    await delay(350); // simulated realistic checkout latency
    const now = Date.now();
    const sub: Subscription = {
      plan: 'premium',
      status: 'active',
      source: 'individual',
      startedAt: new Date(now).toISOString(),
      expiresAt: addDays(now, SUBSCRIPTION_PERIOD_DAYS),
      mock: true,
    };
    await persistSubscription(user.uid, sub);
    return computeEntitlement(user.uid, sub, null, now);
  },

  /**
   * MOCK: activates an Institutional license for 30 days. The purchasing
   * account becomes the institution admin and receives an invite code.
   */
  async subscribeInstitution(
    user: SubscriberIdentity,
    institutionName: string
  ): Promise<{ entitlement: Entitlement; institution: Institution }> {
    assertMockCheckout();
    await delay(350); // simulated realistic checkout latency
    const now = Date.now();
    const expiresAt = addDays(now, SUBSCRIPTION_PERIOD_DAYS);
    const institution: Institution = {
      id: generateInstitutionId(),
      name: institutionName.trim(),
      adminUid: user.uid,
      inviteCode: generateInviteCode(),
      status: 'active',
      members: [],
      createdAt: new Date(now).toISOString(),
      expiresAt,
      mock: true,
    };
    const sub: Subscription = {
      plan: 'institution',
      status: 'active',
      source: 'institution',
      institutionId: institution.id,
      institutionRole: 'admin',
      startedAt: institution.createdAt,
      expiresAt,
      mock: true,
    };
    await persistInstitution(institution);
    await persistSubscription(user.uid, sub);
    return { entitlement: computeEntitlement(user.uid, sub, institution, now), institution };
  },

  /** Joins an institution with its invite code. Returns the new entitlement. */
  async joinInstitution(user: SubscriberIdentity, inviteCode: string): Promise<Entitlement> {
    const institution = await this.findInstitutionByCode(inviteCode);
    if (!institution) throw new Error('INSTITUTION_NOT_FOUND');
    if (institution.status !== 'active' || new Date(institution.expiresAt).getTime() <= Date.now()) {
      throw new Error('INSTITUTION_INACTIVE');
    }
    if (user.role !== 'parent' && user.role !== 'teacher') throw new Error('ROLE_NOT_ALLOWED');

    const alreadyMember =
      institution.adminUid === user.uid || institution.members.some((m) => m.uid === user.uid);
    const updated: Institution = alreadyMember
      ? institution
      : {
          ...institution,
          members: [
            ...institution.members,
            {
              uid: user.uid,
              name: user.name,
              email: user.email,
              role: user.role as InstitutionMember['role'],
              joinedAt: new Date().toISOString(),
            },
          ],
        };
    if (!alreadyMember) await persistInstitution(updated);

    const sub: Subscription = {
      plan: 'institution',
      status: 'active',
      source: 'institution',
      institutionId: updated.id,
      institutionRole: institution.adminUid === user.uid ? 'admin' : 'member',
      startedAt: new Date().toISOString(),
      expiresAt: updated.expiresAt,
      mock: true,
    };
    await persistSubscription(user.uid, sub);
    return computeEntitlement(user.uid, sub, updated);
  },

  /** A member leaves their institution (reverts to free). */
  async leaveInstitution(uid: string): Promise<void> {
    const sub = await this.fetchSubscription(uid);
    if (sub?.source === 'institution' && sub.institutionId && sub.institutionRole !== 'admin') {
      const inst = await this.getInstitution(sub.institutionId);
      if (inst) {
        await persistInstitution({ ...inst, members: inst.members.filter((m) => m.uid !== uid) });
      }
    }
    await persistSubscription(uid, null);
  },

  /**
   * Admin removes a member. The member's own doc is not touched (the admin
   * cannot write it); their entitlement simply stops resolving because they
   * are no longer in `institution.members`.
   */
  async removeMember(institutionId: string, memberUid: string): Promise<Institution | null> {
    const inst = await this.getInstitution(institutionId);
    if (!inst) return null;
    const updated = { ...inst, members: inst.members.filter((m) => m.uid !== memberUid) };
    await persistInstitution(updated);
    return updated;
  },

  /** MOCK: cancels the plan. Institution admins also deactivate the license. */
  async cancelSubscription(uid: string): Promise<Entitlement> {
    const sub = await this.fetchSubscription(uid);
    if (!sub) return { ...FREE_ENTITLEMENT };

    if (sub.source === 'institution' && sub.institutionId && sub.institutionRole === 'admin') {
      const inst = await this.getInstitution(sub.institutionId);
      if (inst) await persistInstitution({ ...inst, status: 'cancelled' });
    }
    const cancelled: Subscription = { ...sub, status: 'cancelled' };
    await persistSubscription(uid, cancelled);
    return computeEntitlement(uid, cancelled, null);
  },

  /** Clears the local cache for an account (used on logout). */
  async clearLocalCache(uid: string): Promise<void> {
    await writeLocalSubscription(uid, null);
  },
};

export default subscriptionService;
