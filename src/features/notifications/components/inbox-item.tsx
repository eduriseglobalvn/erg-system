import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";

import { inboxSourceLabel, isSchoolMessage, needsAck, priorityLabel, type InboxItem as InboxItemData } from "./inbox-filters";

const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;

export function InboxItem({ item, onOpen }: { item: InboxItemData; onOpen: (item: InboxItemData) => void }) {
  const priority = priorityLabel(item);
  const ack = needsAck(item);
  const time = formatDateTimeVi(item.createdAt);
  const source = inboxSourceLabel(item);
  const Icon = isSchoolMessage(item) ? CampaignRoundedIcon : DnsRoundedIcon;
  // The name carries what the dot and colours show, so screen readers get unread / priority / ack state too.
  const label = [item.unread && "Chưa đọc", priority, ack && "Cần xác nhận", source, item.title, time].filter(Boolean).join(", ");

  return (
    <ListItem disablePadding divider>
      <ListItemButton aria-label={label} onClick={() => onOpen(item)} sx={{ alignItems: "flex-start", gap: 1.5, px: 2, py: 1.5, minHeight: 64 }}>
        <Box
          aria-hidden
          sx={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, borderRadius: "50%", bgcolor: priority === "Khẩn" ? "error.main" : "primary.main", color: "common.white" }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" noWrap sx={{ flex: 1, minWidth: 0, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{source}</Typography>
            <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary" }}>{time}</Typography>
          </Box>
          <Typography variant="body2" sx={{ ...clamp2, mt: 0.25, fontWeight: item.unread ? "fontWeightBold" : "fontWeightMedium" }}>{item.title}</Typography>
          {item.bodyPreview && item.bodyPreview !== item.title ? (
            <Typography variant="body2" sx={{ ...clamp2, color: "text.secondary" }}>{item.bodyPreview}</Typography>
          ) : null}
          {priority || ack ? (
            <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {priority ? <ErgStatusChip label={priority} tone={priority === "Khẩn" ? "error" : "warning"} /> : null}
              {ack ? <ErgStatusChip label="Cần xác nhận" tone="info" /> : null}
            </Box>
          ) : null}
        </Box>
        {item.unread ? <Box aria-hidden sx={{ mt: 0.75, width: 9, height: 9, flexShrink: 0, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
      </ListItemButton>
    </ListItem>
  );
}
