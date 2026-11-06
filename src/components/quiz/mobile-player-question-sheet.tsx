import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

// Opening the sheet lands on the question being worked on.
function centerCurrentCell(node: HTMLElement | null) {
  node?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: "center" });
}

/** Header trigger "Câu n/N" plus the bottom sheet that lists every question. */
export function MobileQuestionSheet({
  cells,
  onJumpToQuestion,
  onRequestSubmit,
}: {
  cells: QuestionCell[];
  onJumpToQuestion: (index: number) => void;
  /** Omitted when the player offers no whole-quiz submit (practice mode). */
  onRequestSubmit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current = cells.find((cell) => cell.state === "current")?.index ?? 0;
  const flagged = cells.filter((cell) => cell.flagged).length;
  const close = () => setOpen(false);

  return (
    <>
      <Button
        endIcon={<ExpandLessRoundedIcon />}
        size="small"
        sx={{ color: tk.color.text }}
        type="button"
        variant="text"
        onClick={() => setOpen(true)}
      >
        {`Câu ${current + 1}/${cells.length}`}
      </Button>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              bgcolor: tk.color.surface,
              borderTopLeftRadius: `${tk.radius.shell}px`,
              borderTopRightRadius: `${tk.radius.shell}px`,
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
            },
          },
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${tk.color.divider}`, flexShrink: 0, px: 2, py: 1.5, textAlign: "center" }}>
          <Typography component="h2" variant="subtitle1">Danh sách câu hỏi</Typography>
          <Typography sx={{ color: tk.color.textMuted }} variant="caption">{flagged} câu đã đánh dấu</Typography>
        </Box>
        <Box ref={centerCurrentCell} sx={{ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: 0, p: 2 }}>
          <QuestionListPanel
            cells={cells}
            gridMaxHeight="none"
            mode="taking"
            surface="phone"
            onSelect={(index) => {
              onJumpToQuestion(index);
              close();
            }}
          />
        </Box>
        <Box sx={{ borderTop: `1px solid ${tk.color.divider}`, display: "flex", flexShrink: 0, gap: 1.5, p: 2 }}>
          <Button fullWidth type="button" variant="outlined" onClick={close}>Làm tiếp</Button>
          {onRequestSubmit ? (
            <Button
              fullWidth
              type="button"
              variant="contained"
              onClick={() => {
                close();
                onRequestSubmit();
              }}
            >
              Nộp bài
            </Button>
          ) : null}
        </Box>
      </Drawer>
    </>
  );
}

