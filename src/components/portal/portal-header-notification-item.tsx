import type { MouseEvent } from "react";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";

import type { PortalNotification } from "./use-portal-notifications";

type PortalHeaderNotificationItemProps = {
  notification: PortalNotification;
  /** Detail route of the message in this workspace; without it the row only closes the popover. */
  href?: string;
  onOpen: (event: MouseEvent<HTMLElement>, href?: string) => void;
};

const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;

export function PortalHeaderNotificationItem({ notification, href, onOpen }: PortalHeaderNotificationItemProps) {
  const { priority, needsAck, unread, title, preview, createdAt } = notification;
  const time = formatDateTimeVi(createdAt);
  // The name carries what the dot and chips show, so unread / priority / ack are not colour-only.
  const label = [unread && "Chưa đọc", priority, needsAck && "Cần xác nhận", title, time].filter(Boolean).join(", ");
  const link = href ? { component: "a", href } : {};

  return (
    <ListItem disablePadding divider>
      <ListItemButton {...link} aria-label={label} onClick={(event: MouseEvent<HTMLElement>) => onOpen(event, href)} sx={{ alignItems: "flex-start", gap: 1.5, minHeight: 56, px: 2, py: 1.25 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ ...clamp2, fontWeight: unread ? "fontWeightBold" : "fontWeightMedium" }}>{title}</Typography>
          {preview && preview !== title ? <Typography variant="body2" sx={{ ...clamp2, color: "text.secondary" }}>{preview}</Typography> : null}
          {priority || needsAck ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {priority ? <ErgStatusChip label={priority} tone={priority === "Khẩn" ? "error" : "warning"} /> : null}
              {needsAck ? <ErgStatusChip label="Cần xác nhận" tone="info" /> : null}
            </Box>
          ) : null}
          <Typography component="span" variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>{time}</Typography>
        </Box>
        {unread ? <Box aria-hidden sx={{ bgcolor: "primary.main", borderRadius: "50%", flexShrink: 0, height: 8, mt: 0.75, width: 8 }} /> : null}
      </ListItemButton>
    </ListItem>
  );
}
