export const ADMIN_WORKSPACE_PERMISSION = "admin.workspace.access";

/** Single source for "treat as platform admin" (used for landing-workspace choice only, not authorization). */
export function hasAdminLikeClaims(permissions?: readonly string[] | null): boolean {
  return (permissions ?? []).some((permission) => permission.trim().toLowerCase() === ADMIN_WORKSPACE_PERMISSION);
}
