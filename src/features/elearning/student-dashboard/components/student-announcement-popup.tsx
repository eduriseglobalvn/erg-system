import type { MouseEvent } from "react";

import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { cn } from "@/lib/utils";

type StudentAnnouncementPopupProps = {
  announcement: StudentTeacherAnnouncement;
  autoDismissLabel: string;
  ctaLabel: string;
  dismissLabel: string;
  isOpen: boolean;
  pinnedLabel: string;
  snoozeLabel: string;
  onClose: () => void;
  onOpenDetail: (announcementId: string) => void;
  onSnooze: (announcementId: string) => void;
};

export function StudentAnnouncementPopup({
  announcement,
  autoDismissLabel,
  ctaLabel,
  dismissLabel,
  isOpen,
  pinnedLabel,
  snoozeLabel,
  onClose,
  onOpenDetail,
  onSnooze,
}: StudentAnnouncementPopupProps) {
  if (!isOpen) {
    return null;
  }

  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onOpenDetail(announcement.id);
  }

  function handleCloseClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClose();
  }

  function handleSnoozeClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onSnooze(announcement.id);
  }

  return (
    <div
      aria-hidden={!isOpen}
      className="fixed inset-0 z-50 bg-slate-950/38 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div className="pointer-events-none flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="pointer-events-auto w-full max-w-[760px] cursor-pointer overflow-hidden rounded-[28px] border border-[var(--erg-blue)]/10 bg-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5"
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenDetail(announcement.id);
            }
          }}
        >
          <div className="h-2 w-full bg-[var(--erg-red)]" />
          <div className="space-y-5 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {announcement.isPinned ? (
                  <span className="rounded-full bg-[var(--erg-red)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--erg-red)]">
                    {pinnedLabel}
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {announcement.targetLabel}
                </span>
              </div>
              <button
                type="button"
                aria-label={dismissLabel}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                onClick={handleCloseClick}
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-semibold leading-tight text-[var(--erg-blue)] sm:text-3xl">{announcement.title}</h2>
              <p className="mt-3 text-base leading-8 text-slate-600 sm:text-lg">{announcement.content}</p>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-700">{announcement.teacherName}</div>
                <div className="mt-1 text-sm text-slate-500">{announcement.createdAtLabel}</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  onClick={handleSnoozeClick}
                >
                  {snoozeLabel}
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="text-sm text-slate-500">{autoDismissLabel}</div>
                  <div className="shrink-0 rounded-2xl bg-[var(--erg-blue)] px-5 py-3 text-white shadow-[0_16px_36px_-22px_rgba(11,16,138,0.9)]">
                    <div className="text-sm font-semibold uppercase tracking-[0.14em]">{ctaLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full bg-[var(--erg-blue)]")}
                style={{ animation: "student-announcement-popup-countdown 30s linear forwards" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
