import PushPinIcon from "@mui/icons-material/PushPinRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { StudentDiscussionFeedPost } from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getCommentCount } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { getPostTitle, getReactionTotal, type DiscussionListFilter } from "@/features/elearning/student-dashboard/utils/discussion-thread-list";
import { SubjectTag, ThreadAvatar, ThreadStats, threadIconSx } from "@/features/elearning/student-dashboard/components/student-discussion-thread-parts";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, statusTint } = ergEnterpriseTokens;

export const DISCUSSION_FILTER_LABELS: Record<DiscussionListFilter, string> = {
  latest: "Mới nhất",
  mine: "Của tôi",
  unanswered: "Chưa có trả lời",
};

function FilterChip({ count, label, onClick, selected }: { count?: number; label: string; onClick: () => void; selected: boolean }) {
  return (
    <Chip
      clickable
      aria-pressed={selected}
      color={selected ? "primary" : "default"}
      label={count === undefined ? label : (
        <Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
          {label}
          <Box component="span" sx={{ bgcolor: color.primarySofter, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: statusTint.info.color, minWidth: 20, px: 0.75, textAlign: "center" }}>{count}</Box>
        </Box>
      )}
      variant="outlined"
      onClick={onClick}
      sx={{ bgcolor: selected ? color.primarySofter : color.surface, borderColor: selected ? color.primary : color.border, color: selected ? color.primary : color.textSecondary, height: ergEnterpriseTokens.size.controlSm }}
    />
  );
}

export function ThreadFilters({ filter, onFilter, onSubject, subject, subjects, unansweredCount }: {
  filter: DiscussionListFilter;
  onFilter: (filter: DiscussionListFilter) => void;
  onSubject: (subject: string | null) => void;
  subject: string | null;
  subjects: string[];
  unansweredCount: number;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: { xs: 0, md: 2.25 }, py: { xs: 0, md: 1.5 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {(Object.keys(DISCUSSION_FILTER_LABELS) as DiscussionListFilter[]).map((key) => (
          <FilterChip key={key} count={key === "unanswered" ? unansweredCount : undefined} label={DISCUSSION_FILTER_LABELS[key]} selected={filter === key} onClick={() => onFilter(key)} />
        ))}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        <FilterChip label="Tất cả" selected={subject === null} onClick={() => onSubject(null)} />
        {subjects.map((name) => <FilterChip key={name} label={name} selected={subject === name} onClick={() => onSubject(name)} />)}
      </Box>
    </Box>
  );
}

function ThreadRow({ onOpen, post, selected }: { onOpen: () => void; post: StudentDiscussionFeedPost; selected: boolean }) {
  const pinned = Boolean(post.pinned);
  return (
    <ButtonBase
      aria-current={selected ? "true" : undefined}
      onClick={onOpen}
      sx={{
        alignItems: "flex-start",
        bgcolor: { xs: pinned ? statusTint.warning.bg : color.surface, md: selected ? color.primarySofter : "transparent" },
        border: { xs: `1px solid ${pinned ? alpha(color.warning, 0.35) : color.divider}`, md: 0 },
        borderBottom: { md: `1px solid ${color.divider}` },
        borderRadius: { xs: `${ergEnterpriseTokens.radius.card}px`, md: 0 },
        boxShadow: { md: selected ? `inset 3px 0 0 ${color.primary}` : "none" },
        display: "flex",
        gap: 1.5,
        px: { xs: 2, md: 2.25 },
        py: { xs: 1.75, md: 1.75 },
        textAlign: "left",
        width: "100%",
      }}
    >
      <ThreadAvatar initials={post.authorInitials} size={32} tone={pinned ? "teacher" : post.mine ? "me" : "neutral"} />
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 0.5, minWidth: 0 }}>
        {pinned ? (
          <Box component="span" sx={{ alignItems: "center", color: statusTint.warning.color, display: "inline-flex", gap: 0.25, typography: "caption", fontWeight: "fontWeightBold" }}>
            <PushPinIcon sx={threadIconSx} />
            Cô ghim
          </Box>
        ) : null}
        <Typography variant="subtitle2" sx={{ color: color.text }}>{getPostTitle(post)}</Typography>
        <Box sx={{ alignItems: "center", color: color.textMuted, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {post.subject ? <SubjectTag label={post.subject} /> : null}
          <Typography variant="caption" sx={{ color: "inherit" }}>{post.authorName} · {post.createdAtLabel.replace(/ \d{2}:\d{2}$/, "")}</Typography>
        </Box>
        <ThreadStats hearts={getReactionTotal(post.reactions)} replies={getCommentCount(post.comments)} solved={Boolean(post.acceptedReplyId)} />
      </Box>
    </ButtonBase>
  );
}

export function ThreadList({ activeId, onOpen, posts }: { activeId: string | undefined; onOpen: (id: string) => void; posts: StudentDiscussionFeedPost[] }) {
  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: { xs: 1.5, md: 0 }, minHeight: 0, overflowY: "auto" }}>
      {posts.map((post) => <ThreadRow key={post.id} post={post} selected={post.id === activeId} onOpen={() => onOpen(post.id)} />)}
    </Box>
  );
}
