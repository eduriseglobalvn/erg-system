import Box from "@mui/material/Box";

import { useNavigate } from "@tanstack/react-router";

import { LmsLoginLogsPage } from "@/features/lms/components/lms-login-logs-page";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export function LoginLogsPage() {
  const navigate = useNavigate();

  return (
    <Box component="main" sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <LmsLoginLogsPage onManageAccount={() => void navigate({ href: teacherPath("/account") })} />
    </Box>
  );
}
