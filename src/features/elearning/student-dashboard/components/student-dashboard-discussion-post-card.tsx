import {
  useRef,
  useState,
} from "react";
import MoreHorizontal from "@mui/icons-material/MoreHorizRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  DashboardCopy,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDiscussionImageAttachment,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  getCommentCount,
} from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import {
  MUI_PRIMARY,
  MUI_TEXT,
  MUI_DIVIDER,
  Stack,
  reactionVisuals,
  commentFieldSx,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-shared";
import { ReactionActionButton, PostEngagementBar } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-reactions";
import { ComposerToolbar, ShareDialog, ReactionCluster, AttachmentPreview, AttachmentGrid } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-composer-tools";
import { getReactionTotal, createImageAttachments } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-primitives";
export function DiscussionPostCard({
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
              <MoreHorizontal sx={{ fontSize: 20 }} />
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

export function FacebookComment({
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

