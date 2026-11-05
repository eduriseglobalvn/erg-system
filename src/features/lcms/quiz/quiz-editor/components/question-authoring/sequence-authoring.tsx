import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type KeyboardCoordinateGetter, type Modifier } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
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

export function SequenceAuthoring({ question, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const items = question.sequenceItems ?? [];
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{ selector: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: verticalKeyboardCoordinates }));
  const rootRef = useRef<HTMLDivElement>(null);
  // Reordering or deleting remounts or moves DOM nodes, which drops focus; put it back once the new order has rendered.
  useEffect(() => {
    if (pendingFocus) rootRef.current?.querySelector<HTMLElement>(pendingFocus.selector)?.focus();
  }, [pendingFocus]);
  const update = (change: (latest: SequenceItem[]) => SequenceItem[]) => onUpdate((latest) => withItems(latest, change(latest.sequenceItems ?? [])));

  const append = () => {
    const id = `step-${Date.now().toString(36)}-${nextId++}`;
    setFocusId(id);
    update((list) => [...list, { id, label: "" }]);
  };

  const move = (id: string, delta: -1 | 1) => {
    setPendingFocus({ selector: `[data-handle-id="${id}"]` });
    update((list) => {
      const target = list[list.findIndex((i) => i.id === id) + delta];
      return target ? moveChoice(list, id, target.id) : list;
    });
  };

  const remove = (index: number) => {
    const neighbour = items[index + 1] ?? items[index - 1];
    if (neighbour) setPendingFocus({ selector: `[data-input-id="${neighbour.id}"]` });
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
