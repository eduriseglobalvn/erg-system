import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState, type Ref } from "react";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { questionGridLayout, type GridSurface } from "@/components/quiz/question-grid-layout";
import { applyFilter, filterOptions, parseGoTo, type QuestionListFilter, type QuestionListMode } from "@/components/quiz/question-list-filters";
import { QuestionNavigator, type QuestionCell } from "@/components/quiz/question-navigator";

type QuestionListPanelProps = {
  mode: QuestionListMode;
  cells: QuestionCell[];
  surface: GridSurface;
  onSelect: (index: number) => void;
  goToInputRef?: Ref<HTMLInputElement>;
};

export function QuestionListPanel({ mode, cells, surface, onSelect, goToInputRef }: QuestionListPanelProps) {
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
        value={active}
      >
        {options.map((o) => (
          <ToggleButton key={o.id} value={o.id} sx={{ textTransform: "none" }}>
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

      <QuestionNavigator ariaLabel="Lưới câu hỏi" cells={applyFilter(cells, active)} legend="auto" onSelect={onSelect} surface={surface} />
    </Box>
  );
}
