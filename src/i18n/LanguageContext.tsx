import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { vi, type Dictionary, type Language } from "./vi";
import { en } from "./en";

const STORAGE_KEY = "ygo-lang";

const dictionaries: Record<Language, Dictionary> = { vi, en };

function lookup(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export type TranslateVars = Record<string, string | number>;

function format(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: TranslateVars) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "vi";
    } catch {
      return "vi";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);

  const t = useCallback(
    (key: string, vars?: TranslateVars): string => {
      const template =
        lookup(dictionaries[lang], key) ?? lookup(dictionaries.vi, key) ?? key;
      return format(template, vars);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
