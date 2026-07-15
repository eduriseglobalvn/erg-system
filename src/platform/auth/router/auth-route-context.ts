import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import type { LmsPermission } from "@/platform/auth/permissions/lms-permission-catalog";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

export type AuthRouteState = {
  authenticated: boolean;
  lifecycle: TeacherAccountLifecycle | null;
  permissions: string[];
  deniedPermissions: string[];
  portals: string[];
  hasPermission: (permission: LmsPermission) => boolean;
};

type AuthRouteSession = Pick<StoredAuthSession, "permissions" | "portals"> & {
  deniedPermissions?: string[];
};

export type AuthRouteDecision = "allow" | "login" | "onboarding" | "access-denied";

export function createAuthRouteState({
  account,
  session,
  apiBacked,
}: {
  account: TeacherAccount | null;
  session: AuthRouteSession | null;
  apiBacked: boolean;
}): AuthRouteState {
  const permissions = [...(session?.permissions ?? [])];
  const deniedPermissions = [...(session?.deniedPermissions ?? [])];
  const lifecycle = account?.lifecycle ?? (!apiBacked && account ? legacyLifecycle(account) : null);

  return {
    authenticated: Boolean(account),
    lifecycle,
    permissions,
    deniedPermissions,
    portals: [...(session?.portals ?? [])],
    hasPermission: (permission) => evaluatePermission({ permission, grantedPermissions: permissions, deniedPermissions }),
  };
}

export function resolveAuthRouteAccess(
  auth: AuthRouteState,
  requirement: { portal?: string; permission?: LmsPermission; onboardingRoute?: boolean },
): AuthRouteDecision {
  if (!auth.authenticated) return "login";

  const lifecycleStatus = auth.lifecycle?.status;
  const onboardingRequired = !auth.lifecycle || lifecycleStatus === "PROVISIONED" || lifecycleStatus === "FIRST_LOGIN_RESTRICTED";
  if (requirement.onboardingRoute) {
    if (onboardingRequired) return "allow";
    return lifecycleStatus === "ACTIVE" ? "allow" : "access-denied";
  }
  if (onboardingRequired) return "onboarding";
  if (lifecycleStatus !== "ACTIVE") return "access-denied";

  if (requirement.portal && !auth.portals.includes("*") && !auth.portals.includes(requirement.portal)) {
    const hasPlatformOrPortalPermission = evaluatePermission({
      permission: `${requirement.portal}.portal.access`,
      grantedPermissions: auth.permissions,
      deniedPermissions: auth.deniedPermissions,
    });
    if (!hasPlatformOrPortalPermission) return "access-denied";
  }
  if (requirement.permission && !auth.hasPermission(requirement.permission)) return "access-denied";
  return "allow";
}

function legacyLifecycle(account: TeacherAccount): TeacherAccountLifecycle {
  const completed = account.isProfileCompleted !== false;
  return {
    status: completed ? "ACTIVE" : "FIRST_LOGIN_RESTRICTED",
    isProfileCompleted: completed,
    recoveryEmailMasked: null,
    recoveryEmailVerified: completed,
    mustChangePassword: !completed,
    nextSteps: completed ? [] : ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"],
  };
}
