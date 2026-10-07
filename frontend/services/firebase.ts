/**
 * nena-man · frontend/services/firebase.ts
 * Client-side Firebase SDK initialization (Auth & Firestore).
 * Reads credentials strictly from environment variables (.env).
 * Safely handles local dev mock mode when credentials are not configured.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
// @ts-ignore - provided by React Native bundle of firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'your-firebase-api-key' &&
  !apiKey.startsWith('your-')
);

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | any = { currentUser: null, isFallback: true };
let db: Firestore | any = {};

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (Platform.OS !== 'web' && typeof getReactNativePersistence === 'function') {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }
    auth.isFallback = false;
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Warning: Failed to initialize Firebase Auth with provided config. Switching to fallback mode.', err);
    auth = { currentUser: null, isFallback: true };
  }
} else {
  console.info('[Firebase] Notice: Operating in local dev mode. Firebase API keys are managed via .env');
}

export { auth, db };
export default app;
