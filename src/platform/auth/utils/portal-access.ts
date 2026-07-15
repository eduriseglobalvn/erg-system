import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import type { StudentSession } from "@/platform/auth/api/student-auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

type PortalAccessInput = {
  portal: NonNullable<StoredAuthSession["portal"]>;
  studentSession?: StudentSession | null;
  teacherAccount?: TeacherAccount | null;
  teacherSession?: StoredAuthSession | null;
};

export function canAccessPortal({ portal, studentSession, teacherAccount, teacherSession }: PortalAccessInput) {
  void teacherAccount;
  if (portal === "elearning") {
    if (studentSession?.portal === "elearning" && studentSession.accessToken) {
      return true;
    }

    return Boolean(teacherSession && hasExplicitPortalAccess(teacherSession, portal));
  }

  if (!teacherSession) return false;
  return hasExplicitPortalAccess(teacherSession, portal);
}

function hasExplicitPortalAccess(session: StoredAuthSession, portal: NonNullable<StoredAuthSession["portal"]>) {
  const portals = session.portals ?? [];
  return portals.includes("*") || portals.includes(portal) || hasPortalPermission(session.permissions, portal);
}

function hasPortalPermission(permissions: StoredAuthSession["permissions"], portal: NonNullable<StoredAuthSession["portal"]>) {
  const normalized = permissions?.map((permission) => permission.trim().toLowerCase()) ?? [];
  if (
    normalized.some((permission) =>
      ["*", "admin", "super_admin", "super-admin", "system:admin", "system.super_admin", "erg_super_admin"].includes(permission),
    )
  ) {
    return true;
  }

  return normalized.some((permission) =>
    permission.startsWith(`${portal}.`) || [
      portal,
      `${portal}:access`,
      `${portal}:login`,
      `${portal}:read`,
      `portal:${portal}`,
      `portal:${portal}:access`,
      `${portal}.*`,
    ].includes(permission),
  );
}
