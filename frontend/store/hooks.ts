/**
 * nena-man · frontend/store/hooks.ts
 * Convenience hooks — the ONLY import screens should use from the store layer.
 *
 * Never import a store directly from a screen. Use these hooks instead.
 * This keeps the abstraction boundary clean: if a store's internals change,
 * only this file needs updating, not every screen.
 *
 * Available hooks:
 *   useAuthStore()       — logged-in user snapshot and isAuthenticated flag
 *   useCurrentChild()    — currently selected child + list management
 *   useSession()         — active reading session state and actions
 *   useSettings()        — language, font size, accessibility prefs
 *   useIsOnline()        — boolean: is the device connected to the network?
 *   useNetworkStatus()   — SETUP hook: mount once in root layout to start listener
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStoreBase } from './authStore';
import { useChildStoreBase } from './childStore';
import { useSessionStoreBase } from './sessionStore';
import { useSettingsStoreBase } from './settingsStore';
import { useNetworkStoreBase } from './networkStore';

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Read the logged-in user snapshot and authentication status.
 * This store is populated by AuthContext, not by Firebase directly.
 *
 * @example
 * const { user, isAuthenticated } = useAuthStore();
 * if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
 */
export const useAuthStore = useAuthStoreBase;

// ── Child ─────────────────────────────────────────────────────────────────────

/**
 * Read and manage the currently selected child and the children list.
 *
 * @example
 * const { currentChild, setCurrentChild, children } = useCurrentChild();
 */
export const useCurrentChild = useChildStoreBase;

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Read and manage the active reading session.
 *
 * @example
 * const { recordingStatus, setRecordingStatus, attachResult } = useSession();
 * setRecordingStatus('recording');
 * attachResult('errorAnalysis', { words: [...], severity: 0.2 });
 */
export const useSession = useSessionStoreBase;

// ── Settings ──────────────────────────────────────────────────────────────────

/**
 * Read and update user preferences (language, font size, accessibility).
 *
 * @example
 * const { language, setLanguage } = useSettings();
 * setLanguage('en');
 */
export const useSettings = useSettingsStoreBase;

// ── Network ───────────────────────────────────────────────────────────────────

/**
 * Returns true when the device has network connectivity.
 * Subscribe here — re-renders on connectivity change.
 *
 * @example
 * const isOnline = useIsOnline();
 * if (!isOnline) return <OfflineBanner />;
 */
export function useIsOnline(): boolean {
  return useNetworkStoreBase((s) => s.isOnline);
}

/**
 * SETUP HOOK — mount this once in the root layout (app/_layout.tsx).
 * Starts the NetInfo (native) or window event (web) listener and keeps
 * networkStore.isOnline in sync throughout the app's lifetime.
 *
 * @example
 * // app/_layout.tsx
 * export default function RootLayout() {
 *   useNetworkStatus();
 *   return <Stack />;
 * }
 */
export function useNetworkStatus(): void {
  const setOnline = useNetworkStoreBase((s) => s.setOnline);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // SSR guard: window/navigator don't exist during server-side rendering
      if (typeof window === 'undefined') return;

      // Web: use native browser events
      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);

      setOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Native (iOS/Android): use NetInfo
      let unsubscribe: (() => void) | undefined;

      // Dynamic import to avoid web bundler issues with native modules
      import('@react-native-community/netinfo').then((NetInfo) => {
        // Set initial state
        NetInfo.default.fetch().then((state) => {
          setOnline(state.isConnected ?? true);
        });

        // Subscribe to changes
        unsubscribe = NetInfo.default.addEventListener((state) => {
          setOnline(state.isConnected ?? true);
        });
      });

      return () => {
        unsubscribe?.();
      };
    }
  }, [setOnline]);
}
