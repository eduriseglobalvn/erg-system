import { DndContext, DragOverlay, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { NonTouchPointerSensor } from "@/components/quiz/questions/matching-question/non-touch-pointer-sensor";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { createInitialAnswer, getSequenceCorrectOrder } from "@/domain/quiz/quiz";
import { useIsMobile } from "@/hooks/use-mobile";

import { DraggableSequenceCard, SequenceCard, SequenceRow } from "./sequence-question/sequence-card";
import { moveTo, SEQUENCE_ROW, sequenceAnnouncements } from "./sequence-question/sequence-order";

export function SequenceQuestion({ question, value, submitted = false, reviewMode = false, result, onChange }: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);
  const focusAfterMove = useRef<{ id: string; from: string[] } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // A plain PointerSensor claims a finger on iPad and then loses it to the scroll, so touch drags from the grip or a long press.
    useSensor(NonTouchPointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  const itemMap = useMemo(() => new Map((question.sequenceItems ?? []).map((item) => [item.id, item])), [question.sequenceItems]);
  // createInitialAnswer already starts away from the correct order; never shuffle again here.
  const order = useMemo(
    () => (value.sequenceOrder?.length ? value.sequenceOrder : (createInitialAnswer(question).sequenceOrder ?? [])),
    [question, value.sequenceOrder],
  );
  const correct = result?.correctSequenceOrder?.length ? result.correctSequenceOrder : getSequenceCorrectOrder(question);
  const showReview = reviewMode && correct.length > 0;
  const activeItem = activeId ? itemMap.get(activeId) : undefined;

  // Reordering moves the focused card's DOM node, which drops focus; put it back once the new order renders.
  // Runs every render: a move the parent ignored renders the old order and is dropped, so a later drag can't use it.
  useEffect(() => {
    const pending = focusAfterMove.current;
    if (!pending) return;
    focusAfterMove.current = null;
    if (pending.from.length === order.length && pending.from.every((id, i) => id === order[i])) return;
    const cards = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-sequence-id]") ?? []);
    cards.find((card) => card.dataset.sequenceId === pending.id)?.focus();
  });

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (submitted || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    const to = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (to < 0 || to >= order.length) return;
    focusAfterMove.current = { id: order[index], from: order };
    onChange({ sequenceOrder: moveTo(order, index, to) });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const from = order.indexOf(String(active.id));
    const to = over ? order.indexOf(String(over.id).replace(SEQUENCE_ROW, "")) : -1;
    if (from === -1 || to === -1 || from === to) return;
    onChange({ sequenceOrder: moveTo(order, from, to) });
  }

  return (
    <QuestionBodyWithImage question={question}>
      <DndContext
        sensors={sensors}
        accessibility={{
          announcements: sequenceAnnouncements(order, (id) => itemMap.get(id)?.label ?? ""),
          screenReaderInstructions: { draggable: "Mũi tên lên xuống để đổi vị trí, hoặc kéo thẻ thả vào hàng khác." },
        }}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <Box ref={listRef} className="quiz-answer-region" sx={{ display: "grid", rowGap: 1 }}>
          {order.map((itemId, index) => {
            const item = itemMap.get(itemId);
            if (!item) return null;
            const review = showReview ? { correctAt: correct.indexOf(itemId) + 1, right: correct[index] === itemId } : undefined;
            return (
              <SequenceRow key={itemId} itemId={itemId} position={index + 1} review={review}>
                <DraggableSequenceCard
                  item={item}
                  position={index + 1}
                  review={review}
                  compact={isMobile}
                  locked={submitted}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                />
              </SequenceRow>
            );
          })}
        </Box>
        {submitted ? null : (
          <Box component="p" sx={{ typography: "caption", color: "text.secondary", m: 0, mt: 1.5 }}>
            Giữ và kéo thẻ để đổi chỗ, hoặc chọn thẻ rồi dùng phím mũi tên lên/xuống.
          </Box>
        )}
        <DragOverlay dropAnimation={null}>{activeItem ? <SequenceCard item={activeItem} compact={isMobile} overlay /> : null}</DragOverlay>
      </DndContext>
    </QuestionBodyWithImage>
  );
}
