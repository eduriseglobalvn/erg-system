import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";

/** Which shell the sender works in: decides the allowed scopes and the URLs below. */
export type ComposePortalKind = "admin" | "teacher";

const base = (kind: ComposePortalKind, path: string) => (kind === "admin" ? adminPath(path) : teacherPath(path));

export const notificationComposePath = (kind: ComposePortalKind, campaignId?: string) =>
  base(kind, campaignId ? `/notifications/compose/${encodeURIComponent(campaignId)}` : "/notifications/compose");

/** Where the sender lands after sending: the admin Đã gửi box, or the teacher Hộp thư. */
export const notificationsHomePath = (kind: ComposePortalKind) => `${base(kind, "/notifications")}${kind === "admin" ? "?tab=SENT" : ""}`;

/** Admin detail of one sent campaign (KPIs + recipients); "sent/" keeps it apart from compose and the inbox $notificationId. */
export const campaignDetailPath = (campaignId: string) => adminPath(`/notifications/sent/${encodeURIComponent(campaignId)}`);
