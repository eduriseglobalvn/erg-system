import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import { useEffect, useRef, useState } from "react";

import type { Question } from "@/domain/quiz/types";
import { ChoiceMarker, choiceTileSx } from "./choice-tile";

const TRUE_FALSE = ["Đúng", "Sai"];
const YES_NO = ["Có", "Không"];

function EditableLabel({ label, ariaLabel, onCommit }: { label: string; ariaLabel: string; onCommit: (next: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const refocus = useRef(false);
  // Enter/Esc unmount the input, so focus returns to the label once it is back.
  useEffect(() => {
    if (draft === null && refocus.current) { refocus.current = false; labelRef.current?.focus(); }
  }, [draft]);
  const open = () => { cancelled.current = false; setDraft(label); };
  const finish = (save: boolean, keepFocus: boolean) => {
    const text = draft?.trim();
    if (save && !cancelled.current && text) onCommit(text);
    refocus.current = keepFocus;
    setDraft(null);
  };
  if (draft === null) {
    return (
      <Box
        aria-label={`${label}, nhấn Enter để sửa`}
        onDoubleClick={open}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.nativeEvent.isComposing) { e.preventDefault(); open(); } }}
        ref={labelRef}
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
      onBlur={() => finish(true, false)}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") { e.preventDefault(); finish(true, true); }
        if (e.key === "Escape") { e.stopPropagation(); cancelled.current = true; finish(false, true); }
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
