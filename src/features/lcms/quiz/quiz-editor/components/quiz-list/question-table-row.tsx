import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import Box from "@mui/material/Box";
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

export function QuestionTableRow({ row, readiness, showTopic, onOpen }: {
  row: QuestionListRow;
  readiness: QuestionReadiness;
  showTopic: boolean;
  onOpen: () => void;
}) {
  const { slide } = row;
  const cloud = row.onServer ? "Đã lên máy chủ" : "Chưa lên máy chủ";
  return (
    <TableRow
      hover
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      sx={{ cursor: "pointer", "&:focus-visible": { boxShadow: tokens.shadow.focus } }}
      tabIndex={0}
    >
      <TableCell sx={{ color: "text.secondary", width: 48 }}>{row.number}</TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: "fontWeightMedium" }} variant="body2">
          {questionTitleText(slide.title)}
        </Typography>
      </TableCell>
      {showTopic ? <TableCell>{row.topic?.label}</TableCell> : null}
      <TableCell>{isQuestionType(slide.kind) ? questionTypeLabel(slide.kind) : null}</TableCell>
      <TableCell>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <Box component="span" sx={{ bgcolor: readiness.ready ? "success.main" : "error.main", borderRadius: "50%", flexShrink: 0, height: 8, width: 8 }} />
          <Typography component="span" variant="body2">{readinessLabel(readiness)}</Typography>
        </Box>
      </TableCell>
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
