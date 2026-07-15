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
import { useLocation, useNavigate } from "@/routes/router-compat";

export function TeacherOnboardingPage() {
  const auth = useAuthSession("lms");
  const location = useLocation();
  const navigate = useNavigate();
  const redirect = sanitizeRedirect(new URLSearchParams(location.search).get("redirect"));

  if (auth.isHydratingProfile) {
    return (
      <Box sx={{ mx: "auto", maxWidth: 760, p: 4 }}>
        <Stack spacing={2}>
          <Skeleton height={42} variant="rounded" />
          <Skeleton height={76} variant="rounded" />
          <Skeleton height={280} variant="rounded" />
        </Stack>
      </Box>
    );
  }

  if (!auth.account) return null;

  if (!auth.account.lifecycle) {
    return (
      <Box sx={{ mx: "auto", maxWidth: 640, p: 4 }}>
        <Alert
          action={<Button color="inherit" onClick={auth.actions.signOut}>Đăng xuất</Button>}
          severity="error"
        >
          Backend chưa trả lifecycle tài khoản. ERG đã chặn truy cập LMS để tránh bỏ qua onboarding.
        </Alert>
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
        navigate(redirect, { replace: true });
      }}
      onLogout={auth.actions.signOut}
    />
  );
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/onboarding")) return "/home";
  return value;
}

export default TeacherOnboardingPage;
