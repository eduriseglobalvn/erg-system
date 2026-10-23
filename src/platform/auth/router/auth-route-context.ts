import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";
import { workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";
import { PLATFORM_ROOT_ADMIN_EMAIL, projectVerifiedWorkspaces } from "@/platform/auth/permissions/workspace-capability-projection";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";

export type AuthRouteState = {
  authenticated: boolean;
  lifecycle: TeacherAccountLifecycle | null;
  permissions: string[];
  deniedPermissions: string[];
  portals: string[];
  workspaces: Workspace[];
  hasWorkspace: (workspace: Workspace) => boolean;
  hasPermission: (permission: string) => boolean;
};

type AuthRouteSession = Pick<StoredAuthSession, "permissions" | "portals"> & {
  accountEmail?: string;
  deniedPermissions?: string[];
  roles?: string[];
  workspaces?: readonly Workspace[];
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
  if (AUTH_BYPASS_ENABLED && !account) {
    return {
      authenticated: true,
      lifecycle: {
        status: "ACTIVE",
        isProfileCompleted: true,
        recoveryEmailMasked: null,
        recoveryEmailVerified: true,
        mustChangePassword: false,
        nextSteps: [],
      },
      permissions: ["*"],
      deniedPermissions: [],
      portals: ["lms", "lcms", "crm", "elearning"],
      workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
      hasWorkspace: () => true,
      hasPermission: () => true,
    };
  }

  const deniedPermissions = [...(session?.deniedPermissions ?? [])];
  const isRootAdmin = (account?.email ?? session?.accountEmail)?.trim().toLowerCase() === PLATFORM_ROOT_ADMIN_EMAIL;
  const permissions = isRootAdmin && !deniedPermissions.includes("*")
    ? Array.from(new Set([...(session?.permissions ?? []), "*"]))
    : [...(session?.permissions ?? [])];
  const lifecycle = account?.lifecycle ?? (!apiBacked && account ? legacyLifecycle(account) : null);
  const workspaces = canonicalWorkspaces(session, account?.email);

  return {
    authenticated: Boolean(account),
    lifecycle,
    permissions,
    deniedPermissions,
    portals: [...(session?.portals ?? [])],
    workspaces,
    hasWorkspace: (workspace) => workspaces.includes(workspace),
    hasPermission: (permission) => evaluatePermission({ permission, grantedPermissions: permissions, deniedPermissions }),
  };
}

export function resolveAuthRouteAccess(
  auth: AuthRouteState,
  requirement: { portal?: string; workspace?: Workspace; permission?: string; onboardingRoute?: boolean },
): AuthRouteDecision {
  if (AUTH_BYPASS_ENABLED) return "allow";
  if (!auth.authenticated) return "login";

  const lifecycleStatus = auth.lifecycle?.status;
  const accountDisabled = lifecycleStatus === "INACTIVE" || lifecycleStatus === "BLOCKED";
  if (requirement.onboardingRoute) {
    return accountDisabled ? "access-denied" : "allow";
  }
  if (accountDisabled) return "access-denied";

  const requiredWorkspace = requirement.workspace ?? workspaceFromLegacyPortal(requirement.portal);
  if (requiredWorkspace && !auth.hasWorkspace(requiredWorkspace)) return "access-denied";
  if (requirement.permission && !auth.hasPermission(requirement.permission)) return "access-denied";
  return "allow";
}

function canonicalWorkspaces(session: AuthRouteSession | null, accountEmail?: string): Workspace[] {
  return projectVerifiedWorkspaces({
    accountEmail: accountEmail ?? session?.accountEmail,
    workspaces: session?.workspaces,
    roles: session?.roles,
    permissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
    portals: session?.portals,
  });
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
