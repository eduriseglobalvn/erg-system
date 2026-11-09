import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode, Ref } from "react";

import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { quizAccent, webCardSx, webSideSx } from "@/components/quiz/player-web-frame";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

/** WL2 right column: "Danh sách câu hỏi" card with progress, filter, grid; `children` (Nộp bài) sits at its foot. */
export function PlayerQuestionAside({
  cells,
  children,
  goToInputRef,
  onSelect,
}: {
  cells: QuestionCell[];
  children?: ReactNode;
  goToInputRef?: Ref<HTMLInputElement>;
  onSelect: (index: number) => void;
}) {
  const answered = cells.filter((cell) => cell.answered).length;
  const total = cells.length;
  return (
    <Box component="aside" sx={webSideSx}>
      <Box sx={{ ...webCardSx, display: "flex", flex: 1, flexDirection: "column", gap: 1.5, minHeight: 0, overflowY: "auto" }}>
        <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, justifyContent: "space-between" }}>
          <Typography component="h2" sx={{ color: tk.color.text }} variant="subtitle2">Danh sách câu hỏi</Typography>
          <Typography sx={{ color: tk.color.textMuted, fontVariantNumeric: "tabular-nums" }} variant="caption">{`${answered}/${total} đã làm`}</Typography>
        </Box>
        <Box aria-hidden sx={{ bgcolor: tk.color.divider, borderRadius: `${tk.radius.chip}px`, height: 6, overflow: "hidden" }}>
          <Box sx={{ bgcolor: quizAccent, borderRadius: "inherit", height: "100%", width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
        </Box>
        <QuestionListPanel cells={cells} goToInputRef={goToInputRef} mode="taking" onSelect={onSelect} surface="web" />
        {children ? <Box sx={{ mt: "auto" }}>{children}</Box> : null}
      </Box>
    </Box>
  );
}
