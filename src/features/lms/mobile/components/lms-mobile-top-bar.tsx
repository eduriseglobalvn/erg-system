import type { ReactNode } from "react";
import Notifications from "@mui/icons-material/Notifications";
import { ChevronDown, Download, RefreshCw, WifiOff } from "lucide-react";

import { ERG_ASSETS } from "@/config/seo";

export function LmsMobileTopBar({
  canInstall,
  className,
  installed,
  notificationCenter,
  online,
  schoolName,
  teacherName,
  unreadNotificationCount = 0,
  updateAvailable,
  onAccountOpen,
  onInstall,
  onOpenNotifications,
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
  unreadNotificationCount?: number;
  updateAvailable: boolean;
  onAccountOpen: () => void;
  onInstall: () => void;
  onOpenNotifications?: () => void;
  onScopeOpen: () => void;
  onUpdate: () => void;
}) {
  const initial = teacherName.trim().slice(0, 1).toUpperCase() || "GV";

  return (
    <header className="sticky top-0 z-30 border-b border-[#edf2f7] bg-white px-3 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+8px)] text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)] xl:hidden">
      <div className="flex min-h-[48px] items-center gap-2">
        <button
          type="button"
          aria-label="Chọn lớp"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e6edf5] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25"
          onClick={onScopeOpen}
        >
          <img src={ERG_ASSETS.logo} alt="ERG" className="max-h-6 max-w-7 object-contain" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 rounded-full border border-[#e6edf5] bg-[#fbfdff] px-3 py-1.5 text-left shadow-[0_7px_18px_rgba(15,23,42,0.05)] transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25"
          onClick={onScopeOpen}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14px] font-extrabold leading-5 text-slate-950">{className || "Lớp học"}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </div>
          <div className="truncate text-[10.5px] font-bold leading-4 text-slate-500">{schoolName}</div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {updateAvailable ? (
            <button
              type="button"
              aria-label="Cập nhật ứng dụng"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#e6edf5] bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25"
              onClick={onUpdate}
            >
              <RefreshCw className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          {canInstall && !installed ? (
            <button
              type="button"
              aria-label="Cài LMS PWA"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#e6edf5] bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25"
              onClick={onInstall}
            >
              <Download className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          {!online ? (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-800" aria-label="Đang offline">
              <WifiOff className="h-[18px] w-[18px]" />
            </span>
          ) : null}
          {notificationCenter ?? (
            <button
              type="button"
              aria-label="Thông báo"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e6edf5] bg-white text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              onClick={onOpenNotifications}
            >
              <Notifications className="h-[18px] w-[18px]" />
              {unreadNotificationCount ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d13438] px-1 text-[11px] font-black leading-none text-white ring-2 ring-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              ) : null}
            </button>
          )}
          <button
            type="button"
            aria-label={`Tài khoản ${teacherName}`}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#e6edf5] bg-white text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6cbd]/25"
            onClick={onAccountOpen}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff8a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">{initial}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
