import type { ElementType, KeyboardEvent } from "react";
import { useState } from "react";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import ArrowDropDownCircleOutlinedIcon from "@mui/icons-material/ArrowDropDownCircleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import NotesIcon from "@mui/icons-material/Notes";
import NumbersIcon from "@mui/icons-material/Numbers";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import SearchIcon from "@mui/icons-material/Search";
import ShortTextIcon from "@mui/icons-material/ShortText";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import {
  QUESTION_TYPE_GROUPS,
  filterQuestionTypes,
  questionTypeLabel,
  type QuestionTypeEntry,
} from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const TYPE_ICONS: Record<QuestionType, ElementType> = {
  "multiple-choice": RadioButtonCheckedIcon,
  "multiple-response": CheckBoxOutlinedIcon,
  "true-false": ToggleOnOutlinedIcon,
  "likert-scale": LinearScaleIcon,
  "fill-in-the-blanks": EditNoteIcon,
  "select-from-lists": ArrowDropDownCircleOutlinedIcon,
  "drag-the-words": DragIndicatorIcon,
  "short-answer": ShortTextIcon,
  numeric: NumbersIcon,
  sequence: FormatListNumberedIcon,
  matching: SwapHorizIcon,
  "drag-and-drop": CategoryOutlinedIcon,
  hotspot: AdsClickIcon,
  essay: NotesIcon,
};

const DEFAULT_TYPE: QuestionType = "multiple-choice";
const optionId = (type: QuestionType) => `question-type-option-${type}`;

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
    if (event.key === "Enter" && active && !event.nativeEvent.isComposing) {
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
              "aria-activedescendant": active ? optionId(active.type) : undefined,
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
          <Box
            role="listbox"
            aria-label="Dạng câu hỏi"
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
              alignItems: "start",
            }}
          >
            {QUESTION_TYPE_GROUPS.map((group) => {
              const items = entries.filter((entry) => entry.group === group.id);
              if (items.length === 0) return null;
              return (
                <Box key={group.id} role="group" aria-label={group.label} sx={{ display: "grid", gap: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {group.label}
                  </Typography>
                  {items.map((entry) => (
                    <TypeOption
                      key={entry.type}
                      entry={entry}
                      selected={entry.type === active?.type}
                      onSelect={() => setActiveType(entry.type)}
                      onCreate={() => pick(entry.type)}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </ErgDialog>
  );
}

function TypeOption({
  entry,
  selected,
  onSelect,
  onCreate,
}: {
  entry: QuestionTypeEntry;
  selected: boolean;
  onSelect: () => void;
  onCreate: () => void;
}) {
  const Icon = TYPE_ICONS[entry.type];
  const { color, radius, shadow } = ergEnterpriseTokens;
  return (
    <Box
      id={optionId(entry.type)}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onSelect}
      onDoubleClick={onCreate}
      sx={{
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr)",
        gap: 1.25,
        alignItems: "center",
        p: 1.25,
        cursor: "pointer",
        outline: "none",
        border: "1px solid",
        borderColor: selected ? color.primary : color.border,
        borderRadius: `${radius.control}px`,
        boxShadow: selected ? `0 0 0 3px ${color.primarySofter}` : "none",
        "&:hover": { borderColor: selected ? color.primary : color.borderStrong },
        "&:focus-visible": { boxShadow: shadow.focus },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: "9px",
          bgcolor: color.primarySofter,
          color: color.primary,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ display: "block" }}>
          {entry.label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {entry.description}
        </Typography>
      </Box>
    </Box>
  );
}
