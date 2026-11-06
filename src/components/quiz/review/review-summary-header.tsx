import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { formatTimer } from "@/components/quiz/player-shell-utils";

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
    <Box component="header" sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: { xs: 1, sm: 2 } }}>
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
