import VerifiedIcon from "@mui/icons-material/VerifiedRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { StudentDiscussionComment, StudentDiscussionFeedPost, StudentDiscussionReactionKey } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getReactionTotal, orderThreadReplies } from "@/features/elearning/student-dashboard/utils/discussion-thread-list";
import { HeartButton, threadIconSx, ThreadAvatar } from "@/features/elearning/student-dashboard/components/student-discussion-thread-parts";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, statusTint } = ergEnterpriseTokens;

export type ReplyActions = {
  onHeart: (commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onReplyTo: (target: { id: string; name: string }) => void;
};

function ReplyNode({ actions, comment, nestedUnder, teacherPick }: {
  actions: ReplyActions;
  comment: StudentDiscussionComment;
  /** The root comment when this is a 2nd-level reply: answering it targets the root. */
  nestedUnder?: StudentDiscussionComment;
  teacherPick: boolean;
}) {
  const root = nestedUnder ?? comment;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={teacherPick
          ? { bgcolor: statusTint.success.bg, border: `1px solid ${alpha(color.success, 0.3)}`, borderRadius: `${ergEnterpriseTokens.radius.card}px`, px: { xs: 1.5, md: 1.75 }, py: 1.5 }
          : undefined}
      >
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <ThreadAvatar initials={comment.authorInitials} size={nestedUnder ? 28 : 32} tone={teacherPick ? "teacher" : "neutral"} />
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.75, minWidth: 0 }}>
            <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Typography variant="subtitle2">{comment.authorName}</Typography>
              {teacherPick ? (
                <Box component="span" sx={{ alignItems: "center", bgcolor: color.surface, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: statusTint.success.color, display: "inline-flex", gap: 0.5, px: 1, py: 0.25, typography: "caption", fontWeight: "fontWeightBold" }}>
                  <VerifiedIcon sx={threadIconSx} />
                  <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>Giáo viên chọn là lời giải hay</Box>
                  <Box component="span" sx={{ display: { md: "none" } }}>Giáo viên</Box>
                </Box>
              ) : null}
              <Typography variant="caption" sx={{ color: color.textMuted }}>· {comment.createdAtLabel}</Typography>
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{comment.content}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1.75 }}>
              <HeartButton active={comment.viewerReaction !== null} count={getReactionTotal(comment.reactions)} label="Thích bình luận" onClick={() => actions.onHeart(comment.id, comment.viewerReaction ?? "love")} />
              <Button size="small" variant="text" onClick={() => actions.onReplyTo({ id: root.id, name: comment.authorName })} sx={{ color: color.textMuted, minHeight: 0, minWidth: 0, p: 0, typography: "caption", fontWeight: "fontWeightMedium" }}>
                Trả lời
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      {!nestedUnder && comment.replies.length ? (
        <Box sx={{ borderLeft: `2px solid ${color.divider}`, display: "flex", flexDirection: "column", gap: 1.5, ml: { xs: 1.25, md: 5 }, pl: 2 }}>
          {comment.replies.map((reply) => <ReplyNode key={reply.id} actions={actions} comment={reply} nestedUnder={comment} teacherPick={false} />)}
        </Box>
      ) : null}
    </Box>
  );
}

/** Replies indented under the question with a left rule; the teacher's pick comes first, in the green box. */
export function ThreadReplies({ actions, post }: { actions: ReplyActions; post: StudentDiscussionFeedPost }) {
  const replies = orderThreadReplies(post);
  if (!replies.length) return null;
  return (
    <Box sx={{ borderLeft: `2px solid ${color.divider}`, display: "flex", flexDirection: "column", gap: 2, ml: { xs: 1.5, md: 6.5 }, pl: { xs: 1, md: 2 } }}>
      {replies.map((comment) => <ReplyNode key={comment.id} actions={actions} comment={comment} teacherPick={comment.id === post.acceptedReplyId} />)}
    </Box>
  );
}
