import Box from "@mui/material/Box";

import { dropPiece, readBoard } from "@/components/quiz/questions/matching-question/matching-board";
import { pieceName } from "@/components/quiz/questions/matching-question/matching-helpers";
import { MatchingPuzzle, type PuzzleRow } from "@/components/quiz/questions/matching-question/matching-puzzle";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { getMatchingKey } from "@/domain/quiz/quiz";
import type { QuestionImage } from "@/domain/quiz/types";

const VERDICT = {
  correct: { text: "✓ Đúng", color: "success.main" },
  wrong: { text: "✕ Sai", color: "error.main" },
  missing: { text: "Chưa ghép", color: "warning.main" },
} as const;

// An image or icon next to text is decorative; alone it names the piece. Old icons stand in when there is no image.
const side = (text: string, image?: QuestionImage, icon?: string) => (
  <>
    {image?.url ? (
      <img src={image.url} alt={image.alt || (text ? "" : pieceName(text, image, icon))} />
    ) : icon ? (
      text ? <span aria-hidden>{icon}</span> : <span role="img" aria-label={icon}>{icon}</span>
    ) : null}
    <span>{text}</span>
  </>
);

/** Learners match on the shared puzzle by swapping right pieces between rows (spec 7.1), on phones too. */
export function MatchingQuestion({ question, value, submitted = false, reviewMode = false, result, onChange }: QuestionComponentProps) {
  const board = readBoard(question, value);
  const pairs = question.matching ?? [];
  const key = getMatchingKey(question);
  // Old shape: each pair is also the response with the same id.
  const responses = question.matchingResponses ?? pairs.map((pair) => ({ id: pair.id, response: pair.response ?? "", responseIcon: pair.responseIcon, responseImage: pair.responseImage }));

  const correctFor = (index: number) => (reviewMode ? key?.[pairs[index].id] || result?.correctMatchingOrder?.[index] || "" : "");

  const rows: PuzzleRow[] = pairs.map((pair, index) => {
    const pieceId = board.order[index] || null;
    const response = responses.find((item) => item.id === pieceId);
    const connected = board.connected.includes(pair.id);
    const correctId = correctFor(index);
    const state = !correctId ? undefined : !connected ? "missing" : board.order[index] === correctId ? "correct" : "wrong";
    // The left row this piece belongs to (1-based, like the row numbers), so a wrong row shows where its piece goes.
    const home = state && pieceId ? pairs.findIndex((_, row) => correctFor(row) === pieceId) : -1;
    return {
      id: pair.id,
      pieceId,
      connected,
      left: side(pair.prompt, pair.promptImage, pair.promptIcon),
      right: response ? side(response.response, response.responseImage, response.responseIcon) : null,
      rightName: pieceName(response?.response, response?.responseImage, response?.responseIcon),
      state,
      answerNo: home >= 0 ? home + 1 : undefined,
      trailing: state ? <Box sx={{ typography: "caption", fontWeight: "fontWeightBold", color: VERDICT[state].color }}>{VERDICT[state].text}</Box> : undefined,
    };
  });

  return (
    <QuestionBodyWithImage question={question}>
      <MatchingPuzzle
        mode="learner"
        locked={submitted}
        rows={rows}
        onDrop={(from, to) => {
          const next = dropPiece(board, pairs.map((pair) => pair.id), from, to);
          onChange({ matchingOrder: next.order, matchingConnectedRows: next.connected });
        }}
      />
    </QuestionBodyWithImage>
  );
}
