import Box from "@mui/material/Box";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
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
    <Box component="section" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 4) * 0)","marginBlockEnd":"calc(calc(0.25rem * 4) * calc(1 - 0))"}}}>
        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
            <div>
              <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "inline-flex", fontSize: 11, fontWeight: 500, px: 1.5, py: 0.5 }}>
                {copy.assignmentsTitle}
              </Box>
              <Box component="h1" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"29px","fontWeight":"600","lineHeight":"1.1","color":"oklch(20.8% 0.042 265.755)"}}>
                {copy.todayTitle}
              </Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{copy.assignmentsDescription}</Box>
            </div>
            <Box component="div" sx={{"display":"grid","height":"calc(0.25rem * 11)","width":"calc(0.25rem * 11)","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"#696CFF","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
              <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 2.5)"}}>
            <MobileMetric label={copy.stats.open} value={`${openAssignments.length}`} tone="primary" />
            <MobileMetric label={copy.stats.overdue} value={`${overdueAssignments.length}`} tone="danger" />
            <MobileMetric
              label={copy.stats.completed}
              value={`${completedAssignments.length}/${assignments.length}`}
              tone="neutral"
            />
          </Box>
        </Card>

        <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}
            >
              <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                  <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
                    <Chip>{assignment.statusLabel}</Chip>
                    <Chip>{assignment.subjectLabel}</Chip>
                  </Box>
                  <Box component="h2" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"1.125rem","lineHeight":"calc(0.25rem * 6)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{assignment.title}</Box>
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.dueLabel}</Box>
                </Box>
                <Box component="div" sx={{"borderRadius":"0.5rem","backgroundColor":"#f5f8ff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)","textAlign":"right","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>
                  <Box component="div" sx={{"fontWeight":"600","color":"oklch(27.9% 0.041 260.031)"}}>{assignment.teacherName}</Box>
                  <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)"}}>{assignment.lastActivityLabel}</Box>
                </Box>
              </Box>

              <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)"}}>
                <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","fontSize":"11px","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
                  <span>{copy.progressLabel}</span>
                  <span>{assignment.progressRate}%</span>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={assignment.progressRate}
                  sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: "rgb(241 245 249)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: assignment.status === "overdue" ? "#FF5630" : "#696CFF",
                    },
                  }}
                />
              </Box>

              <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","borderRadius":"0.5rem","backgroundColor":"#f8faff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
                <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                  <Box component="div" sx={{"fontSize":"11px","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
                    {copy.questionCountLabel}
                  </Box>
                  <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>
                    {assignment.answeredCount}/{assignment.totalQuestions}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{"height":"calc(0.25rem * 11)","borderRadius":"0.5rem","backgroundColor":"#696CFF","paddingInline":"calc(0.25rem * 4)","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","&:hover":{"@media (hover: hover)":{"backgroundColor":"#585BE0"}}}}
                  onClick={() => onOpenAssignment(assignment.id)}
                >
                  {copy.assignmentAction(assignment.status)}
                </Button>
              </Box>
            </Card>
          ))}
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

function MobileMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "neutral" | "primary";
  value: string;
}) {
  const valueColor = tone === "danger" ? "#FF5630" : tone === "primary" ? "#696CFF" : "text.primary";

  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fbfcff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box sx={{ color: valueColor, fontSize: 20, fontWeight: 600, mt: 0.5 }}>{value}</Box>
    </Box>
  );
}
