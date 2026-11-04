const ADMIN_LIKE_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "erg_admin",
  "super_admin",
  "super-admin",
  "system.super_admin",
  "erg_super_admin",
  "global_admin",
  "lms_admin",
]);

/** Single source for "treat as platform admin" from raw role/permission claims (used for landing-workspace choice only, not authorization). */
export function hasAdminLikeClaims(roles: readonly string[], permissions?: readonly string[] | null): boolean {
  return roles.some((role) => ADMIN_LIKE_ROLES.has(role.trim().toLowerCase()))
    || (permissions ?? []).some((permission) => permission.trim().toLowerCase() === "lms.admin" || permission.trim() === "*");
}
