import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/AddRounded";
import SearchIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ergMobileDockClearance } from "@/components/portal/erg-mobile-dock";
import type { StudentDiscussionFeedPost, StudentDiscussionReactionKey } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import {
  getDiscussionSubjects,
  isUnanswered,
  selectDiscussionThreads,
  type DiscussionListFilter,
} from "@/features/elearning/student-dashboard/utils/discussion-thread-list";
import { EmptyPanel } from "@/features/elearning/student-dashboard/components/student-dashboard-view-primitives";
import { AskQuestionDialog } from "@/features/elearning/student-dashboard/components/student-discussion-ask-dialog";
import { ThreadDetail } from "@/features/elearning/student-dashboard/components/student-discussion-thread-detail";
import { ThreadFilters, ThreadList } from "@/features/elearning/student-dashboard/components/student-discussion-thread-list";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color } = ergEnterpriseTokens;

/** Thảo luận (design H13 web, H13m list, H13m2 thread): two panes on desktop, list then thread on a phone. */
export function DiscussionView({
  copy,
  posts,
  studentClass,
  viewerName = "",
  onAddComment,
  onCommentReaction,
  onCreatePost,
  onPostReaction,
  onToggleFollow,
}: {
  copy: DashboardCopy;
  posts: StudentDiscussionFeedPost[];
  studentClass: string;
  viewerName?: string;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onCreatePost: (content: string, attachments: StudentDiscussionImageAttachment[], subject?: string) => void;
  onPostReaction: (postId: string, reaction: StudentDiscussionReactionKey) => void;
  onToggleFollow?: (postId: string) => void;
}) {
  const [filter, setFilter] = useState<DiscussionListFilter>("latest");
  const [subject, setSubject] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const subjects = useMemo(() => getDiscussionSubjects(posts), [posts]);
  const visible = useMemo(() => selectDiscussionThreads(posts, filter, subject, query), [posts, filter, subject, query]);
  const unansweredCount = useMemo(() => posts.filter(isUnanswered).length, [posts]);
  // Desktop always shows a thread; a phone shows the list until one is opened.
  const active = posts.find((post) => post.id === openId) ?? visible[0];
  const threadOpenOnPhone = openId !== null && active !== undefined;
  const askButton = (
    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAsking(true)}>Đặt câu hỏi</Button>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2.25 } }}>
      <Box sx={{ alignItems: "center", display: { xs: threadOpenOnPhone ? "none" : "flex", md: "flex" }, gap: 1.5, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1">{copy.discussionTitle} {studentClass}</Typography>
          <Typography variant="body2" sx={{ color: color.textMuted, display: { xs: "none", md: "block" } }}>{copy.discussionDescription}</Typography>
        </Box>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Tìm chủ đề"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
            sx={{ display: { xs: "none", md: "block" }, width: 240 }}
          />
          <IconButton aria-label="Tìm chủ đề" onClick={() => setSearching((current) => !current)} sx={{ border: `1px solid ${color.border}`, display: { md: "none" } }}><SearchIcon /></IconButton>
          <Box sx={{ display: { xs: "none", md: "block" } }}>{askButton}</Box>
        </Box>
      </Box>
      {searching ? (
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Tìm chủ đề"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ display: { xs: threadOpenOnPhone ? "none" : "flex", md: "none" } }}
        />
      ) : null}

      {posts.length === 0 ? (
        <EmptyPanel title={copy.discussionEmptyTitle} description={copy.discussionEmptyDescription} />
      ) : (
        <Box
          sx={{
            bgcolor: { md: color.surface },
            border: { md: `1px solid ${color.border}` },
            borderRadius: `${ergEnterpriseTokens.radius.card}px`,
            display: "grid",
            gridTemplateColumns: { md: "400px minmax(0, 1fr)" },
            height: { md: "min(820px, calc(100vh - 190px))" },
            minHeight: { md: 520 },
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderRight: { md: `1px solid ${color.divider}` }, display: { xs: threadOpenOnPhone ? "none" : "flex", md: "flex" }, flexDirection: "column", gap: { xs: 1.5, md: 0 }, minHeight: 0 }}>
            <ThreadFilters filter={filter} subject={subject} subjects={subjects} unansweredCount={unansweredCount} onFilter={setFilter} onSubject={setSubject} />
            {visible.length ? (
              <ThreadList activeId={active?.id} posts={visible} onOpen={setOpenId} />
            ) : (
              <Typography variant="body2" sx={{ color: color.textMuted, p: 2.25 }}>Không có chủ đề phù hợp.</Typography>
            )}
          </Box>
          <Box sx={{ display: { xs: threadOpenOnPhone ? "flex" : "none", md: "flex" }, minHeight: 0, minWidth: 0 }}>
            {active ? (
              <ThreadDetail
                key={active.id}
                post={active}
                viewerInitials={getInitials(viewerName)}
                onBack={() => setOpenId(null)}
                onCommentReaction={onCommentReaction}
                onPostReaction={onPostReaction}
                onReply={(postId, parentCommentId, content) => onAddComment(postId, parentCommentId, content, [])}
                onToggleFollow={onToggleFollow}
              />
            ) : null}
          </Box>
        </Box>
      )}

      {/* Phone: floating ask button above the dock, hidden once a thread is open. */}
      <Box sx={{ bottom: ergMobileDockClearance(16), display: { xs: threadOpenOnPhone ? "none" : "block", md: "none" }, position: "fixed", right: 16, zIndex: 2 }}>{askButton}</Box>

      <AskQuestionDialog
        open={asking}
        subjects={subjects}
        onClose={() => setAsking(false)}
        onSubmit={(content, chosenSubject) => {
          onCreatePost(content, [], chosenSubject);
          setAsking(false);
        }}
      />
    </Box>
  );
}
