import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { DisplayMatchingPair } from "@/components/quiz/questions/matching-question/matching-helpers";
import {
  AutoResizeMatchingTextarea,
  MatchingImageControls,
  MatchingInlineMedia,
} from "@/components/quiz/questions/matching-question/matching-media";
import type { MatchingPair, QuestionImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EditableMatchingResponseChip({
  id,
  pair,
  index,
  active,
  removable,
  onResponseChange,
  onResponseImageChange,
  onRemove,
}: {
  id: string;
  pair: DisplayMatchingPair;
  index: number;
  active: boolean;
  removable: boolean;
  onResponseChange: (response: string) => void;
  onResponseImageChange: (image: QuestionImage | undefined) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={isDragging ? undefined : { transform: CSS.Translate.toString(transform) }}
    >
      <div
        className={cn(
          "matching-puzzle__response-card is-connected",
          active && "is-active",
          isDragging && "is-dragging",
          "matching-puzzle__response-card--editable",
        )}
      >
        <MatchingInlineMedia
          image={pair.rightImage}
          icon={pair.rightIcon}
          label={pair.rightText}
          size="lg"
          onImageResize={
            pair.rightImage
              ? (width) => onResponseImageChange({ ...pair.rightImage!, width })
              : undefined
          }
          onImageRemove={pair.rightImage ? () => onResponseImageChange(undefined) : undefined}
        />
        <AutoResizeMatchingTextarea
          className="quiz-runtime-edit-input matching-puzzle__response-text"
          value={pair.response}
          onChange={(event) => onResponseChange(event.target.value)}
          aria-label={`Response ${index + 1}`}
        />
        <MatchingImageControls
          image={pair.responseImage}
          label={`Ảnh đáp án ${index + 1}`}
          onChange={onResponseImageChange}
        />
        {removable ? (
          <button type="button" className="quiz-runtime-edit-remove matching-puzzle__remove-button" onClick={onRemove} aria-label={`Xóa cặp ${index + 1}`}>
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          className="matching-puzzle__handle-button"
          aria-label={`Kéo đáp án ${index + 1} để ghép`}
          {...(attributes as ButtonHTMLAttributes<HTMLButtonElement>)}
          {...(listeners as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <span aria-hidden="true" className="matching-puzzle__handle" />
        </button>
      </div>
    </div>
  );
}

export function MatchingRowTarget({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="matching-puzzle__target">
      {children}
    </div>
  );
}

export function MatchingPuzzleRow({
  rowId,
  className,
  children,
}: {
  rowId: string;
  className?: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `row:${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className={cn("matching-puzzle__row", className, isOver && "is-over")}
    >
      {children}
    </div>
  );
}

export function DraggableMatchingChip({
  id,
  rowId,
  label,
  icon,
  image,
  disabled,
  correct,
  incorrect,
  active,
  connected,
  reviewIndex,
}: {
  id: string;
  rowId: string;
  label: string;
  icon?: string;
  image?: MatchingPair["responseImage"];
  disabled: boolean;
  correct?: boolean;
  incorrect?: boolean;
  active: boolean;
  connected: boolean;
  reviewIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
    data: {
      rowId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={isDragging ? undefined : { transform: CSS.Translate.toString(transform) }}
    >
      <MatchingChip
        label={label}
        icon={icon}
        image={image}
        dragging={isDragging}
        locked={disabled}
        correct={correct}
        incorrect={incorrect}
        active={active}
        connected={connected}
        reviewIndex={reviewIndex}
        dragProps={{
          ...(attributes as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

export function MatchingChip({
  label,
  icon,
  image,
  dragging = false,
  overlay = false,
  locked = false,
  correct = false,
  incorrect = false,
  active = false,
  connected = false,
  reviewIndex,
  dragProps,
}: {
  label: string;
  icon?: string;
  image?: MatchingPair["responseImage"];
  dragging?: boolean;
  overlay?: boolean;
  locked?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  active?: boolean;
  connected?: boolean;
  reviewIndex?: number;
  dragProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className={cn(
        "matching-puzzle__response-card",
        overlay && "is-overlay",
        active && "is-active",
        correct && "is-correct",
        incorrect && "is-incorrect",
        connected && "is-connected",
        dragging && "is-dragging",
        locked ? "is-locked" : "is-draggable",
      )}
      {...dragProps}
    >
      {reviewIndex && (correct || incorrect) ? (
        <span
          className="matching-puzzle__index"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <MatchingInlineMedia image={image} icon={icon} label={label} size="lg" />
      <span className="matching-puzzle__response-text">{label}</span>
      {!overlay ? <span aria-hidden="true" className="matching-puzzle__handle" /> : null}
    </button>
  );
}
