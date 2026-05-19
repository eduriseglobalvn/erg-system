import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import type { ReactNode } from "react";

import { StudentDashboardBottomDock } from "@/features/student-dashboard/components/student-dashboard-bottom-dock";
import type { StudentDockPageKey, StudentPageKey } from "@/features/student-dashboard/types/dashboard-view-types";
import { cn } from "@/lib/utils";

export function StudentDashboardMobileShell({
  activePage,
  announcementUnreadCount,
  children,
  currentPageLabel,
  dockItems,
  studentName,
  onAccountOpen,
  onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  children: ReactNode;
  currentPageLabel: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen: () => void;
  onAnnouncementsOpen: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-24 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.8rem)] backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-end text-[30px] font-black leading-none">
                <span className="text-[var(--erg-blue)]">ER</span>
                <span className="text-[var(--erg-red)]">G</span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Learning app</div>
              <div className="mt-1.5 text-[17px] font-semibold leading-none tracking-[-0.02em] text-slate-900">{currentPageLabel}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open announcements"
                className="relative grid h-11 w-11 place-items-center text-slate-600"
                onClick={onAnnouncementsOpen}
              >
                <NotificationsNoneOutlinedIcon fontSize="small" />
                {announcementUnreadCount > 0 ? (
                  <span className="absolute right-[5px] top-[5px] grid h-4 min-w-4 place-items-center rounded-full bg-[var(--erg-red)] px-1 text-[10px] font-bold text-white">
                    {announcementUnreadCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                aria-label={studentName ? `Open account for ${studentName}` : "Open account"}
                className={cn("relative grid h-11 w-11 place-items-center text-slate-600", activePage === "account" ? "text-[#1557ff]" : "")}
                onClick={onAccountOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1557ff] text-xs font-semibold text-white shadow-[0_6px_18px_rgba(21,87,255,0.18)]">
                  {initial || <AccountCircleOutlinedIcon fontSize="small" />}
                </span>
                <span className="absolute bottom-[7px] right-[7px] h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22c55e]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md">{children}</main>

      <StudentDashboardBottomDock activePage={activePage} items={dockItems} onPageChange={onPageChange} />
    </div>
  );
}
