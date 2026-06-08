import { type ReactNode } from "react";

import { ErgFooter } from "@/components/erg-footer";
import { Badge, Button, Card, ProgressBar } from "@/components/ui/dashboard-kit";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentAssignmentAttempt, StudentAssignmentStatus, StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getBestAttempt } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { cn } from "@/lib/utils";

const assignmentStatusMeta: Record<
  StudentAssignmentStatus,
  {
    chipClassName: string;
    progressClassName: string;
    cardClassName: string;
  }
> = {
  not_started: {
    chipClassName: "border-slate-200 bg-slate-50 text-slate-600",
    progressClassName: "bg-slate-400",
    cardClassName: "border-slate-200",
  },
  in_progress: {
    chipClassName: "border-amber-200 bg-amber-50 text-amber-700",
    progressClassName: "bg-amber-500",
    cardClassName: "border-amber-100",
  },
  submitted: {
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    progressClassName: "bg-emerald-500",
    cardClassName: "border-emerald-100",
  },
  overdue: {
    chipClassName: "border-rose-200 bg-rose-50 text-rose-700",
    progressClassName: "bg-rose-500",
    cardClassName: "border-rose-100",
  },
};
export function BrandWordmark() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex items-end text-xl font-semibold leading-none">
        <span className="text-[var(--erg-blue)]">ER</span>
        <span className="text-[var(--erg-red)]">G</span>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-base font-semibold leading-none text-[var(--erg-blue)]">EDURISE GLOBAL</div>
        <div className="mt-1 text-[11px] font-medium text-slate-400">Learn today, lead tomorrow</div>
      </div>
    </div>
  );
}

export function PageTitle({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-[var(--erg-blue)]">
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <h2 className="text-lg font-semibold text-[var(--erg-blue)]">{title}</h2>
      <button type="button" className="text-sm font-semibold text-[var(--erg-blue)]" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

export function AssignmentScoreCard({ assignment, copy }: { assignment: StudentDashboardAssignment; copy: DashboardCopy }) {
  const bestAttempt = getBestAttempt(assignment.attempts);
  const recentAttempts = assignment.attempts.slice(0, 3);

  return (
    <article className="border-b border-slate-100 p-4 last:border-b-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={assignment.status} label={assignment.statusLabel} />
            <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            <span className="text-sm text-slate-500">{assignment.dueLabel}</span>
          </div>

          <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--erg-blue)]">{assignment.title}</h2>
        </div>

        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:w-[148px] md:text-right">
          <div className="text-xs font-semibold text-slate-500">{copy.bestScoreLabel}</div>
          <div className="mt-1 text-xl font-semibold text-[var(--erg-blue)]">
            {bestAttempt ? copy.scoreBadge(bestAttempt.score, bestAttempt.maxScore) : copy.pendingScore}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>{copy.recentResultsTitle}</span>
          <span>{recentAttempts.length}/{Math.min(assignment.attempts.length, 3)}</span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {recentAttempts.map((attempt) => (
            <AttemptResultRow key={attempt.id} attempt={attempt} copy={copy} />
          ))}
        </div>
      </div>
    </article>
  );
}

function AttemptResultRow({ attempt, copy }: { attempt: StudentAssignmentAttempt; copy: DashboardCopy }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-950">{attempt.completedAtLabel}</div>
        <div className="mt-1 text-xs text-slate-500">
          {copy.attemptDurationLabel}: {attempt.durationLabel}
        </div>
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--erg-blue)]">{copy.scoreBadge(attempt.score, attempt.maxScore)}</div>
    </div>
  );
}

export function AssignmentCard({
  assignment,
  compact = false,
  copy,
  onOpen,
}: {
  assignment: StudentDashboardAssignment;
  compact?: boolean;
  copy: DashboardCopy;
  onOpen: () => void;
}) {
  const statusMeta = assignmentStatusMeta[assignment.status];
  const actionable = assignment.status !== "submitted";

  return (
    <Card className={cn("rounded-lg border bg-white shadow-none", statusMeta.cardClassName)}>
      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={assignment.status} label={assignment.statusLabel} />
              <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            </div>

            <h3 className={cn("mt-2 font-semibold leading-snug text-[var(--erg-blue)]", compact ? "text-base" : "text-lg")}>{assignment.title}</h3>
            {!compact ? (
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{assignment.teacherName}</span>
                <span>•</span>
                <span>{assignment.dueLabel}</span>
                <span>•</span>
                <span>{assignment.lastActivityLabel}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">{assignment.dueLabel}</div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {assignment.score !== null ? (
              <Badge className="border-[var(--erg-blue)]/10 bg-[var(--erg-blue)]/5 text-[var(--erg-blue)]" tone="outline">
                {copy.scoreLabel}: {copy.scoreBadge(assignment.score, assignment.maxScore)}
              </Badge>
            ) : null}

            <Button
              variant={actionable ? "default" : "outline"}
              className={cn(
                actionable
                  ? assignment.status === "overdue"
                    ? "bg-[var(--erg-red)] text-white hover:bg-[#b0001d]"
                    : "bg-[var(--erg-blue)] text-white hover:bg-[var(--erg-blue-hover)]"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
              onClick={actionable ? onOpen : undefined}
              disabled={!actionable}
            >
              {copy.assignmentAction(assignment.status)}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_112px_112px]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-400">{copy.progressLabel}</span>
              <span className="text-sm font-semibold text-slate-900">{assignment.progressRate}%</span>
            </div>
            <ProgressBar value={assignment.progressRate} className="mt-2 h-2.5 bg-slate-100" indicatorClassName={statusMeta.progressClassName} />
            {!compact ? <p className="mt-2 text-sm leading-6 text-slate-500">{assignment.focusNote}</p> : null}
          </div>

          {!compact ? (
            <>
              <CompactStat label={copy.questionCountLabel} value={`${assignment.answeredCount}/${assignment.totalQuestions}`} />
              <CompactStat label={copy.scoreLabel} value={assignment.score !== null ? `${assignment.score}` : copy.pendingScore} />
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function CompactBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--erg-blue)]">{value}</div>
    </div>
  );
}

export function ProfileStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold", tone === "danger" ? "text-[var(--erg-red)]" : "text-[var(--erg-blue)]")}>
        {value}
      </div>
    </div>
  );
}

export function StatusPill({ status, label }: { status: StudentAssignmentStatus; label: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-semibold ", assignmentStatusMeta[status].chipClassName)}>
      {label}
    </span>
  );
}

export function StudentFooter() {
  return <ErgFooter />;
}
