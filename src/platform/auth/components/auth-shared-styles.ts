import { getPreferredLocale, tr } from "@/platform/i18n";

export const inputClassName =
  "h-10 w-full rounded-md border border-[#d7e0ec] bg-white px-3 text-sm text-[#242424] shadow-none outline-none transition placeholder:text-[#707070] hover:border-[#b8c8db] focus:border-[#aebfd5] focus:ring-2 focus:ring-[var(--erg-blue-ring)]";

export const submitButtonClassName =
  "inline-flex h-10 w-full items-center justify-center rounded-md border border-[var(--erg-blue)] bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-none transition hover:bg-[var(--erg-blue-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]";

export function formatDate(value: string | null) {
  if (!value) return tr("auth.noDateYet");

  const locale = getPreferredLocale();

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
