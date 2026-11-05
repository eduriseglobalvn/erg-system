import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";

import type { Question, SequenceItem } from "@/domain/quiz/types";
import { prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";
import { moveChoice } from "./move-choice";
import { SequenceStepRow } from "./sequence-step-row";
import { moveRowBy, newRowId, usePendingFocus, useRowSensors, verticalOnly } from "./sortable-rows";

const MIN_STEPS = 2;

/** Every edit writes the new item order and keeps the grading order identical to it. */
const withItems = (question: Question, sequenceItems: SequenceItem[]): Question =>
  ({ ...question, sequenceItems, sequenceCorrectOrder: sequenceItems.map((i) => i.id) });

export function SequenceAuthoring({ question, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const items = question.sequenceItems ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const sensors = useRowSensors();
  const { rootRef, focusLater } = usePendingFocus();
  const update = (change: (latest: SequenceItem[]) => SequenceItem[]) => onUpdate((latest) => withItems(latest, change(latest.sequenceItems ?? [])));

  const append = () => {
    const id = newRowId("step");
    setFocusId(id);
    update((list) => [...list, { id, label: "" }]);
  };

  const move = (id: string, delta: -1 | 1) => {
    focusLater(`[data-handle-id="${id}"]`);
    update((list) => moveRowBy(list, id, delta));
  };

  const remove = (index: number) => {
    const neighbour = items[index + 1] ?? items[index - 1];
    if (neighbour) focusLater(`[data-input-id="${neighbour.id}"]`);
    update((list) => list.filter((i) => i.id !== items[index].id));
  };

  const pickImage = async (id: string, file: File) => {
    try {
      const { dataUrl } = await prepareQuizImage(file);
      const image = { url: dataUrl, alt: "" };
      update((list) => list.map((i) => (i.id === id ? { ...i, image } : i)));
    } catch (error) {
      toast.error(error instanceof QuizImageRejectedError ? error.message : "Không đọc được ảnh.");
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) update((list) => moveChoice(list, String(active.id), String(over.id)));
  };

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <DndContext modifiers={[verticalOnly]} onDragEnd={onDragEnd} sensors={sensors}>
        {items.map((item, index) => (
          <SequenceStepRow
            autoFocus={item.id === focusId}
            canDelete={items.length > MIN_STEPS}
            index={index}
            item={item}
            key={item.id}
            onDelete={() => remove(index)}
            onEnter={() => { if (index === items.length - 1) append(); }}
            onMove={(delta) => move(item.id, delta)}
            onPatch={(change) => update((list) => list.map((i) => (i.id === item.id ? { ...i, ...change } : i)))}
            onPickImage={(file) => void pickImage(item.id, file)}
          />
        ))}
      </DndContext>
      <Box><Button onClick={append} startIcon={<AddIcon />} variant="text">Thêm bước</Button></Box>
    </Box>
  );
}
