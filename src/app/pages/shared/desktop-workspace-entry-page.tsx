import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import type { DesktopWorkspace } from "@/platform/desktop";

const WORKSPACE_CHOICES = [
  {
    workspace: "TEACHER",
    path: "/teacher",
    eyebrow: "Dành cho giáo viên",
    title: "Teacher Workspace",
    description: "Quản lý lớp, giao bài, chấm điểm và lịch giảng dạy.",
    icon: SchoolRoundedIcon,
  },
  {
    workspace: "STUDENT",
    path: "/student",
    eyebrow: "Dành cho học viên",
    title: "Student Workspace",
    description: "Học tập, làm bài, theo dõi tiến độ và kết quả cá nhân.",
    icon: WorkspacePremiumRoundedIcon,
  },
] as const satisfies readonly {
  workspace: DesktopWorkspace;
  path: "/teacher" | "/student";
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof SchoolRoundedIcon;
}[];

export function DesktopWorkspaceEntryPage() {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        minHeight: "100dvh",
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.10)",
          m: "auto",
          maxWidth: 820,
          overflow: "hidden",
          p: { xs: 2.5, sm: 4 },
          width: "100%",
        }}
      >
        <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ERG Learning Desktop
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 26, sm: 34 }, fontWeight: 850, letterSpacing: "-0.03em", mt: 1 }}>
          Chọn không gian làm việc
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 620, mt: 1 }}>
          Một ứng dụng dùng chung giao diện với ERG trên web. Quyền truy cập vẫn được xác thực sau khi đăng nhập.
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 3.5 }}>
          {WORKSPACE_CHOICES.map((choice) => {
            const Icon = choice.icon;
            return (
              <ButtonBase
                key={choice.workspace}
                onClick={() =>
                  void navigate({
                    href: `/login?workspace=${choice.workspace}&redirect=${encodeURIComponent(choice.path)}`,
                  })
                }
                sx={{ borderRadius: 2.5, flex: 1, textAlign: "left" }}
              >
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    height: "100%",
                    p: 2.5,
                    transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                    width: "100%",
                    "&:hover": { borderColor: "primary.main", boxShadow: "0 14px 30px rgba(15,108,189,0.12)", transform: "translateY(-2px)" },
                  }}
                >
                  <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", display: "flex", height: 46, justifyContent: "center", width: 46 }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, mt: 2.5 }}>{choice.eyebrow}</Typography>
                  <Typography sx={{ fontSize: 19, fontWeight: 800, mt: 0.5 }}>{choice.title}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.55, mt: 0.75 }}>{choice.description}</Typography>
                  <Box sx={{ alignItems: "center", color: "primary.main", display: "flex", fontSize: 13, fontWeight: 800, gap: 0.5, mt: 2.5 }}>
                    Tiếp tục <ArrowForwardRoundedIcon fontSize="small" />
                  </Box>
                </Box>
              </ButtonBase>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
