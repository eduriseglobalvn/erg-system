import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState, type ComponentProps, type Ref } from "react";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { questionGridLayout, type GridSurface } from "@/components/quiz/question-grid-layout";
import { applyFilter, filterOptions, parseGoTo, type QuestionListFilter, type QuestionListMode } from "@/components/quiz/question-list-filters";
import { QuestionNavigator, type QuestionCell } from "@/components/quiz/question-navigator";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

// Segmented filter (".seg"): grey track, the chosen tab is a white raised pill.
const segSx = {
  bgcolor: tk.color.divider,
  borderRadius: `${tk.radius.control}px`,
  gap: "2px",
  p: "3px",
  "& .MuiToggleButtonGroup-grouped": {
    border: 0,
    borderRadius: `${tk.radius.sm}px !important`,
    color: tk.color.textSecondary,
    flex: "1 1 auto",
    fontWeight: "fontWeightMedium",
    height: 36,
    m: 0,
    px: 0.75,
    textTransform: "none",
    typography: "caption",
    whiteSpace: "nowrap",
    "&.Mui-selected, &.Mui-selected:hover": { bgcolor: tk.color.surface, boxShadow: tk.shadow.xs, color: tk.color.text },
  },
} as const;

type QuestionListPanelProps = {
  mode: QuestionListMode;
  cells: QuestionCell[];
  surface: GridSurface;
  onSelect: (index: number) => void;
  goToInputRef?: Ref<HTMLInputElement>;
  gridMaxHeight?: ComponentProps<typeof QuestionNavigator>["gridMaxHeight"];
};

export function QuestionListPanel({ mode, cells, surface, onSelect, goToInputRef, gridMaxHeight }: QuestionListPanelProps) {
  const [filter, setFilter] = useState<QuestionListFilter>("all");
  const [goTo, setGoTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const options = filterOptions(mode, cells);
  // A filter that has emptied out (e.g. the last unanswered question was answered) falls back to "all".
  const active = options.find((o) => o.id === filter && o.count > 0)?.id ?? "all";
  // Reset the stale choice too, otherwise it revives when the filter becomes non-empty again.
  if (active !== filter) setFilter(active);

  const submitGoTo = () => {
    const result = parseGoTo(goTo, cells.length);
    if ("error" in result) return setError(result.error);
    setError(null);
    setGoTo("");
    onSelect(result.index);
  };

  return (
    <Box component="nav" aria-label="Danh sách câu hỏi" sx={{ display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <ToggleButtonGroup
        aria-label="Lọc câu hỏi"
        exclusive
        fullWidth
        onChange={(_, next: QuestionListFilter | null) => next && setFilter(next)}
        size="small"
        sx={segSx}
        value={active}
      >
        {options.map((o) => (
          // One line even with 4 chips in the 340px column: content-sized, tight padding, caption type.
          <ToggleButton key={o.id} value={o.id}>
            {`${o.label} · ${o.count}`}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {questionGridLayout(cells.length, surface).showGoTo ? (
        <ErgTextField
          compact
          error={error !== null}
          helperText={error}
          inputRef={goToInputRef}
          label="Đi tới câu"
          onChange={(e) => {
            setGoTo(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submitGoTo();
            }
          }}
          size="small"
          slotProps={{ formHelperText: { role: "alert" }, htmlInput: { inputMode: "numeric" } }}
          value={goTo}
        />
      ) : null}

      <QuestionNavigator ariaLabel="Lưới câu hỏi" cells={applyFilter(cells, active)} gridMaxHeight={gridMaxHeight} legend="auto" onSelect={onSelect} surface={surface} />
    </Box>
  );
}
