import type { ReactNode } from "react";
import { Bell, ChevronDown, Download, RefreshCw, WifiOff } from "lucide-react";

import { ERG_ASSETS } from "@/config/seo";
import { cn } from "@/lib/utils";

export function LmsMobileTopBar({
  activeLabel,
  canInstall,
  className,
  installed,
  notificationCenter,
  online,
  schoolName,
  teacherName,
  updateAvailable,
  onAccountOpen,
  onInstall,
  onScopeOpen,
  onUpdate,
}: {
  activeLabel: string;
  canInstall: boolean;
  className: string;
  installed: boolean;
  notificationCenter?: ReactNode;
  online: boolean;
  schoolName: string;
  teacherName: string;
  updateAvailable: boolean;
  onAccountOpen: () => void;
  onInstall: () => void;
  onScopeOpen: () => void;
  onUpdate: () => void;
}) {
  const initial = teacherName.trim().slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/92 px-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+8px)] shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl xl:hidden">
      <div className="flex min-h-[56px] items-center gap-2">
        <button
          type="button"
          aria-label="Ve man bai tap"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#d9e2ef] bg-white transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
          onClick={onScopeOpen}
        >
          <img src={ERG_ASSETS.logo} alt="ERG" className="max-h-8 max-w-9 object-contain" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 rounded-[14px] px-2.5 py-1.5 text-left transition hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
          onClick={onScopeOpen}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15px] font-extrabold leading-5 text-slate-950">{activeLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <div className="mt-0.5 truncate text-[11px] font-bold text-slate-500">
            {className} · {schoolName}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {updateAvailable ? (
            <button
              type="button"
              aria-label="Cap nhat ung dung"
              className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#dbeafe] bg-[#eef6ff] text-[var(--primary)] shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
              onClick={onUpdate}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          ) : null}
          {canInstall && !installed ? (
            <button
              type="button"
              aria-label="Cai LMS PWA"
              className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#dbeafe] bg-[#eef6ff] text-[var(--primary)] shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
              onClick={onInstall}
            >
              <Download className="h-5 w-5" />
            </button>
          ) : null}
          {!online ? (
            <span className="grid h-11 w-11 place-items-center rounded-[14px] border border-amber-100 bg-amber-50 text-amber-700" aria-label="Dang offline">
              <WifiOff className="h-5 w-5" />
            </span>
          ) : null}
          {notificationCenter ?? (
            <button
              type="button"
              aria-label="Thong bao"
              className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#d9e2ef] bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <Bell className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            aria-label={`Tai khoan ${teacherName}`}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-[14px] border border-[#d9e2ef] bg-white text-xs font-extrabold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
            )}
            onClick={onAccountOpen}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">{initial || "GV"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
