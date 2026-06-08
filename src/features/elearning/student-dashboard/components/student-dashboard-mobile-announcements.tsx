import type { ReactNode } from "react";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

import { Card } from "@/components/ui/dashboard-kit";
import { cn } from "@/lib/utils";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileAnnouncements({
  announcements,
  copy,
  selectedAnnouncementId,
}: {
  announcements: StudentTeacherAnnouncement[];
  copy: DashboardCopy;
  selectedAnnouncementId: string | null;
}) {
  return (
    <section className="px-4 py-4">
      <div className="space-y-4">
        <Card className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-md bg-[#ebf3fc] px-3 py-1 text-[11px] font-medium text-[var(--erg-blue)]">
                {copy.announcementTitle}
              </div>
              <h1 className="mt-4 text-[29px] font-semibold leading-[1.1]  text-slate-900">
                {copy.announcementHeroTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.announcementDescription}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--erg-blue)] text-white shadow-sm">
              <CampaignOutlinedIcon fontSize="small" />
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              id={`student-announcement-${announcement.id}`}
              className={cn(
                "rounded-lg border bg-white p-4 shadow-sm transition",
                selectedAnnouncementId === announcement.id
                  ? "border-[var(--erg-blue)]/30 ring-2 ring-[var(--erg-blue)]/10"
                  : "border-slate-200/80",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.isPinned ? (
                      <Badge tone="primary">
                        <PushPinOutlinedIcon fontSize="small" />
                        {copy.announcementPinnedLabel}
                      </Badge>
                    ) : null}
                    <Badge tone="neutral">{announcement.targetLabel}</Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-900">{announcement.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.content}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-[#f8faff] px-4 py-3 text-sm text-slate-500">
                <div className="font-semibold text-slate-800">{announcement.teacherName}</div>
                <div className="mt-1">{announcement.createdAtLabel}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ",
        tone === "primary"
          ? "bg-[#ebf3fc] text-[var(--erg-blue)]"
          : "border border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}
