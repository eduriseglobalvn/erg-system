import { useQuery } from "@tanstack/react-query";

import { fetchUnreadNotificationCount, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationPortal } from "../api/notification-types";
import { QUERY_POLICIES } from "@/lib/query-policy";

/** The server's unread count for this session's inbox (undefined while loading/unavailable); every read or ack of the inbox invalidates it. */
export function useUnreadNotificationCount(portal: NotificationPortal, enabled = true) {
  const scope = resolveNotificationQueryScope(portal);
  return useQuery({
    enabled,
    queryKey: notificationQueryKeys.unreadCount(portal, scope),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(portal, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  }).data?.unread;
}
