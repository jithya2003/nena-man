/**
 * nena-man · frontend/store/authStore.ts
 * Lightweight Zustand mirror of the authenticated user.
 *
 * IMPORTANT: This store does NOT own Firebase Auth operations.
 * AuthContext (context/AuthContext.tsx) remains the authority for sign-in,
 * sign-out, and token management. This store is populated BY AuthContext
 * so that other stores (childStore, sessionStore) can cross-reference the
 * current user without importing AuthContext.
 *
 * Usage:
 *   import { useAuthStore } from '@/store/hooks';
 *   const { user, isAuthenticated } = useAuthStore();
 */

import { create } from 'zustand';
import type { AuthUser } from './types';

interface AuthState {
  /** Lightweight user snapshot. null when logged out. */
  user: AuthUser | null;
  /** Auth token for API requests. null when logged out. */
  token: string | null;
  /** Derived convenience flag. */
  isAuthenticated: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Called by AuthContext immediately after a successful login or session restore.
   * Populates the store with user info and optional auth token.
   */
  setUser: (user: AuthUser, token?: string | null) => void;

  /** Set or update the active auth token. */
  setToken: (token: string | null) => void;

  /**
   * Called by AuthContext's logout() or 401 API interceptor.
   * Also clears childStore and sessionStore so no stale data survives logout.
   * Import is deferred (lazy) to avoid circular-dependency at module load time.
   */
  logout: () => void;
}

export const useAuthStoreBase = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user, token) => set((state) => ({ user, token: token !== undefined ? token : state.token, isAuthenticated: true })),

  setToken: (token) => set({ token }),

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });

    // Lazily import sibling stores to avoid circular module dependency.
    // These are synchronous Zustand calls — safe to call after set().
    import('./childStore').then(({ useChildStoreBase }) => {
      useChildStoreBase.getState().clearCurrentChild();
    });
    import('./sessionStore').then(({ useSessionStoreBase }) => {
      useSessionStoreBase.getState().resetSession();
    });
  },
}));
