import { useId, type MouseEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";

import { ErgSkeleton } from "@/components/erg-mui";
import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";

import { PortalHeaderNotificationItem } from "./portal-header-notification-item";
import type { PortalNotificationsState } from "./use-portal-notifications";

type PortalHeaderNotificationsProps = {
  /** The bell (or the account tile on the desktop sidebar); focus goes back to it on close. */
  anchorEl: HTMLElement | null;
  state: PortalNotificationsState;
  pathname: string;
  /** Sidebar: opens to the right of the anchor, bottom-aligned. Header (default): below the bell, right-aligned. */
  placement?: "header" | "sidebar";
  onClose: () => void;
  onNavigate?: (path: string) => void;
};

/** Where this workspace keeps its inbox; students and CRM have no routed inbox, so no links. */
function inboxBase(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return adminPath("/notifications");
  if (segment === "teacher") return teacherPath("/notifications");
  return undefined;
}

const PLACEMENTS = {
  header: { anchorOrigin: { vertical: "bottom", horizontal: "right" }, transformOrigin: { vertical: "top", horizontal: "right" } },
  sidebar: { anchorOrigin: { vertical: "top", horizontal: "right" }, transformOrigin: { vertical: "bottom", horizontal: "left" } },
} as const;

export function PortalHeaderNotifications({ anchorEl, state, pathname, placement = "header", onClose, onNavigate }: PortalHeaderNotificationsProps) {
  const titleId = useId();
  const base = inboxBase(pathname);
  const { notifications, isPending, isError, refetch, markRead } = state;
  const unreadIds = notifications.filter((item) => item.unread).map((item) => item.id);

  // Plain left-click goes through the router when the shell gave us one; modified clicks keep the anchor's default.
  const open = (event: MouseEvent<HTMLElement>, href?: string) => {
    if (href && onNavigate && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      onNavigate(href);
    }
    onClose();
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      {...PLACEMENTS[placement]}
      slotProps={{
        paper: { role: "dialog", "aria-labelledby": titleId, sx: { maxWidth: "calc(100vw - 32px)", mt: placement === "header" ? 0.5 : 0, width: 380 } },
        transition: { onExited: () => anchorEl?.focus() },
      }}
    >
      <Box sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", gap: 1, minHeight: 48, pl: 2, pr: 1 }}>
        <Typography id={titleId} component="h2" variant="subtitle1" sx={{ flex: 1 }}>Thông báo</Typography>
        <Button variant="text" size="small" disabled={unreadIds.length === 0} onClick={() => void markRead(unreadIds)} sx={{ minHeight: 44 }}>Đánh dấu đã đọc</Button>
      </Box>
      <Box sx={{ maxHeight: "min(60vh, 480px)", overflowY: "auto" }}>
        {isPending ? (
          <Box role="status" aria-label="Đang tải thông báo" sx={{ display: "grid", gap: 1.5, p: 2 }}>
            {[0, 1, 2].map((n) => <ErgSkeleton key={n} variant="rounded" height={44} />)}
          </Box>
        ) : isError ? (
          <Box sx={{ display: "grid", gap: 1, justifyItems: "center", p: 3 }}>
            <Typography variant="body2" color="text.secondary">Không tải được thông báo.</Typography>
            <Button variant="outlined" size="small" onClick={() => refetch()} sx={{ minHeight: 44 }}>Thử lại</Button>
          </Box>
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>Chưa có thông báo</Typography>
        ) : (
          <List disablePadding aria-label="Thông báo mới nhất">
            {notifications.map((notification) => (
              <PortalHeaderNotificationItem key={notification.id} notification={notification} href={base ? `${base}/${encodeURIComponent(notification.id)}` : undefined} onOpen={open} />
            ))}
          </List>
        )}
      </Box>
      {base ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", p: 1 }}>
          <Button variant="text" fullWidth href={base} onClick={(event) => open(event, base)} sx={{ minHeight: 44 }}>Mở trang Thông báo</Button>
        </Box>
      ) : null}
    </Popover>
  );
}
