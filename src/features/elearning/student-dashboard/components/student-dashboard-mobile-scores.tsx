import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

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
    <Box component="section" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 4) * 0)","marginBlockEnd":"calc(calc(0.25rem * 4) * calc(1 - 0))"}}}>
        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
            <div>
              <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "inline-flex", fontSize: 11, fontWeight: 500, px: 1.5, py: 0.5 }}>
                {copy.scoresTitle}
              </Box>
              <Box component="h1" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"29px","fontWeight":"600","lineHeight":"1.1","color":"oklch(20.8% 0.042 265.755)"}}>
                {copy.recentResultsTitle}
              </Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{copy.scoresDescription}</Box>
            </div>
            <Box component="div" sx={{"display":"grid","height":"calc(0.25rem * 11)","width":"calc(0.25rem * 11)","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"#696CFF","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
              <BarChartRoundedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 2.5)"}}>
            <ScoreMetric icon={<QueryStatsRoundedIcon sx={{ fontSize: 16 }} />} label={copy.stats.average} value={`${averageScore}`} />
            <ScoreMetric icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 16 }} />} label={copy.bestScoreLabel} value={`${bestScore}`} />
            <ScoreMetric icon={<BarChartRoundedIcon sx={{ fontSize: 16 }} />} label={copy.stats.completed} value={`${attemptedAssignments.length}`} />
          </Box>
        </Card>

        <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
          {attemptedAssignments.length > 0 ? (
            attemptedAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}
              >
                <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                  <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                    <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
                      <Chip>{assignment.subjectLabel}</Chip>
                      <Chip>{assignment.statusLabel}</Chip>
                    </Box>
                    <Box component="h2" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"1.125rem","lineHeight":"calc(0.25rem * 6)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{assignment.title}</Box>
                    <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.teacherName}</Box>
                  </Box>
                  <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, px: 1.5, py: 1, textAlign: "right" }}>
                    <Box component="div" sx={{"fontSize":"11px","fontWeight":"600","color":"#696CFF"}}>{copy.scoreLabel}</Box>
                    <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"#696CFF"}}>
                      {assignment.score != null ? copy.scoreBadge(assignment.score, assignment.maxScore) : copy.pendingScore}
                    </Box>
                  </Box>
                </Box>

                <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gridTemplateColumns":"repeat(2, minmax(0, 1fr))","gap":"calc(0.25rem * 3)","borderRadius":"0.5rem","backgroundColor":"#f8faff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
                  <Meta label={copy.attemptDurationLabel} value={assignment.attempts.at(-1)?.durationLabel ?? "--"} />
                  <Meta label={copy.priority.title} value={assignment.attempts.at(-1)?.completedAtLabel ?? assignment.dueLabel} />
                </Box>
              </Card>
            ))
          ) : (
            <Card sx={{"borderRadius":"0.5rem","borderStyle":"dashed","borderWidth":"1px","borderColor":"oklch(86.9% 0.022 252.894)","backgroundColor":"#fff","padding":"calc(0.25rem * 6)","textAlign":"center","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(55.4% 0.046 257.417)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
              {copy.noRecentResults}
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <Box component="span" sx={{"display":"inline-flex","alignItems":"center","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1)","fontSize":"11px","fontWeight":"500","color":"oklch(44.6% 0.043 257.281)"}}>
      {children}
    </Box>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
      <Box component="div" sx={{"fontSize":"11px","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>{value}</Box>
    </Box>
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
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fbfcff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","color":"#696CFF"}}>
        {icon}
        <Box component="span" sx={{"fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      </Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{value}</Box>
    </Box>
  );
}
