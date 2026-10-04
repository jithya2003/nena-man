/**
 * nena-man · frontend/store/settingsStore.ts
 * Persisted store for user preferences: language, font size, accessibility.
 *
 * Persisted via Zustand `persist` so settings survive app restarts.
 * Defaults: Sinhala language, base font size 16, no accessibility overrides.
 *
 * Usage:
 *   import { useSettings } from '@/store/hooks';
 *   const { language, setLanguage } = useSettings();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AccessibilitySettings } from './types';
import { zustandStorage } from './_storageAdapter';

interface SettingsState {
  /** Active app language. 'si' = Sinhala, 'en' = English. */
  language: 'si' | 'en';
  /** Base font size scalar. Default 16. Screens scale relative to this. */
  fontSize: number;
  /** Visual accessibility overrides. */
  accessibility: AccessibilitySettings;

  // ── Daily Reminder Settings ──────────────────────────────────────────────────

  /** Whether daily reading reminders are enabled. Default false. */
  remindersEnabled: boolean;
  /** Scheduled time for daily reminder in 24-hour "HH:mm" format. Default 17:00. */
  reminderTime: string;

  // ── Actions ─────────────────────────────────────────────────────────────────

  setLanguage: (language: 'si' | 'en') => void;
  setFontSize: (size: number) => void;
  /** Partial update — only the fields you pass get overwritten. */
  setAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
}

export const useSettingsStoreBase = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'si',
      fontSize: 16,
      accessibility: {
        highContrast: false,
        dyslexiaFont: false,
      },
      remindersEnabled: false,
      reminderTime: '17:00',

      setLanguage: (language) => set({ language }),

      setFontSize: (fontSize) => set({ fontSize }),

      setAccessibility: (patch) =>
        set((state) => ({
          accessibility: { ...state.accessibility, ...patch },
        })),

      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),

      setReminderTime: (reminderTime) => set({ reminderTime }),
    }),
    {
      name: '@nena_man_settings_store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
