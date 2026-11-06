import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { Link } from "@tanstack/react-router";

import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import { lifecycleLabel, type QuizLifecycle } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

const DOT: Record<QuizLifecycle, string> = {
  none: tokens.statusTint.neutral.dot,
  draft: tokens.statusTint.info.dot,
  published: tokens.statusTint.success.dot,
  changed: tokens.statusTint.warning.dot,
};

function RailItem({ label, count, lifecycle, selected, disabled, onClick }: {
  label: string;
  count: number;
  lifecycle?: QuizLifecycle;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      aria-current={selected ? "true" : undefined}
      disabled={disabled}
      onClick={onClick}
      sx={{
        alignItems: "center", borderRadius: `${tokens.radius.control}px`, display: "grid", gap: 1, gridTemplateColumns: "1fr auto 8px",
        justifyItems: "start", px: 1.5, py: 1, textAlign: "left", width: "100%", "&.Mui-disabled": { color: "text.disabled" },
        transition: `background-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
        // Same selected look as the sidebar: solid primary, white text.
        ...(selected
          ? { bgcolor: tokens.color.primary, color: tokens.color.surface, "&:hover": { bgcolor: tokens.color.primaryHover } }
          : { color: "text.primary", "&:hover": { bgcolor: tokens.color.primarySofter } }),
      }}
    >
      <Typography component="span" noWrap sx={{ fontWeight: "fontWeightMedium", maxWidth: "100%" }} variant="body2">
        {label}
      </Typography>
      <Typography component="span" sx={{ color: selected ? "inherit" : "text.secondary", fontVariantNumeric: "tabular-nums" }} variant="caption">
        {count}
        <Box component="span" sx={visuallyHidden}> câu</Box>
      </Typography>
      {lifecycle ? (
        <Box component="span" sx={{ bgcolor: DOT[lifecycle], border: 1, borderColor: selected ? tokens.color.surface : "transparent", borderRadius: "50%", height: 8, width: 8 }}>
          <Box component="span" sx={visuallyHidden}>{lifecycleLabel[lifecycle]}</Box>
        </Box>
      ) : <span />}
    </ButtonBase>
  );
}

/** The Level's topics; "Tất cả" (row null) only views. Topics are managed in the question bank, never added here. */
export function TopicRail({ rows, selectedTopicId, loading = false, onSelect }: {
  rows: TopicRow[];
  selectedTopicId: string;
  /** The Level's quizzes are still loading: a topic picked now would look quizless and start a second quiz. */
  loading?: boolean;
  onSelect: (row: TopicRow | null) => void;
}) {
  return (
    <Box
      aria-label="Chủ đề"
      component="nav"
      aria-busy={loading || undefined}
      sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", flexShrink: 0, gap: 0.5, overflowY: "auto", p: 1, width: 240 }}
    >
      {rows.length ? (
        <>
          <RailItem
            count={rows.reduce((sum, row) => sum + row.questionCount, 0)}
            label="Tất cả"
            onClick={() => onSelect(null)}
            selected={selectedTopicId === "all"}
          />
          {rows.map((row) => (
            <RailItem
              count={row.questionCount}
              disabled={loading}
              key={row.id}
              label={row.label}
              lifecycle={loading ? undefined : row.lifecycle}
              onClick={() => onSelect(row)}
              selected={row.id === selectedTopicId}
            />
          ))}
        </>
      ) : (
        <Typography color="text.secondary" sx={{ p: 1 }} variant="body2">
          Level này chưa có chủ đề. Thêm chủ đề ở{" "}
          <Button component={Link} size="small" sx={{ minWidth: 0, p: 0, verticalAlign: "baseline" }} to={adminContentPathForSection("questions")} variant="text">
            Ngân hàng câu hỏi
          </Button>
          .
        </Typography>
      )}
    </Box>
  );
}
