import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useEffect, useRef } from "react";

import { questionGridLayout, type GridSurface } from "@/components/quiz/question-grid-layout";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type QuestionCellState = "done" | "current" | "todo" | "correct" | "wrong" | "skipped";
export type QuestionCell = { index: number; state: QuestionCellState; flagged: boolean; hidden?: boolean; answered?: boolean };

const STATE_ORDER: QuestionCellState[] = ["done", "current", "todo", "correct", "wrong", "skipped"];
const STATE_LABEL: Record<QuestionCellState, string> = {
  done: "đã làm",
  current: "đang làm",
  todo: "chưa làm",
  correct: "đúng",
  wrong: "sai",
  skipped: "bỏ trống",
};

const BORDER = "1.5px solid";
const stateSx: Record<QuestionCellState, object> = {
  done: { bgcolor: tk.color.primary, borderColor: tk.color.primary, color: "common.white" },
  current: { bgcolor: tk.color.surface, borderColor: tk.color.primary, color: tk.color.primary },
  todo: { bgcolor: tk.color.surface, borderColor: tk.color.borderStrong, color: tk.color.textSecondary },
  correct: { bgcolor: tk.color.success, borderColor: tk.color.success, color: "common.white" },
  wrong: { bgcolor: tk.color.danger, borderColor: tk.color.danger, color: "common.white" },
  skipped: { bgcolor: tk.color.surface, borderColor: tk.color.borderStrong, borderStyle: "dashed", color: tk.color.textSecondary },
};

const cellLabel = ({ index, state, flagged }: QuestionCell) =>
  `Câu ${index + 1}, ${STATE_LABEL[state]}${flagged ? ", đã đánh dấu" : ""}`;
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type QuestionNavigatorProps = {
  cells: QuestionCell[];
  surface: GridSurface;
  onSelect: (index: number) => void;
  legend: QuestionCellState[] | "auto";
  ariaLabel?: string;
  /** Cap on the scrolling grid; pass "none" when a parent (the phone sheet) already bounds the height. */
  gridMaxHeight?: number | "none";
};

export function QuestionNavigator({ cells, surface, onSelect, legend, ariaLabel = "Danh sách câu hỏi", gridMaxHeight = 320 }: QuestionNavigatorProps) {
  const layout = questionGridLayout(cells.length, surface);
  const visible = cells.filter((cell) => !cell.hidden);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIndex = cells.find((cell) => cell.state === "current")?.index;

  // Opening the list lands on the question being worked on.
  useEffect(() => {
    const box = scrollRef.current;
    const current = box?.querySelector<HTMLElement>('[aria-current="true"]');
    if (box && current && layout.scroll) box.scrollTop = Math.max(0, current.offsetTop - box.clientHeight / 2);
  }, [currentIndex, layout.scroll]);

  // From all cells, not just visible ones, so the legend doesn't jump while filtering.
  const legendStates = legend === "auto" ? STATE_ORDER.filter((state) => cells.some((cell) => cell.state === state)) : legend;
  const showFlagLegend = cells.some((cell) => cell.flagged);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Box
        ref={scrollRef}
        role="group"
        aria-label={ariaLabel}
        sx={{ maxHeight: layout.scroll ? gridMaxHeight : undefined, minHeight: 0, overflowY: layout.scroll ? "auto" : "visible", p: 0.5, position: "relative" }}
      >
        <Box sx={{ display: "grid", gap: `${layout.gap}px`, gridTemplateColumns: `repeat(${layout.columns}, minmax(0, ${layout.cell}px))`, justifyContent: "center" }}>
          {visible.map((cell) => (
            <ButtonBase
              key={cell.index}
              type="button"
              aria-label={cellLabel(cell)}
              aria-current={cell.state === "current" ? "true" : undefined}
              onClick={() => onSelect(cell.index)}
              sx={{
                border: BORDER,
                ...stateSx[cell.state],
                borderRadius: `${tk.radius.control}px`,
                aspectRatio: "1 / 1",
                position: "relative",
                typography: layout.fontSize === "caption" ? "caption" : "body2",
                width: "100%",
                "&::after": cell.flagged ? flagDotSx : undefined,
                "&:focus-visible": { outline: `2px solid ${tk.color.primary}`, outlineOffset: 2 },
              }}
            >
              {cell.index + 1}
            </ButtonBase>
          ))}
        </Box>
      </Box>

      <Box component="ul" aria-label="Chú thích" sx={{ color: tk.color.textMuted, display: "flex", flexWrap: "wrap", gap: 1.5, listStyle: "none", m: 0, p: 0, typography: "caption" }}>
        {legendStates.map((state) => (
          <Box component="li" key={state} sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
            <Box component="span" aria-hidden sx={{ border: BORDER, ...stateSx[state], borderRadius: "4px", height: 12, width: 12 }} />
            {sentence(STATE_LABEL[state])}
          </Box>
        ))}
        {showFlagLegend ? (
          <Box component="li" sx={{ alignItems: "center", display: "inline-flex", gap: 0.75 }}>
            <Box component="span" aria-hidden sx={{ bgcolor: tk.color.warning, borderRadius: "50%", height: 10, width: 10 }} />
            Đánh dấu
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

const flagDotSx = {
  bgcolor: tk.color.warning,
  border: `2px solid ${tk.color.surface}`,
  borderRadius: "50%",
  boxSizing: "border-box",
  content: '""',
  height: 10,
  position: "absolute",
  right: -5,
  top: -5,
  width: 10,
} as const;
