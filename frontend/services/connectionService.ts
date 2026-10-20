/**
 * nena-man · frontend/services/connectionService.ts
 * Real Firestore & Storage integration for Parent/Teacher <-> Student connections.
 * Handles sending pairing requests, accepting/declining requests, and managing linked accounts.
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ConnectionRequest, LinkedPerson, UserProfile, UserRole } from '@/types';
import { AppStorage } from '@/utils/storage';

const COLLECTION_REQUESTS = 'connection_requests';
const COLLECTION_USERS = 'users';

export function deriveStudentCode(uid: string): string {
  if (!uid) return 'NM-0000';
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = clean.slice(-4).toUpperCase().padStart(4, 'X');
  return `NM-${suffix}`;
}

export const connectionService = {
  /**
   * Derive or format a student's pairing code
   */
  getStudentCode(uid: string, customCode?: string): string {
    if (customCode && customCode.trim()) return customCode.trim();
    return deriveStudentCode(uid);
  },

  /**
   * Send a connection request from a Parent or Teacher to a Child
   */
  async sendConnectionRequest(params: {
    sender: UserProfile;
    childEmailOrCode: string;
    relationship?: string;
  }): Promise<ConnectionRequest> {
    const { sender, childEmailOrCode, relationship } = params;
    const input = childEmailOrCode.trim();

    if (!input) {
      throw new Error('කරුණාකර ශිෂ්‍යයාගේ විද්‍යුත් තැපෑල හෝ ශිෂ්‍ය කේතය ඇතුළත් කරන්න. (Please enter the student email or code.)');
    }

    if (input.toLowerCase() === sender.email.toLowerCase()) {
      throw new Error('ඔබගේම ගිණුමට සම්බන්ධතා ඉල්ලීම් යැවිය නොහැක. (Cannot send connection request to yourself.)');
    }

    // Guard against unconfigured Firebase environment
    if ((auth as any)?.isFallback) {
      throw new Error(
        'Firebase සේවාව සකසා නොමැත. සිසුන් සම්බන්ධ කිරීම සඳහා කරුණාකර frontend/.env ගොනුවේ Firebase credentials ඇතුළත් කරන්න. (Firebase is unconfigured. Real Firebase credentials in frontend/.env are required to link student accounts.)'
      );
    }

    // 1. Locate student in Firestore via privacy-safe student_codes lookup
    if (input.includes('@')) {
      throw new Error(
        'විද්‍යුත් තැපෑල මගින් සම්බන්ධ කිරීම පෞද්ගලිකත්ව ආරක්ෂාව හේතුවෙන් තාවකාලිකව අත්හිටුවා ඇත. කරුණාකර ශිෂ්‍ය කේතය (Student Code) භාවිත කරන්න. (Email-based linking is temporarily disabled for privacy safety. Please use the Student Code.)'
      );
    }

    const formattedCode = input.toUpperCase().trim();
    let childUid = '';

    try {
      const codeDocRef = doc(db, 'student_codes', formattedCode);
      const codeSnap = await getDoc(codeDocRef);

      if (!codeSnap.exists()) {
        throw new Error(
          'මෙම කේතයට අදාළ ශිෂ්‍ය ගිණුමක් හමු නොවීය. කරුණාකර නිවැරදි ශිෂ්‍ය කේතය පරීක්ෂා කරන්න. (No student account found with this student code.)'
        );
      }

      const codeData = codeSnap.data();
      childUid = codeData.childUid;
    } catch (err: any) {
      if (err.message && (err.message.includes('මෙම කේතයට') || err.message.includes('විද්‍යුත් තැපෑල'))) {
        throw err;
      }
      console.warn('[connectionService] student_codes search error:', err);
      if (err?.code === 'permission-denied') {
        throw new Error(
          'ශිෂ්‍ය කේතය පරීක්ෂා කිරීමට අවසර නොමැත. (Permission denied accessing student code in Firestore.)'
        );
      }
      if (err?.code === 'unavailable' || err?.message?.includes('network')) {
        throw new Error(
          'ජාල දෝෂයකි. කරුණාකර අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න. (Network error. Please check your connection.)'
        );
      }
      throw new Error(
        `ශිෂ්‍ය කේතය සෙවීමේදී දෝෂයක් ඇති විය: ${err?.message || 'අඥාත දෝෂයකි'} (Error searching for student code.)`
      );
    }

    if (!childUid) {
      throw new Error(
        'මෙම කේතයට අදාළ ශිෂ්‍ය ගිණුමක් හමු නොවීය. (No student account found with this student code.)'
      );
    }

    if (childUid === sender.uid) {
      throw new Error('ඔබගේම ගිණුමට සම්බන්ධතා ඉල්ලීම් යැවිය නොහැක. (Cannot send connection request to yourself.)');
    }

    // 2. Check if already linked in local sender profile
    if (sender.linkedChildren && sender.linkedChildren.some((c) => c.uid === childUid)) {
      throw new Error('මෙම ශිෂ්‍යයා දැනටමත් ඔබගේ ගිණුමට සම්බන්ධ කර ඇත. (This student is already linked to your account.)');
    }

    // 3. Check for existing request using deterministic ID $(senderUid)_$(childUid)
    const deterministicLinkId = `${sender.uid}_${childUid}`;
    const linkDocRef = doc(db, COLLECTION_REQUESTS, deterministicLinkId);

    try {
      const existingLinkSnap = await getDoc(linkDocRef);
      if (existingLinkSnap.exists()) {
        const existingStatus = existingLinkSnap.data()?.status;
        if (existingStatus === 'accepted') {
          throw new Error('මෙම ශිෂ්‍යයා දැනටමත් ඔබගේ ගිණුමට සම්බන්ධ කර ඇත. (This student is already linked to your account.)');
        }
        if (existingStatus === 'pending') {
          throw new Error('මෙම ශිෂ්‍යයා වෙත දැනටමත් සම්බන්ධතා ඉල්ලීමක් යවා ඇත. කරුණාකර ශිෂ්‍යයා විසින් එය තහවුරු කරන තෙක් රැඳී සිටින්න. (A connection request has already been sent to this student.)');
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('දැනටමත් ඔබගේ') || err.message.includes('දැනටමත් සම්බන්ධතා'))) {
        throw err;
      }
      console.warn('[connectionService] Check existing deterministic request warning:', err);
    }

    // 4. Create or reactivate connection request in Firestore with deterministic ID
    const newRequest: Omit<ConnectionRequest, 'id'> = {
      senderUid: sender.uid,
      senderName: sender.displayName || (sender.role === 'teacher' ? 'ගුරුතුමා / ගුරුතුමිය' : 'දෙමාපියන්'),
      senderEmail: sender.email,
      senderRole: (sender.role as 'parent' | 'teacher') || 'parent',
      childUid,
      childEmail: '', // Not exposed via public code lookup; populated on student accept
      childName: 'ශිෂ්‍යයා',
      childGrade: 2,
      relationship:
        relationship ||
        (sender.role === 'teacher' ? 'පන්ති භාර ගුරුතුමා / ගුරුතුමිය' : 'දෙමාපියන් / භාරකරු'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(linkDocRef, {
        ...newRequest,
        updatedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
    } catch (createErr: any) {
      console.error('[connectionService] Firestore setDoc error:', createErr);
      if (createErr?.code === 'permission-denied') {
        throw new Error(
          'සම්බන්ධතා ඉල්ලීම සුරැකීමට අවසර නොමැත. (Permission denied creating connection request in Firestore.)'
        );
      }
      if (createErr?.code === 'unavailable' || createErr?.message?.includes('network')) {
        throw new Error(
          'ජාල දෝෂයකි. කරුණාකර අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න. (Network error creating connection request.)'
        );
      }
      throw new Error(
        `සම්බන්ධතා ඉල්ලීම යැවීම අසාර්ථක විය: ${createErr?.message || 'අඥාත දෝෂයකි'} (Failed to send connection request.)`
      );
    }

    const createdRecord: ConnectionRequest = {
      id: deterministicLinkId,
      ...newRequest,
    };

    // Cache locally for offline reliability
    try {
      const cached = await this.getSentRequestsForParent(sender.uid);
      await AppStorage.setItem(
        `@nena_man_sent_requests_${sender.uid}`,
        JSON.stringify([createdRecord, ...cached])
      );
    } catch {}

    return createdRecord;
  },

  /**
   * Get all pending connection requests for a child
   */
  async getPendingRequestsForChild(
    childUid: string,
    childEmail?: string
  ): Promise<ConnectionRequest[]> {
    const list: ConnectionRequest[] = [];
    const seenIds = new Set<string>();

    try {
      // Query by childUid (secure UID lookup compliant with firestore.rules)
      if (childUid) {
        const qUid = query(
          collection(db, COLLECTION_REQUESTS),
          where('childUid', '==', childUid),
          where('status', '==', 'pending')
        );
        const snapUid = await getDocs(qUid);
        snapUid.forEach((d) => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            list.push({ id: d.id, ...(d.data() as Omit<ConnectionRequest, 'id'>) });
          }
        });
      }
    } catch (err) {
      console.warn('[connectionService] getPendingRequestsForChild warning:', err);
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get all requests sent by a parent or teacher
   */
  async getSentRequestsForParent(parentUid: string): Promise<ConnectionRequest[]> {
    const list: ConnectionRequest[] = [];
    try {
      const q = query(
        collection(db, COLLECTION_REQUESTS),
        where('senderUid', '==', parentUid)
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<ConnectionRequest, 'id'>) });
      });
    } catch (err) {
      console.warn('[connectionService] getSentRequestsForParent warning:', err);
      // Fallback to local cache
      try {
        const cached = await AppStorage.getItem(`@nena_man_sent_requests_${parentUid}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Accept a connection request (Child confirms)
   */
  async acceptConnectionRequest(
    request: ConnectionRequest,
    childUser: UserProfile
  ): Promise<void> {
    const respondedAt = new Date().toISOString();

    const guardianLink: LinkedPerson = {
      uid: request.senderUid,
      name: request.senderName,
      email: request.senderEmail,
      role: request.senderRole,
      relationship: request.relationship,
      linkedAt: respondedAt,
    };

    const childLink: LinkedPerson = {
      uid: childUser.uid,
      name: childUser.displayName,
      email: childUser.email,
      role: 'child',
      grade: childUser.grade || 2,
      relationship: request.relationship,
      linkedAt: respondedAt,
    };

    try {
      // 1. Update request status to 'accepted'
      const reqRef = doc(db, COLLECTION_REQUESTS, request.id);
      await updateDoc(reqRef, {
        status: 'accepted',
        childUid: childUser.uid,
        childName: childUser.displayName || 'ශිෂ්‍යයා',
        childGrade: childUser.grade || 2,
        childEmail: childUser.email ? childUser.email.toLowerCase() : '',
        respondedAt,
        updatedAt: respondedAt,
      });
    } catch (err) {
      console.warn('[connectionService] Error updating request status:', err);
    }

    try {
      // 2. Update child document with linked guardian (owner write)
      const childRef = doc(db, COLLECTION_USERS, childUser.uid);
      await setDoc(
        childRef,
        {
          linkedGuardians: arrayUnion(guardianLink),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[connectionService] Error linking guardian to child doc:', err);
    }

    // Note: Cross-user write to users/{request.senderUid} has been eliminated.
    // The relationship is authoritatively tracked in connection_requests where status == 'accepted'.

    // Save locally for both child and parent caches
    try {
      const childGuardiansKey = `@nena_man_linked_guardians_${childUser.uid}`;
      const existingGuardiansStr = await AppStorage.getItem(childGuardiansKey);
      const existingGuardians: LinkedPerson[] = existingGuardiansStr ? JSON.parse(existingGuardiansStr) : [];
      const updatedGuardians = [...existingGuardians.filter((g) => g.uid !== guardianLink.uid), guardianLink];
      await AppStorage.setItem(childGuardiansKey, JSON.stringify(updatedGuardians));

      const parentChildrenKey = `@nena_man_linked_children_${request.senderUid}`;
      const existingChildrenStr = await AppStorage.getItem(parentChildrenKey);
      const existingChildren: LinkedPerson[] = existingChildrenStr ? JSON.parse(existingChildrenStr) : [];
      const updatedChildren = [...existingChildren.filter((c) => c.uid !== childLink.uid), childLink];
      await AppStorage.setItem(parentChildrenKey, JSON.stringify(updatedChildren));

      const stored = await AppStorage.getItem('@nena_man_auth_user');
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        const existing = parsed.linkedGuardians || [];
        parsed.linkedGuardians = [...existing.filter((g) => g.uid !== request.senderUid), guardianLink];
        await AppStorage.setItem('@nena_man_auth_user', JSON.stringify(parsed));
      }
    } catch {}
  },

  /**
   * Decline a connection request
   */
  async declineConnectionRequest(requestId: string): Promise<void> {
    try {
      const reqRef = doc(db, COLLECTION_REQUESTS, requestId);
      await updateDoc(reqRef, {
        status: 'declined',
        respondedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[connectionService] declineConnectionRequest warning:', err);
    }
  },

  /**
   * Get all linked children for a parent or teacher
   */
  async getLinkedChildren(parentUid: string, parentEmail?: string): Promise<LinkedPerson[]> {
    const map = new Map<string, LinkedPerson>();

    // 1. Authoritative source: Query connection_requests where status == 'accepted' and sender matches
    try {
      if (parentUid) {
        const qSender = query(
          collection(db, COLLECTION_REQUESTS),
          where('senderUid', '==', parentUid),
          where('status', '==', 'accepted')
        );
        const snapSender = await getDocs(qSender);
        snapSender.forEach((d) => {
          const data = d.data() as ConnectionRequest;
          const key = data.childUid || data.childEmail;
          if (key) {
            map.set(key, {
              uid: data.childUid,
              name: data.childName,
              email: data.childEmail,
              role: 'child',
              grade: data.childGrade,
              relationship: data.relationship,
              linkedAt: data.respondedAt || data.createdAt,
            });
          }
        });
      }
    } catch (err) {
      console.warn('[connectionService] getLinkedChildren requests query warning:', err);
    }

    // 2. Query users/{parentUid} in Firestore (Owner profile read)
    try {
      if (parentUid) {
        const userRef = doc(db, COLLECTION_USERS, parentUid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.linkedChildren && Array.isArray(data.linkedChildren)) {
            data.linkedChildren.forEach((c: LinkedPerson) => {
              const key = c?.uid || c?.email;
              if (key && !map.has(key)) map.set(key, c);
            });
          }
        }
      }
    } catch (err) {
      console.warn('[connectionService] getLinkedChildren users doc warning:', err);
    }

    // 3. Local storage fallback
    try {
      if (parentUid) {
        const stored = await AppStorage.getItem(`@nena_man_linked_children_${parentUid}`);
        if (stored) {
          const parsed: LinkedPerson[] = JSON.parse(stored);
          parsed.forEach((c) => {
            const key = c?.uid || c?.email;
            if (key && !map.has(key)) map.set(key, c);
          });
        }
      }
    } catch {}

    return Array.from(map.values());
  },

  /**
   * Get all linked parents/guardians for a student
   */
  async getLinkedGuardians(childUid: string, childEmail?: string): Promise<LinkedPerson[]> {
    const map = new Map<string, LinkedPerson>();
    const declinedSenderUids = new Set<string>();

    // 1. Authoritative source: Query connection_requests where childUid matches
    try {
      if (childUid) {
        const qUid = query(
          collection(db, COLLECTION_REQUESTS),
          where('childUid', '==', childUid)
        );
        const snapUid = await getDocs(qUid);
        snapUid.forEach((d) => {
          const data = d.data() as ConnectionRequest;
          if (data.senderUid) {
            if (data.status === 'accepted') {
              map.set(data.senderUid, {
                uid: data.senderUid,
                name: data.senderName,
                email: data.senderEmail,
                role: data.senderRole,
                relationship: data.relationship,
                linkedAt: data.respondedAt || data.createdAt,
              });
            } else if (data.status === 'declined') {
              declinedSenderUids.add(data.senderUid);
            }
          }
        });
      }
    } catch (err) {
      console.warn('[connectionService] getLinkedGuardians requests query warning:', err);
    }

    // 2. Query users/{childUid} in Firestore, excluding any declined/disconnected guardians
    try {
      if (childUid) {
        const userRef = doc(db, COLLECTION_USERS, childUid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.linkedGuardians && Array.isArray(data.linkedGuardians)) {
            data.linkedGuardians.forEach((g: LinkedPerson) => {
              if (g?.uid && !declinedSenderUids.has(g.uid) && !map.has(g.uid)) {
                map.set(g.uid, g);
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('[connectionService] getLinkedGuardians users doc warning:', err);
    }

    // 3. Local storage fallback, excluding any declined/disconnected guardians
    try {
      if (childUid) {
        const stored = await AppStorage.getItem(`@nena_man_linked_guardians_${childUid}`);
        if (stored) {
          const parsed: LinkedPerson[] = JSON.parse(stored);
          parsed.forEach((g) => {
            if (g?.uid && !declinedSenderUids.has(g.uid) && !map.has(g.uid)) {
              map.set(g.uid, g);
            }
          });
        }
      }
    } catch {}

    return Array.from(map.values());
  },

  /**
   * Remove / detach a student connection from a parent/teacher account
   */
  async removeStudentConnection(
    parentUid: string,
    childUid: string,
    childEmail?: string
  ): Promise<void> {
    const uidKey = (childUid || '').trim().toLowerCase();
    const emailKey = (childEmail || '').trim().toLowerCase();

    // 1. Mark accepted connection_requests between this parent and child as 'declined'
    try {
      const q = query(
        collection(db, COLLECTION_REQUESTS),
        where('senderUid', '==', parentUid)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as ConnectionRequest;
        const reqChildUid = (data.childUid || '').toLowerCase();
        const reqChildEmail = (data.childEmail || '').toLowerCase();

        const isMatch =
          (uidKey && (reqChildUid === uidKey || reqChildEmail === uidKey)) ||
          (emailKey && (reqChildEmail === emailKey || reqChildUid === emailKey));

        if (isMatch) {
          await updateDoc(doc(db, COLLECTION_REQUESTS, d.id), {
            status: 'declined', // Mark as declined so queries ignore it
            disconnectedAt: new Date().toISOString(),
            removedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[connectionService] remove connection_requests warning:', err);
    }

    // 2. Remove child from parent document in Firestore users/{parentUid}
    try {
      const parentRef = doc(db, COLLECTION_USERS, parentUid);
      const snap = await getDoc(parentRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.linkedChildren && Array.isArray(data.linkedChildren)) {
          const updated = data.linkedChildren.filter((c: LinkedPerson) => {
            const cUid = (c.uid || '').toLowerCase();
            const cEmail = (c.email || '').toLowerCase();
            if (uidKey && (cUid === uidKey || cEmail === uidKey)) return false;
            if (emailKey && (cEmail === emailKey || cUid === emailKey)) return false;
            return true;
          });
          await updateDoc(parentRef, { linkedChildren: updated });
        }
      }
    } catch (err) {
      console.warn('[connectionService] remove from parent doc warning:', err);
    }

    // Note: Cross-user write to users/{targetChildId} has been eliminated.
    // The relationship revocation is authoritatively governed by connection_requests status == 'declined'.

    // 3. Update local storage caches
    try {
      const parentKey = `@nena_man_linked_children_${parentUid}`;
      const stored = await AppStorage.getItem(parentKey);
      if (stored) {
        const parsed: LinkedPerson[] = JSON.parse(stored);
        const filtered = parsed.filter((c) => {
          const cUid = (c.uid || '').toLowerCase();
          const cEmail = (c.email || '').toLowerCase();
          if (uidKey && (cUid === uidKey || cEmail === uidKey)) return false;
          if (emailKey && (cEmail === emailKey || cUid === emailKey)) return false;
          return true;
        });
        await AppStorage.setItem(parentKey, JSON.stringify(filtered));
      }

      if (childUid) {
        const childKey = `@nena_man_linked_guardians_${childUid}`;
        await AppStorage.removeItem(childKey);
      }

      // Clear child store so active session does not switch back to detached child
      await AppStorage.removeItem('@nena_man_child_store');

      const authUserStr = await AppStorage.getItem('@nena_man_auth_user');
      if (authUserStr) {
        const authUser: UserProfile = JSON.parse(authUserStr);
        if (authUser.uid === parentUid && authUser.linkedChildren) {
          authUser.linkedChildren = authUser.linkedChildren.filter((c) => {
            const cUid = (c.uid || '').toLowerCase();
            const cEmail = (c.email || '').toLowerCase();
            if (uidKey && (cUid === uidKey || cEmail === uidKey)) return false;
            if (emailKey && (cEmail === emailKey || cUid === emailKey)) return false;
            return true;
          });
          await AppStorage.setItem('@nena_man_auth_user', JSON.stringify(authUser));
        } else if (authUser.linkedGuardians) {
          authUser.linkedGuardians = authUser.linkedGuardians.filter((g) => g.uid !== parentUid);
          await AppStorage.setItem('@nena_man_auth_user', JSON.stringify(authUser));
        }
      }
    } catch {}
  },
};
