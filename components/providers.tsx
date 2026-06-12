"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useState } from "react";
import { Locale, translations, T } from "@/lib/i18n";

/* ── i18n context ────────────────────────────────────────── */
interface I18nCtx { locale: Locale; t: T; setLocale: (l: Locale) => void; }
const I18nContext = createContext<I18nCtx>({
  locale: "en",
  t: translations.en,
  setLocale: () => {},
});

export function useT() { return useContext(I18nContext); }

/* ── Root providers ──────────────────────────────────────── */
export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const t = translations[locale] as T;

  const setLocale = (l: Locale) => setLocaleState(l);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <I18nContext.Provider value={{ locale, t, setLocale }}>
        {children}
      </I18nContext.Provider>
    </ThemeProvider>
  );
}
