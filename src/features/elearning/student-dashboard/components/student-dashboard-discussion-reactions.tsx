import {
  useRef,
  useState,
  type ReactNode,
} from "react";
import MessageCircle from "@mui/icons-material/ChatBubbleOutlineRounded";
import Share2 from "@mui/icons-material/ShareRounded";
import Smile from "@mui/icons-material/SentimentSatisfiedAltRounded";
import ThumbsUp from "@mui/icons-material/ThumbUpAltOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import {
  MUI_MUTED,
  Stack,
  reactionVisuals,
  reactionKeys,
} from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-shared";
import { formatCompactCount } from "@/features/elearning/student-dashboard/components/student-dashboard-discussion-primitives";
export function ReactionActionButton({
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
        startIcon={compact ? undefined : active ? <span>{active.icon}</span> : <ThumbsUp sx={{ fontSize: 18 }} />}
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

export function ReactionPicker({
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

export function ReactionInsertButton({ onPick }: { onPick: (reaction: StudentDiscussionReactionKey) => void }) {
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
      <Button startIcon={<Smile sx={{ fontSize: 16 }} />} size="small" variant="text" sx={{ borderRadius: 999, color: MUI_MUTED, fontWeight: 800 }}>
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

export function PostEngagementBar({
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
        <EngagementStatButton icon={<MessageCircle sx={{ fontSize: 19 }} />} value={formatCompactCount(commentCount)} onClick={onCommentClick} />
        <EngagementStatButton icon={<Share2 sx={{ fontSize: 19 }} />} value={formatCompactCount(shareCount)} onClick={onShareClick} />
      </Stack>
      <ReactionGlyphStack reactions={reactions} />
    </Stack>
  );
}

export function EngagementStatButton({ icon, onClick, value }: { icon: ReactNode; onClick: () => void; value: string }) {
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

export function ReactionStatButton({
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
            {active ? active.icon : <ThumbsUp sx={{ fontSize: 19 }} />}
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

export function ReactionGlyphStack({ reactions }: { reactions: StudentDiscussionFeedPost["reactions"] }) {
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

