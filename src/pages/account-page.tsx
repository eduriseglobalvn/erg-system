import Box from "@mui/material/Box";

import { useNavigate } from "@tanstack/react-router";

import { LmsAccountPage } from "@/features/lms/components/lms-account-page";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export function AccountPage() {
  const navigate = useNavigate();

  return (
    <Box component="main" sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <LmsAccountPage
        onLoginLogs={() => void navigate({ href: teacherPath("/account/login-logs") })}
        onSignedOut={() => void navigate({ replace: true, to: "/login" })}
      />
    </Box>
  );
}
