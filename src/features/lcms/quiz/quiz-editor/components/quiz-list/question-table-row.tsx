import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { questionTypeLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-catalog";
import type { QuestionReadiness } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-readiness";
import { questionTitleText, readinessLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-readiness";
import type { TopicRow } from "@/features/lcms/quiz/quiz-editor/model/topic-rail";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { isQuestionType, type QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** One question of the list. `groupId` is set for the open quiz; in "Tất cả" the row carries its own topic instead. */
export type QuestionListRow = {
  slide: QuizEditorSlide;
  number: number;
  groupId: string | null;
  topic: TopicRow | null;
  onServer: boolean;
};

type TopicOption = { id: string; label: string };

/** "Chưa có chủ đề ▾" on a "Tất cả" question without a topic: picking one moves the question there. */
function TopicPicker({ number, topics, onPick }: { number: number; topics: readonly TopicOption[]; onPick: (topic: TopicOption) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        aria-haspopup="menu"
        aria-label={`Chọn chủ đề cho câu ${number}`}
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        size="small"
        sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
        variant="text"
      >
        Chưa có chủ đề
      </Button>
      <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)}>
        {topics.map((topic) => (
          <MenuItem
            key={topic.id}
            onClick={() => {
              setAnchor(null);
              onPick(topic);
            }}
          >
            {topic.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function QuestionTableRow({ row, readiness, showTopic, onOpen, selected, onToggleSelect, highlighted, topics = [], onAssignTopic, packages }: {
  row: QuestionListRow;
  readiness: QuestionReadiness;
  showTopic: boolean;
  onOpen: () => void;
  /** Set where rows can be checked: renders the selection checkbox. */
  selected?: boolean;
  onToggleSelect?: () => void;
  highlighted?: boolean;
  topics?: readonly TopicOption[];
  /** Set for a "Tất cả" question with no topic yet: renders the topic picker. */
  onAssignTopic?: (topic: TopicOption) => void;
  /** "Đã dùng": how many packages hold the question; the column is left out when undefined. */
  packages?: number;
}) {
  const { slide } = row;
  const cloud = row.onServer ? "Đã lên máy chủ" : "Chưa lên máy chủ";
  return (
    <TableRow
      aria-label={`Mở câu ${row.number}: ${questionTitleText(slide.title)}`}
      hover
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      sx={{
        cursor: "pointer",
        ...(highlighted ? { bgcolor: tokens.color.primarySofter } : {}),
        "&:focus-visible": { boxShadow: tokens.shadow.focus },
      }}
      tabIndex={0}
    >
      {onToggleSelect ? (
        <TableCell onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} padding="checkbox">
          <Checkbox checked={selected} onChange={onToggleSelect} slotProps={{ input: { "aria-label": `Chọn câu ${row.number}` } }} />
        </TableCell>
      ) : null}
      <TableCell sx={{ color: "text.secondary", width: 48 }}>{row.number}</TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: "fontWeightMedium" }} variant="body2">
          {questionTitleText(slide.title)}
        </Typography>
      </TableCell>
      {showTopic ? (
        <TableCell onClick={onAssignTopic ? (event) => event.stopPropagation() : undefined} onKeyDown={onAssignTopic ? (event) => event.stopPropagation() : undefined}>
          {onAssignTopic ? <TopicPicker number={row.number} onPick={onAssignTopic} topics={topics} /> : row.topic?.label}
        </TableCell>
      ) : null}
      <TableCell>{isQuestionType(slide.kind) ? questionTypeLabel(slide.kind) : null}</TableCell>
      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <Box component="span" sx={{ bgcolor: readiness.ready ? "success.main" : "error.main", borderRadius: "50%", flexShrink: 0, height: 8, width: 8 }} />
          <Typography component="span" variant="body2">{readinessLabel(readiness)}</Typography>
        </Box>
      </TableCell>
      {packages === undefined ? null : (
        <TableCell sx={{ color: packages ? "text.primary" : "text.secondary", whiteSpace: "nowrap" }}>{packages ? `${packages} gói` : "—"}</TableCell>
      )}
      <TableCell sx={{ width: 72 }}>
        {row.onServer ? (
          <CloudDoneOutlinedIcon sx={{ color: "success.main" }} titleAccess={cloud} />
        ) : (
          <CloudOffOutlinedIcon sx={{ color: "text.secondary" }} titleAccess={cloud} />
        )}
      </TableCell>
    </TableRow>
  );
}
