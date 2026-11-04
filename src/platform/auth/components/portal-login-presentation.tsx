import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";

import { AuthCard, AuthPageBackdrop } from "@/platform/auth/components/auth-page-layout";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

type AuthNotice = ReturnType<typeof useAuthSession>["notice"];

export function PortalLoginShell({ children }: { children: ReactNode }) {
  return (
    <AuthPageBackdrop>
      <AuthCard>{children}</AuthCard>
    </AuthPageBackdrop>
  );
}

export function NoticeBanner({ notice }: { notice: AuthNotice }) {
  if (!notice) return null;
  return (
    <Fade in>
      <Alert role={notice.tone === "error" ? "alert" : "status"} severity={notice.tone === "success" ? "success" : notice.tone === "error" ? "error" : "info"} sx={{ mb: 2.5 }}>
        {notice.message}
      </Alert>
    </Fade>
  );
}
