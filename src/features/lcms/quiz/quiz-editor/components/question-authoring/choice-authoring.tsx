import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type KeyboardCoordinateGetter, type Modifier } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";

import type { Choice, Question } from "@/domain/quiz/types";
import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { moveChoice } from "./move-choice";
import { ChoiceRow } from "./choice-row";

// Rows have no sortable layout, so arrow keys step a fixed 56px vertically.
const verticalKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const step = event.code === "ArrowDown" ? 56 : event.code === "ArrowUp" ? -56 : 0;
  if (!step) return undefined;
  event.preventDefault();
  return { x: currentCoordinates.x, y: currentCoordinates.y + step };
};
const MIN_CHOICES = 2;
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });
let nextId = 0;

export function ChoiceAuthoring({ question, mode, onChange, onUpdate }: {
  question: Question;
  mode: "single" | "multiple";
  onChange: (next: Question) => void;
  /** Applies a change to the latest question; used once an async step (image processing) finishes. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const choices = question.choices ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: verticalKeyboardCoordinates }));
  const commit = (next: Choice[]) => onChange({ ...question, choices: next });
  const patch = (id: string, change: Partial<Choice>) => commit(choices.map((c) => (c.id === id ? { ...c, ...change } : c)));

  const toggleCorrect = (id: string) =>
    commit(choices.map((c) => (c.id === id ? { ...c, correct: !c.correct } : mode === "single" ? { ...c, correct: false } : c)));

  const append = () => {
    const id = `choice-${Date.now().toString(36)}-${nextId++}`;
    setFocusId(id);
    commit([...choices, { id, label: "", correct: false }]);
  };

  const pickImage = async (id: string, file: File) => {
    try {
      const { dataUrl } = await prepareQuizImage(file);
      const image = { url: dataUrl, alt: "" };
      onUpdate((latest) => ({ ...latest, choices: latest.choices?.map((c) => (c.id === id ? { ...c, image } : c)) }));
    } catch (error) {
      toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) commit(moveChoice(choices, String(active.id), String(over.id)));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <DndContext modifiers={[verticalOnly]} onDragEnd={onDragEnd} sensors={sensors}>
        {choices.map((choice, index) => (
          <ChoiceRow
            autoFocus={choice.id === focusId}
            canDelete={choices.length > MIN_CHOICES}
            choice={choice}
            index={index}
            key={choice.id}
            onDelete={() => commit(choices.filter((c) => c.id !== choice.id))}
            onEnter={() => { if (index === choices.length - 1) append(); }}
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
