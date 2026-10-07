/**
 * nena-man · frontend/services/sessionService.ts
 * Real Firestore & Local Persistence Service for Completed Reading Sessions.
 *
 * Implements the `sessions/{sessionId}` Firestore schema:
 *   sessions/{sessionId}
 *     ├── sessionId: string
 *     ├── childId: string
 *     ├── childName: string (optional)
 *     ├── textId: string
 *     ├── textContent: string (optional)
 *     ├── startTime: number (timestamp ms)
 *     ├── endTime: number (timestamp ms)
 *     ├── durationSeconds: number
 *     ├── status: 'completed' | 'partial' | 'error'
 *     ├── starsEarned: number
 *     ├── overallAccuracy: number
 *     ├── createdAt: ISO-8601 string
 *     └── results:
 *         ├── errorAnalysis (M1)
 *         ├── textDifficulty (M2)
 *         ├── behaviorState (M4)
 *         └── recommendation (M3)
 *
 * Handles:
 *   1. Writing completed session data to Firestore (collection: 'sessions').
 *   2. Dual-persistence: saves locally to AppStorage ('@nena_man_saved_sessions')
 *      ensuring offline resilience and immediate zero-latency dashboard rendering.
 *   3. Updating child progress stats (totalSessions, stars, latestAccuracy, lastActive).
 *   4. Querying session history for child progress reports and parent/teacher dashboards.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ReadingSessionRecord, SessionData } from '@/types';
import { AppStorage } from '@/utils/storage';

const COLLECTION_SESSIONS = 'sessions';
const COLLECTION_USERS = 'users';
const STORAGE_KEY_SAVED_SESSIONS = '@nena_man_saved_sessions';

/** Helper to read all locally cached sessions from AppStorage */
async function getLocalSavedSessions(): Promise<ReadingSessionRecord[]> {
  try {
    const raw = await AppStorage.getItem(STORAGE_KEY_SAVED_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[sessionService] Failed to parse local sessions:', err);
    return [];
  }
}

/** Helper to persist an array of sessions to AppStorage */
async function setLocalSavedSessions(sessions: ReadingSessionRecord[]): Promise<void> {
  try {
    await AppStorage.setItem(STORAGE_KEY_SAVED_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn('[sessionService] Failed to save sessions locally:', err);
  }
}

export const sessionService = {
  /**
   * Save a completed reading session to Firestore (sessions/{sessionId})
   * and mirror to local storage for offline support and immediate UI updates.
   */
  async saveCompletedSession(
    sessionRecord: ReadingSessionRecord
  ): Promise<{ success: boolean; id: string; isOffline?: boolean }> {
    const sessionId = sessionRecord.sessionId;
    if (!sessionId) {
      throw new Error('[sessionService] sessionId is required to persist session');
    }

    // 1. Immediately cache locally so UI updates with zero delay
    let isOffline = false;
    try {
      const localList = await getLocalSavedSessions();
      const existingIdx = localList.findIndex((s) => s.sessionId === sessionId);
      const recordToStore: ReadingSessionRecord = {
        ...sessionRecord,
        synced: false,
      };

      if (existingIdx >= 0) {
        localList[existingIdx] = recordToStore;
      } else {
        localList.unshift(recordToStore);
      }
      await setLocalSavedSessions(localList);
    } catch (localErr) {
      console.warn('[sessionService] Local storage write warning:', localErr);
    }

    // 2. Persist to Firestore: sessions/{sessionId}
    try {
      if (db && typeof db.collection === 'function' || (db && Object.keys(db).length > 0)) {
        const sessionDocRef = doc(db, COLLECTION_SESSIONS, sessionId);
        
        // Sanitize record for Firestore (strip any undefined values)
        const sanitized: Record<string, any> = {
          sessionId: sessionRecord.sessionId,
          childId: sessionRecord.childId,
          childName: sessionRecord.childName || '',
          textId: sessionRecord.textId,
          textContent: sessionRecord.textContent || '',
          startTime: sessionRecord.startTime,
          endTime: sessionRecord.endTime,
          durationSeconds: sessionRecord.durationSeconds,
          status: sessionRecord.status,
          starsEarned: sessionRecord.starsEarned ?? 3,
          overallAccuracy: sessionRecord.overallAccuracy ?? 80,
          createdAt: sessionRecord.createdAt || new Date().toISOString(),
          results: {
            errorAnalysis: sessionRecord.results.errorAnalysis
              ? {
                  accuracy: sessionRecord.results.errorAnalysis.accuracy,
                  severity: sessionRecord.results.errorAnalysis.severity,
                  errorCount: sessionRecord.results.errorAnalysis.errorCount,
                  readingSpeed: sessionRecord.results.errorAnalysis.readingSpeed,
                  pauseDuration: sessionRecord.results.errorAnalysis.pauseDuration,
                  hesitationCount: sessionRecord.results.errorAnalysis.hesitationCount,
                  fluencyScore: sessionRecord.results.errorAnalysis.fluencyScore,
                  words: sessionRecord.results.errorAnalysis.words || [],
                  errors: sessionRecord.results.errorAnalysis.errors || [],
                  transcription: sessionRecord.results.errorAnalysis.transcription || '',
                }
              : null,
            textDifficulty: sessionRecord.results.textDifficulty
              ? {
                  difficultyLevel: sessionRecord.results.textDifficulty.difficultyLevel,
                  support: sessionRecord.results.textDifficulty.support || [],
                  simplificationNeeded: Boolean(sessionRecord.results.textDifficulty.simplificationNeeded),
                  simplifiedText: sessionRecord.results.textDifficulty.simplifiedText || null,
                  ruleApplied: sessionRecord.results.textDifficulty.ruleApplied || '',
                }
              : null,
            behaviorState: sessionRecord.results.behaviorState
              ? {
                  behavioralState: sessionRecord.results.behaviorState.behavioralState,
                  predictionConfidence: sessionRecord.results.behaviorState.predictionConfidence,
                  interventionRequired: Boolean(sessionRecord.results.behaviorState.interventionRequired),
                  recommendedIntervention: sessionRecord.results.behaviorState.recommendedIntervention || null,
                  engagementScore: sessionRecord.results.behaviorState.engagementScore ?? 80,
                  fatigueLevel: sessionRecord.results.behaviorState.fatigueLevel ?? 0.2,
                  voiceMetrics: sessionRecord.results.behaviorState.voiceMetrics || {},
                }
              : null,
            recommendation: sessionRecord.results.recommendation
              ? {
                  difficultyAction: sessionRecord.results.recommendation.difficultyAction,
                  nextActivity: sessionRecord.results.recommendation.nextActivity || '',
                  recommendedActivities: sessionRecord.results.recommendation.recommendedActivities || [],
                  rationale: sessionRecord.results.recommendation.rationale || [],
                }
              : null,
          },
          synced: true,
        };

        await setDoc(sessionDocRef, sanitized, { merge: true });

        // Update local cache flag to synced: true
        const localList = await getLocalSavedSessions();
        const updated = localList.map((s) =>
          s.sessionId === sessionId ? { ...s, synced: true } : s
        );
        await setLocalSavedSessions(updated);

        // 3. Atomically update child's profile stats if childId exists
        if (sessionRecord.childId) {
          try {
            const userDocRef = doc(db, COLLECTION_USERS, sessionRecord.childId);
            await updateDoc(userDocRef, {
              totalSessions: increment(1),
              stars: increment(sessionRecord.starsEarned ?? 3),
              latestAccuracy: sessionRecord.overallAccuracy ?? 80,
              lastActive: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } catch (profileUpdateErr) {
            // Profile doc might not exist in dev mock mode; safe to swallow
            console.info('[sessionService] Notice: Child profile doc not updated:', profileUpdateErr);
          }
        }

        console.info(`[sessionService] ✅ Successfully persisted session ${sessionId} to Firestore.`);
        return { success: true, id: sessionId, isOffline: false };
      }
    } catch (firestoreErr) {
      console.warn('[sessionService] Firestore write failed, stored offline locally:', firestoreErr);
      isOffline = true;
    }

    return { success: true, id: sessionId, isOffline: true };
  },

  /**
   * Fetch all completed sessions for a specific child.
   * Merges Firestore records with locally cached records.
   */
  async getChildSessions(
    childId: string,
    limitCount: number = 20
  ): Promise<ReadingSessionRecord[]> {
    const localSessions = await getLocalSavedSessions();
    const filteredLocal = childId
      ? localSessions.filter((s) => s.childId === childId || s.childId === 'child_default')
      : localSessions;

    try {
      if (db && typeof db.collection === 'function' || (db && Object.keys(db).length > 0)) {
        const sessionsRef = collection(db, COLLECTION_SESSIONS);
        let q = childId
          ? query(sessionsRef, where('childId', '==', childId), limit(limitCount))
          : query(sessionsRef, limit(limitCount));

        const snap = await getDocs(q);
        if (!snap.empty) {
          const firestoreSessions = snap.docs.map((d) => d.data() as ReadingSessionRecord);

          // Merge Firestore + local, removing duplicates
          const seen = new Set<string>();
          const merged: ReadingSessionRecord[] = [];

          for (const s of [...firestoreSessions, ...filteredLocal]) {
            if (s.sessionId && !seen.has(s.sessionId)) {
              seen.add(s.sessionId);
              merged.push(s);
            }
          }

          // Sort descending by startTime
          merged.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
          return merged;
        }
      }
    } catch (err) {
      console.warn('[sessionService] Could not fetch sessions from Firestore, using local cache:', err);
    }

    // Return local cache sorted descending
    return filteredLocal.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  },

  /**
   * Convert ReadingSessionRecord items into lightweight SessionData items
   * for backwards-compatible charts and summary tables.
   */
  toSessionData(record: ReadingSessionRecord): SessionData {
    const errorAnalysis = record.results.errorAnalysis;
    const behaviorState = record.results.behaviorState;

    return {
      id: record.sessionId,
      date: new Date(record.startTime).toISOString().split('T')[0],
      textId: record.textId,
      accuracy: record.overallAccuracy ?? errorAnalysis?.accuracy ?? 80,
      durationSeconds: record.durationSeconds || 60,
      errorCount: errorAnalysis?.errorCount ?? errorAnalysis?.errors?.length ?? 0,
      behaviorState: (behaviorState?.behavioralState as any) || 'focused',
      starsEarned: record.starsEarned ?? 3,
    };
  },

  /**
   * Sync any pending offline sessions to Firestore once online.
   */
  async syncPendingOfflineSessions(): Promise<number> {
    const local = await getLocalSavedSessions();
    const unsynced = local.filter((s) => !s.synced);
    if (unsynced.length === 0) return 0;

    let syncedCount = 0;
    for (const item of unsynced) {
      try {
        const res = await this.saveCompletedSession(item);
        if (!res.isOffline) {
          syncedCount++;
        }
      } catch (err) {
        console.warn(`[sessionService] Failed to sync session ${item.sessionId}:`, err);
      }
    }
    return syncedCount;
  },

  /**
   * Clear all locally cached sessions (useful for test resets).
   */
  async clearLocalSessions(): Promise<void> {
    await AppStorage.removeItem(STORAGE_KEY_SAVED_SESSIONS);
  },
};

export default sessionService;
