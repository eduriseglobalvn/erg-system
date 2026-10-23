import {
  useRef,
  useState,
} from "react";
import Camera from "@mui/icons-material/PhotoCameraRounded";
import ImageIcon from "@mui/icons-material/ImageRounded";
import Send from "@mui/icons-material/SendRounded";
import Smile from "@mui/icons-material/SentimentSatisfiedAltRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  StudentDiscussionImageAttachment,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  MUI_PRIMARY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_DIVIDER,
  Stack,
  reactionVisuals,
  reactionKeys,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-shared";
import { ReactionPicker } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-reactions";
export function ComposerToolbar({
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
      <IconButton aria-label="Thêm ảnh" size="small" onClick={onAddImage}><Camera sx={{ fontSize: 16 }} /></IconButton>
      <IconButton aria-label="Thêm ảnh minh họa" size="small" onClick={onAddImage}><ImageIcon sx={{ fontSize: 16 }} /></IconButton>
      <Box sx={{ flex: 1 }} />
      <IconButton aria-label="Gửi" size="small" onClick={onSend} sx={{ color: canSend ? "#1877F2" : "#BCC0C4" }}>
        <Send sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

export function ReactionIconButton({ onPick }: { onPick: (reaction: StudentDiscussionReactionKey) => void }) {
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
      <IconButton aria-label="Thêm cảm xúc" size="small"><Smile sx={{ fontSize: 16 }} /></IconButton>
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

export function ShareDialog({
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

export function ReactionCluster({
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

export function AttachmentPreview({
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

export function AttachmentGrid({
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

