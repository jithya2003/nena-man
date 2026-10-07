import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppStorage } from '@/utils/storage';
import { Language, translations } from '@/constants/translations';

const LANGUAGE_STORAGE_KEY = '@nena_man_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  isLanguageReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('si');
  const [isLanguageReady, setIsLanguageReady] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSavedLanguage() {
      try {
        const savedLang = await AppStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isMounted && (savedLang === 'si' || savedLang === 'en')) {
          setLanguageState(savedLang);
        }
      } catch (err) {
        console.warn('[LanguageContext] Failed to load stored language:', err);
      } finally {
        if (isMounted) {
          setIsLanguageReady(true);
        }
      }
    }
    loadSavedLanguage();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AppStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (err) {
      console.warn('[LanguageContext] Failed to save language setting:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const langDict = translations[language] || translations['si'];
      let text = langDict[key] || translations['si'][key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
        });
      }
      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLanguageReady,
    }),
    [language, setLanguage, t, isLanguageReady]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
