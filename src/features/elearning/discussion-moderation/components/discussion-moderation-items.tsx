import { useState, type ReactNode } from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHorizRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type {
  ModerationComment,
  ModerationPost,
  ModerationReply,
  ModerationTargetType,
} from "@/features/elearning/discussion-moderation/api/discussion-moderation-api";

export type ModerationAction = { kind: "hide" | "show" | "delete"; targetType: ModerationTargetType; targetId: string };
type OnAction = (action: ModerationAction) => void;

function ItemMenu({ hidden, onAction, targetId, targetType }: { hidden: boolean; onAction: OnAction; targetId: string; targetType: ModerationTargetType }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const pick = (kind: ModerationAction["kind"]) => {
    setAnchor(null);
    onAction({ kind, targetId, targetType });
  };
  return (
    <>
      <ErgIconButton label={targetType === "POST" ? "Tuỳ chọn bài viết" : "Tuỳ chọn bình luận"} size="small" onClick={(event) => setAnchor(event.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </ErgIconButton>
      <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)}>
        {hidden ? <MenuItem onClick={() => pick("show")}>Hiện lại</MenuItem> : <MenuItem onClick={() => pick("hide")}>Ẩn</MenuItem>}
        <MenuItem onClick={() => pick("delete")} sx={{ color: "error.main" }}>Xoá</MenuItem>
      </Menu>
    </>
  );
}

function AuthorLine({ name, createdAt, hidden, variant }: { name: string | null; createdAt: string | null; hidden: boolean; variant: "subtitle2" | "caption" }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", minWidth: 0, rowGap: 0.5 }}>
      <Typography variant={variant} sx={{ color: "text.primary" }}>{name || "Học viên"}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{formatDateTimeVi(createdAt)}</Typography>
      {hidden ? <ErgStatusChip label="Đã ẩn" tone="warning" /> : null}
    </Stack>
  );
}

function Entry({ item, menu, nested, children }: {
  item: ModerationComment | ModerationReply;
  menu: ReactNode;
  nested?: boolean;
  children?: ReactNode;
}) {
  return (
    <Box sx={{ pl: nested ? { xs: 3, sm: 5 } : 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", opacity: item.hidden ? 0.55 : 1 }}>
        <Avatar sx={{ height: 32, width: 32, typography: "caption" }}>{item.authorInitials || "HV"}</Avatar>
        <Box sx={{ bgcolor: "action.hover", borderRadius: `${ergEnterpriseTokens.radius.card}px`, flex: 1, minWidth: 0, px: 1.5, py: 1 }}>
          <AuthorLine name={item.authorName} createdAt={item.createdAt} hidden={item.hidden} variant="caption" />
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>{item.content}</Typography>
        </Box>
        {menu}
      </Stack>
      {children}
    </Box>
  );
}

/** One student post with its two comment levels; hidden items stay visible here, dimmed and flagged "Đã ẩn". */
export function ModerationPostCard({ post, onAction }: { post: ModerationPost; onAction: OnAction }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: `${ergEnterpriseTokens.radius.card}px`, p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", opacity: post.hidden ? 0.55 : 1 }}>
        <Avatar>{post.authorInitials || "HV"}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AuthorLine name={post.authorName} createdAt={post.createdAt} hidden={post.hidden} variant="subtitle2" />
          {post.title && post.title !== post.content ? <Typography variant="subtitle1" sx={{ mt: 1 }}>{post.title}</Typography> : null}
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-line", wordBreak: "break-word" }}>{post.content}</Typography>
        </Box>
        <ItemMenu hidden={post.hidden} onAction={onAction} targetId={post.id} targetType="POST" />
      </Stack>
      {post.comments.length ? (
        <Stack spacing={1.25} sx={{ mt: 2 }}>
          {post.comments.map((comment) => (
            <Entry key={comment.id} item={comment} menu={<ItemMenu hidden={comment.hidden} onAction={onAction} targetId={comment.id} targetType="COMMENT" />}>
              {comment.replies.length ? (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {comment.replies.map((reply) => (
                    <Entry key={reply.id} item={reply} nested menu={<ItemMenu hidden={reply.hidden} onAction={onAction} targetId={reply.id} targetType="COMMENT" />} />
                  ))}
                </Stack>
              ) : null}
            </Entry>
          ))}
        </Stack>
      ) : null}
    </Card>
  );
}
