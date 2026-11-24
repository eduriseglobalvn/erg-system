import type { KeyboardEvent } from "react";
import { useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { filterQuestionTypes, questionTypeLabel } from "./question-type-catalog";
import { QuestionTypeList, questionTypeOptionId } from "./question-type-picker-list";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** "Dạng ▾" in the editor titlebar: one click on a type changes the question to it. */
export function QuestionTypeMenu({ value, onChange }: { value: QuestionType; onChange: (type: QuestionType) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<QuestionType>(value);
  const entries = filterQuestionTypes(query);
  const active = entries.find((entry) => entry.type === activeType) ?? entries[0];

  function open(target: HTMLElement) {
    setQuery("");
    setActiveType(value);
    setAnchor(target);
  }
  function pick(type: QuestionType) {
    setAnchor(null);
    if (type !== value) onChange(type);
  }
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && active && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      pick(active.type);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && entries.length > 0) {
      event.preventDefault();
      const index = active ? entries.indexOf(active) : 0;
      setActiveType(entries[(index + (event.key === "ArrowDown" ? 1 : -1) + entries.length) % entries.length]!.type);
    }
  }

  return (
    <>
      <Button
        aria-expanded={Boolean(anchor)}
        aria-haspopup="dialog"
        aria-label={`Dạng câu hỏi: ${questionTypeLabel(value)}`}
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => open(event.currentTarget)}
        sx={{ color: "text.primary", whiteSpace: "nowrap" }}
        variant="outlined"
      >
        <Typography color="text.secondary" component="span" sx={{ mr: 1 }} variant="caption">Dạng</Typography>
        {questionTypeLabel(value)}
      </Button>
      <Popover
        anchorEl={anchor}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        onClose={() => setAnchor(null)}
        open={Boolean(anchor)}
        slotProps={{ paper: { "aria-label": "Đổi dạng câu hỏi", role: "dialog", sx: { maxWidth: "calc(100vw - 32px)", mt: 1, p: 2, width: 880 } } }}
      >
        <Box onKeyDown={handleKeyDown}>
          <ErgTextField
            autoFocus
            compact
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gõ để lọc dạng câu hỏi…"
            slotProps={{
              htmlInput: { "aria-activedescendant": active ? questionTypeOptionId(active.type) : undefined, "aria-label": "Lọc dạng câu hỏi" },
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            }}
            sx={{ mb: 2 }}
            value={query}
          />
          {entries.length ? (
            <QuestionTypeList active={active} entries={entries} onCreate={pick} onSelect={pick} />
          ) : (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>Không có dạng nào khớp</Typography>
          )}
          <Typography color="text.secondary" sx={{ display: "block", mt: 2 }} variant="caption">
            Đổi dạng giữ đề bài; phần đáp án không dùng được sẽ bỏ đi, có nút Hoàn tác ngay sau khi đổi.
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
