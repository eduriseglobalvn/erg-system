import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SequenceItem } from "@/lib/types";

export function SequenceQuestion({
  question,
  value,
  submitted = false,
  reviewMode = false,
  onChange,
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

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-3"}`}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-3"}`}>
            {currentOrder.map((itemId, index) => {
              const item = itemMap.get(itemId);
              if (!item) return null;

              const originalIndex = itemIds.findIndex((candidateId) => candidateId === itemId);
              const correctPosition = reviewMode && itemId === itemIds[index];

              return (
                <SequenceRowTarget key={item.id} rowId={item.id}>
                  <div className={`flex items-start ${isMobile ? "gap-2" : "gap-3 sm:gap-4"}`}>
                    <span
                      className={isMobile ? "w-6 flex-none pt-2 text-right text-[18px] font-semibold" : "w-11 flex-none text-right text-3xl font-medium sm:w-14 sm:text-[44px]"}
                      style={{ color: "var(--quiz-option-text)" }}
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

function SequenceRowTarget({
  rowId,
  children,
}: {
  rowId: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `sequence-row:${rowId}` });

  return (
    <div ref={setNodeRef} className="rounded-xl" style={isOver ? { backgroundColor: "var(--quiz-option-selected-bg)" } : undefined}>
      {children}
    </div>
  );
}

function DraggableSequenceItem({
  item,
  disabled,
  active,
  compact,
  correct,
  incorrect,
  reviewIndex,
}: {
  item: SequenceItem;
  disabled: boolean;
  active: boolean;
  compact: boolean;
  correct?: boolean;
  incorrect?: boolean;
  reviewIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className="min-w-0 flex-1"
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      <SequenceCard
        item={item}
        dragging={isDragging}
        active={active}
        compact={compact}
        locked={disabled}
        correct={correct}
        incorrect={incorrect}
        reviewIndex={reviewIndex}
        dragProps={{
          ...(attributes as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

function SequenceCard({
  item,
  dragging = false,
  overlay = false,
  locked = false,
  active = false,
  compact = false,
  correct = false,
  incorrect = false,
  reviewIndex,
  dragProps,
}: {
  item: SequenceItem;
  dragging?: boolean;
  overlay?: boolean;
  locked?: boolean;
  active?: boolean;
  compact?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  reviewIndex?: number;
  dragProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const stateClass =
    overlay || active
      ? "border-[#c6b66a] bg-[#fff0a8] shadow-[0_10px_26px_rgba(98,89,34,0.22)]"
      : correct
        ? "border-[#8fb37f] bg-[#f4fff0]"
        : incorrect
          ? "border-[#e1a6a0] bg-[#fff5f4]"
          : "border-slate-300 bg-white";

  return (
    <button
      type="button"
      className={`touch-none flex w-full items-center justify-between gap-2 border text-left text-slate-900 shadow-sm transition ${
        compact
          ? "min-h-[44px] rounded-md px-3 py-2 text-[15px] leading-6"
          : "min-h-[56px] rounded-[10px] px-5 text-[24px] leading-[1.3] sm:min-h-[64px] sm:text-[26px]"
      } ${stateClass} ${dragging ? "opacity-15" : ""} ${locked ? "cursor-default" : "cursor-grab"}`}
      style={!overlay && !active && !correct && !incorrect ? { borderColor: "var(--quiz-canvas-border)", backgroundColor: "var(--quiz-input-bg)", color: "var(--quiz-option-text)" } : undefined}
      {...dragProps}
    >
      {reviewIndex ? (
        <span
          className="shrink-0 font-black"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{item.label}</span>
      {!overlay ? (
        <span aria-hidden="true" className={compact ? "text-slate-400" : "text-xl tracking-[-0.16em] text-slate-400"}>
          {compact ? <GripVertical className="h-4 w-4" /> : "⋮⋮"}
        </span>
      ) : null}
    </button>
  );
}
