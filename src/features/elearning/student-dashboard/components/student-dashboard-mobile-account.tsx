import Box from "@mui/material/Box";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";

import type { ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardAssignment,
  StudentDashboardProfile,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileAccount({
  account,
  averageAssignmentScore,
  copy,
  onSignIn,
  onSignOut,
  openAssignments,
  profile,
}: {
  account: ElearningViewerSession | null;
  averageAssignmentScore: number;
  copy: DashboardCopy;
  onSignIn: () => void;
  onSignOut: () => void;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
}) {
  return (
    <Box component="section" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 4) * 0)","marginBlockEnd":"calc(calc(0.25rem * 4) * calc(1 - 0))"}}}>
        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 5)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 4)"}}>
            <Box component="div" sx={{"display":"grid","height":"calc(0.25rem * 16)","width":"calc(0.25rem * 16)","placeItems":"center","borderRadius":"0.5rem","backgroundColor":"#696CFF","fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
              {profile.name.slice(0, 1)}
            </Box>
            <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
              <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "inline-flex", fontSize: 11, fontWeight: 500, px: 1.5, py: 0.5 }}>
                {copy.accountTitle}
              </Box>
              <Box component="h1" sx={{"marginTop":"calc(0.25rem * 3)","fontSize":"28px","fontWeight":"600","lineHeight":"1.1","color":"oklch(20.8% 0.042 265.755)"}}>
                {profile.name}
              </Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>
                {profile.className} · {profile.schoolName}
              </Box>
            </Box>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 5)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 2.5)"}}>
            <Metric label={copy.stats.average} value={`${averageAssignmentScore}`} />
            <Metric label={copy.stats.completed} value={`${profile.completedAssignments}`} />
            <Metric label={copy.stats.open} value={`${openAssignments.length}`} />
          </Box>
        </Card>

        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
            <Box sx={{ bgcolor: "rgba(105,108,255,0.08)", borderRadius: 1, color: "#696CFF", display: "grid", height: 40, placeItems: "center", width: 40 }}>
              <AccountCircleOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
            <div>
              <Box component="h2" sx={{"fontSize":"1rem","lineHeight":"calc(1.5 / 1)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{copy.loginStateTitle}</Box>
              <Box component="p" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{copy.accountDescription}</Box>
            </div>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","borderRadius":"0.5rem","backgroundColor":"#f8faff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 7)","color":"oklch(44.6% 0.043 257.281)"}}>
            <Box component="div" sx={{"fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{account?.name ?? copy.guestLabel}</Box>
            <div>{account?.email ?? copy.guestLabel}</div>
            <div>{account ? copy.signedInAs : copy.guestLabel}</div>
          </Box>

          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gap":"calc(0.25rem * 3)"}}>
            <Button
              variant="contained"
              startIcon={<LoginOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{"height":"calc(0.25rem * 11)","borderRadius":"0.5rem","backgroundColor":"#696CFF","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"#585BE0"}}}}
              onClick={onSignIn}
            >
              {copy.signIn}
            </Button>
            <Button
              variant="outlined"
              startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{"height":"calc(0.25rem * 11)","borderRadius":"0.5rem","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","color":"oklch(37.2% 0.044 257.287)"}}
              onClick={onSignOut}
            >
              {copy.signOut}
            </Button>
          </Box>
        </Card>

        <Card sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"color-mix(in srgb, oklch(92.9% 0.013 255.508) 80%, transparent)","@supports (color: color-mix(in lab, red, red))":{"borderColor":"color-mix(in oklab, oklch(92.9% 0.013 255.508) 80%, transparent)"},"backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
          <Box component="h2" sx={{"fontSize":"1rem","lineHeight":"calc(1.5 / 1)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{copy.learningProfileTitle}</Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"grid","gap":"calc(0.25rem * 3)"}}>
            <InfoRow label={copy.progressLabel} value={`${profile.weeklyGoalProgress}%`} />
            <InfoRow label={copy.assignmentsTitle} value={`${profile.completedAssignments}/${profile.totalAssignments}`} />
            <InfoRow label={copy.scoresTitle} value={`${profile.averageScore}`} />
            <InfoRow label={copy.notificationTitle} value={`${profile.homeroomTeacher}`} />
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fbfcff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"11px","fontWeight":"500","color":"oklch(70.4% 0.04 256.788)"}}>{label}</Box>
      <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{value}</Box>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)","borderRadius":"0.5rem","backgroundColor":"#f8faff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)"}}>
      <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{label}</Box>
      <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{value}</Box>
    </Box>
  );
}
