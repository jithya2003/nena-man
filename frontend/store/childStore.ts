/**
 * nena-man · frontend/store/childStore.ts
 * Persisted store for the currently selected child and the full children list.
 *
 * Persisted via Zustand's `persist` middleware so the selected child survives
 * an app restart (parent doesn't have to re-select every time they open the app).
 *
 * Usage:
 *   import { useCurrentChild } from '@/store/hooks';
 *   const { currentChild, setCurrentChild } = useCurrentChild();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Child } from './types';
import { LinkedPerson } from '@/types';
import { zustandStorage } from './_storageAdapter';

interface ChildState {
  /** The child the parent/teacher is currently viewing sessions for. */
  currentChild: Child | null;
  /** All child profiles belonging to the logged-in parent/teacher. */
  children: Child[];
  /** The guardian the child is currently viewing parent dashboard for. */
  currentGuardian: LinkedPerson | null;

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Select a specific child to work with. */
  setCurrentChild: (child: Child) => void;
  /** Set the active guardian when child views parent dashboard. */
  setCurrentGuardian: (guardian: LinkedPerson | null) => void;
  /** Replace the entire children list (called after fetching from API). */
  setChildren: (list: Child[]) => void;
  /** Deselect the current child (called on logout). */
  clearCurrentChild: () => void;
}

export const useChildStoreBase = create<ChildState>()(
  persist(
    (set) => ({
      currentChild: null,
      children: [],
      currentGuardian: null,

      setCurrentChild: (child) => set({ currentChild: child }),
      setCurrentGuardian: (guardian) => set({ currentGuardian: guardian }),
      setChildren: (list) => set({ children: list }),
      clearCurrentChild: () => set({ currentChild: null, currentGuardian: null, children: [] }),
    }),
    {
      name: '@nena_man_child_store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        currentChild: state.currentChild,
        currentGuardian: state.currentGuardian,
        children: state.children,
      }),
    }
  )
);
