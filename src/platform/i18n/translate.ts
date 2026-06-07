import { messages, type Locale, type MessageKey } from "@/platform/i18n/messages";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";

const STORAGE_KEY = "erg-learning.locale";

type TranslateParams = Record<string, string | number>;

export function getPreferredLocale(): Locale {
  const stored = getPersistedJsonValue<Locale | string>(STORAGE_KEY, "vi");
  if (stored === "vi" || stored === "en") {
    return stored;
  }

  // Mặc định luôn là tiếng Việt nếu người dùng chưa chọn thủ công
  return "vi";
}

export function setPreferredLocale(locale: Locale) {
  setPersistedJsonValue(STORAGE_KEY, locale);
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: TranslateParams,
): string {
  let value: string = messages[locale][key] ?? messages.vi[key] ?? key;

  if (!params) {
    return value;
  }

  for (const [paramKey, paramValue] of Object.entries(params)) {
    value = value.replaceAll(`{{${paramKey}}}`, String(paramValue));
  }

  return value;
}

export function tr(key: MessageKey, params?: TranslateParams) {
  return translate(getPreferredLocale(), key, params);
}
