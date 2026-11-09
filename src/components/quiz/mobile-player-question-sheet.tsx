import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { QuestionListPanel } from "@/components/quiz/question-list-panel";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

// Opening the sheet lands on the question being worked on.
function centerCurrentCell(node: HTMLElement | null) {
  node?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: "center" });
}

/** Header pill "Câu n/N" plus the bottom sheet (L04) that lists every question. */
export function MobileQuestionSheet({
  cells,
  open: openProp,
  onOpenChange,
  onJumpToQuestion,
  onRequestSubmit,
}: {
  cells: QuestionCell[];
  /** Controlled by the shell so the dock's "n/N đã làm" button opens the same sheet. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onJumpToQuestion: (index: number) => void;
  /** Omitted when the player offers no whole-quiz submit (practice mode). */
  onRequestSubmit?: () => void;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;
  const current = cells.find((cell) => cell.state === "current")?.index ?? 0;
  const answered = cells.filter((cell) => cell.answered || cell.state === "done").length;
  const flagged = cells.filter((cell) => cell.flagged).length;
  const close = () => setOpen(false);

  return (
    <>
      <Button
        endIcon={<ExpandLessRoundedIcon />}
        size="small"
        sx={{
          bgcolor: tk.color.primarySofter,
          borderRadius: `${tk.radius.chip}px`,
          color: `var(--quiz-accent, ${tk.color.primary})`,
          fontVariantNumeric: "tabular-nums",
          fontWeight: "fontWeightBold",
          minHeight: 32,
          pl: 1.75,
          pr: 1.25,
          py: 0,
          "& .MuiButton-endIcon": { ml: 0.25 },
          "&:hover": { bgcolor: tk.color.primarySoft },
        }}
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
              bgcolor: tk.color.surfaceSubtle,
              borderTopLeftRadius: `${tk.radius.shell}px`,
              borderTopRightRadius: `${tk.radius.shell}px`,
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
            },
          },
        }}
      >
        <Box sx={{ bgcolor: tk.color.surface, borderBottom: `1px solid ${tk.color.divider}`, flexShrink: 0 }}>
          <Box aria-hidden sx={{ bgcolor: tk.color.borderStrong, borderRadius: 0.5, height: 5, mx: "auto", mt: 1, width: 40 }} />
          <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, pb: 1.5, pl: 2, pr: 1, pt: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h2" sx={{ color: tk.color.text }} variant="h4">Danh sách câu hỏi</Typography>
              <Typography sx={{ color: tk.color.textMuted }} variant="caption">
                {`${answered}/${cells.length} đã làm${flagged ? ` · ${flagged} câu đã đánh dấu` : ""}`}
              </Typography>
            </Box>
            <IconButton aria-label="Đóng" sx={{ border: `1px solid ${tk.color.border}`, height: 44, width: 44 }} onClick={close}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>
        <Box ref={centerCurrentCell} sx={{ display: "flex", flex: "1 1 auto", flexDirection: "column", gap: 1.75, minHeight: 0, overflowY: "auto", p: 2 }}>
          <Box aria-hidden sx={{ bgcolor: tk.color.divider, borderRadius: `${tk.radius.chip}px`, flexShrink: 0, height: 6, overflow: "hidden" }}>
            <Box sx={{ bgcolor: `var(--quiz-accent, ${tk.color.primary})`, borderRadius: `${tk.radius.chip}px`, height: "100%", width: `${(answered / Math.max(cells.length, 1)) * 100}%` }} />
          </Box>
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
        <Box sx={{ bgcolor: tk.color.surface, borderTop: `1px solid ${tk.color.border}`, display: "flex", flexShrink: 0, gap: 1, pb: "calc(env(safe-area-inset-bottom, 0px) + 12px)", pt: 1.25, px: 1.5 }}>
          <Button fullWidth size="large" sx={{ borderColor: tk.color.borderStrong, color: tk.color.text }} type="button" variant="outlined" onClick={close}>Làm tiếp</Button>
          {onRequestSubmit ? (
            <Button
              fullWidth
              size="large"
              startIcon={<SendRoundedIcon />}
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
