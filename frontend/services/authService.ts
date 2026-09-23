/**
 * nena-man · frontend/services/authService.ts
 * Real Firebase Authentication & Firestore Profile integration.
 * Connects directly to Google Firebase Auth with user-friendly error handling.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, RegisterData } from '@/types';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Maps Firebase error codes to user-friendly messages in Sinhala & English
 */
export function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'මුරපදය හෝ විද්‍යුත් තැපෑල වැරදියි. (Incorrect email or password.)';
    case 'auth/user-not-found':
      return 'මෙම විද්‍යුත් තැපෑලට අදාළ ගිණුමක් හමු නොවීය. (No account found for this email.)';
    case 'auth/email-already-in-use':
      return 'මෙම විද්‍යුත් තැපෑල දැනටමත් ලියාපදිංචි කර ඇත. (Email is already registered.)';
    case 'auth/weak-password':
      return 'මුරපදය අවම වශයෙන් අකුරු 6ක් විය යුතුය. (Password must be at least 6 characters.)';
    case 'auth/invalid-email':
      return 'වලංගු විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න. (Please enter a valid email address.)';
    case 'auth/too-many-requests':
      return 'අසාර්ථක උත්සාහයන් වැඩියි. කරුණාකර මඳ වේලාවකින් නැවත උත්සාහ කරන්න. (Too many failed attempts. Please try again later.)';
    case 'auth/network-request-failed':
      return 'අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න. (Network error. Please check your connection.)';
    default:
      return 'පිවිසීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න. (Authentication failed. Please try again.)';
  }
}

export const authService = {
  /**
   * Register a new user with Firebase Auth & Firestore
   */
  async register(data: RegisterData): Promise<{ user: UserProfile; token: string }> {
    try {
      const password = data.password || 'password123';
      const userCred = await createUserWithEmailAndPassword(auth, data.email.trim(), password);
      const fbUser = userCred.user;

      // Update Firebase Auth profile display name
      await updateProfile(fbUser, { displayName: data.displayName });

      // Send email verification — user must click the link before accessing the dashboard
      try {
        await sendEmailVerification(fbUser);
      } catch (verifyErr) {
        console.warn('[authService] sendEmailVerification warning:', verifyErr);
      }

      // Save user profile in Cloud Firestore
      const userProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || data.email,
        displayName: data.displayName,
        role: data.role,
        age: data.age || (data.role === 'child' ? 7 : undefined),
        grade: data.grade || (data.role === 'child' ? 2 : undefined),
        schoolName: data.schoolName || '',
        createdAt: new Date().toISOString(),
        emailVerified: false,
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...userProfile,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.warn('[authService] Firestore save warning:', firestoreErr);
      }

      const token = await fbUser.getIdToken();

      // Notify Flask backend
      try {
        await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: userProfile.email,
            display_name: userProfile.displayName,
            role: userProfile.role,
            age: userProfile.age,
            grade: userProfile.grade,
            school_name: userProfile.schoolName,
          }),
        });
      } catch {
        // Backend optional sync
      }

      return { user: userProfile, token };
    } catch (err: any) {
      console.error('[authService] Register error:', err.code, err.message);
      throw new Error(getFirebaseErrorMessage(err.code || ''));
    }
  },

  /**
   * Sign In with Email & Password via Firebase Auth
   */
  async login(
    identifier: string,
    password: string = '',
    role: UserRole = 'child'
  ): Promise<{ user: UserProfile; token: string }> {
    try {
      // Format email if username entered
      const email = identifier.includes('@') ? identifier.trim() : `${identifier.trim()}@nenaman.lk`;
      
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCred.user;
      try {
        await fbUser.reload();
      } catch {
        // Fallback if network flickers during reload
      }
      const token = await fbUser.getIdToken();

      // Retrieve full profile from Cloud Firestore
      let userProfile: UserProfile | null = null;
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          const docData = snap.data();
          userProfile = {
            uid: fbUser.uid,
            email: fbUser.email || email,
            displayName: docData.displayName || fbUser.displayName || (role === 'child' ? 'සෙනුලි' : 'පෙරේරා මහතා'),
            role: (docData.role as UserRole) || role,
            age: docData.age,
            grade: docData.grade,
            schoolName: docData.schoolName,
            createdAt: docData.createdAt,
            emailVerified: fbUser.emailVerified,
          };
        }
      } catch (firestoreErr) {
        console.warn('[authService] Firestore fetch warning:', firestoreErr);
      }

      // Default profile from Firebase Auth user if Firestore doc not yet created
      if (!userProfile) {
        userProfile = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || (role === 'child' ? 'සෙනුලි ද සිල්වා' : 'පෙරේරා මහතා'),
          role,
          age: role === 'child' ? 7 : undefined,
          grade: role === 'child' ? 2 : undefined,
          createdAt: new Date().toISOString(),
          emailVerified: fbUser.emailVerified,
        };
      }

      return { user: userProfile, token };
    } catch (err: any) {
      console.error('[authService] Login error:', err.code, err.message);
      throw new Error(getFirebaseErrorMessage(err.code || ''));
    }
  },

  /**
   * Send Password Reset Email via Firebase Auth
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('[authService] Password reset error:', err.code, err.message);
      throw new Error(getFirebaseErrorMessage(err.code || ''));
    }
  },

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[authService] SignOut warning:', err);
    }
  },
};
