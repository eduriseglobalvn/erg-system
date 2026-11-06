import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";

import type { Choice, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { moveChoice } from "./move-choice";
import { ChoiceRow } from "./choice-row";
import { readQuizImage } from "./read-quiz-image";
import { moveRowBy, newRowId, usePendingFocus, useRowSensors, verticalOnly } from "./sortable-rows";

const MIN_CHOICES = 2;

export function ChoiceAuthoring({ question, mode, onUpdate }: {
  question: Question;
  mode: "single" | "multiple";
  onChange: (next: Question) => void;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const choices = question.choices ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const sensors = useRowSensors();
  const { rootRef, focusLater } = usePendingFocus();
  const update = (change: (latest: Choice[]) => Choice[]) => onUpdate((latest) => ({ ...latest, choices: change(latest.choices ?? []) }));
  const patch = (id: string, change: Partial<Choice>) => update((list) => list.map((c) => (c.id === id ? { ...c, ...change } : c)));

  const toggleCorrect = (id: string) =>
    update((list) => list.map((c) => (c.id === id ? { ...c, correct: !c.correct } : mode === "single" ? { ...c, correct: false } : c)));

  const append = () => {
    const id = newRowId("choice");
    setFocusId(id);
    update((list) => [...list, { id, label: "", correct: false }]);
  };

  const move = (id: string, delta: -1 | 1) => {
    focusLater(`[data-handle-id="${id}"]`);
    update((list) => moveRowBy(list, id, delta));
  };

  const remove = (index: number) => {
    const neighbour = choices[index + 1] ?? choices[index - 1];
    if (neighbour) focusLater(`[data-input-id="${neighbour.id}"]`);
    update((list) => list.filter((c) => c.id !== choices[index].id));
  };

  const pickImage = async (id: string, file: File) => {
    const image = await readQuizImage(file);
    if (image) patch(id, { image: { url: image.dataUrl, alt: "" } });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) update((list) => moveChoice(list, String(active.id), String(over.id)));
  };

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <DndContext modifiers={[verticalOnly]} onDragEnd={onDragEnd} sensors={sensors}>
        {choices.map((choice, index) => (
          <ChoiceRow
            autoFocus={choice.id === focusId}
            canDelete={choices.length > MIN_CHOICES}
            choice={choice}
            index={index}
            key={choice.id}
            onDelete={() => remove(index)}
            onEnter={() => { if (index === choices.length - 1) append(); }}
            onMove={(delta) => move(choice.id, delta)}
            onPatch={(change) => patch(choice.id, change)}
            onPickImage={(file) => void pickImage(choice.id, file)}
            onToggleCorrect={() => toggleCorrect(choice.id)}
          />
        ))}
      </DndContext>
      <Button
        fullWidth
        onClick={append}
        startIcon={<AddIcon />}
        sx={{ justifyContent: "flex-start", border: "1.5px dashed", borderColor: tokens.color.borderStrong, borderRadius: `${tokens.radius.card}px`, p: "10px 14px" }}
        variant="text"
      >
        Thêm phương án
        <Box component="kbd" sx={{ ml: "auto", typography: "caption", color: "text.secondary", border: "1px solid", borderBottomWidth: 2, borderColor: tokens.color.border, borderRadius: 0.5, px: 0.75 }}>
          Enter
        </Box>
      </Button>
    </Box>
  );
}
