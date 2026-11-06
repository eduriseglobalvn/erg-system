import { viMessages1 } from "@/platform/i18n/messages-data/vi-1";
import { viMessages2 } from "@/platform/i18n/messages-data/vi-2";
import { enMessages1 } from "@/platform/i18n/messages-data/en-1";
import { enMessages2 } from "@/platform/i18n/messages-data/en-2";

export const messages = {
  vi: {
    ...viMessages1,
    ...viMessages2,
  },
  en: {
    ...enMessages1,
    ...enMessages2,
  },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof typeof messages.vi;
