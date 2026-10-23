import {
  useRef,
  useState,
} from "react";
import ImageIcon from "@mui/icons-material/ImageRounded";
import MessageCircle from "@mui/icons-material/ChatBubbleOutlineRounded";
import Send from "@mui/icons-material/SendRounded";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import type {
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
  MUI_PRIMARY,
  MUI_MUTED,
  elevatedCardSx,
  Stack,
  reactionVisuals,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-shared";
import { DiscussionPostCard } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-post-card";
import { AttachmentPreview } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-composer-tools";
import { ReactionInsertButton } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-reactions";
import { DiscussionPageHeader, EmptyPanel, createImageAttachments } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-primitives";
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
        studentClass={studentClass}
        description={copy.discussionDescription}
        icon={<MessageCircle sx={{ fontSize: 18 }} />}
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
                  startIcon={<ImageIcon sx={{ fontSize: 16 }} />}
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
                endIcon={<Send sx={{ fontSize: 16 }} />}
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
          <DiscussionPostCard
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
