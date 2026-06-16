import { ClipboardCheck as AssignmentTurnedInOutlinedIcon } from "lucide-react";
import { ChevronRight as ChevronRightRoundedIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

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
        <Card className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-md bg-[rgba(105, 108, 255, 0.08)] px-3 py-1 text-[11px] font-medium text-[#696CFF]">
                {copy.assignmentsTitle}
              </div>
              <h1 className="mt-4 text-[29px] font-semibold leading-[1.1]  text-slate-900">
                {copy.todayTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.assignmentsDescription}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#696CFF] text-white shadow-sm">
              <AssignmentTurnedInOutlinedIcon size={16} />
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
              className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm"
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
                <div className="rounded-lg bg-[#f5f8ff] px-3 py-2 text-right text-xs text-slate-500">
                  <div className="font-semibold text-slate-800">{assignment.teacherName}</div>
                  <div className="mt-1">{assignment.lastActivityLabel}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
                  <span>{copy.progressLabel}</span>
                  <span>{assignment.progressRate}%</span>
                </div>
                <ProgressBar
                  value={assignment.progressRate}
                  className="mt-2 h-2 bg-slate-100"
                  indicatorClassName={assignment.status === "overdue" ? "bg-[#FF5630]" : "bg-[#696CFF]"}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-[#f8faff] px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400">
                    {copy.questionCountLabel}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    {assignment.answeredCount}/{assignment.totalQuestions}
                  </div>
                </div>
                <Button
                  className="h-11 rounded-lg bg-[#696CFF] px-4 text-white shadow-sm hover:bg-[#585BE0]"
                  onClick={() => onOpenAssignment(assignment.id)}
                >
                  {copy.assignmentAction(assignment.status)}
                  <ChevronRightRoundedIcon size={16} />
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
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
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
    tone === "danger" ? "text-[#FF5630]" : tone === "primary" ? "text-[#696CFF]" : "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-[#fbfcff] px-3 py-3">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
}
