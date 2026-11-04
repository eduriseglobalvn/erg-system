import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import {
  changeMyPassword,
  requestRecoveryEmailChallenge,
  updateMyTeacherProfile,
  verifyRecoveryEmailChallenge,
} from "@/platform/auth/api/account-security-api";
import { saveCurrentAccount } from "@/platform/auth/api/auth-storage";
import { TeacherOnboardingWorkspace } from "@/platform/auth/components/teacher-onboarding-workspace";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { useLocation, useNavigate } from "@tanstack/react-router";

export function TeacherOnboardingPage() {
  const auth = useAuthSession("lms");
  const location = useLocation();
  const navigate = useNavigate();
  const redirect = sanitizeRedirect(new URLSearchParams(location.searchStr).get("redirect"));

  if (auth.isHydratingProfile) {
    return (
      <Box
        sx={{
          background: "radial-gradient(120% 120% at 50% 0%, #F8FAFD 0%, #EEF2F7 100%)",
          display: "flex",
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Stack spacing={2.5} sx={{ maxWidth: 560, width: "100%" }}>
          <Skeleton height={36} sx={{ borderRadius: "12px", width: 140, mx: "auto" }} variant="rounded" />
          <Skeleton height={28} sx={{ borderRadius: "12px", width: 280, mx: "auto" }} variant="rounded" />
          <Skeleton height={380} sx={{ borderRadius: "24px" }} variant="rounded" />
        </Stack>
      </Box>
    );
  }

  if (!auth.account) return null;

  if (!auth.account.lifecycle) {
    return (
      <Box
        sx={{
          background: "radial-gradient(120% 120% at 50% 0%, #F8FAFD 0%, #EEF2F7 100%)",
          display: "flex",
          minHeight: "100svh",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 540, width: "100%" }}>
          <Alert
            action={<Button variant="contained" color="inherit" onClick={auth.actions.signOut} sx={{ fontWeight: 650, borderRadius: "980px" }}>Đăng xuất</Button>}
            severity="warning"
            sx={{
              borderRadius: "18px",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              p: 2.5,
            }}
          >
            Backend chưa trả lifecycle tài khoản. Quyền portal của bạn vẫn được giữ nguyên; hãy tải lại trang hoặc liên hệ quản trị viên nếu thông báo tiếp tục xuất hiện.
          </Alert>
        </Box>
      </Box>
    );
  }

  function persistLifecycle(lifecycle: TeacherAccountLifecycle) {
    if (!auth.account) return;
    saveCurrentAccount({ ...auth.account, lifecycle, isProfileCompleted: lifecycle.isProfileCompleted });
  }

  return (
    <TeacherOnboardingWorkspace
      account={auth.account}
      lifecycle={auth.account.lifecycle}
      onUpdateProfile={async (input) => {
        const updated = await updateMyTeacherProfile(input);
        saveCurrentAccount(updated);
        return updated;
      }}
      onRequestRecovery={requestRecoveryEmailChallenge}
      onVerifyRecovery={async (input) => {
        const result = await verifyRecoveryEmailChallenge(input);
        if (result.lifecycle) persistLifecycle(result.lifecycle);
        return result;
      }}
      onChangePassword={async (input) => {
        const result = await changeMyPassword(input);
        if (result.lifecycle) persistLifecycle(result.lifecycle);
        return result;
      }}
      onComplete={(lifecycle) => {
        persistLifecycle(lifecycle);
        void navigate({ href: redirect, replace: true });
      }}
      onLogout={auth.actions.signOut}
    />
  );
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.startsWith("/onboarding")) return teacherPath("/home");
  return value;
}

export default TeacherOnboardingPage;
