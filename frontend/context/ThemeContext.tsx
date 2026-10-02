import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AppStorage } from '@/utils/storage';

export type FontSizeScale = 'normal' | 'large' | 'extra-large';
export type FontPreference = 'opendyslexic' | 'lexend';

const THEME_STORAGE_KEY = '@nena_man_accessibility_theme';

interface AccessibilitySettings {
  fontSizeScale: FontSizeScale;
  fontPreference: FontPreference;
  increasedSpacing: boolean;
  audioAssistance: boolean;
  soundFeedback: boolean;
  readingSpeed: number;
}

interface ThemeContextType extends AccessibilitySettings {
  scaleMultiplier: number;
  setFontSizeScale: (scale: FontSizeScale) => void;
  setFontPreference: (pref: FontPreference) => void;
  setIncreasedSpacing: (enabled: boolean) => void;
  setAudioAssistance: (enabled: boolean) => void;
  setSoundFeedback: (enabled: boolean) => void;
  setReadingSpeed: (speed: number) => void;
  getScaledFontSize: (baseSize: number) => number;
  getLineHeight: (fontSize: number) => number;
  getLetterSpacing: () => number;
}

const SCALE_MULTIPLIERS: Record<FontSizeScale, number> = {
  'normal': 1.0,
  'large': 1.18,
  'extra-large': 1.35,
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSizeScale: 'normal',
  fontPreference: 'opendyslexic',
  increasedSpacing: false,
  audioAssistance: true,
  soundFeedback: true,
  readingSpeed: 1,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function loadSavedSettings() {
      try {
        const stored = await AppStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.warn('[ThemeContext] Error loading theme settings:', err);
      }
    }
    loadSavedSettings();
  }, []);

  const saveSettings = useCallback(async (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    try {
      await AppStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('[ThemeContext] Error saving theme settings:', err);
    }
  }, []);

  const setFontSizeScale = useCallback((scale: FontSizeScale) => {
    saveSettings({ ...settings, fontSizeScale: scale });
  }, [settings, saveSettings]);

  const setFontPreference = useCallback((pref: FontPreference) => {
    saveSettings({ ...settings, fontPreference: pref });
  }, [settings, saveSettings]);

  const setIncreasedSpacing = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, increasedSpacing: enabled });
  }, [settings, saveSettings]);

  const setAudioAssistance = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, audioAssistance: enabled });
  }, [settings, saveSettings]);

  const setSoundFeedback = useCallback((enabled: boolean) => {
    saveSettings({ ...settings, soundFeedback: enabled });
  }, [settings, saveSettings]);

  const setReadingSpeed = useCallback((speed: number) => {
    saveSettings({ ...settings, readingSpeed: speed });
  }, [settings, saveSettings]);

  const scaleMultiplier = SCALE_MULTIPLIERS[settings.fontSizeScale] || 1.0;

  const value = useMemo<ThemeContextType>(() => {
    return {
      ...settings,
      scaleMultiplier,
      setFontSizeScale,
      setFontPreference,
      setIncreasedSpacing,
      setAudioAssistance,
      setSoundFeedback,
      setReadingSpeed,
      getScaledFontSize: (baseSize: number) => {
        const safeBase = baseSize < 13 ? 13 : baseSize;
        return Math.round(safeBase * scaleMultiplier);
      },
      getLineHeight: (fontSize: number) => {
        const multiplier = settings.increasedSpacing ? 1.75 : 1.45;
        return Math.round(fontSize * multiplier);
      },
      getLetterSpacing: () => {
        return settings.increasedSpacing ? 1.2 : 0.4;
      },
    };
  }, [settings, scaleMultiplier, setFontSizeScale, setFontPreference, setIncreasedSpacing, setAudioAssistance, setSoundFeedback, setReadingSpeed]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useDyslexiaTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      ...DEFAULT_SETTINGS,
      scaleMultiplier: 1.0,
      setFontSizeScale: () => {},
      setFontPreference: () => {},
      setIncreasedSpacing: () => {},
      setAudioAssistance: () => {},
      setSoundFeedback: () => {},
      setReadingSpeed: () => {},
      getScaledFontSize: (b) => Math.round(b),
      getLineHeight: (s) => Math.round(s * 1.5),
      getLetterSpacing: () => 0.4,
    };
  }
  return context;
}
