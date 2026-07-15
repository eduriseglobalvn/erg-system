import Box from "@mui/material/Box";
import { type ReactNode } from "react";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";

import { ErgFooter } from "@/components/erg-footer";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentAssignmentAttempt, StudentAssignmentStatus, StudentDashboardAssignment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getBestAttempt } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

const assignmentStatusMeta: Record<
  StudentAssignmentStatus,
  {
    chipBackground: string;
    chipBorder: string;
    chipColor: string;
    progressColor: string;
    cardBorder: string;
  }
> = {
  not_started: {
    chipBackground: "#f8fafc", chipBorder: "#e2e8f0", chipColor: "#475569",
    progressColor: "#94a3b8",
    cardBorder: "#e2e8f0",
  },
  in_progress: {
    chipBackground: "#fffbeb", chipBorder: "#fde68a", chipColor: "#b45309",
    progressColor: "#f59e0b",
    cardBorder: "#fef3c7",
  },
  submitted: {
    chipBackground: "#ecfdf5", chipBorder: "#a7f3d0", chipColor: "#047857",
    progressColor: "#10b981",
    cardBorder: "#d1fae5",
  },
  overdue: {
    chipBackground: "#fff1f2", chipBorder: "#fecdd3", chipColor: "#be123c",
    progressColor: "#f43f5e",
    cardBorder: "#ffe4e6",
  },
};
export function BrandWordmark() {
  return (
    <Box component="div" sx={{"display":"flex","minWidth":"calc(0.25rem * 0)","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"display":"flex","alignItems":"flex-end","fontSize":"1.25rem","lineHeight":"1","fontWeight":"600"}}>
        <Box component="span" sx={{"color":"#696CFF"}}>ER</Box>
        <Box component="span" sx={{"color":"#FF5630"}}>G</Box>
      </Box>
      <Box component="div" sx={{"display":"none","minWidth":"calc(0.25rem * 0)","@media ((min-width: 40rem))":{"display":"block"}}}>
        <Box component="div" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"1rem","lineHeight":"1","fontWeight":"600","color":"#696CFF"}}>EDURISE GLOBAL</Box>
        <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>Learn today, lead tomorrow</Box>
      </Box>
    </Box>
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
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 5)"}}>
      <Box component="div" sx={{"display":"flex","alignItems":"flex-start","gap":"calc(0.25rem * 3)"}}>
        <Box component="span" sx={{"display":"grid","height":"calc(0.25rem * 10)","width":"calc(0.25rem * 10)","flexShrink":"0","placeItems":"center","borderRadius":"0.375rem","backgroundColor":"oklch(96.8% 0.007 247.896)","color":"#696CFF"}}>
          {icon}
        </Box>
        <div>
          <Box component="h1" sx={{"fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{title}</Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","maxWidth":"48rem","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{description}</Box>
        </div>
      </Box>
    </Box>
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
    <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="h2" sx={{"fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"#696CFF"}}>{title}</Box>
      <Box component="button" type="button" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"#696CFF"}} onClick={onAction}>
        {actionLabel}
      </Box>
    </Box>
  );
}

export function AssignmentScoreCard({ assignment, copy }: { assignment: StudentDashboardAssignment; copy: DashboardCopy }) {
  const bestAttempt = getBestAttempt(assignment.attempts);
  const recentAttempts = assignment.attempts.slice(0, 3);

  return (
    <Box component="article" sx={{ borderBottom: "1px solid", borderColor: "#f1f5f9", p: 2, "&:last-of-type": { borderBottom: 0 } }}>
      <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 3)","@media ((min-width: 48rem))":{"flexDirection":"row","alignItems":"flex-start","justifyContent":"space-between"}}}>
        <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
          <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
            <StatusPill status={assignment.status} label={assignment.statusLabel} />
            <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            <Box component="span" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.dueLabel}</Box>
          </Box>

          <Box component="h2" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"1.125rem","lineHeight":"1.375","fontWeight":"600","color":"#696CFF"}}>{assignment.title}</Box>
        </Box>

        <Box component="div" sx={{"width":"100%","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","@media ((min-width: 48rem))":{"width":"148px","textAlign":"right"}}}>
          <Box component="div" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>{copy.bestScoreLabel}</Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"#696CFF"}}>
            {bestAttempt ? copy.scoreBadge(bestAttempt.score, bestAttempt.maxScore) : copy.pendingScore}
          </Box>
        </Box>
      </Box>

      <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)"}}>
        <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
          <span>{copy.recentResultsTitle}</span>
          <span>{recentAttempts.length}/{Math.min(assignment.attempts.length, 3)}</span>
        </Box>
        <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","display":"grid","gap":"calc(0.25rem * 2)","@media ((min-width: 40rem))":{"gridTemplateColumns":"repeat(3, minmax(0, 1fr))"}}}>
          {recentAttempts.map((attempt) => (
            <AttemptResultRow key={attempt.id} attempt={attempt} copy={copy} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function AttemptResultRow({ attempt, copy }: { attempt: StudentAssignmentAttempt; copy: DashboardCopy }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)"}}>
      <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
        <Box component="div" sx={{"overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>{attempt.completedAtLabel}</Box>
        <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>
          {copy.attemptDurationLabel}: {attempt.durationLabel}
        </Box>
      </Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"#696CFF"}}>{copy.scoreBadge(attempt.score, attempt.maxScore)}</Box>
    </Box>
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
    <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: statusMeta.cardBorder, borderRadius: 1, boxShadow: "none" }}>
      <Box sx={{ p: compact ? 1.5 : 2 }}>
        <Box component="div" sx={{"display":"flex","flexDirection":"column","gap":"calc(0.25rem * 4)","@media ((min-width: 64rem))":{"flexDirection":"row","alignItems":"flex-start","justifyContent":"space-between"}}}>
          <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
            <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
              <StatusPill status={assignment.status} label={assignment.statusLabel} />
              <CompactBadge>{assignment.subjectLabel}</CompactBadge>
            </Box>

            <Box component="h3" sx={{ color: "#696CFF", fontSize: compact ? 16 : 18, fontWeight: 600, lineHeight: 1.375, m: 0, mt: 1 }}>{assignment.title}</Box>
            {!compact ? (
              <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","display":"flex","flexWrap":"wrap","gap":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>
                <span>{assignment.teacherName}</span>
                <span>•</span>
                <span>{assignment.dueLabel}</span>
                <span>•</span>
                <span>{assignment.lastActivityLabel}</span>
              </Box>
            ) : (
              <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.dueLabel}</Box>
            )}
          </Box>

          <Box component="div" sx={{"display":"flex","flexShrink":"0","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
            {assignment.score !== null ? (
              <Chip
                variant="outlined"
                size="small"
                label={`${copy.scoreLabel}: ${copy.scoreBadge(assignment.score, assignment.maxScore)}`}
                sx={{ borderColor: "rgba(105,108,255,0.1)", bgcolor: "rgba(105,108,255,0.05)", color: "#696CFF" }}
              />
            ) : null}

            <Button
              variant={actionable ? "contained" : "outlined"}
              sx={actionable ? { bgcolor: assignment.status === "overdue" ? "#FF5630" : "#696CFF", color: "common.white", "&:hover": { bgcolor: assignment.status === "overdue" ? "#E04B26" : "#585BE0" } } : { bgcolor: "background.paper", borderColor: "divider", color: "text.secondary" }}
              onClick={actionable ? onOpen : undefined}
              disabled={!actionable}
            >
              {copy.assignmentAction(assignment.status)}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "minmax(0,1fr) 112px 112px" }, mt: 2 }}>
          <Box>
            <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
              <Box component="span" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>{copy.progressLabel}</Box>
              <Box component="span" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{assignment.progressRate}%</Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={assignment.progressRate}
              sx={{
                mt: 1,
                height: 10,
                borderRadius: 1,
                bgcolor: "rgb(241 245 249)",
                "& .MuiLinearProgress-bar": { bgcolor: statusMeta.progressColor },
              }}
            />
            {!compact ? <Box component="p" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.focusNote}</Box> : null}
          </Box>

          {!compact ? (
            <>
              <CompactStat label={copy.questionCountLabel} value={`${assignment.answeredCount}/${assignment.totalQuestions}`} />
              <CompactStat label={copy.scoreLabel} value={assignment.score !== null ? `${assignment.score}` : copy.pendingScore} />
            </>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
}

export function CompactBadge({ children }: { children: string }) {
  return (
    <Box component="span" sx={{"display":"inline-flex","alignItems":"center","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1)","fontSize":"11px","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)"}}>
      {children}
    </Box>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"#696CFF"}}>{value}</Box>
    </Box>
  );
}

export function ProfileStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box sx={{ color: tone === "danger" ? "#FF5630" : "#696CFF", fontSize: 20, fontWeight: 600, mt: 0.5 }}>
        {value}
      </Box>
    </Box>
  );
}

export function StatusPill({ status, label }: { status: StudentAssignmentStatus; label: string }) {
  return (
    <Box component="span" sx={{ alignItems: "center", bgcolor: assignmentStatusMeta[status].chipBackground, border: "1px solid", borderColor: assignmentStatusMeta[status].chipBorder, borderRadius: 1, color: assignmentStatusMeta[status].chipColor, display: "inline-flex", fontSize: 11, fontWeight: 600, px: 1.25, py: 0.5, whiteSpace: "nowrap" }}>
      {label}
    </Box>
  );
}

export function StudentFooter() {
  return <ErgFooter />;
}
