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
  /** Derived convenience flag. */
  isAuthenticated: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Called by AuthContext immediately after a successful login.
   * Populates the store with uid, name, email, and role.
   */
  setUser: (user: AuthUser) => void;

  /**
   * Called by AuthContext's logout().
   * Also clears childStore and sessionStore so no stale data survives logout.
   * Import is deferred (lazy) to avoid circular-dependency at module load time.
   */
  logout: () => void;
}

export const useAuthStoreBase = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: () => {
    set({ user: null, isAuthenticated: false });

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
