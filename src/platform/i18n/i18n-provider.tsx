import {
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  getPreferredLocale,
  setPreferredLocale,
  translate,
} from "@/platform/i18n/translate";
import type { Locale } from "@/platform/i18n/messages";
import { I18nContext, type I18nContextValue } from "@/platform/i18n/i18n-context";

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
