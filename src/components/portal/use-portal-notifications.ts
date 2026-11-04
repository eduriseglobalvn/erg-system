import { createContext, useContext } from "react";

import type { PortalNotification, PortalNotificationTab } from "./portal-header-notification-data";

type PortalNotificationsSource = (portal: string, tab: PortalNotificationTab, feedEnabled: boolean) => {
  unreadCount: number | undefined;
  notifications: PortalNotification[];
};

const emptySource: PortalNotificationsSource = () => ({ unreadCount: undefined, notifications: [] });

// The real hook lives in features/notifications and is provided by App (components must not import features).
export const PortalNotificationsSourceContext = createContext<PortalNotificationsSource>(emptySource);

export function notificationPortalFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return "admin";
  if (segment === "crm") return "crm";
  if (segment === "student") return "elearning";
  return "lms";
}

export function usePortalNotifications(portal: string, tab: PortalNotificationTab, feedEnabled: boolean) {
  return useContext(PortalNotificationsSourceContext)(portal, tab, feedEnabled);
}
