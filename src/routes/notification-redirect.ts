import type { AuthRouteState } from "@/platform/auth/router/auth-route-context";
import { buildLoginRedirectTarget } from "@/platform/auth/utils/auth-redirects";
import { studentPath, workspacePath } from "@/platform/workspaces/workspace-paths";

// Message ids are UUIDs: anything else (/, .., %, ?) could leave the notifications path, so it is dropped.
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
// Same preference as the post-login landing: admin first, then teacher, then student.
const WORKSPACE_ORDER = ["ADMIN", "TEACHER", "STUDENT"] as const;

/** Target of the push deep link `/notifications/{id}`: the detail page of the signed-in workspace, or login and back. */
export function notificationRedirectHref(rawId: string, auth: Pick<AuthRouteState, "authenticated" | "workspaces">) {
  const id = SAFE_ID.test(rawId) ? rawId : "";
  const suffix = id ? `/notifications/${id}` : "/notifications";
  if (!auth.authenticated) return buildLoginRedirectTarget(suffix) ?? "/login";
  const workspace = WORKSPACE_ORDER.find((candidate) => auth.workspaces.includes(candidate));
  // The student inbox opens messages in place on the Hộp thư tab; there is no student detail route.
  if (workspace === "STUDENT") return `${studentPath("/")}?tab=announcements`;
  // CRM has no inbox page: its home.
  if (!workspace) return "/";
  return workspacePath(workspace, suffix);
}
