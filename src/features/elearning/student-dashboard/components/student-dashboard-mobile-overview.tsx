import Box from "@mui/material/Box";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";

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
    <Box component="section" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3.5) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3.5) * calc(1 - 0))"}}}>
        <Card sx={{"overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "inline-flex", fontSize: 10, fontWeight: 600, px: 1.5, py: 0.5 }}>
            {heroEyebrow}
          </Box>
          <Box component="h1" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"27px","fontWeight":"600","lineHeight":"1.12","color":"#0f172a"}}>
            {heroTitle}
          </Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"14px","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{heroDescription}</Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 2.5)"}}>
            <MobileStat label="Open" value={`${openAssignments.length}`} />
            <MobileStat label="Done" value={`${profile.completedAssignments}`} />
            <MobileStat label="Avg" value={`${profile.averageScore}`} />
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"flex","gap":"calc(0.25rem * 3)"}}>
            <Button
              variant="contained"
              sx={{"height":"calc(0.25rem * 10)","flex":"1","borderRadius":"0.5rem","backgroundColor":"#696CFF","fontSize":"14px","fontWeight":"600","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","&:hover":{"@media ((hover: hover))":{"backgroundColor":"#585BE0"}}}}
              onClick={() => onOpenAssignment(priorityAssignment.id)}
            >
              {primaryAction}
            </Button>
            <Button
              variant="outlined"
              sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","paddingInline":"calc(0.25rem * 4)","fontSize":"14px","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}
              onClick={() => onPageChange("assignments")}
            >
              {secondaryAction}
            </Button>
          </Box>
        </Card>

        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
            {announcement?.isPinned ? <Capsule>{announcementPinnedLabel}</Capsule> : null}
            <Capsule>{announcement?.targetLabel ?? profile.className}</Capsule>
          </Box>
          <Box component="h2" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"20px","fontWeight":"600","lineHeight":"1.15","color":"oklch(20.8% 0.042 265.755)"}}>
            {announcement?.title ?? "Lịch học và bài ưu tiên tuần này"}
          </Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"14px","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>
            {announcement?.content ?? "Khi giáo viên gửi thông báo mới, nội dung quan trọng sẽ hiện tại đây."}
          </Box>
          {announcement ? (
            <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>
              {announcement.teacherName} · {announcement.createdAtLabel}
            </Box>
          ) : null}

          <Button
            variant="outlined"
            fullWidth
            sx={{"marginTop":"calc(0.25rem * 4)","height":"calc(0.25rem * 10)","borderRadius":"0.5rem","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","fontSize":"14px","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}
            onClick={() => onPageChange("announcements")}
          >
            Thông báo giáo viên
          </Button>
        </Card>

        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
            <Box component="div" sx={{"fontSize":"20px","fontWeight":"600","lineHeight":"1","color":"oklch(20.8% 0.042 265.755)"}}>{todayTitle}</Box>
            <Box component="button" type="button" sx={{"fontSize":"13px","fontWeight":"600","color":"#696CFF"}} onClick={() => onPageChange("assignments")}>
              {secondaryAction}
            </Box>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)",":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
            {openAssignments.slice(0, 3).map((assignment) => (
              <Box component="article"
                key={assignment.id}
                sx={{ bgcolor: "#fafbff", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}
              >
                <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                  <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                    <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"11px","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
                      <Capsule>{assignment.statusLabel}</Capsule>
                      <Capsule>{assignment.subjectLabel}</Capsule>
                    </Box>
                    <Box component="h3" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"17px","fontWeight":"600","lineHeight":"calc(0.25rem * 6)","color":"oklch(20.8% 0.042 265.755)"}}>{assignment.title}</Box>
                    <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"14px","color":"oklch(55.4% 0.046 257.417)"}}>{assignment.dueLabel}</Box>
                  </Box>
                  <Box component="button"
                    type="button"
                    sx={{"display":"grid","height":"calc(0.25rem * 10)","minWidth":"calc(0.25rem * 10)","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"#696CFF","paddingInline":"calc(0.25rem * 3)","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}
                    onClick={() => onOpenAssignment(assignment.id)}
                  >
                    <TaskAltOutlinedIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>

                <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)"}}>
                  <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
                    <span>Progress</span>
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
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"14px","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{assignment.focusNote}</Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>

        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
            <Box component="div" sx={{"fontSize":"20px","fontWeight":"600","lineHeight":"1","color":"oklch(20.8% 0.042 265.755)"}}>{discussionSectionTitle}</Box>
            <Box component="button" type="button" sx={{ bgcolor: "rgba(105,108,255,0.08)", border: 0, borderRadius: 1, color: "#696CFF", display: "grid", height: 36, placeItems: "center", width: 36 }} onClick={() => onPageChange("discussion")}>
              <ForumOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)",":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
            {discussionPosts.map((post) => (
              <Box component="button"
                key={post.id}
                type="button"
                sx={{"width":"100%","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fafbff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)","textAlign":"left","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"#fff"}}}}
                onClick={() => onPageChange("discussion")}
              >
                <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>
                  <Capsule>{post.className}</Capsule>
                  <span>{post.authorName}</span>
                  <span>·</span>
                  <span>{post.createdAtLabel}</span>
                </Box>
                <Box component="p" sx={{"marginTop":"calc(0.25rem * 3)","overflow":"hidden","display":"-webkit-box","WebkitBoxOrient":"vertical","WebkitLineClamp":"2","whiteSpace":"pre-line","fontSize":"14px","lineHeight":"calc(0.25rem * 6)","color":"oklch(37.2% 0.044 257.287)"}}>{post.content}</Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>
                  {post.commentCount} replies
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function Capsule({ children }: { children: string }) {
  return (
    <Box component="span" sx={{"display":"inline-flex","alignItems":"center","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 1)","fontSize":"10px","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>
      {children}
    </Box>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fbfcff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"10px","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"28px","fontWeight":"600","lineHeight":"1","color":"#696CFF"}}>{value}</Box>
    </Box>
  );
}
