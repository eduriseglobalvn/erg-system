import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { getPreferredLocale, tr } from "@/features/i18n";

export const inputClassName =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--erg-blue)] focus:ring-4 focus:ring-[var(--erg-blue)]/10";

export const submitButtonClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-lg bg-[var(--erg-blue)] px-5 text-base font-bold text-white shadow-[0_18px_40px_-24px_rgba(0,0,139,0.45)] transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-[var(--erg-blue)]/20";

export function Field({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <label className="block" style={{ display: "block" }}>
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-800" style={{ alignItems: "center", color: "#1e293b", display: "flex", fontSize: 14, fontWeight: 600, gap: 12, justifyContent: "space-between", marginBottom: 8 }}>
        <span>{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}

export function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
      style={{ alignItems: "center", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#334155", display: "flex", fontSize: 16, fontWeight: 600, gap: 12, height: 48, justifyContent: "center", width: "100%" }}
    >
      {icon}
      {label}
    </button>
  );
}

export function DividerText({ text }: { text: string }) {
  return (
    <div className="mt-6 flex items-center gap-4 text-sm text-slate-400" style={{ alignItems: "center", color: "#94a3b8", display: "flex", fontSize: 14, gap: 16, marginTop: 24 }}>
      <div className="h-px flex-1 bg-slate-200" style={{ backgroundColor: "#e2e8f0", flex: 1, height: 1 }} />
      <span>{text}</span>
      <div className="h-px flex-1 bg-slate-200" style={{ backgroundColor: "#e2e8f0", flex: 1, height: 1 }} />
    </div>
  );
}

export function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
      {children}
    </span>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function QuickLinkCard({ to, title, caption }: { to: string; title: string; caption: string }) {
  return (
    <Link
      className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
      to={to}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{caption}</div>
    </Link>
  );
}

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
