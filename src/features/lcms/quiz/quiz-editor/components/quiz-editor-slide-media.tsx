import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { buildElementOffsetStyle, clampOffset } from "./quiz-editor-slide-render-utils";

export function AttachedMediaPreview({
  slide,
  elementId,
  title,
  size,
  selectedImageId,
  onSelectImage,
  offset,
  onMoveImage,
  className,
}: {
  slide: QuizEditorSlide;
  elementId: string;
  title: string;
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  offset?: QuizEditorElementOffset;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
  className: string;
}) {
  if (!slide.media?.src) {
    return null;
  }

  return (
    <SelectableImage
      elementId={elementId}
      title={title}
      size={size}
      selectedImageId={selectedImageId}
      onSelectImage={onSelectImage}
      offset={offset}
      onMoveImage={onMoveImage}
      className={className}
    >
      <img
        src={slide.media.src}
        alt={slide.media.alt || slide.title}
        className="classic-slide__attached-media-image"
      />
    </SelectableImage>
  );
}

export function SelectableImage({
  elementId,
  title,
  size,
  selectedImageId,
  onSelectImage,
  offset,
  onMoveImage,
  className,
  children,
}: {
  elementId: string;
  title: string;
  size: "stage" | "thumbnail" | "mini";
  selectedImageId: string | null;
  onSelectImage?: (elementId: string) => void;
  offset?: QuizEditorElementOffset;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
  className: string;
  children: ReactNode;
}) {
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    parentWidth: number;
    parentHeight: number;
    moved: boolean;
  } | null>(null);

  if (size !== "stage" || !onSelectImage) {
    return (
      <div className={className} style={buildElementOffsetStyle(offset)}>
        {children}
      </div>
    );
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectImage(elementId);

    if (!onMoveImage) {
      return;
    }

    const parent = event.currentTarget.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    if (!parentRect) return;

    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offset?.x ?? 0,
      startOffsetY: offset?.y ?? 0,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      moved: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const nextX = clampOffset(state.startOffsetX + (moveEvent.clientX - state.startClientX) / state.parentWidth);
      const nextY = clampOffset(state.startOffsetY + (moveEvent.clientY - state.startClientY) / state.parentHeight);
      state.moved = true;
      onMoveImage(elementId, { x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <button
      type="button"
      title={title}
      onPointerDown={handlePointerDown}
      style={buildElementOffsetStyle(offset)}
      className={cn(className, "classic-slide__selectable-image", selectedImageId === elementId && "is-selected")}
    >
      {children}
    </button>
  );
}

export function InlineSlideTextArea({
  value,
  className,
  style,
  ariaLabel,
  onChange,
}: {
  value: string;
  className: string;
  style?: CSSProperties;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={2}
      aria-label={ariaLabel}
      className={className}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function InlineSlideInput({
  value,
  className,
  style,
  ariaLabel,
  onChange,
}: {
  value: string;
  className: string;
  style?: CSSProperties;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      className={className}
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

