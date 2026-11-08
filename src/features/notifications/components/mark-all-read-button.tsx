import { useMutation, useQueryClient } from "@tanstack/react-query";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import IconButton from "@mui/material/IconButton";

import { markAllNotificationsRead, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationPortal } from "../api/notification-types";
import { useUnreadNotificationCount } from "../hooks/use-unread-notification-count";

/** Inbox header action (canvas N12/N15 `done_all`): marks the whole inbox read; disabled when nothing is unread. */
export function MarkAllReadButton({ portal }: { portal: NotificationPortal }) {
  const queryClient = useQueryClient();
  const unread = useUnreadNotificationCount(portal);
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(portal),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(portal, resolveNotificationQueryScope(portal)) }),
  });
  return (
    <IconButton
      disabled={!unread || markAll.isPending}
      aria-label="Đánh dấu tất cả đã đọc"
      onClick={() => markAll.mutate()}
      sx={{ border: 1, borderColor: "divider", borderRadius: "50%", bgcolor: "background.paper", width: 44, height: 44 }}
    >
      <DoneAllRoundedIcon />
    </IconButton>
  );
}
