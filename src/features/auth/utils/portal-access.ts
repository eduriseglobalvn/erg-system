import type { StoredAuthSession } from "@/features/auth/api/auth-token-storage";
import type { StudentSession } from "@/features/auth/api/student-auth-storage";
import type { TeacherAccount } from "@/features/auth/types/auth-types";

const ADMIN_EMAIL = "admin@erg.edu.vn";
const TEACHER_PORTALS: Array<NonNullable<StoredAuthSession["portal"]>> = ["lms", "hoclieu"];

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

  if (!teacherAccount) return false;
  if (teacherAccount.email.trim().toLowerCase() === ADMIN_EMAIL) return true;
  if (!teacherSession) return false;

  const portals = teacherSession.portals ?? [];
  if (portals.includes("*") || portals.includes(portal)) return true;

  if (TEACHER_PORTALS.includes(portal) && TEACHER_PORTALS.some((teacherPortal) => portals.includes(teacherPortal))) {
    return true;
  }

  return hasPortalPermission(teacherSession.permissions, portal);
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
