import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgEmptyState, ErgErrorState, ErgTabCount, ergChipTabsSx } from "@/components/erg-mui";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { fetchNotificationFeed, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationPortal } from "../api/notification-types";
import { filterInbox, inboxFiltersFor, type InboxFilter, type InboxItem as InboxItemData, type InboxWorkspace } from "./inbox-filters";
import { useUnreadNotificationCount } from "../hooks/use-unread-notification-count";
import { InboxItem } from "./inbox-item";
import { MarkAllReadButton } from "./mark-all-read-button";

const INBOX_SIZE = 50;
// shortcut: the API has no ack filter, so "Cần xử lý" scans the newest 100 (the server page cap); add a server filter when that is not enough.
const ACTION_SCAN_SIZE = 100;

const EMPTY_LABEL: Partial<Record<InboxFilter, string>> = {
  UNREAD: "Không còn thông báo chưa đọc.",
  ACTION: "Không có thông báo cần xử lý trong các tin gần đây.",
};

const COMPOSE_LABEL: Record<InboxWorkspace, string> = { ADMIN: "Gửi thông báo", TEACHER: "Gửi lớp", STUDENT: "" };

type InboxListProps = {
  portal: NotificationPortal;
  workspace: InboxWorkspace;
  onOpen: (item: InboxItemData) => void;
  /** Renders the page heading; leave out when the page has its own. */
  title?: string;
  /** Shows the primary send action ("Gửi lớp" / "Gửi thông báo"). Pass it only when the session may send. */
  onCompose?: () => void;
};

export function InboxList({ portal, workspace, onOpen, title, onCompose }: InboxListProps) {
  const filters = inboxFiltersFor(workspace);
  const [filter, setFilter] = useState<InboxFilter>("ALL");
  // Unread comes from the server (status=unread), so it is right past the first page; SCHOOL/SYSTEM split the newest page.
  const status = filter === "UNREAD" ? "unread" : "all";
  const size = filter === "ACTION" ? ACTION_SCAN_SIZE : INBOX_SIZE;
  const query = useQuery({
    queryKey: notificationQueryKeys.inbox(portal, status, 0, size, resolveNotificationQueryScope(portal)),
    queryFn: ({ signal }) => fetchNotificationFeed({ portal, status, page: 0, size }, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const items = filterInbox(query.data?.items ?? [], filter === "UNREAD" ? "ALL" : filter);
  const composeLabel = COMPOSE_LABEL[workspace];
  const unread = useUnreadNotificationCount(portal) ?? 0;

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {title || (onCompose && composeLabel) ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {title ? <Typography variant="h1" sx={{ flex: 1 }}>{title}</Typography> : <Box sx={{ flex: 1 }} />}
          {title ? <MarkAllReadButton portal={portal} /> : null}
          {onCompose && composeLabel ? (
            <ErgButton variant="contained" size="small" startIcon={<CampaignRoundedIcon />} onClick={onCompose}>{composeLabel}</ErgButton>
          ) : null}
        </Box>
      ) : null}
      <Tabs
        aria-label="Lọc thông báo"
        value={filter}
        onChange={(_, value: InboxFilter) => setFilter(value)}
        variant="scrollable"
        scrollButtons={false}
        sx={ergChipTabsSx}
      >
        {filters.map((tab) => (
          <Tab key={tab.id} value={tab.id} iconPosition="end" icon={tab.id === "ALL" ? <ErgTabCount count={unread} /> : undefined} label={tab.label} />
        ))}
      </Tabs>
      {query.isPending ? (
        <ContentPendingSkeleton />
      ) : query.isError ? (
        <ErgErrorState
          title="Không tải được thông báo"
          description="Kiểm tra kết nối rồi thử lại."
          action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>}
        />
      ) : items.length ? (
        <List
          aria-label="Danh sách thông báo"
          disablePadding
          sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, bgcolor: "background.paper", overflow: "hidden" }}
        >
          {items.map((item) => <InboxItem key={item.id} item={item} onOpen={onOpen} />)}
        </List>
      ) : (
        <ErgEmptyState title={EMPTY_LABEL[filter] ?? "Chưa có thông báo."} />
      )}
    </Box>
  );
}
