import Box from "@mui/material/Box";
import type { ReactNode, Ref } from "react";

import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

/** Web right column: the question list card; `children` (Nộp bài) sits at its foot. */
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
  return (
    <Box
      component="aside"
      sx={{
        bgcolor: tk.color.surface,
        border: `1px solid ${tk.color.border}`,
        borderRadius: `${tk.radius.card}px`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 0,
        minWidth: 0,
        overflowY: "auto",
        p: 2,
      }}
    >
      <QuestionListPanel cells={cells} goToInputRef={goToInputRef} mode="taking" onSelect={onSelect} surface="web" />
      {children ? <Box sx={{ mt: "auto" }}>{children}</Box> : null}
    </Box>
  );
}
