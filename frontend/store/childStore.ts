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
  /** Update specific fields of a child locally in state and list. */
  updateChild: (childId: string, updates: Partial<Child>) => void;
}

export const useChildStoreBase = create<ChildState>()(
  persist(
    (set) => ({
      currentChild: null,
      children: [],
      currentGuardian: null,

      setCurrentChild: (child) =>
        set((state) => {
          const existingChild = state.children.find((c) => c.id === child.id);
          const currentMatching = state.currentChild?.id === child.id ? state.currentChild : null;
          const preservedAvatar = child.avatar || currentMatching?.avatar || existingChild?.avatar;

          const updatedChild: Child = {
            ...child,
            ...(preservedAvatar ? { avatar: preservedAvatar } : {}),
          };

          return { currentChild: updatedChild };
        }),
      setCurrentGuardian: (guardian) => set({ currentGuardian: guardian }),
      setChildren: (list) => set({ children: list }),
      clearCurrentChild: () => set({ currentChild: null, currentGuardian: null, children: [] }),
      updateChild: (childId, updates) =>
        set((state) => {
          let updatedCurrent = state.currentChild;
          if (state.currentChild && state.currentChild.id === childId) {
            updatedCurrent = { ...state.currentChild, ...updates };
          } else if (!state.currentChild && childId) {
            updatedCurrent = {
              id: childId,
              name: 'ශිෂ්‍යයා',
              age: 7,
              grade: 2,
              readingLevel: 'medium',
              streak: 1,
              stars: 10,
              totalSessions: 0,
              avatarColor: '#4F46E5',
              ...updates,
            };
          }

          const hasChild = state.children.some((c) => c.id === childId);
          const updatedChildren = hasChild
            ? state.children.map((c) => (c.id === childId ? { ...c, ...updates } : c))
            : updatedCurrent
            ? [...state.children, updatedCurrent]
            : state.children;

          return {
            currentChild: updatedCurrent,
            children: updatedChildren,
          };
        }),
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
