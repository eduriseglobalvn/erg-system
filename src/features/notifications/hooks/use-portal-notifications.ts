import { useQuery } from "@tanstack/react-query";

import { fetchNotificationFeed, fetchUnreadNotificationCount, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationFeedItem, NotificationPortal } from "../api/notification-types";
import { QUERY_POLICIES } from "@/lib/query-policy";

import type { PortalNotification, PortalNotificationTab } from "@/components/portal/portal-header-notification-data";

const FEED_SIZE = 20;

function toPortalNotification(item: NotificationFeedItem): PortalNotification {
  const type = item.priority === "urgent" || item.priority === "high" ? "warning" : item.type === "system" ? "info" : "reminder";
  return { id: item.id, type, title: item.title, message: item.bodyPreview || item.description, time: `${item.dateLabel} ${item.timeLabel}`.trim(), isRead: !item.unread };
}

/** Real implementation, injected into the portal chrome via PortalNotificationsSourceContext. Real unread count (undefined while unavailable) and, when `feedEnabled`, the inbox list. */
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
