import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchNotificationFeed, markNotificationRead } from "@/features/notifications/api/notification-feed-api";
import { notificationQueryKeys } from "@/features/notifications/api/notification-query";
import { parseScheduleNotice, type ScheduleNotice } from "../../domain/schedule-notice";

const FEED_SIZE = 20;

/**
 * Thong bao SCHEDULE_PUBLISHED chua doc (6.10, 6.11): banner = cai moi nhat, «Mới» = cac batchId chua doc,
 * «Đã xem» danh dau da doc. Dung chung khoa `notifications/lms` nen bi invalidate khi push toi.
 */
export function useScheduleNotice(enabled: boolean) {
  const queryClient = useQueryClient();
  const feed = useQuery({
    enabled,
    queryFn: ({ signal }) => fetchNotificationFeed({ page: 0, portal: "lms", size: FEED_SIZE, status: "unread" }, signal),
    queryKey: [...notificationQueryKeys.inbox("lms", "unread", 0, FEED_SIZE), "schedule-published"],
    staleTime: 60_000,
  });
  const notices = useMemo<ScheduleNotice[]>(() => (feed.data?.items ?? []).flatMap((item) => {
    const notice = parseScheduleNotice(item);
    return notice ? [notice] : [];
  }), [feed.data]);
  const markSeen = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => markNotificationRead(id, "lms"))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root("lms") }),
  });
  return {
    latest: notices[0],
    markSeen: () => markSeen.mutate(notices.map((notice) => notice.id)),
    newBatchIds: useMemo(() => new Set(notices.map((notice) => notice.batchId)), [notices]),
    others: Math.max(0, notices.length - 1),
  };
}
