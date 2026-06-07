import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import type { ReactNode } from "react";

import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
import type { StudentDockPageKey, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
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
    <div className="min-h-screen bg-[#f7f8fa] pb-24 font-[var(--font-app)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-[#cfd7e3] bg-white/98 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.8rem)] shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-end text-[30px] font-semibold leading-none">
                <span className="text-[var(--erg-blue)]">ER</span>
                <span className="text-[var(--erg-red)]">G</span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-slate-500">Learning app</div>
              <div className="mt-1.5 text-[17px] font-semibold leading-none  text-slate-900">{currentPageLabel}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open announcements"
                className="relative grid h-10 w-10 place-items-center rounded-md border border-[#d1d9e6] bg-white text-slate-600 shadow-sm"
                onClick={onAnnouncementsOpen}
              >
                <NotificationsNoneOutlinedIcon fontSize="small" />
                {announcementUnreadCount > 0 ? (
                  <span className="absolute right-[5px] top-[5px] grid h-4 min-w-4 place-items-center rounded-full bg-[var(--erg-red)] px-1 text-[10px] font-medium text-white">
                    {announcementUnreadCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                aria-label={studentName ? `Open account for ${studentName}` : "Open account"}
                className={cn("relative grid h-10 w-10 place-items-center rounded-md border border-[#d1d9e6] bg-white text-slate-600 shadow-sm", activePage === "account" ? "text-[var(--erg-blue)] ring-1 ring-[#b8d6fa]" : "")}
                onClick={onAccountOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--erg-blue)] text-xs font-semibold text-white shadow-sm">
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
