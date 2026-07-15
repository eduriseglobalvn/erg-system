import type { ReactNode } from "react";

import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import type { LmsPermission } from "@/platform/auth/permissions/lms-permission-catalog";

export function PermissionBoundary({
  children,
  deniedPermissions,
  fallback = null,
  permission,
  permissions,
}: {
  children: ReactNode;
  deniedPermissions?: readonly string[];
  fallback?: ReactNode;
  permission: LmsPermission;
  permissions?: readonly string[];
}) {
  const auth = useAuthSession("lms");
  const allowed = evaluatePermission({
    permission,
    grantedPermissions: permissions ?? auth.session?.permissions,
    deniedPermissions: deniedPermissions ?? auth.session?.deniedPermissions,
  });
  return allowed ? <>{children}</> : <>{fallback}</>;
}
