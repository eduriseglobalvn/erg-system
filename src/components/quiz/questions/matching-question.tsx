import Box from "@mui/material/Box";

import { dropPiece, readBoard } from "@/components/quiz/questions/matching-question/matching-board";
import { MatchingMobile } from "@/components/quiz/questions/matching-question/matching-mobile";
import { MatchingPuzzle, type PuzzleRow } from "@/components/quiz/questions/matching-question/matching-puzzle";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { getMatchingKey } from "@/domain/quiz/quiz";
import type { QuestionImage } from "@/domain/quiz/types";
import { useIsMobile } from "@/hooks/use-mobile";

const VERDICT = {
  correct: { text: "✓ Đúng", color: "success.main" },
  wrong: { text: "✕ Sai", color: "error.main" },
  missing: { text: "Chưa ghép", color: "warning.main" },
} as const;

const side = (text: string, image?: QuestionImage) => (
  <>
    {image?.url ? <img src={image.url} alt={image.alt ?? text} /> : null}
    <span>{text}</span>
  </>
);

/** Learners match on the shared puzzle by swapping right pieces between rows (spec 7.1); phones keep the select UI. */
export function MatchingQuestion({ question, value, submitted = false, reviewMode = false, result, onChange }: QuestionComponentProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <MatchingMobile question={question} value={value} submitted={submitted} reviewMode={reviewMode} onChange={onChange} />;

  const board = readBoard(question, value);
  const pairs = question.matching ?? [];
  const key = getMatchingKey(question);
  // Old shape: each pair is also the response with the same id.
  const responses = question.matchingResponses ?? pairs.map((pair) => ({ id: pair.id, response: pair.response ?? "", responseImage: pair.responseImage }));

  const rows: PuzzleRow[] = pairs.map((pair, index) => {
    const pieceId = board.order[index] || null;
    const response = responses.find((item) => item.id === pieceId);
    const connected = board.connected.includes(pair.id);
    const correctId = reviewMode ? key?.[pair.id] || result?.correctMatchingOrder?.[index] || "" : "";
    const state = !correctId ? undefined : !connected ? "missing" : board.order[index] === correctId ? "correct" : "wrong";
    return {
      id: pair.id,
      pieceId,
      connected,
      left: side(pair.prompt, pair.promptImage),
      right: response ? side(response.response, response.responseImage) : null,
      rightName: response?.response || "ảnh",
      state,
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
