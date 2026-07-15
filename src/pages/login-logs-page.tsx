import Box from "@mui/material/Box";

import { useNavigate } from "@/routes/router-compat";

import { LmsLoginLogsPage } from "@/features/lms/components/lms-login-logs-page";

export function LoginLogsPage() {
  const navigate = useNavigate();

  return (
    <Box component="main" sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <LmsLoginLogsPage onManageAccount={() => navigate("/account")} />
    </Box>
  );
}
