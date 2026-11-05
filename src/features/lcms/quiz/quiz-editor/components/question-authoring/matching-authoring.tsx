import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";

import { MatchingPuzzle, type PuzzleRow } from "@/components/quiz/questions/matching-question/matching-puzzle";
import type { MatchingPair, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { AnswerImage, type ImageChange } from "./answer-image";
import { readPairs, rightOwner, savePairs, swapRight, writePairs } from "./matching-pairs";
import { PieceTextInput } from "./piece-text-input";
import { assessQuestionReadiness } from "./question-readiness";
import { newRowId, usePendingFocus } from "./sortable-rows";

const MIN_PAIRS = 2;
const HINT = "Mỗi hàng là một cặp đúng. Bấm vào chữ để sửa, nút ảnh để gắn ảnh vào mảnh; kéo mảnh phải sang hàng khác để đổi vế phải giữa hai hàng.";

/** Teacher view of the matching puzzle (spec 7.1): every row is a correct pair, the pieces stand apart. */
export function MatchingAuthoring({ question, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const pairs = readPairs(question);
  const { rootRef, focusLater } = usePendingFocus();
  const update = (change: (list: MatchingPair[]) => MatchingPair[]) => onUpdate((latest) => savePairs(latest, change(readPairs(latest))));
  const patch = (id: string, change: Partial<MatchingPair>) => update((list) => list.map((pair) => (pair.id === id ? { ...pair, ...change } : pair)));
  const setImage = (side: "promptImage" | "responseImage", owner: (list: MatchingPair[]) => string) => (change: ImageChange) =>
    update((list) => { const id = owner(list); return list.map((pair) => (pair.id === id ? { ...pair, [side]: change(pair[side]) } : pair)); });
  const unconfirmed = assessQuestionReadiness(question, { hasQuestionImage: false }).issues.find((issue) => issue.code === "pair-key");

  const append = () => {
    const id = newRowId("pair");
    focusLater(`[data-input-id="${id}-left"]`);
    update((list) => [...list, { id, prompt: "", response: "" }]);
  };

  const remove = (index: number) => {
    const neighbour = pairs[index + 1] ?? pairs[index - 1];
    if (neighbour) focusLater(`[data-input-id="${neighbour.id}-left"]`);
    update((list) => list.filter((pair) => pair.id !== pairs[index].id));
  };

  const rows: PuzzleRow[] = pairs.map((pair, index) => {
    const n = index + 1;
    const last = index === pairs.length - 1;
    return {
      id: pair.id,
      pieceId: pair.id,
      connected: false,
      rightName: pair.response || pair.responseImage?.alt || "ảnh",
      left: (
        <>
          <AnswerImage image={pair.promptImage} name={`vế trái hàng ${n}`} onChange={setImage("promptImage", () => pair.id)} />
          <PieceTextInput
            inputId={`${pair.id}-left`}
            label={`Vế trái hàng ${n}`}
            onChange={(prompt) => patch(pair.id, { prompt })}
            placeholder={`Vế trái ${n}`}
            value={pair.prompt}
          />
        </>
      ),
      right: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <AnswerImage image={pair.responseImage} name={`vế phải hàng ${n}`} onChange={setImage("responseImage", (list) => rightOwner(list, pair))} />
          <PieceTextInput
            inputId={`${pair.id}-right`}
            label={`Vế phải hàng ${n}`}
            onChange={(response) => patch(pair.id, { response })}
            onEnter={last ? append : undefined}
            placeholder={`Vế phải ${n}`}
            value={pair.response ?? ""}
          />
        </Box>
      ),
      trailing: (
        <IconButton
          aria-label={`Xoá cặp ${n}`}
          disabled={pairs.length <= MIN_PAIRS}
          onClick={() => remove(index)}
          size="small"
          title={pairs.length <= MIN_PAIRS ? "Cần ít nhất 2 cặp" : undefined}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ),
    };
  });

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>{HINT}</Box>
      {unconfirmed && (
        <Alert
          action={<Button color="inherit" onClick={() => onUpdate((latest) => writePairs(latest, readPairs(latest)))} size="small" variant="text">Các cặp đã đúng</Button>}
          severity="warning"
        >
          {unconfirmed.message}
        </Alert>
      )}
      <MatchingPuzzle mode="author" onDrop={(from, to) => { if (to !== null && to !== from) update((list) => swapRight(list, from, to)); }} rows={rows} />
      <Button
        onClick={append}
        startIcon={<AddIcon />}
        sx={{
          justifyContent: "flex-start", height: 44, width: "min(420px, 100%)", px: 2, color: "primary.main",
          border: "1.5px dashed", borderColor: tokens.color.border, borderRadius: `${tokens.radius.card}px`,
        }}
        variant="text"
      >
        Thêm cặp
      </Button>
    </Box>
  );
}
