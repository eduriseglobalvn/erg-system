import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBackRounded";
import ChatBubbleIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import NotificationsIcon from "@mui/icons-material/NotificationsNoneRounded";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActiveRounded";
import SendIcon from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { StudentDiscussionFeedPost, StudentDiscussionReactionKey } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getCommentCount } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { getPostTitle, getReactionTotal } from "@/features/elearning/student-dashboard/utils/discussion-thread-list";
import { ThreadReplies } from "@/features/elearning/student-dashboard/components/student-discussion-replies";
import { HeartButton, SubjectTag, ThreadAvatar, threadIconSx } from "@/features/elearning/student-dashboard/components/student-discussion-thread-parts";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color } = ergEnterpriseTokens;

type ReplyTarget = { id: string; name: string };

export type ThreadDetailProps = {
  onBack: () => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onPostReaction: (postId: string, reaction: StudentDiscussionReactionKey) => void;
  onReply: (postId: string, parentCommentId: string | undefined, content: string) => void;
  onToggleFollow?: (postId: string) => void;
  post: StudentDiscussionFeedPost;
  viewerInitials: string;
};

function ThreadHeader({ onBack, onToggleFollow, post }: Pick<ThreadDetailProps, "onBack" | "onToggleFollow" | "post">) {
  const following = Boolean(post.following);
  const toggle = onToggleFollow ? () => onToggleFollow(post.id) : undefined;
  return (
    <Box sx={{ alignItems: "center", borderBottom: { md: `1px solid ${color.divider}` }, display: "flex", gap: 1.25, px: { xs: 0, md: 2.75 }, py: { xs: 0, md: 1.75 } }}>
      <IconButton aria-label="Quay lại danh sách" onClick={onBack} sx={{ display: { md: "none" } }}><ArrowBackIcon /></IconButton>
      {post.subject ? <Box sx={{ display: { xs: "none", md: "block" } }}><SubjectTag label={post.subject} /></Box> : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ display: { xs: "none", md: "block" } }}>{getPostTitle(post)}</Typography>
        <Typography variant="h5" sx={{ display: { md: "none" } }}>Chủ đề</Typography>
        <Typography variant="caption" sx={{ color: color.textMuted, display: { md: "none" } }}>{[post.subject, `${getCommentCount(post.comments)} trả lời`].filter(Boolean).join(" · ")}</Typography>
      </Box>
      <Button
        aria-pressed={following}
        size="small"
        startIcon={following ? <NotificationsActiveIcon sx={threadIconSx} /> : <NotificationsIcon sx={threadIconSx} />}
        variant="text"
        onClick={toggle}
        sx={{ display: { xs: "none", md: "inline-flex" } }}
      >
        {following ? "Đang theo dõi" : "Theo dõi"}
      </Button>
      <IconButton aria-label={following ? "Bỏ theo dõi" : "Theo dõi"} aria-pressed={following} onClick={toggle} sx={{ border: `1px solid ${color.border}`, display: { md: "none" } }}>
        {following ? <NotificationsActiveIcon /> : <NotificationsIcon />}
      </IconButton>
    </Box>
  );
}

function ReplyComposer({ onClearTarget, onSend, target, viewerInitials }: { onClearTarget: () => void; onSend: (content: string) => void; target: ReplyTarget | null; viewerInitials: string }) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0;
  function send() {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft("");
  }
  return (
    <Box sx={{ borderTop: `1px solid ${color.divider}`, display: "flex", flexDirection: "column", gap: 0.5, px: { xs: 1.5, md: 2.75 }, py: 1.5 }}>
      {target ? (
        <Typography variant="caption" sx={{ color: color.textMuted }}>
          Đang trả lời {target.name}
          <Button size="small" variant="text" onClick={onClearTarget} sx={{ minHeight: 0, minWidth: 0, ml: 1, p: 0, typography: "caption" }}>Hủy</Button>
        </Typography>
      ) : null}
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        <ThreadAvatar initials={viewerInitials} size={32} tone="me" />
        <TextField
          fullWidth
          size="small"
          value={draft}
          placeholder={target ? `Trả lời ${target.name}...` : "Viết trả lời... (lịch sự, đúng chủ đề)"}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: `${ergEnterpriseTokens.radius.chip}px` } }}
        />
        <Button disabled={!canSend} startIcon={<SendIcon sx={threadIconSx} />} variant="outlined" onClick={send} sx={{ display: { xs: "none", md: "inline-flex" } }}>Gửi</Button>
        <IconButton aria-label="Gửi" disabled={!canSend} onClick={send} sx={{ bgcolor: color.primary, color: color.surface, display: { md: "none" }, "&:hover": { bgcolor: color.primaryHover } }}><SendIcon /></IconButton>
      </Box>
    </Box>
  );
}

export function ThreadDetail({ onBack, onCommentReaction, onPostReaction, onReply, onToggleFollow, post, viewerInitials }: ThreadDetailProps) {
  const [target, setTarget] = useState<ReplyTarget | null>(null);
  const actions = {
    onHeart: (commentId: string, reaction: StudentDiscussionReactionKey) => onCommentReaction(post.id, commentId, reaction),
    onReplyTo: setTarget,
  };
  const replyCount = getCommentCount(post.comments);
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, minWidth: 0 }}>
      <ThreadHeader post={post} onBack={onBack} onToggleFollow={onToggleFollow} />
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0, overflowY: "auto", px: { xs: 0, md: 2.75 }, py: { xs: 1.5, md: 2.25 } }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <ThreadAvatar initials={post.authorInitials} tone={post.mine ? "me" : "neutral"} />
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.75, minWidth: 0 }}>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Typography variant="subtitle2">
                {post.authorName}
                {post.mine ? <Box component="span" sx={{ display: { md: "none" } }}> (bạn)</Box> : null}
              </Typography>
              {post.mine ? <Box component="span" sx={{ bgcolor: color.primary, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: color.surface, display: { xs: "none", md: "inline" }, px: 0.75, typography: "caption", fontWeight: "fontWeightBold" }}>Bạn</Box> : null}
              <Typography variant="caption" sx={{ color: color.textMuted }}>· {post.createdAtLabel}</Typography>
            </Box>
            <Typography variant="h5" sx={{ display: { md: "none" } }}>{getPostTitle(post)}</Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{post.content}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1.75 }}>
              <HeartButton active={post.viewerReaction !== null} count={getReactionTotal(post.reactions)} label="Thích chủ đề" onClick={() => onPostReaction(post.id, post.viewerReaction ?? "love")} />
              <Box component="span" sx={{ alignItems: "center", color: color.textMuted, display: "inline-flex", gap: 0.5, typography: "caption", fontWeight: "fontWeightMedium" }}>
                <ChatBubbleIcon sx={threadIconSx} />
                {replyCount}
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>&nbsp;trả lời</Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <ThreadReplies actions={actions} post={post} />
      </Box>
      <ReplyComposer
        target={target}
        viewerInitials={viewerInitials}
        onClearTarget={() => setTarget(null)}
        onSend={(content) => {
          onReply(post.id, target?.id, content);
          setTarget(null);
        }}
      />
    </Box>
  );
}
