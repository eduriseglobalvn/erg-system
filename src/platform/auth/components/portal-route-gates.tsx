import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";

import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { readStoredAuthSession, type StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { ReauthDialog } from "@/platform/auth/components/reauth-dialog";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { requiresTeacherOnboarding } from "@/platform/auth/types/account-lifecycle";
import { buildLoginRedirectTarget, buildRedirectPath } from "@/platform/auth/utils/auth-redirects";
import { canAccessPortal } from "@/platform/auth/utils/portal-access";
import { isBffAuthEnabled } from "@/lib/api-client";

type PortalKey = NonNullable<StoredAuthSession["portal"]>;

type PortalAuthGateProps = {
  children: ReactNode;
  portal: PortalKey;
  requiredPermission?: string;
};

export function PortalAuthGate({ children, portal, requiredPermission }: PortalAuthGateProps) {
  const auth = useAuthSession(portal);
  const location = useLocation();
  const redirect = buildRedirectPath(location.pathname, location.searchStr, location.hash);
  const studentSession = getCurrentStudentSession();
  // The login mutation writes the server-backed session before navigation, but
  // the portal-specific hook may not have observed the storage event yet. Read
  // the persisted identity as a synchronous fallback so a workspace redirect
  // cannot briefly evaluate an authenticated account as anonymous.
  const compatibilityPortals = portal === "elearning"
    ? ["lms", "lcms"] as const
    : portal === "lcms"
      ? ["lcms", "lms"] as const
      : portal === "lms"
        ? ["lms", "lcms"] as const
        : [portal] as const;
  const storedTeacherAccount = compatibilityPortals
    .map((candidate) => getCurrentAccount(candidate))
    .find((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const storedTeacherSession = compatibilityPortals
    .map((candidate) => readStoredAuthSession(candidate))
    .find((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  const teacherAccount = isBffAuthEnabled()
    ? auth.account ?? null
    : portal === "elearning"
      ? auth.account ?? storedTeacherAccount
      : auth.account ?? storedTeacherAccount;
  const normalizedTeacherAccount = teacherAccount ?? null;
  const teacherSession = isBffAuthEnabled()
    ? auth.session
    : auth.session ?? storedTeacherSession;

  if (canAccessPortal({ portal, studentSession, teacherAccount: normalizedTeacherAccount, teacherSession, requiredPermission })) {
    if (needsOnboarding(normalizedTeacherAccount)) {
      return <Navigate replace search={{ redirect }} to="/onboarding" />;
    }

    return (
      <>
        {children}
        <ReauthDialog
          open={auth.reauthRequired}
          onReauthenticate={auth.actions.reauthenticate}
          onSignOut={auth.actions.signOut}
        />
      </>
    );
  }

  if (normalizedTeacherAccount) {
    return <Navigate replace to={accessDeniedPath(portal, normalizedTeacherAccount.email, redirect)} />;
  }

  const loginTarget = buildLoginRedirectTarget(location.pathname, location.searchStr, location.hash);
  return loginTarget ? <Navigate replace to={loginTarget} /> : null;
}

export function AuthenticatedAccountGate({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const location = useLocation();

  if (auth.account) return <>{children}</>;

  const loginTarget = buildLoginRedirectTarget(location.pathname, location.searchStr, location.hash);
  return loginTarget ? <Navigate replace to={loginTarget} /> : null;
}

export function TeacherPortalAuthGate({ children }: Omit<PortalAuthGateProps, "portal">) {
  return <PortalAuthGate portal="lms">{children}</PortalAuthGate>;
}

export function StudentPortalAuthGate({ children }: Omit<PortalAuthGateProps, "portal">) {
  return <PortalAuthGate portal="elearning">{children}</PortalAuthGate>;
}

function needsOnboarding(account: ReturnType<typeof useAuthSession>["account"]) {
  return Boolean(account && (requiresTeacherOnboarding(account.lifecycle) || (!account.lifecycle && account.isProfileCompleted === false)));
}

function accessDeniedPath(portal: PortalKey, email: string, redirect: string) {
  return `/access-denied?${new URLSearchParams({ portal, email, redirect }).toString()}`;
}
