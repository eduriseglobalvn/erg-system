import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchNotificationFeed, markNotificationRead, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationFeedItem, NotificationPortal } from "../api/notification-types";
import { priorityLabel, needsAck } from "../components/inbox-filters";
import { useUnreadNotificationCount } from "./use-unread-notification-count";
import { QUERY_POLICIES } from "@/lib/query-policy";

import type { PortalNotification, PortalNotificationsState } from "@/components/portal/use-portal-notifications";

/** The bell shows the newest few; the full list lives on the inbox page. */
export const PORTAL_NOTIFICATION_LIMIT = 6;

function toPortalNotification(item: NotificationFeedItem): PortalNotification {
  return {
    id: item.id,
    title: item.title,
    preview: item.bodyPreview || item.description,
    createdAt: item.createdAt,
    unread: item.unread,
    priority: priorityLabel(item),
    needsAck: needsAck(item),
  };
}

/** Real implementation, injected into the portal chrome via PortalNotificationsSourceContext. Real unread count (undefined while unavailable) and, when `feedEnabled`, the newest messages of the same inbox the pages read. */
export function usePortalNotifications(portal: NotificationPortal, feedEnabled: boolean): PortalNotificationsState {
  const queryClient = useQueryClient();
  const scope = resolveNotificationQueryScope(portal);
  const unreadCount = useUnreadNotificationCount(portal);
  const feed = useQuery({
    enabled: feedEnabled,
    queryKey: notificationQueryKeys.inbox(portal, "all", 0, PORTAL_NOTIFICATION_LIMIT, scope),
    queryFn: ({ signal }) => fetchNotificationFeed({ portal, status: "all", page: 0, size: PORTAL_NOTIFICATION_LIMIT }, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  return {
    unreadCount,
    notifications: (feed.data?.items ?? []).map(toPortalNotification),
    isPending: feedEnabled && feed.isPending,
    isError: feed.isError,
    refetch: () => void feed.refetch(),
    // Only the messages on screen are marked (a read-all would also clear ones the user never saw).
    markRead: async (ids) => {
      const results = await Promise.allSettled(ids.map((id) => markNotificationRead(id, portal)));
      if (results.some((result) => result.status === "rejected")) toast.error("Không thể đánh dấu một số thông báo đã đọc");
      await queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(portal, scope) });
    },
  };
}
