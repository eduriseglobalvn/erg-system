import { getPreferredLocale, tr } from "@/platform/i18n";

export const inputClassName =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--erg-blue)] focus:ring-4 focus:ring-[var(--erg-blue)]/10";

export const submitButtonClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-lg bg-[var(--erg-blue)] px-5 text-base font-bold text-white shadow-[0_18px_40px_-24px_rgba(0,0,139,0.45)] transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-[var(--erg-blue)]/20";

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
