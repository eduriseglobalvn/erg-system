import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";

/** Floats at the bottom of A1 while questions are selected; holds the page's only contained button then. */
export function QuestionSelectionBar({
  copy,
  count,
  onAutoPick,
  onClear,
  onCreateQuiz,
}: {
  copy: QuestionBankCopy;
  count: number;
  onAutoPick: () => void;
  onClear: () => void;
  onCreateQuiz: () => void;
}) {
  return (
    <Box
      role="region"
      aria-label={copy.selectionSummary(count)}
      sx={{
        alignItems: "center",
        bgcolor: t.color.surface,
        border: `1px solid ${t.color.border}`,
        borderRadius: `${t.radius.card}px`,
        bottom: 16,
        boxShadow: t.shadow.float,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mx: "auto",
        px: 2,
        py: 1.25,
        position: "sticky",
        width: "fit-content",
        maxWidth: "100%",
        zIndex: 5,
      }}
    >
      <Typography variant="subtitle1" component="p" aria-live="polite" sx={{ mr: 0.5 }}>
        {copy.selectionSummary(count)}
      </Typography>
      <Button variant="text" onClick={onClear}>
        {copy.clearSelection}
      </Button>
      <Button variant="outlined" onClick={onAutoPick}>
        {copy.autoPickOpen}
      </Button>
      <ErgButton onClick={onCreateQuiz}>{copy.createQuizFromSelection(count)}</ErgButton>
    </Box>
  );
}
