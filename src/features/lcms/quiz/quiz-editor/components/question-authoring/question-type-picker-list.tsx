import type { ElementType } from "react";
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
import ShortTextIcon from "@mui/icons-material/ShortText";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  QUESTION_TYPE_GROUPS,
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

export const questionTypeOptionId = (type: QuestionType) => `question-type-option-${type}`;

/** The grouped listbox of question types; the dialog owns selection and creation. */
export function QuestionTypeList({ entries, active, onSelect, onCreate }: {
  entries: QuestionTypeEntry[];
  active: QuestionTypeEntry | undefined;
  onSelect: (type: QuestionType) => void;
  onCreate: (type: QuestionType) => void;
}) {
  return (
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
                onSelect={() => onSelect(entry.type)}
                onCreate={() => onCreate(entry.type)}
              />
            ))}
          </Box>
        );
      })}
    </Box>
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
      id={questionTypeOptionId(entry.type)}
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
