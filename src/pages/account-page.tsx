import Box from "@mui/material/Box";

import { useNavigate } from "@/routes/router-compat";

import { LmsAccountPage } from "@/features/lms/components/lms-account-page";

export function AccountPage() {
  const navigate = useNavigate();

  return (
    <Box component="main" sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <LmsAccountPage
        onLoginLogs={() => navigate("/account/login-logs")}
        onSignedOut={() => navigate("/login", { replace: true })}
      />
    </Box>
  );
}
