import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

/** Whether the signed-in person holds `permission`; use it to hide write buttons (the API still enforces it with a 403). */
export function can(permission: string): boolean {
  if (AUTH_BYPASS_ENABLED) return true;
  const session = getAuthScope("lcms").session;
  return evaluatePermission({ permission, grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
}
