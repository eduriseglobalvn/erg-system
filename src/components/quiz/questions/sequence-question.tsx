import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SequenceItem } from "@/lib/types";

import { DraggableSequenceItem, SequenceCard, SequenceRowTarget } from "./sequence-question/sequence-card";
import { DraggableEditableSequenceItem } from "./sequence-question/sequence-editable-item";

export function SequenceQuestion({
  question,
  value,
  submitted = false,
  reviewMode = false,
  onChange,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  const items = useMemo(() => question.sequenceItems ?? [], [question.sequenceItems]);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const currentOrder = useMemo(() => {
    if (value.sequenceOrder?.length) {
      return value.sequenceOrder;
    }

    return [...itemIds].reverse();
  }, [itemIds, value.sequenceOrder]);
  const activeItem = activeId ? itemMap.get(activeId) ?? null : null;

  function emitItems(nextItems: SequenceItem[]) {
    onQuestionChange?.({ ...question, sequenceItems: nextItems });
  }

  function updateItem(itemId: string, patch: Partial<SequenceItem>) {
    emitItems(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function removeItem(itemId: string) {
    emitItems(items.filter((item) => item.id !== itemId));
  }

  function addItem() {
    emitItems([
      ...items,
      {
        id: createSequenceId("sequence"),
        label: `Step ${items.length + 1}`,
      },
    ]);
  }

  function emit(nextOrder: string[]) {
    onChange({ sequenceOrder: nextOrder });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("sequence-row:")) return;

    const sourceIndex = currentOrder.findIndex((itemId) => itemId === draggedId);
    const targetIndex = currentOrder.findIndex((itemId) => itemId === overId.replace("sequence-row:", ""));
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    emit(nextOrder);
  }

  function handleEditableDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("sequence-row:")) return;

    const targetId = overId.replace("sequence-row:", "");
    const sourceIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    emitItems(nextItems);
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className={`quiz-answer-region flex flex-col ${isMobile ? "gap-2.5" : "gap-4"}`}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleEditableDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
              {items.map((item, index) => (
                <SequenceRowTarget key={item.id} rowId={item.id}>
                  <DraggableEditableSequenceItem
                    item={item}
                    index={index}
                    compact={isMobile}
                    active={activeId === item.id}
                    totalItems={items.length}
                    onLabelChange={(label) => updateItem(item.id, { label })}
                    onImageChange={(image) => updateItem(item.id, { image })}
                    onRemove={() => removeItem(item.id)}
                  />
                </SequenceRowTarget>
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <div className={`flex items-stretch ${isMobile ? "gap-2" : "gap-3 sm:gap-4"}`}>
                  <span
                    className={
                      isMobile
                        ? "flex w-7 flex-none items-center justify-center text-[18px] font-bold"
                        : "flex w-12 flex-none items-center justify-center text-[var(--quiz-readable-size-lg)] font-extrabold sm:w-16"
                    }
                    style={{ color: "#174f91" }}
                  >
                    {Math.max(1, items.findIndex((item) => item.id === activeItem.id) + 1)}.
                  </span>
                  <SequenceCard item={activeItem} overlay compact={isMobile} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <button type="button" className="quiz-runtime-edit-add" onClick={addItem}>
            Add step
          </button>
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`quiz-answer-region flex flex-col ${isMobile ? "gap-2.5" : "gap-4"}`}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
            {currentOrder.map((itemId, index) => {
              const item = itemMap.get(itemId);
              if (!item) return null;

              const originalIndex = itemIds.findIndex((candidateId) => candidateId === itemId);
              const correctPosition = reviewMode && itemId === itemIds[index];

              return (
                <SequenceRowTarget key={item.id} rowId={item.id}>
                  <div className={`flex items-stretch ${isMobile ? "gap-2" : "gap-3 sm:gap-4"}`}>
                    <span
                      className={isMobile ? "flex w-7 flex-none items-center justify-center text-[18px] font-bold" : "flex w-12 flex-none items-center justify-center text-[var(--quiz-readable-size-lg)] font-extrabold sm:w-16"}
                      style={{ color: "#174f91" }}
                    >
                      {index + 1}.
                    </span>
                    <DraggableSequenceItem
                      item={item}
                      disabled={submitted}
                      active={activeId === item.id}
                      compact={isMobile}
                      correct={correctPosition}
                      incorrect={reviewMode && !correctPosition}
                      reviewIndex={reviewMode && originalIndex >= 0 ? originalIndex + 1 : undefined}
                    />
                  </div>
                </SequenceRowTarget>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>{activeItem ? <SequenceCard item={activeItem} overlay compact={isMobile} /> : null}</DragOverlay>
        </DndContext>
      </div>
    </QuestionBodyWithImage>
  );
}

function createSequenceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
