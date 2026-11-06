import type { KeyboardEvent } from "react";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import {
  filterQuestionTypes,
  questionTypeLabel,
} from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import {
  QuestionTypeList,
  questionTypeOptionId,
} from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-picker-list";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const DEFAULT_TYPE: QuestionType = "multiple-choice";

type Props = {
  open: boolean;
  title: string;
  onPick: (type: QuestionType) => void;
  onClose: () => void;
  /** Footer button text for the active type; defaults to "Tạo câu {type}". */
  confirmLabel?: (typeLabel: string) => string;
  description?: string;
};

export function QuestionTypePickerDialog({
  open, title, onPick, onClose, confirmLabel = (label) => `Tạo câu ${label}`,
  description = "Câu chỉ được tạo khi đã chọn dạng. Hủy thì không để lại gì.",
}: Props) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<QuestionType>(DEFAULT_TYPE);

  const [picked, setPicked] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  // Reset when the dialog opens, not when it closes, so nothing changes while it fades out.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActiveType(DEFAULT_TYPE);
      setPicked(false);
    }
  }
  // At most one creation per opening: a double click or held Enter must not add two questions.
  function pick(type: QuestionType) {
    if (!open || picked) return;
    setPicked(true);
    onPick(type);
  }

  const entries = filterQuestionTypes(query);
  // The remembered type may be filtered out; the first match then stands in as active.
  const active = entries.find((entry) => entry.type === activeType) ?? entries[0];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && active && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      pick(active.type);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && entries.length > 0) {
      event.preventDefault();
      const index = active ? entries.indexOf(active) : 0;
      const next = (index + (event.key === "ArrowDown" ? 1 : -1) + entries.length) % entries.length;
      setActiveType(entries[next]!.type);
    }
  }

  return (
    <ErgDialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title={title}
      description={description}
      actions={
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mr: "auto" }}>
            {entries.length} dạng
          </Typography>
          <Button variant="text" onClick={onClose}>
            Hủy
          </Button>
          <ErgButton variant="contained" disabled={!active} onClick={() => active && pick(active.type)}>
            {active ? confirmLabel(questionTypeLabel(active.type)) : "Tạo câu"}
          </ErgButton>
        </>
      }
    >
      <Box onKeyDown={handleKeyDown}>
        <ErgTextField
          autoFocus
          compact
          placeholder="Gõ để lọc dạng câu hỏi…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            htmlInput: {
              "aria-label": "Lọc dạng câu hỏi",
              "aria-activedescendant": active ? questionTypeOptionId(active.type) : undefined,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.5 }}
        />
        {entries.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Không có dạng nào khớp
          </Typography>
        ) : (
          <QuestionTypeList entries={entries} active={active} onSelect={setActiveType} onCreate={pick} />
        )}
      </Box>
    </ErgDialog>
  );
}
