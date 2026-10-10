import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type Lang } from '../i18n/strings';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  isTamil: boolean;
}

const LangContext = createContext<LangCtx>({ lang: 'en', setLang: () => {}, isTamil: false });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('sv_lang') as Lang) || 'en';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('sv_lang', l);
    setLangState(l);
    document.documentElement.lang = l;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, isTamil: lang === 'ta' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
