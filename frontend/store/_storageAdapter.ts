/**
 * nena-man · frontend/store/_storageAdapter.ts
 * Internal Zustand persist storage adapter wrapping the app's AppStorage utility.
 *
 * Why: Zustand's persist middleware requires a StateStorage-compatible object.
 * AppStorage (utils/storage.ts) already handles web (localStorage) vs native
 * (in-memory) — we simply bridge the two interfaces here.
 *
 * This file is INTERNAL to the store/ folder. Do not import it from screens.
 */

import { AppStorage } from '@/utils/storage';
import type { StateStorage } from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return AppStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return AppStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    return AppStorage.removeItem(name);
  },
};
