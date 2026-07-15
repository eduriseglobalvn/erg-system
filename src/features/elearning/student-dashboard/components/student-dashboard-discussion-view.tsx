import { useRef, useState, type ReactNode } from "react";
import {
  Camera,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Smile,
  ThumbsUp,
} from "lucide-react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack as MuiStack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import type {
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getCommentCount } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";

const MUI_PRIMARY = "#0F6CBD";
const MUI_TEXT = "#172033";
const MUI_MUTED = "#667085";
const MUI_BORDER = "rgba(16, 24, 40, 0.1)";
const MUI_DIVIDER = "rgba(16, 24, 40, 0.075)";
const MUI_SURFACE = "#FFFFFF";
const MUI_CARD_SHADOW = "0 1px 2px rgba(16,24,40,0.045), 0 18px 44px rgba(16,24,40,0.055)";

const elevatedCardSx = {
  bgcolor: MUI_SURFACE,
  border: `1px solid ${MUI_BORDER}`,
  borderRadius: "14px",
  boxShadow: MUI_CARD_SHADOW,
};

function Stack({
  alignItems,
  justifyContent,
  sx,
  ...props
}: {
  alignItems?: unknown;
  children?: ReactNode;
  direction?: unknown;
  justifyContent?: unknown;
  spacing?: unknown;
  sx?: unknown;
  [key: string]: unknown;
}) {
  const layoutSx = {
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
  };

  return (
    <MuiStack
      {...(props as Record<string, unknown>)}
      sx={[Object.keys(layoutSx).length ? layoutSx : null, sx].filter(Boolean) as never}
    />
  );
}

const reactionVisuals: Record<StudentDiscussionReactionKey, { color: string; icon: string; label: string }> = {
  angry: { color: "#E9710F", icon: "😡", label: "Phẫn nộ" },
  care: { color: "#F7B125", icon: "🤗", label: "Cố lên" },
  haha: { color: "#F7B125", icon: "😆", label: "Haha" },
  like: { color: "#1877F2", icon: "👍", label: "Thích" },
  love: { color: "#F3425F", icon: "❤️", label: "Yêu thích" },
  sad: { color: "#F7B125", icon: "😢", label: "Buồn" },
  wow: { color: "#F7B125", icon: "😮", label: "Wow" },
};

const reactionKeys = Object.keys(reactionVisuals) as StudentDiscussionReactionKey[];

export function DiscussionView({
  copy,
  posts,
  studentClass,
  onAddComment,
  onCommentReaction,
  onCreatePost,
  onPostReaction,
}: {
  copy: DashboardCopy;
  posts: StudentDiscussionFeedPost[];
  studentClass: string;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onCreatePost: (content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onPostReaction: (postId: string, reaction: StudentDiscussionReactionKey) => void;
}) {
  const [composer, setComposer] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const [snackbar, setSnackbar] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function submitPost() {
    const content = composer.trim();
    if (!content && composerAttachments.length === 0) {
      setSnackbar("Nhập nội dung hoặc thêm ảnh trước khi đăng.");
      return;
    }

    onCreatePost(content, composerAttachments);
    setComposer("");
    setComposerAttachments([]);
  }

  async function addComposerImages(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setComposerAttachments((current) => [...current, ...nextAttachments]);
    if (nextAttachments.length) {
      setSnackbar(`Đã thêm ${nextAttachments.length} ảnh.`);
    }
  }

  return (
    <Stack spacing={1.45}>
      <DiscussionPageHeader
        className={studentClass}
        description={copy.discussionDescription}
        icon={<MessageCircle size={18} />}
        title={copy.discussionTitle}
      />

      <Card sx={elevatedCardSx}>
        <CardContent sx={{ p: { xs: 1.1, md: 1.25 } }}>
          <Stack spacing={0.85}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: MUI_PRIMARY, color: "#fff", fontSize: 14, fontWeight: 900, height: 34, width: 34 }}>{studentClass.slice(0, 1)}</Avatar>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={5}
                value={composer}
                placeholder={copy.discussionBodyPlaceholder}
                onChange={(event) => setComposer(event.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#F0F2F5",
                    borderRadius: "18px",
                    transition: "background 160ms ease, box-shadow 160ms ease",
                    "& textarea": { fontSize: 14, lineHeight: 1.45, py: 0.32 },
                    "& .MuiOutlinedInput-input": { px: 1.45 },
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "transparent" },
                    "&.Mui-focused": { bgcolor: "#fff", boxShadow: "0 0 0 4px rgba(15,108,189,0.08)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(15,108,189,0.34)" },
                  },
                }}
              />
            </Stack>
            <AttachmentPreview
              attachments={composerAttachments}
              onRemove={(attachmentId) => setComposerAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ pl: { xs: 0, sm: 5.5 } }}>
              <Stack direction="row" spacing={0.75}>
                <Button
                  startIcon={<ImageIcon size={16} />}
                  size="small"
                  variant="text"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderRadius: 999, color: MUI_MUTED, fontWeight: 800 }}
                >
                  Ảnh
                </Button>
                <ReactionInsertButton onPick={(reaction) => setComposer((current) => `${current}${current ? " " : ""}${reactionVisuals[reaction].icon}`)} />
                <input
                  ref={fileInputRef}
                  accept="image/*"
                  hidden
                  multiple
                  type="file"
                  onChange={(event) => {
                    void addComposerImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </Stack>
              <Button
                endIcon={<Send size={16} />}
                variant="contained"
                onClick={submitPost}
                sx={{
                  bgcolor: MUI_PRIMARY,
                  borderRadius: 999,
                  boxShadow: "0 8px 18px rgba(15,108,189,0.16)",
                  fontWeight: 900,
                  minHeight: 36,
                  px: 2.1,
                  "&:hover": { bgcolor: "#0B4F8A" },
                }}
              >
                {copy.discussionPostAction}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {posts.length ? (
        posts.map((post) => (
          <FacebookPostCard
            key={post.id}
            copy={copy}
            post={post}
            onAddComment={onAddComment}
            onCommentReaction={onCommentReaction}
            onPostReaction={onPostReaction}
            onToast={setSnackbar}
          />
        ))
      ) : (
        <EmptyPanel title={copy.discussionEmptyTitle} description={copy.discussionEmptyDescription} />
      )}

      <Snackbar
        autoHideDuration={2600}
        message={snackbar}
        open={Boolean(snackbar)}
        onClose={() => setSnackbar("")}
      />
    </Stack>
  );
}

function FacebookPostCard({
  copy,
  post,
  onAddComment,
  onCommentReaction,
  onPostReaction,
  onToast,
}: {
  copy: DashboardCopy;
  post: StudentDiscussionFeedPost;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onPostReaction: (postId: string, reaction: StudentDiscussionReactionKey) => void;
  onToast: (message: string) => void;
}) {
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commentCount = getCommentCount(post.comments);
  const reactionTotal = getReactionTotal(post.reactions);
  const shareCount = 3;

  function submitReply() {
    const content = replyDraft.trim();
    if (!content && replyAttachments.length === 0) return;
    onAddComment(post.id, undefined, content, replyAttachments);
    setReplyDraft("");
    setReplyAttachments([]);
  }

  async function addReplyImages(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setReplyAttachments((current) => [...current, ...nextAttachments]);
    if (nextAttachments.length) onToast(`Đã thêm ${nextAttachments.length} ảnh.`);
  }

  return (
    <Card
      id={`student-discussion-post-${post.id}`}
      sx={{
        bgcolor: "#fff",
        border: `1px solid ${MUI_DIVIDER}`,
        borderRadius: "14px",
        boxShadow: "0 1px 2px rgba(16,24,40,0.045), 0 16px 36px rgba(16,24,40,0.045)",
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px 14px 0 0", px: { xs: 1.5, md: 2 }, pt: { xs: 1.45, md: 1.65 }, pb: post.attachments.length ? 1.15 : 1.45 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.14)", color: "#1877F2", fontSize: 14, fontWeight: 900, height: 40, width: 40 }}>
              {post.authorInitials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: "#050505", fontWeight: 850, lineHeight: 1.2 }}>
                  {post.authorName}
                </Typography>
                <Chip label={post.className} size="small" sx={{ bgcolor: "#F0F2F5", borderRadius: "7px", fontWeight: 750, height: 24 }} />
                {post.relatedAssignmentTitle ? (
                  <Chip label={post.relatedAssignmentTitle} size="small" sx={{ bgcolor: "rgba(15,108,189,0.08)", borderRadius: "7px", color: MUI_TEXT, fontWeight: 750, height: 24 }} />
                ) : null}
              </Stack>
              <Typography variant="caption" sx={{ color: "#65676B", display: "block", mt: 0.15 }}>
                {post.createdAtLabel} · Lớp học
              </Typography>
            </Box>
            <IconButton aria-label="Tùy chọn bài viết" size="small" sx={{ color: "#65676B" }}>
              <MoreHorizontal size={20} />
            </IconButton>
          </Stack>

          <Typography variant="body2" sx={{ color: "#050505", fontSize: 15, lineHeight: 1.55, mt: 1.15, whiteSpace: "pre-line" }}>
            {post.content}
          </Typography>
          {post.moderationWarning ? (
            <Box sx={{ bgcolor: "#FFF7E6", border: "1px solid rgba(255,171,0,0.22)", borderRadius: "10px", mt: 1.1, px: 1.1, py: 0.75 }}>
              <Typography variant="caption" sx={{ color: "#B76E00", display: "block", fontWeight: 750 }}>
                {copy.discussionModerationWarning}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {post.attachments.length ? (
          <Box
            sx={{
              bgcolor: "#F7F8FA",
              borderTop: "1px solid rgba(16,24,40,0.055)",
              px: { xs: 1, md: 1.2 },
              py: 1,
            }}
          >
            <AttachmentGrid attachments={post.attachments} hero />
          </Box>
        ) : null}

        <PostEngagementBar
          activeReaction={post.viewerReaction}
          commentCount={commentCount}
          reactions={post.reactions}
          reactionTotal={reactionTotal}
          shareCount={shareCount}
          onCommentClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
          onReaction={(reaction) => onPostReaction(post.id, reaction)}
          onShareClick={() => setShareOpen(true)}
        />

        <Box
          sx={{
            bgcolor: "#FAFBFD",
            borderRadius: "0 0 14px 14px",
            px: { xs: 1.5, md: 2 },
            py: 1.25,
          }}
        >
          {post.comments.length ? (
            <Stack spacing={1.05}>
              {post.comments.map((comment) => (
                <FacebookComment
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  postId={post.id}
                  onAddComment={onAddComment}
                  onCommentReaction={onCommentReaction}
                  onToast={onToast}
                />
              ))}
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: post.comments.length ? 1.2 : 0 }}>
            <Avatar sx={{ bgcolor: MUI_PRIMARY, color: "#fff", fontSize: 13, fontWeight: 900, height: 32, width: 32 }}>L</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                id={`comment-input-${post.id}`}
                fullWidth
                value={replyDraft}
                placeholder={copy.discussionReplyPlaceholder}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitReply();
                  }
                }}
                sx={commentFieldSx}
              />
              <ComposerToolbar
                canSend={Boolean(replyDraft.trim() || replyAttachments.length)}
                onAddImage={() => fileInputRef.current?.click()}
                onPickReaction={(reaction) => setReplyDraft((current) => `${current}${current ? " " : ""}${reactionVisuals[reaction].icon}`)}
                onSend={submitReply}
              />
              <AttachmentPreview attachments={replyAttachments} compact onRemove={(attachmentId) => setReplyAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))} />
              <input
                ref={fileInputRef}
                accept="image/*"
                hidden
                multiple
                type="file"
                onChange={(event) => {
                  void addReplyImages(event.target.files);
                  event.target.value = "";
                }}
              />
            </Box>
          </Stack>
        </Box>
      </CardContent>

      <ShareDialog
        open={shareOpen}
        postId={post.id}
        title={post.content.slice(0, 88)}
        onClose={() => setShareOpen(false)}
        onToast={onToast}
      />
    </Card>
  );
}

function FacebookComment({
  comment,
  depth,
  postId,
  onAddComment,
  onCommentReaction,
  onToast,
}: {
  comment: StudentDiscussionComment;
  depth: number;
  postId: string;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onToast: (message: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reactionTotal = getReactionTotal(comment.reactions);

  function submitReply() {
    const content = replyDraft.trim();
    if (!content && replyAttachments.length === 0) return;
    onAddComment(postId, comment.id, content, replyAttachments);
    setReplyDraft("");
    setReplyAttachments([]);
    setIsReplying(false);
  }

  async function addImages(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setReplyAttachments((current) => [...current, ...nextAttachments]);
    if (nextAttachments.length) onToast(`Đã thêm ${nextAttachments.length} ảnh.`);
  }

  return (
    <Box sx={{ pl: depth ? { xs: 2.8, sm: 4.5 } : 0, position: "relative" }}>
      {depth ? (
        <Box sx={{ borderBottom: "2px solid #DADDE1", borderLeft: "2px solid #DADDE1", borderBottomLeftRadius: 10, height: 24, left: { xs: 0.9, sm: 1.5 }, position: "absolute", top: -1, width: { xs: 1.8, sm: 2.5 } }} />
      ) : null}
      <Stack direction="row" spacing={0.85} alignItems="flex-start">
        <Avatar sx={{ bgcolor: "#E4E6EB", color: "#050505", fontSize: 12, fontWeight: 850, height: 32, width: 32 }}>
          {comment.authorInitials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ bgcolor: "#F0F2F5", borderRadius: "18px", display: "inline-block", maxWidth: "100%", px: 1.25, py: 0.8 }}>
            <Typography variant="caption" sx={{ color: "#050505", display: "block", fontWeight: 850, lineHeight: 1.2 }}>
              {comment.authorName}
            </Typography>
            <Typography variant="body2" sx={{ color: "#050505", fontSize: 14, lineHeight: 1.45, mt: 0.15 }}>
              {comment.content}
            </Typography>
            <AttachmentGrid attachments={comment.attachments} compact />
          </Box>
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ color: "#65676B", minHeight: 22, pl: 1.1 }}>
            <Typography variant="caption">{comment.createdAtLabel}</Typography>
            <ReactionActionButton compact activeReaction={comment.viewerReaction} onReaction={(reaction) => onCommentReaction(postId, comment.id, reaction)} />
            <Button size="small" variant="text" onClick={() => setIsReplying((current) => !current)} sx={{ color: "#65676B", fontSize: 12, fontWeight: 850, minHeight: 22, minWidth: 0, p: 0 }}>
              Trả lời
            </Button>
            {reactionTotal ? <ReactionCluster compact reactions={comment.reactions} total={reactionTotal} /> : null}
          </Stack>
          {isReplying ? (
            <Box sx={{ mt: 0.75 }}>
              <TextField
                autoFocus
                fullWidth
                value={replyDraft}
                placeholder={`Trả lời ${comment.authorName}...`}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitReply();
                  }
                }}
                sx={commentFieldSx}
              />
              <ComposerToolbar
                canSend={Boolean(replyDraft.trim() || replyAttachments.length)}
                onAddImage={() => fileInputRef.current?.click()}
                onPickReaction={(reaction) => setReplyDraft((current) => `${current}${current ? " " : ""}${reactionVisuals[reaction].icon}`)}
                onSend={submitReply}
              />
              <AttachmentPreview attachments={replyAttachments} compact onRemove={(attachmentId) => setReplyAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))} />
              <input
                ref={fileInputRef}
                accept="image/*"
                hidden
                multiple
                type="file"
                onChange={(event) => {
                  void addImages(event.target.files);
                  event.target.value = "";
                }}
              />
            </Box>
          ) : null}
          {comment.replies.length ? (
            <Stack spacing={1} sx={{ mt: 0.65 }}>
              {comment.replies.map((reply) => (
                <FacebookComment
                  key={reply.id}
                  comment={reply}
                  depth={Math.min(depth + 1, 3)}
                  postId={postId}
                  onAddComment={onAddComment}
                  onCommentReaction={onCommentReaction}
                  onToast={onToast}
                />
              ))}
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

function ReactionActionButton({
  activeReaction,
  compact,
  onReaction,
}: {
  activeReaction: StudentDiscussionReactionKey | null;
  compact?: boolean;
  onReaction: (reaction: StudentDiscussionReactionKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = activeReaction ? reactionVisuals[activeReaction] : null;
  const closeTimerRef = useRef<number | null>(null);

  function openPicker() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  }

  return (
    <Box
      onMouseEnter={openPicker}
      onMouseLeave={scheduleClose}
      sx={{ display: compact ? "inline-flex" : "flex", flex: compact ? "initial" : 1, justifyContent: "center", position: "relative" }}
    >
      <Button
        fullWidth={!compact}
        startIcon={compact ? undefined : active ? <span>{active.icon}</span> : <ThumbsUp size={18} />}
        variant="text"
        onClick={() => onReaction(activeReaction ?? "like")}
        sx={{
          borderRadius: compact ? 0 : "8px",
          color: active ? active.color : "#65676B",
          fontSize: compact ? 12 : undefined,
          fontWeight: 850,
          minHeight: compact ? 22 : 36,
          minWidth: 0,
          p: compact ? 0 : undefined,
          textTransform: "none",
          "&:hover": { bgcolor: compact ? "transparent" : "#F0F2F5" },
        }}
      >
        {active ? active.label : "Thích"}
      </Button>
      <ReactionPicker
        align={compact ? "start" : "center"}
        open={open}
        onMouseEnter={openPicker}
        onMouseLeave={scheduleClose}
        onReaction={(reaction) => {
          onReaction(reaction);
          setOpen(false);
        }}
      />
    </Box>
  );
}

function ReactionPicker({
  align = "center",
  open,
  onMouseEnter,
  onMouseLeave,
  onReaction,
}: {
  align?: "center" | "start";
  open: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onReaction: (reaction: StudentDiscussionReactionKey) => void;
}) {
  if (!open) return null;

  return (
    <Stack
      direction="row"
      spacing={0.35}
      sx={{
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 999,
        bottom: "calc(100% + 2px)",
        boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
        left: align === "start" ? 0 : "50%",
        p: 0.55,
        pointerEvents: "auto",
        position: "absolute",
        transform: align === "start" ? "translate(0, -6px) scale(1)" : "translate(-50%, -6px) scale(1)",
        transition: "opacity 140ms ease, transform 140ms ease",
        zIndex: 20,
        "&::after": {
          bottom: -10,
          content: '""',
          height: 12,
          left: 0,
          position: "absolute",
          right: 0,
        },
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {reactionKeys.map((reaction) => (
        <Tooltip key={reaction} title={reactionVisuals[reaction].label}>
          <IconButton
            aria-label={reactionVisuals[reaction].label}
            onClick={(event) => {
              event.stopPropagation();
              onReaction(reaction);
            }}
            sx={{
              fontSize: 27,
              height: 38,
              transition: "transform 120ms ease",
              width: 38,
              "&:hover": { bgcolor: "transparent", transform: "translateY(-5px) scale(1.16)" },
            }}
          >
            {reactionVisuals[reaction].icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}

function ReactionInsertButton({ onPick }: { onPick: (reaction: StudentDiscussionReactionKey) => void }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  function openPicker() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  }

  return (
    <Box onMouseEnter={openPicker} onMouseLeave={scheduleClose} sx={{ position: "relative" }}>
      <Button startIcon={<Smile size={16} />} size="small" variant="text" sx={{ borderRadius: 999, color: MUI_MUTED, fontWeight: 800 }}>
        Cảm xúc
      </Button>
      <ReactionPicker
        open={open}
        onMouseEnter={openPicker}
        onMouseLeave={scheduleClose}
        onReaction={(reaction) => {
          onPick(reaction);
          setOpen(false);
        }}
      />
    </Box>
  );
}

function PostEngagementBar({
  activeReaction,
  commentCount,
  reactions,
  reactionTotal,
  shareCount,
  onCommentClick,
  onReaction,
  onShareClick,
}: {
  activeReaction: StudentDiscussionReactionKey | null;
  commentCount: number;
  reactions: StudentDiscussionFeedPost["reactions"];
  reactionTotal: number;
  shareCount: number;
  onCommentClick: () => void;
  onReaction: (reaction: StudentDiscussionReactionKey) => void;
  onShareClick: () => void;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid rgba(16,24,40,0.075)",
        borderTop: "1px solid rgba(16,24,40,0.075)",
        color: "#5F6673",
        minHeight: 38,
        px: { xs: 1.5, md: 2 },
        py: 0.6,
      }}
    >
      <Stack direction="row" spacing={{ xs: 1.55, sm: 2.15 }} alignItems="center">
        <ReactionStatButton activeReaction={activeReaction} count={reactionTotal} onReaction={onReaction} />
        <EngagementStatButton icon={<MessageCircle size={19} />} value={formatCompactCount(commentCount)} onClick={onCommentClick} />
        <EngagementStatButton icon={<Share2 size={19} />} value={formatCompactCount(shareCount)} onClick={onShareClick} />
      </Stack>
      <ReactionGlyphStack reactions={reactions} />
    </Stack>
  );
}

function EngagementStatButton({ icon, onClick, value }: { icon: ReactNode; onClick: () => void; value: string }) {
  return (
    <Button
      variant="text"
      onClick={onClick}
      sx={{
        color: "#5F6673",
        borderRadius: "8px",
        minHeight: 28,
        minWidth: 0,
        px: 0.5,
        py: 0,
        textTransform: "none",
        transition: "background-color 180ms ease, color 180ms ease",
        "&:hover": { bgcolor: "#F0F2F5", color: "#1877F2" },
      }}
    >
      <Stack direction="row" spacing={0.65} alignItems="center">
        <Box sx={{ display: "inline-flex", lineHeight: 0 }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: "inherit", fontSize: 14, fontWeight: 750, lineHeight: 1 }}>
          {value}
        </Typography>
      </Stack>
    </Button>
  );
}

function ReactionStatButton({
  activeReaction,
  count,
  onReaction,
}: {
  activeReaction: StudentDiscussionReactionKey | null;
  count: number;
  onReaction: (reaction: StudentDiscussionReactionKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const active = activeReaction ? reactionVisuals[activeReaction] : null;

  function openPicker() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  }

  return (
    <Box onMouseEnter={openPicker} onMouseLeave={scheduleClose} sx={{ display: "inline-flex", position: "relative" }}>
      <Button
        variant="text"
        onClick={() => onReaction(activeReaction ?? "like")}
        sx={{
          color: active ? active.color : "#5F6673",
          borderRadius: "8px",
          minHeight: 28,
          minWidth: 0,
          px: 0.5,
          py: 0,
          textTransform: "none",
          transition: "background-color 180ms ease, color 180ms ease",
          "&:hover": { bgcolor: "#F0F2F5", color: active ? active.color : "#1877F2" },
        }}
      >
        <Stack direction="row" spacing={0.65} alignItems="center">
          <Box sx={{ display: "inline-flex", fontSize: active ? 16 : 0, lineHeight: 0 }}>
            {active ? active.icon : <ThumbsUp size={19} />}
          </Box>
          <Typography variant="body2" sx={{ color: "inherit", fontSize: 14, fontWeight: 750, lineHeight: 1 }}>
            {formatCompactCount(count)}
          </Typography>
        </Stack>
      </Button>
      <ReactionPicker
        align="start"
        open={open}
        onMouseEnter={openPicker}
        onMouseLeave={scheduleClose}
        onReaction={(reaction) => {
          onReaction(reaction);
          setOpen(false);
        }}
      />
    </Box>
  );
}

function ReactionGlyphStack({ reactions }: { reactions: StudentDiscussionFeedPost["reactions"] }) {
  const topReactions = reactionKeys
    .filter((key) => reactions[key].count > 0)
    .sort((first, second) => reactions[second].count - reactions[first].count)
    .slice(0, 2);

  if (!topReactions.length) {
    return null;
  }

  return (
    <Stack direction="row" spacing={-0.55} alignItems="center" sx={{ pr: 0.2 }}>
      {topReactions.map((key) => (
        <Box
          key={key}
          aria-label={reactionVisuals[key].label}
          title={reactionVisuals[key].label}
          sx={{
            alignItems: "center",
            bgcolor: key === "like" || key === "love" ? reactionVisuals[key].color : "transparent",
            border: "2px solid #fff",
            borderRadius: "50%",
            display: "flex",
            fontSize: 13,
            height: 22,
            justifyContent: "center",
            lineHeight: 1,
            width: 22,
          }}
        >
          {reactionVisuals[key].icon}
        </Box>
      ))}
    </Stack>
  );
}

function ComposerToolbar({
  canSend,
  onAddImage,
  onPickReaction,
  onSend,
}: {
  canSend: boolean;
  onAddImage: () => void;
  onPickReaction: (reaction: StudentDiscussionReactionKey) => void;
  onSend: () => void;
}) {
  return (
    <Stack direction="row" spacing={0.25} sx={{ color: "#65676B", mt: 0.45, pl: 1 }}>
      <ReactionIconButton onPick={onPickReaction} />
      <IconButton aria-label="Thêm ảnh" size="small" onClick={onAddImage}><Camera size={16} /></IconButton>
      <IconButton aria-label="Thêm ảnh minh họa" size="small" onClick={onAddImage}><ImageIcon size={16} /></IconButton>
      <Box sx={{ flex: 1 }} />
      <IconButton aria-label="Gửi" size="small" onClick={onSend} sx={{ color: canSend ? "#1877F2" : "#BCC0C4" }}>
        <Send size={16} />
      </IconButton>
    </Stack>
  );
}

function ReactionIconButton({ onPick }: { onPick: (reaction: StudentDiscussionReactionKey) => void }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  function openPicker() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  }

  return (
    <Box onMouseEnter={openPicker} onMouseLeave={scheduleClose} sx={{ position: "relative" }}>
      <IconButton aria-label="Thêm cảm xúc" size="small"><Smile size={16} /></IconButton>
      <ReactionPicker
        open={open}
        onMouseEnter={openPicker}
        onMouseLeave={scheduleClose}
        onReaction={(reaction) => {
          onPick(reaction);
          setOpen(false);
        }}
      />
    </Box>
  );
}

function ShareDialog({
  open,
  postId,
  title,
  onClose,
  onToast,
}: {
  open: boolean;
  postId: string;
  title: string;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const shareUrl =
    typeof window === "undefined"
      ? `/?tab=discussion&post=${encodeURIComponent(postId)}`
      : `${window.location.origin}${window.location.pathname}?tab=discussion&post=${encodeURIComponent(postId)}`;

  async function copyLink() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    onToast("Đã copy link chia sẻ. Người xem cần đăng nhập để mở.");
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 900 }}>Chia sẻ bài viết</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: MUI_MUTED, mb: 1.5 }}>
          Link này chỉ xem được sau khi đăng nhập tài khoản ERG Elearning.
        </Typography>
        <Paper sx={{ bgcolor: "#F8FAFC", border: `1px solid ${MUI_DIVIDER}`, borderRadius: 2, p: 1.5 }}>
          <Typography variant="caption" sx={{ color: MUI_MUTED, display: "block", fontWeight: 800, mb: 0.5 }}>
            {title || "Bài thảo luận"}
          </Typography>
          <Typography variant="body2" sx={{ color: MUI_TEXT, overflowWrap: "anywhere" }}>
            {shareUrl}
          </Typography>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 999, fontWeight: 800 }}>Đóng</Button>
        <Button variant="contained" onClick={() => void copyLink()} sx={{ bgcolor: MUI_PRIMARY, borderRadius: 999, fontWeight: 900 }}>
          Copy link
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReactionCluster({
  compact,
  reactions,
  total,
}: {
  compact?: boolean;
  reactions: StudentDiscussionFeedPost["reactions"];
  total: number;
}) {
  if (!total) {
    return (
      <Typography variant="caption" sx={{ color: "#65676B", fontWeight: 650 }}>
        Hãy là người đầu tiên thích
      </Typography>
    );
  }

  const topReactions = reactionKeys
    .filter((key) => reactions[key].count > 0)
    .sort((first, second) => reactions[second].count - reactions[first].count)
    .slice(0, compact ? 1 : 3);

  return (
    <Stack direction="row" spacing={0.6} alignItems="center">
      <Stack direction="row" spacing={-0.35}>
        {topReactions.map((key) => (
          <Box
            key={key}
            aria-label={reactionVisuals[key].label}
            title={reactionVisuals[key].label}
            sx={{
              alignItems: "center",
              bgcolor: key === "like" || key === "love" ? reactionVisuals[key].color : "transparent",
              border: "2px solid #fff",
              borderRadius: "50%",
              display: "flex",
              fontSize: compact ? 10 : 12,
              height: compact ? 18 : 20,
              justifyContent: "center",
              lineHeight: 1,
              width: compact ? 18 : 20,
              zIndex: 2,
            }}
          >
            {reactionVisuals[key].icon}
          </Box>
        ))}
      </Stack>
      <Typography variant="caption" sx={{ color: "#65676B", fontWeight: 650 }}>
        {total}
      </Typography>
    </Stack>
  );
}

function AttachmentPreview({
  attachments,
  compact,
  onRemove,
}: {
  attachments: StudentDiscussionImageAttachment[];
  compact?: boolean;
  onRemove: (attachmentId: string) => void;
}) {
  if (!attachments.length) return null;

  return (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: compact ? "repeat(auto-fill, minmax(54px, 1fr))" : "repeat(auto-fit, minmax(140px, 1fr))", mt: 1 }}>
      {attachments.map((attachment) => (
        <Box key={attachment.id} sx={{ borderRadius: 2, height: compact ? 58 : 142, overflow: "hidden", position: "relative" }}>
          <Box component="img" alt={attachment.name} src={attachment.url} sx={{ height: "100%", objectFit: "cover", width: "100%" }} />
          <IconButton aria-label="Bỏ ảnh" size="small" onClick={() => onRemove(attachment.id)} sx={{ bgcolor: "rgba(15,23,42,0.72)", color: "#fff", position: "absolute", right: 6, top: 6, "&:hover": { bgcolor: "rgba(15,23,42,0.88)" } }}>
            ×
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}

function AttachmentGrid({
  attachments,
  compact,
  hero,
}: {
  attachments: StudentDiscussionImageAttachment[];
  compact?: boolean;
  hero?: boolean;
}) {
  if (!attachments.length) return null;

  if (hero) {
    const visibleAttachments = attachments.slice(0, 4);

    return (
      <Box
        sx={{
          display: "grid",
          gap: 0.75,
          gridTemplateColumns: attachments.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
          m: 0,
        }}
      >
        {visibleAttachments.map((attachment, index) => (
          <Box
            key={attachment.id}
            sx={{
              bgcolor: "#EDEFF3",
              border: "1px solid rgba(16,24,40,0.07)",
              borderRadius: attachments.length === 1 ? "12px" : "10px",
              height: attachments.length === 1 ? { xs: 260, md: 380 } : { xs: 150, md: 218 },
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              component="img"
              alt={attachment.name}
              src={attachment.url}
              sx={{ display: "block", height: "100%", objectFit: "cover", width: "100%" }}
            />
            {index === 3 && attachments.length > 4 ? (
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: "rgba(15,23,42,0.58)",
                  color: "#fff",
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 900,
                  inset: 0,
                  justifyContent: "center",
                  position: "absolute",
                }}
              >
                +{attachments.length - 4}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: compact ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(180px, 1fr))", mt: 1.2 }}>
      {attachments.slice(0, 4).map((attachment) => (
        <Box component="img" key={attachment.id} alt={attachment.name} src={attachment.url} sx={{ border: "1px solid rgba(16,24,40,0.07)", borderRadius: 2, height: compact ? 92 : 190, objectFit: "cover", width: "100%" }} />
      ))}
    </Box>
  );
}

function DiscussionPageHeader({
  className,
  description,
  icon,
  title,
}: {
  className: string;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card sx={elevatedCardSx}>
      <CardContent sx={{ px: { xs: 1.5, md: 2 }, py: { xs: 1.35, md: 1.45 } }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box sx={{ bgcolor: "rgba(15,108,189,0.08)", border: "1px solid rgba(15,108,189,0.14)", borderRadius: "12px", color: MUI_PRIMARY, display: "grid", height: 42, placeItems: "center", width: 42 }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
              <Chip
                label={className}
                size="small"
                sx={{
                  bgcolor: "rgba(15,108,189,0.08)",
                  border: "1px solid rgba(15,108,189,0.14)",
                  borderRadius: "8px",
                  color: MUI_PRIMARY,
                  fontSize: 12,
                  fontWeight: 850,
                  height: 24,
                }}
              />
              <Typography variant="caption" sx={{ color: MUI_MUTED, fontWeight: 750 }}>
                Bảng tin lớp học
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.2, sm: 1 }} alignItems={{ xs: "flex-start", sm: "baseline" }}>
              <Typography variant="h6" sx={{ color: MUI_TEXT, fontSize: { xs: 17, md: 18 }, fontWeight: 900, lineHeight: 1.15 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: MUI_MUTED, fontSize: 13.5 }}>
                {description}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <Paper sx={{ bgcolor: "#F9FAFD", border: `1px solid ${MUI_BORDER}`, borderRadius: "12px", boxShadow: "0 5px 18px rgba(16,32,51,0.045)", p: 2.2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Paper>
  );
}

function getReactionTotal(reactions: StudentDiscussionFeedPost["reactions"]) {
  return reactionKeys.reduce((total, key) => total + reactions[key].count, 0);
}

function formatCompactCount(value: number) {
  if (value >= 1000) {
    const compactValue = Math.round((value / 1000) * 10) / 10;
    return `${compactValue.toString().replace(".", ",")}K`;
  }

  return `${value}`;
}

function createImageAttachments(files: FileList | null) {
  const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));

  return Promise.all(
    imageFiles.map(
      (file, index) =>
        new Promise<StudentDiscussionImageAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `image-${Date.now()}-${index}-${file.name}`,
              type: "image",
              name: file.name,
              url: typeof reader.result === "string" ? reader.result : "",
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

const commentFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#F0F2F5",
    borderRadius: "18px",
    minHeight: 40,
    pr: 0.75,
    "& input": { py: 1.05 },
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused": { bgcolor: "#F0F2F5" },
    "&.Mui-focused fieldset": { borderColor: "transparent" },
  },
};
