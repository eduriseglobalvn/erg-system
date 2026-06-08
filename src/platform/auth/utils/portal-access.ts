import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import type { StudentSession } from "@/platform/auth/api/student-auth-storage";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

const ADMIN_EMAIL = "admin@erg.edu.vn";
const TEACHER_PORTALS: Array<NonNullable<StoredAuthSession["portal"]>> = ["lms", "lcms"];

type PortalAccessInput = {
  portal: NonNullable<StoredAuthSession["portal"]>;
  studentSession?: StudentSession | null;
  teacherAccount?: TeacherAccount | null;
  teacherSession?: StoredAuthSession | null;
};

export function canAccessPortal({ portal, studentSession, teacherAccount, teacherSession }: PortalAccessInput) {
  if (portal === "elearning") {
    if (studentSession?.portal === "elearning" && studentSession.accessToken) {
      return true;
    }

    if (!teacherAccount) return false;
    if (teacherAccount.email.trim().toLowerCase() === ADMIN_EMAIL) return true;

    return Boolean(teacherSession && (teacherSession.accessToken || (teacherSession.portals ?? []).length || teacherSession.portal));
  }

  if (!teacherSession) return false;
  if (portal === "admin" || portal === "crm") {
    if (teacherAccount?.email.trim().toLowerCase() === ADMIN_EMAIL) return true;
    if (teacherAccount?.role === "admin") return true;
    return hasAdminPermission(teacherSession.permissions, teacherSession.portals, portal);
  }

  if (teacherAccount?.email.trim().toLowerCase() === ADMIN_EMAIL) return true;

  const portals = teacherSession.portals ?? [];
  if (portals.includes("*") || portals.includes(portal)) return true;

  if (TEACHER_PORTALS.includes(portal) && TEACHER_PORTALS.some((teacherPortal) => portals.includes(teacherPortal))) {
    return true;
  }

  if (hasPortalPermission(teacherSession.permissions, portal)) return true;

  return !teacherAccount && Boolean(teacherSession.accessToken);
}

function hasAdminPermission(
  permissions: StoredAuthSession["permissions"],
  portals: StoredAuthSession["portals"],
  portal: "admin" | "crm" = "admin",
) {
  if (portals?.includes("*") || portals?.includes(portal) || portals?.includes("admin")) return true;

  const normalized = permissions?.map((permission) => permission.trim().toLowerCase()) ?? [];
  return normalized.some((permission) =>
    [
      "*",
      "admin",
      "super_admin",
      "super-admin",
      "system:admin",
      "system.super_admin",
      "erg_admin",
      "erg_super_admin",
      "global_admin",
      "lms_admin",
      "admin:*",
      "admin.access",
      "portal:admin",
      "portal:admin:access",
      portal,
      `${portal}:access`,
      `portal:${portal}`,
      `portal:${portal}:access`,
    ].includes(permission),
  );
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
    [
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
