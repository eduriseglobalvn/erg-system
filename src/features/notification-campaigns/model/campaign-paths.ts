import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";

/** Which shell the sender works in: decides the allowed scopes and the URLs below. */
export type ComposePortalKind = "admin" | "teacher";

const base = (kind: ComposePortalKind, path: string) => (kind === "admin" ? adminPath(path) : teacherPath(path));

export const notificationComposePath = (kind: ComposePortalKind, campaignId?: string) =>
  base(kind, campaignId ? `/notifications/compose/${encodeURIComponent(campaignId)}` : "/notifications/compose");

/** Where the sender lands after sending. The sent list arrives with task 9 on this same path. */
export const notificationsHomePath = (kind: ComposePortalKind) => base(kind, "/notifications");
