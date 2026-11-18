import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { fetchNotificationFeed, notificationQueryKeys } from "../api/notification-api";
import type { NotificationPortal } from "../api/notification-types";
import { QUIZ_ACTIVE_ATTRIBUTE } from "../push/push-floating-model";

/**
 * In-app card when a new message reaches the open app: the unread count (polled) went up, so the newest unread
 * message is shown as a toast and the inbox lists refresh. Works without Web Push; when a push for the same
 * message also arrives, both use the notification id as the toast id, so sonner shows it once.
 * shortcut: a read plus a new message in one poll cancel out and show no card; move to SSE if that matters.
 */
export function useNewNotificationToast(portal: NotificationPortal, unread: number | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const previous = useRef(unread);

  useEffect(() => {
    const before = previous.current;
    previous.current = unread;
    if (unread === undefined || before === undefined || unread <= before) return;
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(portal) });
    // A learner in a quiz is not interrupted; the message waits in the inbox.
    if (document.documentElement.hasAttribute(QUIZ_ACTIVE_ATTRIBUTE)) return;
    void fetchNotificationFeed({ portal, status: "unread", page: 0, size: 1 })
      .then(({ items }) => {
        const newest = items[0];
        if (!newest) return;
        toast.info(newest.title, {
          action: { label: "Mở", onClick: () => void navigate({ href: `/notifications/${encodeURIComponent(newest.id)}` }) },
          closeButton: true,
          description: newest.bodyPreview || newest.description,
          id: newest.id,
        });
      })
      .catch(() => undefined);
  }, [navigate, portal, queryClient, unread]);
}
