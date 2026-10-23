import { messages, type Locale, type MessageKey } from "./messages";

export type MessageFeature = "common" | "quiz" | "locale" | "sidebar" | "auth" | "dashboard" | "lms" | "lcms" | "crm" | "elearning";

const features = ["common", "quiz", "locale", "sidebar", "auth", "dashboard", "lms", "lcms", "crm", "elearning"] as const satisfies readonly MessageFeature[];

export const featureMessages = Object.fromEntries(
  features.map((feature) => [feature, Object.fromEntries(
    (Object.keys(messages.vi) as MessageKey[])
      .filter((key) => key.startsWith(`${feature}.`))
      .map((key) => [key, { vi: messages.vi[key], en: messages.en[key] }]),
  )]),
) as Record<MessageFeature, Partial<Record<MessageKey, { vi: string; en: string }>>>;

export function getFeatureMessage(feature: MessageFeature, key: MessageKey, locale: Locale) {
  return featureMessages[feature][key]?.[locale] ?? messages[locale][key] ?? messages.vi[key] ?? key;
}
