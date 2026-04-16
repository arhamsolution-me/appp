import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { TRANSLATIONS } from '@/constants/translations';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ur' | 'ar' | 'hi' | 'es' | 'fr'>('en');

  useEffect(() => {
    fetchSavedLanguage();
  }, []);

  const fetchSavedLanguage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single();

      if (data?.language && TRANSLATIONS[data.language]) {
        setCurrentLanguage(data.language);
      }
    } catch (e) {
      console.log('[LANG_CONTEXT_FETCH_ERROR]', e);
    }
  };

  const setLanguage = async (lang: any) => {
    setCurrentLanguage(lang);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
      }
    } catch (e) {
      console.log('[LANG_CONTEXT_UPDATE_ERROR]', e);
    }
  };

  const t = (key: string): string => {
    const langSet = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    return langSet[key] || TRANSLATIONS.en[key] || key;
  };

  const isRTL = ['ur', 'ar'].includes(currentLanguage);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
