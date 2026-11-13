import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgSearchField } from "@/components/erg-mui";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchNotificationFeed, notificationQueryKeys, resolveNotificationQueryScope } from "@/features/notifications/api/notification-api";
import type { NotificationPortal } from "@/features/notifications/api/notification-types";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { NotificationDetail } from "@/features/notifications/components/notification-detail";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { loadMyQuestionThreads, markQuestionThreadRead, questionThreadKeys } from "../api/student-question-thread-api";
import { StudentInboxComposeDialog, type ComposeAssignment } from "./student-inbox-compose-dialog";
import { filterInboxEntries, mergeInboxEntries, type InboxChip, type InboxEntry } from "./student-inbox-entries";
import { StudentInboxListPane } from "./student-inbox-list-pane";
import { StudentQuestionThreadPane } from "./student-question-thread-pane";

const NOTE_SIZE = 50;

type StudentInboxViewProps = {
  portal: NotificationPortal;
  /** Student assignments, to know which thread belongs to a PRACTICE assignment ("Làm lại câu N"). */
  assignments?: ReadonlyArray<ComposeAssignment & { kind?: "PRACTICE" | "TEST" }>;
  /** Opens an assignment in the dashboard; without it the "Mở câu hỏi" / "Làm lại câu N" shortcuts are hidden. */
  onOpenAssignment?: (assignmentId: string) => void;
};

/** Hộp thư (H12 web, N14 + H12m phone): question threads with the teacher and notifications in one list; a row opens in place. */
export function StudentInboxView({ portal, assignments = [], onOpenAssignment }: StudentInboxViewProps) {
  const mobile = useIsMobile();
  const scope = resolveNotificationQueryScope(portal);
  const accountId = scope.accountId ?? "anonymous";
  const queryClient = useQueryClient();
  const [chip, setChip] = useState<InboxChip>("ALL");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  const threads = useQuery({
    queryKey: questionThreadKeys.list(accountId),
    queryFn: ({ signal }) => loadMyQuestionThreads(signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const notes = useQuery({
    queryKey: notificationQueryKeys.inbox(portal, "all", 0, NOTE_SIZE, scope),
    queryFn: ({ signal }) => fetchNotificationFeed({ portal, status: "all", page: 0, size: NOTE_SIZE }, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const all = mergeInboxEntries(threads.data ?? [], notes.data?.items ?? [], seen);
  const needle = query.trim().toLowerCase();
  const entries = filterInboxEntries(all, chip).filter((entry) => !needle || `${entry.title} ${entry.preview}`.toLowerCase().includes(needle));
  const threadUnread = all.filter((entry) => entry.kind === "THREAD" && entry.unread).length;
  const unreadCount = all.filter((entry) => entry.unread).length;
  // The web layout always shows a detail: the opened row, else the newest one. The phone shows the list until a row is opened.
  const selected = entries.find((entry) => entry.key === openKey) ?? (mobile ? undefined : entries[0]);

  const select = (entry: InboxEntry) => {
    setOpenKey(entry.key);
    if (entry.thread) {
      const id = entry.thread.id;
      setSeen((prev) => new Set(prev).add(id));
      if (entry.unread) void markQuestionThreadRead(id).then(() => queryClient.invalidateQueries({ queryKey: questionThreadKeys.list(accountId) })).catch(() => undefined);
    }
  };
  const list = (
    <StudentInboxListPane
      chip={chip} entries={entries} selectedKey={selected?.key ?? null} unreadCount={unreadCount} threadUnread={threadUnread}
      loading={(threads.isPending || notes.isPending) && !entries.length}
      failed={threads.isError && notes.isError}
      onChip={setChip} onSelect={select}
      onRetry={() => { void threads.refetch(); void notes.refetch(); }}
    />
  );
  const detail = selected ? (
    selected.thread ? (
      <StudentQuestionThreadPane
        key={selected.key} accountId={accountId} threadId={selected.thread.id} mobile={mobile}
        practice={assignments.some((assignment) => assignment.id === selected.thread!.assignmentId && assignment.kind === "PRACTICE")}
        onBack={mobile ? () => setOpenKey(null) : undefined} onOpenAssignment={onOpenAssignment}
      />
    ) : (
      <Box sx={{ p: 2 }}><NotificationDetail key={selected.key} portal={portal} notificationId={selected.notification!.id} onBack={() => setOpenKey(null)} /></Box>
    )
  ) : null;

  const compose = (
    <StudentInboxComposeDialog
      assignments={assignments} open={composing} onClose={() => setComposing(false)}
      onSent={(thread) => { setComposing(false); setChip("THREAD"); setQuery(""); setOpenKey(`thread:${thread.id}`); }}
    />
  );
  if (mobile) {
    return selected ? <Box sx={{ minHeight: "70vh" }}>{detail}</Box> : (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
          <Typography component="h1" variant="h1" sx={{ flex: 1 }}>Hộp thư</Typography>
          <ErgButton variant="contained" size="small" startIcon={<EditRoundedIcon />} onClick={() => setComposing(true)}>Hỏi giáo viên</ErgButton>
        </Box>
        {list}
        {compose}
      </Box>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">Hộp thư</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Thông báo của lớp, trả lời của giáo viên và tin thi đua ở cùng một chỗ</Typography>
        </Box>
        <ErgSearchField aria-label="Tìm trong hộp thư" placeholder="Tìm trong hộp thư" value={query} onChange={(event) => setQuery(event.target.value)} sx={{ width: 260 }} />
        <MarkAllReadButton portal={portal} />
        <ErgButton variant="contained" startIcon={<EditRoundedIcon />} onClick={() => setComposing(true)}>Hỏi giáo viên</ErgButton>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "380px minmax(0, 1fr)", height: 820, border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, bgcolor: "background.paper", overflow: "hidden" }}>
        <Box sx={{ borderRight: 1, borderColor: "divider", overflowY: "auto", p: 1.5 }}>{list}</Box>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{detail}</Box>
      </Box>
      {compose}
    </Box>
  );
}
