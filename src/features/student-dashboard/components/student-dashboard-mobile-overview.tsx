import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

import { Button, Card, ProgressBar } from "@/components/ui/dashboard-kit";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/student-dashboard/types/student-dashboard-types";

type StudentPageKey = "overview" | "assignments" | "scores" | "discussion" | "announcements" | "account";

type DiscussionPreviewItem = {
  id: string;
  authorName: string;
  className: string;
  commentCount: number;
  content: string;
  createdAtLabel: string;
};

export function StudentDashboardMobileOverview({
  announcement,
  announcementPinnedLabel,
  discussionPosts,
  discussionSectionTitle,
  heroDescription,
  heroEyebrow,
  heroTitle,
  onOpenAssignment,
  onPageChange,
  openAssignments,
  primaryAction,
  priorityAssignment,
  profile,
  secondaryAction,
  todayTitle,
}: {
  announcement: StudentTeacherAnnouncement | undefined;
  announcementPinnedLabel: string;
  discussionPosts: DiscussionPreviewItem[];
  discussionSectionTitle: string;
  heroDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
  openAssignments: StudentDashboardAssignment[];
  primaryAction: string;
  priorityAssignment: StudentDashboardAssignment;
  profile: StudentDashboardProfile;
  secondaryAction: string;
  todayTitle: string;
}) {
  return (
    <section className="px-4 py-4">
      <div className="space-y-3.5">
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="inline-flex rounded-full bg-[#eef3fd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1557ff]">
            {heroEyebrow}
          </div>
          <h1 className="mt-4 text-[27px] font-semibold leading-[1.12] tracking-[-0.03em] text-[#0f172a]">
            {heroTitle}
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-slate-600">{heroDescription}</p>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <MobileStat label="Open" value={`${openAssignments.length}`} />
            <MobileStat label="Done" value={`${profile.completedAssignments}`} />
            <MobileStat label="Avg" value={`${profile.averageScore}`} />
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              className="h-10 flex-1 rounded-2xl bg-[#1557ff] text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(21,87,255,0.22)] hover:bg-[#0f48dd]"
              onClick={() => onOpenAssignment(priorityAssignment.id)}
            >
              {primaryAction}
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700"
              onClick={() => onPageChange("assignments")}
            >
              {secondaryAction}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            {announcement?.isPinned ? <Capsule>{announcementPinnedLabel}</Capsule> : null}
            <Capsule>{announcement?.targetLabel ?? profile.className}</Capsule>
          </div>
          <h2 className="mt-4 text-[20px] font-semibold leading-[1.15] tracking-[-0.02em] text-slate-900">
            {announcement?.title ?? "Lịch học và bài ưu tiên tuần này"}
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-slate-600">
            {announcement?.content ?? "Khi giáo viên gửi thông báo mới, nội dung quan trọng sẽ hiện tại đây."}
          </p>
          {announcement ? (
            <div className="mt-4 text-xs font-semibold text-slate-500">
              {announcement.teacherName} · {announcement.createdAtLabel}
            </div>
          ) : null}

          <Button
            variant="outline"
            className="mt-4 h-10 w-full rounded-2xl border-slate-200 bg-white text-[14px] font-medium text-slate-700"
            onClick={() => onPageChange("announcements")}
          >
            Thông báo giáo viên
          </Button>
        </Card>

        <Card className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-slate-900">{todayTitle}</div>
            <button type="button" className="text-[13px] font-semibold text-[#1557ff]" onClick={() => onPageChange("assignments")}>
              {secondaryAction}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {openAssignments.slice(0, 3).map((assignment) => (
              <article
                key={assignment.id}
                className="rounded-[22px] border border-slate-200 bg-[#fafbff] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <Capsule>{assignment.statusLabel}</Capsule>
                      <Capsule>{assignment.subjectLabel}</Capsule>
                    </div>
                    <h3 className="mt-3 text-[17px] font-semibold leading-6 text-slate-900">{assignment.title}</h3>
                    <p className="mt-1 text-[14px] text-slate-500">{assignment.dueLabel}</p>
                  </div>
                  <button
                    type="button"
                    className="grid h-10 min-w-10 place-items-center rounded-2xl bg-[#1557ff] px-3 text-white shadow-sm"
                    onClick={() => onOpenAssignment(assignment.id)}
                  >
                    <TaskAltOutlinedIcon fontSize="small" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <span>Progress</span>
                    <span>{assignment.progressRate}%</span>
                  </div>
                  <ProgressBar
                    value={assignment.progressRate}
                    className="mt-2 h-2 bg-slate-100"
                    indicatorClassName={assignment.status === "overdue" ? "bg-[var(--erg-red)]" : "bg-[#1557ff]"}
                  />
                  <p className="mt-3 text-[14px] leading-6 text-slate-600">{assignment.focusNote}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-slate-900">{discussionSectionTitle}</div>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-2xl bg-[#eef3fd] text-[#1557ff]" onClick={() => onPageChange("discussion")}>
              <ForumOutlinedIcon fontSize="small" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {discussionPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                className="w-full rounded-[22px] border border-slate-200 bg-[#fafbff] px-4 py-4 text-left transition hover:bg-white"
                onClick={() => onPageChange("discussion")}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <Capsule>{post.className}</Capsule>
                  <span>{post.authorName}</span>
                  <span>·</span>
                  <span>{post.createdAtLabel}</span>
                </div>
                <p className="mt-3 line-clamp-2 whitespace-pre-line text-[14px] leading-6 text-slate-700">{post.content}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {post.commentCount} replies
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function Capsule({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-[#fbfcff] px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#1557ff]">{value}</div>
    </div>
  );
}
