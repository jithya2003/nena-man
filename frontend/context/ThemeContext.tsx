import React, { createContext, useContext, useState, useMemo } from 'react';

export type FontSizeScale = 'normal' | 'large' | 'extra-large';
export type FontPreference = 'opendyslexic' | 'lexend';

interface ThemeContextType {
  fontSizeScale: FontSizeScale;
  fontPreference: FontPreference;
  scaleMultiplier: number;
  increasedSpacing: boolean;
  setFontSizeScale: (scale: FontSizeScale) => void;
  setFontPreference: (pref: FontPreference) => void;
  setIncreasedSpacing: (enabled: boolean) => void;
  getScaledFontSize: (baseSize: number) => number;
  getLineHeight: (fontSize: number) => number;
  getLetterSpacing: () => number;
}

const SCALE_MULTIPLIERS: Record<FontSizeScale, number> = {
  'normal': 1.0,
  'large': 1.15,
  'extra-large': 1.30,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>('normal');
  const [fontPreference, setFontPreference] = useState<FontPreference>('opendyslexic'); // Default to OpenDyslexic
  const [increasedSpacing, setIncreasedSpacing] = useState<boolean>(false);

  const scaleMultiplier = SCALE_MULTIPLIERS[fontSizeScale];

  const value = useMemo<ThemeContextType>(() => {
    return {
      fontSizeScale,
      fontPreference,
      scaleMultiplier,
      increasedSpacing,
      setFontSizeScale,
      setFontPreference,
      setIncreasedSpacing,
      getScaledFontSize: (baseSize: number) => {
        const safeBase = baseSize < 13 ? 13 : baseSize;
        return Math.round(safeBase * scaleMultiplier);
      },
      getLineHeight: (fontSize: number) => {
        const multiplier = increasedSpacing ? 1.75 : 1.5;
        return Math.round(fontSize * multiplier);
      },
      getLetterSpacing: () => {
        return increasedSpacing ? 1.2 : 0.4;
      },
    };
  }, [fontSizeScale, fontPreference, scaleMultiplier, increasedSpacing]);

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
      fontSizeScale: 'normal',
      fontPreference: 'opendyslexic',
      scaleMultiplier: 1.0,
      increasedSpacing: false,
      setFontSizeScale: () => {},
      setFontPreference: () => {},
      setIncreasedSpacing: () => {},
      getScaledFontSize: (b) => Math.round(b),
      getLineHeight: (s) => Math.round(s * 1.5),
      getLetterSpacing: () => 0.4,
    };
  }
  return context;
}
