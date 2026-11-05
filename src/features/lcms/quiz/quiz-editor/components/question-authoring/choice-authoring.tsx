import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";

import type { Choice, Question } from "@/domain/quiz/types";
import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ChoiceRow } from "./choice-row";

const MIN_CHOICES = 2;
let nextId = 0;

export function ChoiceAuthoring({ question, mode, onChange }: {
  question: Question;
  mode: "single" | "multiple";
  onChange: (next: Question) => void;
}) {
  const choices = question.choices ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));
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
      patch(id, { image: { url: dataUrl, alt: "" } });
    } catch (error) {
      if (error instanceof QuizImageRejectedError) toast.error(error.message);
      else throw error;
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const from = choices.findIndex((c) => c.id === active.id);
    const to = choices.findIndex((c) => c.id === over?.id);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...choices];
    next.splice(to, 0, next.splice(from, 1)[0]);
    commit(next);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <DndContext onDragEnd={onDragEnd} sensors={sensors}>
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
        sx={{ justifyContent: "flex-start", border: "1.5px dashed", borderColor: tokens.color.borderStrong, borderRadius: 1.5, p: "10px 14px" }}
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
