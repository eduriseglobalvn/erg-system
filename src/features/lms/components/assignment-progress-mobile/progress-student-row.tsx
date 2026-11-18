import { nameInitials } from "@/domain/formatters/format-initials";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

export type ProgressRowStatus = "completed" | "inprogress" | "notstarted";

/** What the phone list needs from the page's StudentProgressRow (structural, so no import cycle). */
export type ProgressMobileRow = {
  id: string;
  name: string;
  userId?: string;
  score: number | null;
  /** Top of the scale `score` is on; absent means 100 (a percentage). */
  scoreMax?: number;
  status: ProgressRowStatus;
  timestamp: string;
};

const badge: Record<ProgressRowStatus, { label: string; tone: "success" | "info" | "warning" }> = {
  completed: { label: "Đã nộp", tone: "success" },
  inprogress: { label: "Đang làm", tone: "info" },
  notstarted: { label: "Chưa nộp", tone: "warning" },
};

/** "800/1000": the score on the scale the server graded it, so teacher and student read the same figure. */
export function scoreLabel(row: Pick<ProgressMobileRow, "score" | "scoreMax">, empty = "-") {
  return row.score === null ? empty : `${row.score}/${row.scoreMax ?? 100}`;
}

export function initialsOf(name: string) {
  return nameInitials(name) || "?";
}

function noteOf(row: ProgressMobileRow) {
  const time = row.timestamp && row.timestamp !== "—" ? row.timestamp : "";
  if (row.status === "completed") {
    return [row.score !== null ? `${scoreLabel(row)} điểm` : "Chưa có điểm", time && `nộp ${time}`].filter(Boolean).join(" · ");
  }
  if (row.status === "inprogress") return time ? `Đang làm · cập nhật ${time}` : "Đang làm bài";
  return "Chưa mở bài";
}

/** Canvas `.li`: avatar initials, name, one-line note, status pill. */
export function ProgressStudentRow({ onGrade, row }: { onGrade?: () => void; row: ProgressMobileRow }) {
  const { label, tone } = badge[row.status];
  return (
    <Box component="li" sx={{ alignItems: "center", display: "flex", gap: 1.5, minHeight: 56, px: 2, py: 1, "& + &": { borderTop: 1, borderColor: "divider" } }}>
      <Avatar sx={{ bgcolor: t.color.primarySofter, color: "primary.main", height: 36, typography: "caption", fontWeight: "fontWeightBold", width: 36 }}>
        {initialsOf(row.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: "fontWeightMedium" }} variant="body2">{row.name}</Typography>
        <Typography color="text.secondary" noWrap variant="caption" component="p">{noteOf(row)}</Typography>
      </Box>
      {onGrade ? (
        <Button onClick={onGrade} sx={{ flexShrink: 0, minHeight: 44 }} variant="outlined">Chấm bài</Button>
      ) : (
        <ErgStatusChip dot={false} label={label} sx={{ flexShrink: 0 }} tone={tone} />
      )}
    </Box>
  );
}
