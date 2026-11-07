import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { AUTH_BYPASS_ENABLED } from "@/platform/auth/config/auth-bypass";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

/** Whether the session of this portal may send campaigns (shows the send button, Đã gửi and Nháp). The BE checks again. */
export function canSendCampaigns(portal: "lcms" | "lms") {
  const { permissions, session } = getAuthScope(portal);
  return evaluatePermission({
    permission: "notification.campaign.send",
    grantedPermissions: AUTH_BYPASS_ENABLED ? ["*"] : permissions,
    deniedPermissions: session?.deniedPermissions,
  });
}
