import { X } from "lucide-react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import type { MatchingPair } from "@/domain/quiz/types";
import { cn } from "@/lib/utils";

function ImageResizeHandle({
  width,
  min,
  max,
  onResize,
}: {
  width: number;
  min: number;
  max: number;
  onResize: (width: number) => void;
}) {
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = width;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(min, Math.min(max, Math.round(startWidth + moveEvent.clientX - startX)));
      onResize(nextWidth);
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <button
      type="button"
      className="question-image-resize-handle"
      aria-label="Resize image"
      onPointerDown={handlePointerDown}
    />
  );
}

export function MatchingInlineMedia({
  image,
  icon,
  label,
  size = "sm",
  onImageResize,
  onImageRemove,
}: {
  image?: MatchingPair["promptImage"];
  icon?: string;
  label: string;
  size?: "sm" | "lg";
  onImageResize?: (width: number) => void;
  onImageRemove?: () => void;
}) {
  if (image?.url) {
    return (
      <span
        className={cn(
          "matching-inline-media grid flex-none place-items-center overflow-hidden rounded-md border border-slate-200 bg-white",
          onImageResize && "matching-inline-media--resizable",
          size === "lg" ? "matching-inline-media--lg h-10 w-10" : "h-8 w-8",
        )}
        style={image.width ? ({ "--matching-editor-image-size": `${image.width}px` } as CSSProperties) : undefined}
      >
        <img src={image.url} alt={image.alt ?? label} className="h-full w-full object-contain" />
        {onImageRemove ? (
          <button
            type="button"
            className="matching-inline-media__remove"
            aria-label={`Xóa ảnh ${label}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onImageRemove();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
        {onImageResize ? (
          <ImageResizeHandle
            width={image.width ?? 76}
            onResize={onImageResize}
            min={44}
            max={150}
          />
        ) : null}
      </span>
    );
  }

  if (!icon) return null;

  return (
    <span
      className={cn(
        "matching-inline-media grid flex-none place-items-center rounded-md border font-semibold",
        size === "lg" ? "matching-inline-media--lg h-10 w-10 text-xl" : "h-8 w-8 text-base",
      )}
      style={{
        color: "var(--quiz-accent-start)",
        borderColor: "color-mix(in srgb, var(--quiz-accent-start) 28%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--quiz-accent-start) 9%, transparent)",
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
