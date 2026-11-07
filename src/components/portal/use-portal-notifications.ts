import { createContext, useContext } from "react";

import { canonicalWorkspaceForPath, CANONICAL_LMS_WORKSPACE_ROUTES } from "@/platform/workspaces/workspace-route";

export type PortalNotification = {
  id: string;
  title: string;
  preview: string;
  /** ISO time; shown with formatDateTimeVi. */
  createdAt: string;
  unread: boolean;
  /** "Khẩn" / "Quan trọng" as text, null for normal priority. */
  priority: string | null;
  needsAck: boolean;
};

export type PortalNotificationsState = {
  /** The API's unread count (not the list length); undefined while unavailable. */
  unreadCount: number | undefined;
  /** The newest few messages; only fetched while the popover is open. */
  notifications: PortalNotification[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  /** Marks these messages read and refreshes the inbox/badge. */
  markRead: (ids: string[]) => Promise<unknown>;
};

type PortalNotificationsSource = (portal: string, feedEnabled: boolean) => PortalNotificationsState;

const emptySource: PortalNotificationsSource = () => ({
  unreadCount: undefined,
  notifications: [],
  isPending: false,
  isError: false,
  refetch: () => undefined,
  markRead: () => Promise.resolve(),
});

// The real hook lives in features/notifications and is provided by App (components must not import features).
export const PortalNotificationsSourceContext = createContext<PortalNotificationsSource>(emptySource);

/** Same session portal the workspace's inbox page uses (admin = lcms, teacher = lms, student = elearning), so one cache and one badge. */
export function notificationPortalFromPath(pathname: string) {
  if (pathname.split("/").filter(Boolean)[0] === "crm") return "crm";
  const workspace = canonicalWorkspaceForPath(pathname);
  return workspace ? CANONICAL_LMS_WORKSPACE_ROUTES[workspace].legacyPortal : "lms";
}

export function usePortalNotifications(portal: string, feedEnabled: boolean) {
  return useContext(PortalNotificationsSourceContext)(portal, feedEnabled);
}
