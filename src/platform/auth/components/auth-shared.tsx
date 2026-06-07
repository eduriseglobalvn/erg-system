import type { ReactNode } from "react";
import { Link } from "@/routes/router-compat";

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
      className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#cfd7e3] bg-white text-sm font-semibold text-[#242424] transition hover:border-[#b8d6fa] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
      style={{ alignItems: "center", backgroundColor: "#fff", border: "1px solid #cfd7e3", borderRadius: 6, color: "#242424", display: "flex", fontSize: 14, fontWeight: 600, gap: 10, height: 40, justifyContent: "center", width: "100%" }}
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
    <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
      {children}
    </span>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function QuickLinkCard({ to, title, caption }: { to: string; title: string; caption: string }) {
  return (
    <Link
      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
      to={to}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{caption}</div>
    </Link>
  );
}
