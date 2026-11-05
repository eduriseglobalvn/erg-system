import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import { useState } from "react";

import type { Question } from "@/domain/quiz/types";
import { ChoiceMarker, choiceTileSx } from "./choice-tile";

const TRUE_FALSE = ["Đúng", "Sai"];
const YES_NO = ["Có", "Không"];

function EditableLabel({ label, ariaLabel, onCommit }: { label: string; ariaLabel: string; onCommit: (next: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const finish = (save: boolean) => {
    const text = draft?.trim();
    if (save && text) onCommit(text);
    setDraft(null);
  };
  if (draft === null) {
    return (
      <Box
        onDoubleClick={() => setDraft(label)}
        onKeyDown={(e) => { if (e.key === "Enter") setDraft(label); }}
        role="button"
        sx={{ typography: "body1", fontWeight: "fontWeightMedium", cursor: "text", py: 0.5 }}
        tabIndex={0}
      >
        {label}
      </Box>
    );
  }
  return (
    <InputBase
      autoFocus
      fullWidth
      inputProps={{ "aria-label": ariaLabel }}
      onBlur={() => finish(true)}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") { e.preventDefault(); finish(true); }
        if (e.key === "Escape") finish(false);
      }}
      sx={{ typography: "body1", fontWeight: "fontWeightMedium" }}
      value={draft}
    />
  );
}

export function TrueFalseAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const choices = question.choices ?? [];
  const commit = (next: typeof choices) => onChange({ ...question, choices: next });
  const isTrueFalse = choices.length === 2 && choices.every((c, i) => c.label === TRUE_FALSE[i]);
  const flipTo = isTrueFalse ? YES_NO : TRUE_FALSE;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {choices.map((choice, index) => {
        const letter = String.fromCharCode(65 + index);
        return (
          <Box key={choice.id} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.5, alignItems: "center", p: "12px 14px", ...choiceTileSx(choice.correct) }}>
            <ChoiceMarker
              letter={letter}
              ok={choice.correct}
              onClick={() => commit(choices.map((c) => ({ ...c, correct: c.id === choice.id ? !c.correct : false })))}
            />
            <EditableLabel
              ariaLabel={`Nội dung phương án ${index + 1}`}
              label={choice.label}
              onCommit={(label) => commit(choices.map((c) => (c.id === choice.id ? { ...c, label } : c)))}
            />
          </Box>
        );
      })}
      <Button
        onClick={() => commit(choices.map((c, i) => ({ ...c, label: flipTo[i] ?? c.label })))}
        sx={{ alignSelf: "flex-start" }}
        variant="text"
      >
        {isTrueFalse ? "Đổi thành Có / Không" : "Đổi thành Đúng / Sai"}
      </Button>
    </Box>
  );
}
