import { useQuery } from "@tanstack/react-query";

import { fetchNotificationFeed, fetchUnreadNotificationCount, notificationQueryKeys, resolveNotificationQueryScope } from "@/features/notifications/api/notification-api";
import type { NotificationFeedItem, NotificationPortal } from "@/features/notifications/api/notification-types";
import { QUERY_POLICIES } from "@/lib/query-policy";

import type { PortalNotification, PortalNotificationTab } from "./portal-header-notification-data";

const FEED_SIZE = 20;

export function notificationPortalFromPath(pathname: string): NotificationPortal {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return "admin";
  if (segment === "crm") return "crm";
  if (segment === "student") return "elearning";
  return "lms";
}

function toPortalNotification(item: NotificationFeedItem): PortalNotification {
  const type = item.priority === "urgent" || item.priority === "high" ? "warning" : item.type === "system" ? "info" : "reminder";
  return { id: item.id, type, title: item.title, message: item.bodyPreview || item.description, time: `${item.dateLabel} ${item.timeLabel}`.trim(), isRead: !item.unread };
}

/** Real unread count (undefined while unavailable) and, when `feedEnabled`, the inbox list. */
export function usePortalNotifications(portal: NotificationPortal, tab: PortalNotificationTab, feedEnabled: boolean) {
  const scope = resolveNotificationQueryScope(portal);
  const unread = useQuery({
    queryKey: notificationQueryKeys.unreadCount(portal, scope),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(portal, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const feed = useQuery({
    enabled: feedEnabled,
    queryKey: notificationQueryKeys.inbox(portal, tab, 0, FEED_SIZE, scope),
    queryFn: ({ signal }) => fetchNotificationFeed({ portal, status: tab, page: 0, size: FEED_SIZE }, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  return {
    unreadCount: unread.data?.unread,
    notifications: (feed.data?.items ?? []).map(toPortalNotification),
  };
}
