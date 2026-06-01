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
        <Card className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-[#eef3fd] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1557ff]">
                {copy.announcementTitle}
              </div>
              <h1 className="mt-4 text-[29px] font-semibold leading-[1.1] tracking-[-0.02em] text-slate-900">
                {copy.announcementHeroTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.announcementDescription}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1557ff] text-white shadow-sm">
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
                "rounded-[26px] border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition",
                selectedAnnouncementId === announcement.id
                  ? "border-[#1557ff]/30 ring-2 ring-[#1557ff]/10"
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

              <div className="mt-4 rounded-[20px] bg-[#f8faff] px-4 py-3 text-sm text-slate-500">
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
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
        tone === "primary"
          ? "bg-[#eef3fd] text-[#1557ff]"
          : "border border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}
