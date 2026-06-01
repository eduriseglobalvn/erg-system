import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  getPreferredLocale,
  setPreferredLocale,
  translate,
} from "@/platform/i18n/translate";
import type { Locale, MessageKey } from "@/platform/i18n/messages";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => getPreferredLocale());

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        setPreferredLocale(nextLocale);
      },
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
