import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { SequenceItem } from "@/domain/quiz/types";

import { SequenceInlineImage } from "./sequence-media";

export function SequenceRowTarget({
  rowId,
  children,
}: {
  rowId: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `sequence-row:${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl transition"
      style={isOver ? { backgroundColor: "rgba(0,0,136,0.06)", outline: "2px dashed rgba(0,0,136,0.18)", outlineOffset: 2 } : undefined}
    >
      {children}
    </div>
  );
}

export function DraggableSequenceItem({
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

export function SequenceCard({
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
      ? "border-[#c6b66a] bg-[#fff0a8] shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
      : correct
        ? "border-[#8fb37f] bg-[#f4fff0]"
        : incorrect
          ? "border-[#e1a6a0] bg-[#fff5f4]"
          : "border-[#d1d5db] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:border-[#b8bec8] hover:shadow-[0_12px_24px_rgba(15,23,42,0.09)]";

  return (
    <button
      type="button"
      className={`touch-none flex w-full items-center justify-between gap-2 border text-left text-slate-900 shadow-sm transition ${
        compact
          ? "min-h-[48px] rounded-lg px-4 py-2.5 text-[16px] font-semibold leading-6"
          : "min-h-[calc(var(--quiz-control-height)+12px)] rounded-[10px] px-7 py-4 text-[var(--quiz-readable-size-lg)] font-semibold leading-[1.35]"
      } ${stateClass} ${dragging ? "opacity-15" : ""} ${locked ? "cursor-default" : "cursor-grab"}`}
      style={
        !overlay && !active && !correct && !incorrect
          ? {
              background: "linear-gradient(180deg, #ffffff, #fbfbfc)",
              color: "#174f91",
              paddingLeft: compact ? undefined : "34px",
            }
          : { paddingLeft: compact ? undefined : "34px" }
      }
      {...dragProps}
    >
      {reviewIndex ? (
        <span
          className="shrink-0 font-semibold"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <SequenceInlineImage image={item.image} label={item.label} />
      <span className="min-w-0 flex-1 break-words">{item.label}</span>
      {!overlay ? (
        <span aria-hidden="true" className={compact ? "grid h-8 w-7 place-items-center text-slate-400" : "grid h-10 w-8 place-items-center text-slate-400"}>
          {compact ? <GripVertical className="h-4 w-4" /> : <SequenceHandle />}
        </span>
      ) : null}
    </button>
  );
}

export function SequenceHandle() {
  return (
    <span className="grid h-[22px] w-3.5 grid-cols-2 grid-rows-3 place-items-center" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-[#7b7f86]" />
      ))}
    </span>
  );
}
