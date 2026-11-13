import type { ElementType } from "react";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgEmptyState, ErgErrorState, ErgTabCount, ergChipTabsSx } from "@/components/erg-mui";
import { formatListTimeVi } from "@/domain/formatters/format-date";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { INBOX_CHIPS, type InboxChip, type InboxEntry, type InboxEntryKind } from "./student-inbox-entries";

const KIND: Record<InboxEntryKind, { label: string; Icon: ElementType; tone: keyof typeof t.statusTint }> = {
  THREAD: { label: "Hỏi giáo viên", Icon: ForumRoundedIcon, tone: "success" },
  CLASS: { label: "Thông báo lớp", Icon: CampaignRoundedIcon, tone: "info" },
  DISCUSSION: { label: "Thảo luận lớp", Icon: ForumRoundedIcon, tone: "info" },
  RANK: { label: "Thi đua", Icon: EmojiEventsRoundedIcon, tone: "warning" },
  CENTER: { label: "Trung tâm", Icon: CampaignRoundedIcon, tone: "warning" },
  SYSTEM: { label: "Hệ thống", Icon: DnsRoundedIcon, tone: "neutral" },
};
const clamp1 = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

type ListPaneProps = {
  chip: InboxChip;
  entries: ReadonlyArray<InboxEntry>;
  failed: boolean;
  loading: boolean;
  selectedKey: string | null;
  unreadCount: number;
  threadUnread: number;
  onChip: (chip: InboxChip) => void;
  onRetry: () => void;
  onSelect: (entry: InboxEntry) => void;
};

/** Left column of H12 / the N14 list: filter chips and one merged list of question threads and notifications. */
export function StudentInboxListPane({ chip, entries, failed, loading, selectedKey, unreadCount, threadUnread, onChip, onRetry, onSelect }: ListPaneProps) {
  return (
    <Box sx={{ display: "grid", gap: 1.5, alignContent: "start" }}>
      <Tabs aria-label="Lọc hộp thư" value={chip} onChange={(_, value: InboxChip) => onChip(value)} variant="scrollable" scrollButtons={false} sx={ergChipTabsSx}>
        {INBOX_CHIPS.map((tab) => (
          <Tab key={tab.id} value={tab.id} iconPosition="end" icon={tab.id === "ALL" || tab.id === "THREAD" ? <ErgTabCount count={tab.id === "ALL" ? unreadCount : threadUnread} /> : undefined} label={tab.label} />
        ))}
      </Tabs>
      {loading ? (
        <ContentPendingSkeleton />
      ) : failed ? (
        <ErgErrorState title="Không tải được hộp thư" description="Kiểm tra kết nối rồi thử lại." action={<ErgButton variant="outlined" onClick={onRetry}>Thử lại</ErgButton>} />
      ) : entries.length ? (
        <List aria-label="Danh sách hộp thư" disablePadding>
          {entries.map((entry) => <InboxRow key={entry.key} entry={entry} selected={entry.key === selectedKey} onSelect={onSelect} />)}
        </List>
      ) : (
        <ErgEmptyState title="Hộp thư trống." description="Tin nhắn của cô và thông báo của lớp sẽ hiện ở đây." />
      )}
    </Box>
  );
}

function InboxRow({ entry, selected, onSelect }: { entry: InboxEntry; selected: boolean; onSelect: (entry: InboxEntry) => void }) {
  const { label: kindLabel, Icon, tone } = KIND[entry.kind];
  const label = /badge/i.test(entry.notification?.eventType ?? "") ? "Huy hiệu" : kindLabel;
  const tint = t.statusTint[tone];
  return (
    <ListItemButton
      aria-current={selected ? "true" : undefined}
      aria-label={[entry.unread && "Chưa đọc", label, entry.title].filter(Boolean).join(", ")}
      selected={selected}
      onClick={() => onSelect(entry)}
      sx={{
        alignItems: "flex-start", gap: 1.5, px: 2, py: 1.5, borderBottom: 1, borderColor: "divider", borderLeft: 3, borderLeftColor: "transparent",
        "&.Mui-selected": { bgcolor: t.color.primarySofter, borderLeftColor: "primary.main" },
      }}
    >
      <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 32, height: 32, flexShrink: 0, borderRadius: `${t.radius.sm}px`, bgcolor: tint.bg, color: tint.dot }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ flex: 1, minWidth: 0, color: tint.color, fontWeight: "fontWeightBold", textTransform: "uppercase", ...clamp1 }}>{label}</Typography>
          <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary" }}>{formatListTimeVi(entry.at).replace(new RegExp("/" + new Date().getFullYear() + "$"), "")}</Typography>
          {entry.unread ? <Box aria-hidden sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
        </Box>
        <Typography variant="subtitle2" sx={{ ...clamp1, fontWeight: entry.unread ? "fontWeightBold" : "fontWeightMedium" }}>{entry.title}</Typography>
        {entry.preview ? <Typography variant="body2" sx={{ ...clamp1, color: "text.secondary" }}>{entry.preview}</Typography> : null}
      </Box>
    </ListItemButton>
  );
}
