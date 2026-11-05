import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type KeyboardCoordinateGetter, type Modifier } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";

import type { Question, SequenceItem } from "@/domain/quiz/types";
import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";
import { moveChoice } from "./move-choice";
import { SequenceStepRow } from "./sequence-step-row";

const MIN_STEPS = 2;
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });
// Rows have no sortable layout, so arrow keys step a fixed 56px vertically.
const verticalKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const step = event.code === "ArrowDown" ? 56 : event.code === "ArrowUp" ? -56 : 0;
  if (!step) return undefined;
  event.preventDefault();
  return { x: currentCoordinates.x, y: currentCoordinates.y + step };
};
let nextId = 0;

/** Every edit writes the new item order and keeps the grading order identical to it. */
const withItems = (question: Question, sequenceItems: SequenceItem[]): Question =>
  ({ ...question, sequenceItems, sequenceCorrectOrder: sequenceItems.map((i) => i.id) });

export function SequenceAuthoring({ question, onChange, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question; used once image processing finishes. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const items = question.sequenceItems ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: verticalKeyboardCoordinates }));
  const commit = (next: SequenceItem[]) => onChange(withItems(question, next));

  const append = () => {
    const id = `step-${Date.now().toString(36)}-${nextId++}`;
    setFocusId(id);
    commit([...items, { id, label: "" }]);
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = items[index + delta];
    if (target) commit(moveChoice(items, items[index].id, target.id));
  };

  const pickImage = async (id: string, file: File) => {
    try {
      const { dataUrl } = await prepareQuizImage(file);
      const image = { url: dataUrl, alt: "" };
      onUpdate((latest) => withItems(latest, (latest.sequenceItems ?? []).map((i) => (i.id === id ? { ...i, image } : i))));
    } catch (error) {
      toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) commit(moveChoice(items, String(active.id), String(over.id)));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <DndContext modifiers={[verticalOnly]} onDragEnd={onDragEnd} sensors={sensors}>
        {items.map((item, index) => (
          <SequenceStepRow
            autoFocus={item.id === focusId}
            canDelete={items.length > MIN_STEPS}
            index={index}
            item={item}
            key={item.id}
            onDelete={() => commit(items.filter((i) => i.id !== item.id))}
            onEnter={() => { if (index === items.length - 1) append(); }}
            onMove={(delta) => move(index, delta)}
            onPatch={(change) => commit(items.map((i) => (i.id === item.id ? { ...i, ...change } : i)))}
            onPickImage={(file) => void pickImage(item.id, file)}
          />
        ))}
      </DndContext>
      <Box><Button onClick={append} startIcon={<AddIcon />} variant="text">Thêm bước</Button></Box>
    </Box>
  );
}
