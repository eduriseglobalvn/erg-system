import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import type { QuizEditorSlideMedia } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";

export function DraggableSlideMedia({
  media,
  readOnly,
  onChange,
}: {
  media: QuizEditorSlideMedia;
  readOnly: boolean;
  onChange: (media: QuizEditorSlideMedia) => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const position = {
    x: clampUnit(media.x ?? 0.74),
    y: clampUnit(media.y ?? 0.48),
    width: Math.min(0.5, Math.max(0.2, media.width ?? 0.34)),
  };

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    if ((event.target as HTMLElement).closest("[data-media-resize]")) return;
    const parent = frameRef.current?.parentElement;
    if (!parent) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = parent.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = position;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextX = clampUnit(start.x + (moveEvent.clientX - startX) / rect.width);
      const nextY = clampUnit(start.y + (moveEvent.clientY - startY) / rect.height);
      onChange({ ...media, x: nextX, y: nextY, width: start.width });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    const parent = frameRef.current?.parentElement;
    if (!parent) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = parent.getBoundingClientRect();
    const startX = event.clientX;
    const startWidth = position.width;

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(0.5, Math.max(0.2, startWidth + (moveEvent.clientX - startX) / rect.width));
      onChange({ ...media, x: position.x, y: position.y, width: nextWidth });
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <div
      ref={frameRef}
      className={cn("classic-editor__learner-floating-media", !readOnly && "is-draggable")}
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        width: `${position.width * 100}%`,
      }}
      onPointerDown={handlePointerDown}
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      aria-label="Kéo để đổi vị trí ảnh"
    >
      <img src={media.src} alt={media.alt} draggable={false} />
      {!readOnly ? <span>Kéo ảnh</span> : null}
      {!readOnly ? (
        <button
          type="button"
          data-media-resize
          className="classic-editor__learner-floating-media-resize"
          onPointerDown={handleResizePointerDown}
          aria-label="Kéo để đổi kích thước ảnh"
        />
      ) : null}
    </div>
  );
}

export function clampUnit(value: number) {
  return Math.min(0.92, Math.max(0.08, value));
}
