import type { ReactNode } from "react";
import { BarChart3 as BarChartRoundedIcon } from "lucide-react";
import { Trophy as EmojiEventsOutlinedIcon } from "lucide-react";
import { LineChart as QueryStatsRoundedIcon } from "lucide-react";

import Card from "@mui/material/Card";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileScores({
  assignments,
  copy,
}: {
  assignments: StudentDashboardAssignment[];
  copy: DashboardCopy;
}) {
  const attemptedAssignments = assignments.filter((assignment) => assignment.attempts.length > 0);
  const bestScore = attemptedAssignments.reduce((best, assignment) => Math.max(best, assignment.score ?? 0), 0);
  const averageScore = attemptedAssignments.length
    ? Math.round(
        attemptedAssignments.reduce((sum, assignment) => sum + (assignment.score ?? 0), 0) / attemptedAssignments.length,
      )
    : 0;

  return (
    <section className="px-4 py-4">
      <div className="space-y-4">
        <Card className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex rounded-md bg-[rgba(105, 108, 255, 0.08)] px-3 py-1 text-[11px] font-medium text-[#696CFF]">
                {copy.scoresTitle}
              </div>
              <h1 className="mt-4 text-[29px] font-semibold leading-[1.1]  text-slate-900">
                {copy.recentResultsTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.scoresDescription}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#696CFF] text-white shadow-sm">
              <BarChartRoundedIcon size={16} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <ScoreMetric icon={<QueryStatsRoundedIcon size={16} />} label={copy.stats.average} value={`${averageScore}`} />
            <ScoreMetric icon={<EmojiEventsOutlinedIcon size={16} />} label={copy.bestScoreLabel} value={`${bestScore}`} />
            <ScoreMetric icon={<BarChartRoundedIcon size={16} />} label={copy.stats.completed} value={`${attemptedAssignments.length}`} />
          </div>
        </Card>

        <div className="space-y-3">
          {attemptedAssignments.length > 0 ? (
            attemptedAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{assignment.subjectLabel}</Chip>
                      <Chip>{assignment.statusLabel}</Chip>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-900">{assignment.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{assignment.teacherName}</p>
                  </div>
                  <div className="rounded-lg bg-[rgba(105, 108, 255, 0.08)] px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold text-[#696CFF]">{copy.scoreLabel}</div>
                    <div className="mt-1 text-xl font-semibold text-[#696CFF]">
                      {assignment.score != null ? copy.scoreBadge(assignment.score, assignment.maxScore) : copy.pendingScore}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-[#f8faff] px-4 py-3">
                  <Meta label={copy.attemptDurationLabel} value={assignment.attempts.at(-1)?.durationLabel ?? "--"} />
                  <Meta label={copy.priority.title} value={assignment.attempts.at(-1)?.completedAtLabel ?? assignment.dueLabel} />
                </div>
              </Card>
            ))
          ) : (
            <Card className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm leading-6 text-slate-500 shadow-sm">
              {copy.noRecentResults}
            </Card>
          )}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function ScoreMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#fbfcff] px-3 py-3">
      <div className="flex items-center gap-2 text-[#696CFF]">
        {icon}
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
