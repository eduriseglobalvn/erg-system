import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { formatTimer } from "@/components/quiz/player-shell-utils";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

/** Review/retry text sits on a light surface, never straight on the page: the contrast tone makes the page dark. */
export const reviewPaperSx = { bgcolor: tk.color.surface, border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, px: 2, py: 1 };

type ReviewSummaryHeaderProps = {
  scoreOutOf10: string;
  correct: number;
  total: number;
  /** Null when the attempt has no start/submit time: the line is hidden. */
  elapsedSeconds: number | null;
  onBack: () => void;
};

export function ReviewSummaryHeader({ scoreOutOf10, correct, total, elapsedSeconds, onBack }: ReviewSummaryHeaderProps) {
  return (
    <Box component="header" sx={{ ...reviewPaperSx, alignItems: "center", display: "flex", flexWrap: "wrap", gap: { xs: 1, sm: 2 } }}>
      <Button variant="text" startIcon={<ArrowBackIcon />} onClick={onBack}>Về kết quả</Button>
      <Typography component="h1" variant="h6" sx={{ flex: "1 1 auto" }}>Xem lại bài làm</Typography>
      <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Typography color="primary" variant="h6">{`${scoreOutOf10}/10`}</Typography>
        <Typography variant="body2">{`${correct}/${total} câu đúng`}</Typography>
        {elapsedSeconds !== null ? (
          <Typography color="text.secondary" variant="body2">{`Thời gian làm ${formatTimer(elapsedSeconds)}`}</Typography>
        ) : null}
      </Box>
    </Box>
  );
}

/** WL5 top of the review column: score · correct · time, split by hairlines. A missing time drops its cell. */
export function ReviewScoreStrip({ scoreOutOf10, correct, total, elapsedSeconds }: Omit<ReviewSummaryHeaderProps, "onBack">) {
  const cells = [
    { value: scoreOutOf10, label: "điểm / 10", color: tk.color.success },
    { value: `${correct}/${total}`, label: "câu đúng", color: tk.color.text },
    ...(elapsedSeconds === null ? [] : [{ value: formatTimer(elapsedSeconds), label: "thời gian", color: tk.color.text }]),
  ];
  return (
    <Box component="dl" sx={{ borderBottom: "1px solid", borderColor: tk.color.divider, display: "grid", gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`, m: 0, mb: 0.5, mt: -0.5, pb: 1.5, textAlign: "center" }}>
      {cells.map((cell, i) => (
        <Box key={cell.label} sx={{ borderLeft: i ? "1px solid" : 0, borderColor: tk.color.divider, display: "flex", flexDirection: "column-reverse" }}>
          <Typography component="dt" sx={{ color: tk.color.textMuted }} variant="caption">{cell.label}</Typography>
          <Typography component="dd" sx={{ color: cell.color, fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold", m: 0 }} variant="h2">{cell.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
