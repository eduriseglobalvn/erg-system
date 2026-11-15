import Link from "@mui/material/Link";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { adminPath } from "@/platform/workspaces/workspace-paths";

function canManageDaysOff(): boolean {
  if (AUTH_BYPASS_ENABLED) return true;
  const session = getAuthScope("lcms").session;
  return evaluatePermission({ permission: "timekeeping.manage", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
}

/** Text link to `/admin/calendar/days-off`, hidden for people without `timekeeping.manage` (the route would refuse them). */
export function DaysOffLink() {
  const navigate = useNavigate();
  const allowed = useMemo(() => canManageDaysOff(), []);
  if (!allowed) return null;
  return (
    <Link color="text.secondary" component="button" onClick={() => void navigate({ href: adminPath("/calendar/days-off") })} type="button" underline="hover" variant="body2">
      Ngày nghỉ &amp; thứ 7
    </Link>
  );
}
