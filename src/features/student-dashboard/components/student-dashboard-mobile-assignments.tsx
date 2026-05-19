import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import { Button, Card, ProgressBar } from "@/components/ui/dashboard-kit";
import type { DashboardCopy } from "@/features/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileAssignments({
  assignments,
  completedAssignments,
  copy,
  onOpenAssignment,
  openAssignments,
  overdueAssignments,
}: {
  assignments: StudentDashboardAssignment[];
  completedAssignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
  onOpenAssignment: (assignmentId: string) => void;
  openAssignments: StudentDashboardAssignment[];
  overdueAssignments: StudentDashboardAssignment[];
}) {
  return (
    <section className="px-4 py-4">
      <div className="space-y-4">
        <Card className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-[#eef3fd] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1557ff]">
                {copy.assignmentsTitle}
              </div>
              <h1 className="mt-4 text-[29px] font-semibold leading-[1.1] tracking-[-0.02em] text-slate-900">
                {copy.todayTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.assignmentsDescription}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1557ff] text-white shadow-sm">
              <AssignmentTurnedInOutlinedIcon fontSize="small" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <MobileMetric label={copy.stats.open} value={`${openAssignments.length}`} tone="primary" />
            <MobileMetric label={copy.stats.overdue} value={`${overdueAssignments.length}`} tone="danger" />
            <MobileMetric
              label={copy.stats.completed}
              value={`${completedAssignments.length}/${assignments.length}`}
              tone="neutral"
            />
          </div>
        </Card>

        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip>{assignment.statusLabel}</Chip>
                    <Chip>{assignment.subjectLabel}</Chip>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-900">{assignment.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{assignment.dueLabel}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f8ff] px-3 py-2 text-right text-xs text-slate-500">
                  <div className="font-semibold text-slate-800">{assignment.teacherName}</div>
                  <div className="mt-1">{assignment.lastActivityLabel}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>{copy.progressLabel}</span>
                  <span>{assignment.progressRate}%</span>
                </div>
                <ProgressBar
                  value={assignment.progressRate}
                  className="mt-2 h-2 bg-slate-100"
                  indicatorClassName={assignment.status === "overdue" ? "bg-[var(--erg-red)]" : "bg-[#1557ff]"}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] bg-[#f8faff] px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {copy.questionCountLabel}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    {assignment.answeredCount}/{assignment.totalQuestions}
                  </div>
                </div>
                <Button
                  className="h-11 rounded-2xl bg-[#1557ff] px-4 text-white shadow-[0_8px_22px_rgba(21,87,255,0.24)] hover:bg-[#0f48dd]"
                  onClick={() => onOpenAssignment(assignment.id)}
                >
                  {copy.assignmentAction(assignment.status)}
                  <ChevronRightRoundedIcon fontSize="small" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">
      {children}
    </span>
  );
}

function MobileMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "neutral" | "primary";
  value: string;
}) {
  const valueClassName =
    tone === "danger" ? "text-[var(--erg-red)]" : tone === "primary" ? "text-[#1557ff]" : "text-slate-900";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#fbfcff] px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
}
